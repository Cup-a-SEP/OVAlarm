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
                tracker.pollUpdates();

                $('#new').click(function()
                {
                    app.newTrip();
                });

                $('.alarm').click(function()
                {
                    tracker.editAlarm($(this).attr('data-id'));
                });

                $('#itinerary')
                    .on('sleep', function(e)
                    {
                        $(e.target).data('trip', app.storage.trip);
                        delete app.storage.trip;

                        $(e.target).data('alarms', app.storage.alarms);
                        app.storage.alarms = [];
                    })
                    .on('wake', function(e)
                    {
                        app.storage.trip = $(e.target).data('trip');
                        app.storage.alarms = $(e.target).data('alarms');
                        tracker.pollUpdates();
                    })
                    .on('die', function()
                    {
                        delete app.storage.trip;
                        app.storage.alarms = [];
                    });
            });
    };

    /** Updates the 'playlist' (used by poll) */
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
    };

    /** Updates the 'countdown' (used by poll). Returns the least duration. */
    tracker.updateTimes = function updateTimes()
    {
        var now = new Date().getTime();
        var elements = $('.place');
        var least = Infinity; // Least duration

        elements.each(function()
        {
            var timing = $(this).attr('data-time') - now;
            least = Math.min(Math.abs(timing), least);

            $(this)
                .find('.arrival,.departure')
                .text(app.formatTiming(timing / 1000));
        });

        return least;
    };

    /** Makes the tracker information update dynamically. (stops when itinerary element vanishes) */
    tracker.pollUpdates = function pollUpdates()
    {
        if ($('#itinerary').length)
        {
            tracker.updateProgress();
            var least = tracker.updateTimes();
            setTimeout(pollUpdates, Math.max(Math.min(least / 2, 60e3), 1e3));
        }
    };

    /** Open the alarm settings window. */
    tracker.editAlarm = function editAlarm(id) // id = alarm *interface* id
    {
        $('#alarm-done').click();

        var leg = Number(id.slice(1));
        var type = id[0] == 'd' ? 'departure' : 'arrival';
        var alarm = app.findAlarm(leg, type);
        var delay = 600; // Defaults (10 minutes)

        if (!alarm)
        {
            // Delay temporarily set to 0 seconds so it doesn't trigger whilst sliding
            if (!(alarm = app.setAlarm(leg, type, 0)))
                return; // Cancel when alarm creation failed
            edit(delay);
        }
        else
            edit(alarm.leadTime);
        
        function edit(d)
        {
            $('.alarm[data-id=' + id + ']')
                .addClass('set')
                .find('.alarm-content')
                .text(app.formatDuration(d));

            delay = d;
        }

        function close()
        {
            // Set alarm or remove it when it could not be set (probably set in the past)
            if (!app.setAlarm(leg, type, delay))
                tracker.removeAlarm(id);
            closeAlarmSettings();
        }

        app.page
            .append(app.templates.alarmSetting(
            {
                id: id,
                delay: delay / 60
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

                $('#alarm-done').click(close);
                $('#itinerary,#info,#menu').mouseup(close);
            });
    };

    /** Removes the alarm setting (and window). */
    tracker.removeAlarm = function removeAlarm(id)
    {
        var leg = Number(id.slice(1));
        var type = id[0] == 'd' ? 'departure' : 'arrival';

        app.removeAlarm(leg, type);
        $('.set[data-id=' + id + ']')
            .removeClass('set')
            .find('.alarm-content')
            .text('+');

        closeAlarmSettings();
    };

    function processItinerary(it)
    {
        var out =
        {
            duration: it.duration / 1000,
            distance: 0,
            legs: []
        };
        var now = new Date().getTime();
        var stripStart, stripEnd, mode, oddEven, legCount=0, d_alarm, a_alarm;

        for (var i = 0; i < it.legs.length; ++i)
        {
            out.distance += it.legs[i].distance;

            stripStart = false;
            stripEnd = false;
            mode = it.legs[i].mode;
            d_alarm = app.findAlarm(i, 'departure');
            a_alarm = app.findAlarm(i, 'arrival');

            // Strip out some uninteresting Walk information
            if (mode == 'WALK') {
                if (i && i < it.legs.length - 1) {
                    // Strip transfer legs, those are not interesting
                    continue;
                } else if (i === 0) {
                    // strip  end of first walk leg, not interesting
                    stripEnd = true;
                } else if (i === it.legs.length - 1) {
                    // strip start of last walk leg, not interesting
                    stripStart = true;
                }
            }
            // as we strip legs, we need to have a seperate counter
            oddEven = legCount%2 ? 'odd' : 'even';
            legCount++;

            // set the icon
            // TODO: Make me a function [it was already there! app.formatMode, also as Handlebars helper]
            // I've seperated duplicated the function to app.formatIcon (and helper) in case we're doing localization

            // Start place
            if (!stripStart) {
                out.legs.push(
                {
                    index: i,
                    time: it.legs[i].startTime,
                    place: it.legs[i].from.name,
                    departure: (it.legs[i].startTime - now) / 1000,
                    alarm: d_alarm && d_alarm.leadTime,
                    oddEven: oddEven
                });
            }

            // Transit leg
            out.legs.push(
            {
                index: i,
                time: it.legs[i].endTime,
                mode: mode,
                type: it.legs[i].routeShortName || ucfirst(app.formatMode(mode)),
                headsign: it.legs[i].headsign || it.legs[i].to.name,
                oddEven: oddEven
            });

            // End place
            if (!stripEnd) {
                out.legs.push(
                {
                    index: i,
                    time: it.legs[i].endTime,
                    place: it.legs[i].to.name,
                    arrival: (it.legs[i].endTime - now) / 1000,
                    alarm: a_alarm && a_alarm.leadTime,
                    oddEven: oddEven
                });
            }
        }

        return out;
    }

    function ucfirst(str)
    {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function closeAlarmSettings()
    {
        $('#alarm-setting').remove();
        $('#itinerary,#info,#menu').off('mouseup', closeAlarmSettings);
    }

})(jQuery, window.app = window.app || {});