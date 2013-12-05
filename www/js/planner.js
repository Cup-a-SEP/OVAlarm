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

		request = request || { when: Date() };

		app.newPage();
		app.page
			.append(app.templates.bar())
			.append(app.templates.planner(request))
			.ready(function()
			{
				$('#plan').click(function()
				{
					app.planTrip();
					return false;
				});

				$('#planner input').on('change', function(e)
				{
					// Save old form values to history
					newTrip(app.storage.request);
					if (app.storage.results)
						planner.showResults(app.storage.results);
					app.pageSwap();

					// Save new form values to storage
					app.storage.request = planner.getValues();
				});

				$('#planner').on('wake', function()
				{
					app.storage.request = planner.getValues();
					if ($('#results').length)
						app.storage.results = $('#results').data('otp');
					else
						delete app.storage.results;
				}).on('sleep', function()
				{
					$('#results').data('otp', app.storage.results);
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
			planner.showError(errorMessage /*debug:*/ + ' (' + errorCode + ')');
			app.loader.hide();
		});
	};

	/** Extracts planner values from the current form. */
	planner.getValues = function getValues()
	{
		return {
			from: $('#from').val(),
			fromCoord: $('#from').attr('data-coord'),
			to: $('#to').val(),
			toCoord: $('#to').attr('data-coord'),
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
			if (it.legs[i].mode == 'WALK')
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

	// Temporarily, replaced by suggestions widget
	function addAddressResolver(e)
	{
		e.blur(function()
		{
			app.geoCode(e.val()).done(function(results)
			{
				if (results.length)
				{
					e.val(results[0].address);
					e.attr('data-coord', results[0].coord);
				}
				else
					e.val(e.val() + '?');
			});
		});
	}

})(jQuery, window.app = window.app || {});