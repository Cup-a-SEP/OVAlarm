(function($, app)
{
	/** Dynamically loads (ajax) a html file( and appends it to dest (or head if not specified).
		The path parameter can be overloaded by giving an array of paths.
		Returns a deferred object. */
	app.includeHTML = function includeHTML(path, dest)
	{
		dest = dest || $('head');

		if ($.isArray(path))
		{
			return $.when.apply($, $.map(path, function(path)
			{
				return includeHTML(path, dest);
			})).promise();
		}

		var def = $.Deferred();

		$.get(path).done(function(data, textStatus)
		{
			dest.append(data).ready(function()
			{
				def.resolve(textStatus);
			});
		}).fail(function(jqXHR, textStatus, errorThrown)
		{
			def.reject(textStatus, errorThrown);
		});

		return def.promise();
	}

	/** Object that holds a collection of templates */
	app.templates = {};

	/** Loads a template using Handlebars with the specified name.
		(the container element should have an id with the same name but prefixed by 'tpl:') */
	app.loadTemplate = function loadTemplate(name)
	{
		var template = $('#tpl\\:'+name);

		template.ready(function()
		{
			app.templates[name] = Handlebars.compile(template.html());
		})
	}

	/** Loads a partial template for Handlebars use with the specified name. (similar container constraints) */
	app.loadPartialTemplate = function loadPartialTemplate(name)
	{
		var template = $('#tpl\\:'+name);

		template.ready(function()
		{
			Handlebars.registerPartial(name, template.html());
		})
	}


	/** Persistent storage for the app (WARNING: supports only core types) */
	app.storage = {};

	/** Loads previously saved persistent storage or use the supplied defaults. */
	app.loadStorage = function loadStorage(defaults)
	{
		if (!('appdata' in localStorage))
			app.storage = defaults;
		else
			app.storage = $.parseJSON(localStorage['appdata']);
	}

	/** Saves the current state of the persistent storage. */
	app.saveStorage = function saveStorage()
	{
		localStorage['appdata'] = $.toJSON(app.storage);
	}

	/** Closes the app. */
	app.exitApp = function exitApp()
	{
		$(document).trigger('appexit');
		('app' in navigator ? navigator.app.exitApp : function exitApp()
		{
			// Fallback when app is simulated in a browser
			app.page
				.empty()
				.append($('<style>').text('body { background-color: Black; color: White; }'
				                         +'h1 { padding-top: 49%; text-align: center; }'))
				.append($('<h1>').text('App has been closed'));
		})();
	}

	/** Saves page history (for use of the back button in android). */
	app.history = [];

	/** Saves the current page in the history and clears it. */
	app.newPage = function newPage()
	{
		app.history.push(app.page.children().detach());
	}

	/** Clears the current page and pops the last one from the history.
		(Closes the app when the history is empty) */
	app.pageBack = function pageBack()
	{
		if (app.history.length)
			app.page.empty().append(app.history.pop());
		else
			app.exitApp();
	}

	$(function()
	{
		/** shorthand for page content */
		app.page = $('main');
	})

})(jQuery, window.app = window.app || {});