(function($, app)
{
	function pad(x)
	{
		return (x > 9 ? '' : '0') + x;
	}

	/** Formats a (valid) js date repersentation to: yyyy-mm-ddThh:mm (used by html5 date input)*/
	app.formatISODateTime = function formatISODateTime(datetime)
	{
		if (!datetime)
			return '';
		return new Date(datetime).toISOString().match(/^[^:]*:[^:]*/)[0];
	}

	/** Formats a (valid) js date repersentation to: yyyy-mm-dd (used by html5 date input)*/
	app.formatISODate = function formatISODate(datetime)
	{
		datetime = new Date(datetime);
		return datetime.getFullYear() + '-' + pad(datetime.getMonth() + 1) + '-' + pad(datetime.getDate());
	}

	/** Formats a (valid) js date repersentation to: hh:mm (used by html5 time input)*/
	app.formatISOTime = function formatISOTime(datetime)
	{
		datetime = new Date(datetime);
		return pad(datetime.getHours()) + ':' + pad(datetime.getMinutes());
	}

	/** Formats a (valid) js date repersentation according to datetime locale*/
	app.formatLCDateTime = function formatLCDateTime(datetime)
	{
		if (!datetime)
			return '';
		return new Date(datetime).toLocaleString();
	}

	/** Formats a (valid) js date repersentation according to date locale*/
	app.formatLCDate = function formatLCDate(datetime)
	{
		if (!datetime)
			return '';
		return new Date(datetime).toLocaleDateString();
	}

	/** Formats a (valid) js date repersentation according to time locale*/
	app.formatLCTime = function formatLCTime(datetime)
	{
		if (!datetime)
			return '';
		return new Date(datetime).toLocaleTimeString();
	}

	/** Formats a duration in seconds in a more human-readable way. */
	app.formatDuration = function formatDuration(seconds)
	{
		if (seconds >= 7200) /* past two hours */
		{
			var hours = Math.floor(seconds / 3600);
			var mins = Math.round(seconds % 3600 / 60);
			return hours + ' hours' + (mins ? ' and ' + mins + (mins == 1 ? ' minute' : ' minutes') : '');
		}
		else if (seconds >= 120 || !(seconds-0)) /* past two minutes */
		{
			var mins = Math.round(seconds / 60);
			return mins + ' minutes';
		}
		else
		{
			var mins = Math.floor(seconds / 60);
			var secs = Math.floor(seconds % 60);
			return (mins ? '1 minute' + (secs ? ' and ' : '') : '')
			     + (secs || !mins ? secs + (secs == 1 ? ' second' : ' seconds') : '');
		}
	}

	/** Formats a relative time (seconds) in a more human-readable way. */
	app.formatTiming = function formatTiming(seconds)
	{
		seconds = Math.floor(seconds);
		if (!seconds)
			return 'now';
		else if (seconds < 0)
			return app.formatDuration(-seconds) + ' ago';
		else
			return 'in ' + app.formatDuration(seconds);
	}

	/** Formates a distance. */
	app.formatDistance = function formatDistance(meters)
	{
		return (meters / 1000).toFixed(1) + 'km';
	}

	/** Formats a (valid) js date repersentation (h:mm).*/
	app.formatTime = function formatTime(datetime)
	{
		datetime = new Date(datetime);
		return datetime.getHours() + ':' + pad(datetime.getMinutes());
	}

	/** Formats a (valid) js date repersentation (d-m-y).*/
	app.formatDate = function formatDate(datetime)
	{
		datetime = new Date(datetime);
		return datetime.getDate() + '-' + (datetime.getMonth() + 1) + '-' + String(datetime.getFullYear()).substr(2);
	}

	/** Formats OpenTripPlanner modality designations in a more human-readable way. */
	app.formatMode = function formatIcon(mode)
	{
		return {
			'WALK':       'walking',
			'BICYCLE':    'bike',
			'CAR':        'car',
			'TRAM':       'tram',
			'METRO':      'metro',
			'SUBWAY':     'metro',
			'RAIL':       'train',
			'TRAIN':      'train',
			'BUS':        'bus',
			'FERRY':      'ferry',
			'TIMMERS':    'timmers',
			// 'CABLE_CAR':  'cable car',
			// 'GONDOLA':    'gondola',
			// 'FUNICULAR':  'funicular',
			// 'TRANSIT':    'transit',
			// 'TRAINISH':   'trainish',
			// 'BUSISH':     'busish',
			// 'BOARDING':   'boarding',
			// 'ALIGHTING':  'alighting',
			// 'TRANSFER':   'transfer',
			// 'STL':        'stl',
			// 'CUSTOM_MOTOR_VEHICL': 'custom',
			'PUBLIC_TRANSPORT': 'bus',
		}[mode];
	}

	/** Formats OpenTripPlanner modality designations to icon names. */
	app.formatIcon = function formatMode(mode)
	{
		return {
			'WALK':             'walking',
			'BICYCLE':          'bike',
			'CAR':              'car',
			'TRAM':             'tram',
			'METRO':            'metro',
			'SUBWAY':           'metro',
			'RAIL':             'train',
			'TRAIN':            'train',
			'BUS':              'bus',
			'PUBLIC_TRANSPORT': 'bus',
		}[mode] || null;
	}

})(jQuery, window.app = window.app || {})

// Register formatting functions for use in templates
Handlebars.registerHelper('ISOdatetime',  app.formatISODateTime);
Handlebars.registerHelper('ISOdate',      app.formatISODate);
Handlebars.registerHelper('ISOtime',      app.formatISOTime);
Handlebars.registerHelper('LCdatetime',   app.formatLCDateTime);
Handlebars.registerHelper('LCdate',       app.formatLCDate);
Handlebars.registerHelper('LCtime',       app.formatLCTime);
Handlebars.registerHelper('duration',     app.formatDuration);
Handlebars.registerHelper('timing',       app.formatTiming);
Handlebars.registerHelper('distance',     app.formatDistance);
Handlebars.registerHelper('date',         app.formatDate);
Handlebars.registerHelper('time',         app.formatTime);
Handlebars.registerHelper('mode',         app.formatMode);
Handlebars.registerHelper('icon',         app.formatIcon);