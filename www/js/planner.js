(function($, app)
{
	var planner = (app.planner = app.planner || {});

	/** Opens the planner in a new page (optionally with specified values). */
	app.newTrip = function newTrip(request)
	{
		if (request)
			app.storage.request = request;
		else
		{
			delete app.storage.request;
			delete app.storage.results;
		}

		delete app.storage.trip;
		app.removeAllAlarms();

		request = request || { when: Date() };
		
		// dispose the addres resolvers so it won't leave behind DOM objects
		disposeAddressResolvers();

		app.newPage();
		app.page
			.append(app.templates.bar())
			.append(app.templates.planner(request))
			.ready(function()
			{
				$('form#planner').off('submit').on('submit', function(e)
				{
					// prevent normal submit behavior
					e.preventDefault();

					// TODO: BUILD IN A METHOD THAT VALIDATES WHETHER ALL FIELDS ARE SET BEFORE ACTUALLY DOING ALL THE NEXT ACTIONS

					// Save old form values to history
					newTrip(app.storage.request);
					if (app.storage.results)
						planner.showResults(app.storage.results);
					app.pageSwap();

					// Save new form values to storage
					app.storage.request = planner.getValues();

					// plan trip
					app.planTrip();
				});

				$('#planner').off('wake').on('wake', function()
				{
					app.storage.request = planner.getValues();
					if ($('#results').length)
						app.storage.results = $('#results').data('otp');
					else
						delete app.storage.results;
				}).off('sleep').on('sleep', function()
				{
					$('#results').data('otp', app.storage.results);
				});

				// sync the changing of the radio-buttons to the state of their labels
				$('[type="radio"]').off('change').on('change', function ()
				{
					var radio = $(this);
					if (radio.is(':checked')) {
						radio.parent('label').addClass('active');
						radio.parent('label').siblings('label').removeClass('active');
					} else {
						radio.parent('label').removeClass('active');
						radio.parent('label').siblings('label').addClass('active');
					}
				});

				addAddressResolver($('#from'));
				addAddressResolver($('#to'));
			});
	};

	/** Plans a trip using the planner form data (the form must be there).*/
	app.planTrip = function planTrip()
	{
		var values = planner.getValues();
		values.when = values.when.split('T');

		app.loader.show();

		app.otpPlan(
		{
			fromPlace: values.fromCoord,
			toPlace: values.toCoord,
			date: values.when[0],
			time: values.when[1],
			arriveBy: values.arrive
		}).done(function(results)
		{
			app.newTrip(planner.getValues());
			planner.showResults(results);
			app.storage.results = results;
			app.refreshAlarms();
			app.loader.hide();
		}).fail(function(errorCode, errorMessage)
		{
			planner.showError(errorMessage /*debug:* / + ' (' + errorCode + ')'/**/);
			app.loader.hide();
		});
	};

	/** Extracts planner values from the current form. */
	planner.getValues = function getValues()
	{
		// TODO: Find a better place to do this transformation
		// var fromCoord = $('#from').data('coord');
		// var toCoord = $('#to').data('coord');

		return {
			from: $('#from').val(),
			fromCoord: $('#from').data('coord'),
			to: $('#to').val(),
			toCoord: $('#to').data('coord'),
			when: $('#when').val(),
			arrive: $('#arrive').is(':checked')
		};
	};

	/** Displays an error message. */
	planner.showError = function showError(error)
	{
		if ($('#feedback').length) $('#results').remove();
		app.page.append(app.templates.results({ error: error }));
	};

	/** Displays planner results. */
	planner.showResults = function showResults(results)
	{
		if ($('#feedback').length) $('#results').remove();
		app.page
			.append(app.templates.results(
			{
				results: $.map(results.itineraries, processItinerary)
			}))
			.ready(function()
			{
				$.each(results.itineraries, function(i, itinerary)
				{
					$('#track' + i).click(function()
					{
						app.trackTrip(stripItinerary(results, i));
					});
				});
			});
	};

	function processItinerary(it)
	{
		var out =
		{
			duration: it.duration / 1000,
			distance: 0,
			legs: []
		};

		for (var i = 0; i < it.legs.length; ++i)
		{
			out.distance += it.legs[i].distance;

			// Strip walk legs, those are not interesting
			if (it.legs[i].mode == 'WALK' && i && i < it.legs.length - 1)
				continue;

			// Start place
			out.legs.push(
			{
				time: it.legs[i].startTime,
				place: it.legs[i].from.name
			});

			// Transit leg
			out.legs.push(
			{
				mode: it.legs[i].mode,
				type: it.legs[i].routeShortName
			});

			// End place
			if (i == it.legs.length - 1)
				out.legs.push(
				{
					time: it.legs[i].endTime,
					place: it.legs[i].to.name
				});
		}

		return out;
	}

	// Note: this function could be a lot stricter removing all unused values...
	function stripItinerary(plan, index)
	{
		return {
			date: plan.date,
			from: plan.from,
			to: plan.to,
			itineraries: [ plan.itineraries[index] ]
		};
	}

	function disposeAddressResolvers ()
	{
		$('.has-address-resolver').removeClass('.has-address-resolver').autocomplete('dispose');
	}

	function addAddressResolver(e)
	{
		// Temporary quick solution
		var options = {
			serviceUrl: "http://ovh.openkvk.nl:8888/",
			paramName: "noparam", // FIXME: NEWBAGHACK: Hack as the above API doesn't work with data params
			maxHeight: '350',
			transformResult: function (response, originalQuery) {
				var result = {};
				var sug;
				// Parse JSON, fallback to empty array if failing
				try {
					result.suggestions = JSON.parse(response).features;
				} catch (e) {
					console.warn('failed to parse JSON');
				}

				if (!result.suggestions) {
					result.suggestions = [];
				}

				// FIXME: NEWBAGHACK: keep only the first 10 results
				result.suggestions = result.suggestions.slice(0,9);

				// set the correct data
				for (var i = result.suggestions.length - 1; i >= 0; i--) {
					sug = result.suggestions[i];
					sug.value = sug.properties.search;
					sug.data = sug.geometry.coordinates[1] + ',' + sug.geometry.coordinates[0];
				}

				return result;
			},
			onSearchStart: function (query) {
				// adding the magic *
				for (var prop in query) {
					if (query.hasOwnProperty(prop)) {
						query[prop] = query[prop] + '*';
					}
				}
			},
			onSelect: function (suggestion) {
				$(this).data('coord', suggestion.data);
			}
		};
		// Add a class so it's easy to dispose on rerender
		e.addClass('has-address-resolver').autocomplete(options);
	}

})(jQuery, window.app = window.app || {});