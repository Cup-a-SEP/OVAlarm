(function($, app)
{

	var device = $.Deferred();  // Device ready
	var gui = $.Deferred();     // GUI ready
	var data = $.Deferred();    // Data ready

	// App closed event
	$(document).one('appexit', function()
	{
		app.saveStorage();
	});

	// App done loading event
	$(document).on('appready', function()
	{
		app.loader.hide();
		app.tracker.pollSpeed(10000); // Not the best place to set this...
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
			$(document).trigger('appexit');
		});
		
		device.resolve();
	});

	// Also trigger deviceready when app is simulated in a browser
	if (!('app' in navigator))
		device.resolve();

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
			if ('trip' in app.storage)
				app.trackTrip(app.storage.trip);
			else
				app.newTrip();
			app.history.pop();
			gui.resolve();
		});

	});

	$.when(device, data, gui).done(function()
	{
		$(document).trigger('appready');
	});

})(jQuery, window.app = window.app || {})
