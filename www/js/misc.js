(function($, app)
{
	var loader = (app.loader = app.loader || {});

	/** Initializes the loader and also shows it. */
	loader.init = function init()
	{
		app.page.before(app.templates.loader());
	}

	/** Shows the loader. */
	loader.show = function show()
	{
		$('#loader').show();
	}

	/** Hides the loader. */
	loader.hide = function hide()
	{
		$('#loader').hide();
	}

})(jQuery, window.app = window.app || {});