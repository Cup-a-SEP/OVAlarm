(function($, app)
{

	var device = $.Deferred();  // Device ready
	var gui = $.Deferred();     // GUI ready
	var data = $.Deferred();    // Data ready

	/** Opens the app interface. */
	app.startApp = function startApp()
	{
		var request = app.storage.request;
		var results = app.storage.results;
		var trip = app.storage.trip;

		app.newTrip();

		if (request)
			$('main').ready(function()
			{
				app.newTrip(request);
			});

		if (results)
			$('main').ready(function()
			{
				app.newTrip(request);
				// Fake OTP request result
				app.planner.showResults(results);
				app.storage.results = results;
			});
		
		if (trip)
			$('main').ready(function()
			{
				app.trackTrip(trip);
			});

		app.history.shift();
	}

	// App closed event
	$(document).one('appexit', function()
	{
		app.saveStorage();
	});

	// App done loading event
	$(document).on('appready', function()
	{
		app.startApp();
		app.loader.hide();
	});

	// Set up device events
	$(document).on('deviceready', function()
	{
		$(document).on('backbutton', function()
		{
			app.pageBack();
		});
		
		$(document).on('pause', function()
		{
			app.exitApp();
		});
		
		device.resolve();
	});

	// Load data (async)
	setTimeout(function()
	{
		app.loadStorage({ alarms: {} });
		app.storage.alarms = app.storage.alarms || {};
		data.resolve();
	}, 0);

	$(function()
	{

		// First load the loader and then show it
		app.includeHTML('tpl/loader.html').done(function()
		{
			app.loader.init();
		})

		// Load the other templates, send a trigger when done
		app.includeHTML([
			'tpl/bar.html',
			'tpl/planner.html',
			'tpl/results.html',
			'tpl/tutorial.html',
			'tpl/info.html',
			'tpl/itinerary.html',
			'tpl/menu.html'
		]).done(function()
		{
			gui.resolve();

			// Fake things when the app is simulated in a browser
			if (!('app' in navigator))
			{
				$(document).trigger('deviceready');
				debug();
			}
		});

	});

	$.when(device, data, gui).done(function()
	{
		$(document).trigger('appready');
	});

	function debug()
	{
		$('main')
			.after($('<section>')
				.attr('id', 'debug')
				.append('Debug: ')
				.append($('<button>')
					.text('Back')
					.click(function() { $(document).trigger('backbutton'); }))
				.append($('<button>')
					.text('Pause')
					.click(function() { $(document).trigger('pause'); })));

		$(document).on('appexit', function() { $('#debug').remove(); })
	}

})(jQuery, window.app = window.app || {})
