(function($, app)
{
	var tracker = (app.tracker = app.tracker || {});

	/** Opens a new tracker page for the specified trip. (always picks itinerary #0) */
	app.trackTrip = function trackTrip(trip)
	{
		app.storage.trip = trip;

		var itinerary = processItinerary(trip.itineraries[0]);

		app.newPage();
		app.page
			.append(app.templates.bar())
			.append(app.templates.info({
				from: trip.from.name,
				to: trip.to.name,
				duration: itinerary.duration / 1000,
				distance: itinerary.distance,
				arrival: trip.itineraries[0].endTime
			}))
			.append(app.templates.itinerary(itinerary))
			.append(app.templates.menu())
			.ready(function()
			{
				tracker.updateProgress();
				tracker.updateTimes();

				$('#new').click(function()
				{
					delete app.storage.trip;
					app.newTrip();
					app.history.pop();
				});

				$('.alarm').click(function()
				{
					tracker.editAlarm($(this).attr('data-id'));
				});
			});
	}

	/** Updates the 'playlist' */
	tracker.updateProgress = function updateProgress()
	{
		var now = new Date().getTime();
		var elements = $('.leg').add('.place');

		elements.filter(function()
		{
			return $(this).attr('data-time') < now;
		}).addClass('past');

		$('#itinerary .current').removeClass('current');
		elements.not('.past').first().addClass('current');
	}

	/** Updates the 'countdown' */
	tracker.updateTimes = function updateTimes()
	{
		var now = new Date().getTime();
		var elements = $('.place');
		elements.each(function()
		{
			var timing = $(this).attr('data-time') - now;
			$(this)
				.find('.arrival,.departure')
				.text(app.formatTiming(timing / 1000));
		});
	}

	/** Update tracker interface if present. */
	tracker.pollUpdates = function pollUpdates()
	{
		if ($('#itinerary').length)
		{
			tracker.updateProgress();
			tracker.updateTimes();
		}
	}

	/** Sets the update rate for the tracker (0 to turn it off completely). */
	var poll_speed, poll_id;
	tracker.pollSpeed = function setPollSpeed(speed)
	{
		if (speed === undefined)
			return poll_speed;

		if (poll_speed != speed)
		{
			if (poll_id)
				clearInterval(poll_id);

			if (speed)
				poll_id = setInterval(tracker.pollUpdates, poll_speed = speed);
			else
				poll_id = undefined, poll_speed = 0;
		}
	}

	/** Open the alarm settings window. */
	tracker.editAlarm = function editAlarm(id)
	{
		closeAlarmSettings();

		// Defaults
		if (!(id in app.storage.alarms))
			edit(600);
		
		function edit(delay)
		{
			app.storage.alarms[id] = delay;
			$('.alarm[data-id=' + id + ']')
				.addClass('set')
				.text(app.formatDuration(delay));
		}

		app.page
			.append(app.templates.alarmSetting(
			{
				id: id,
				delay: app.storage.alarms[id] / 60
			}))
			.ready(function()
			{
				var button = $('.alarm[data-id=' + id + ']');
				$('#alarm-setting')
					.css('top', button.offset().top + button.outerHeight());

				$('#remove').click(function()
				{
					tracker.removeAlarm(id);
				});

				$('#delay').change(function()
				{
					edit($('#delay').val() * 60);
				});

				$('#itinerary,#info,#menu').mouseup(closeAlarmSettings);
			});
	}

	/** Removes the alarm setting (and window). */
	tracker.removeAlarm = function removeAlarm(id)
	{
		delete app.storage.alarms[id];
		$('.set[data-id=' + id + ']')
			.removeClass('set')
			.text('+');

		closeAlarmSettings();
	}

	function processItinerary(it)
	{
		var out =
		{
			duration: it.duration / 1000,
			distance: 0,
			legs: []
		};
		var now = new Date().getTime();

		for (var i = 0; i < it.legs.length; ++i)
		{
			out.distance += it.legs[i].distance;

			// Strip transfer legs, those are not interesting
			if (i && i < it.legs.length - 1 && it.legs[i].mode == 'WALK')
				continue;

			// Start place
			out.legs.push(
			{
				index: i,
				time: it.legs[i].startTime,
				place: it.legs[i].from.name,
				departure: (it.legs[i].startTime - now) / 1000,
				alarm: app.storage.alarms['d'+i]
			});

			// Transit leg
			out.legs.push(
			{
				index: i,
				time: it.legs[i].endTime,
				mode: it.legs[i].mode,
				type: it.legs[i].routeShortName || app.formatMode(it.legs[i].mode),
				headsign: it.legs[i].headsign || it.legs[i].to.name
			});

			// End place
			out.legs.push(
			{
				index: i,
				time: it.legs[i].endTime,
				place: it.legs[i].to.name,
				arrival: (it.legs[i].endTime - now) / 1000,
				alarm: app.storage.alarms['a'+i]
			});
		}

		return out;
	}

	function closeAlarmSettings()
	{
		$('#alarm-setting').remove();
		$('#itinerary,#info,#menu').off('mouseup', closeAlarmSettings);
	}

})(jQuery, window.app = window.app || {});