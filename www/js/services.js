(function($, app)
{

	/** Geocode service server address */
	app.geocode_serverpath = 'http://bag42.nl/api/v0/geocode/json';
	//app.geocode_serverpath = 'http://maps.googleapis.com/maps/api/geocode/json';

	/** Geographic coordinate object: lattitude,longitude */
	app.GeoCoord = function GeoCode(lat, long)
	{
		if (typeof long == 'string')
		{
			lat = lat.split(',');
			this.lat = lat[0]-0;
			this.long = lat[1]-0;
		}
		else
		{
			this.lat = lat-0;
			this.long = long-0;
		}
	}

	app.GeoCoord.prototype.toString = function toString()
	{
		return this.lat + ',' + this.long;
	}

	/** Request a list of possible locations based on the given address. (deferred) */
	app.geoCode = function geoCode(address)
	{
		var def = $.Deferred();

		$.getJSON(app.geocode_serverpath,
		{
			address: address + '*', // The notorious bag42 wildcard
			sensor: true,
			region: 'nl'
		}).done(function(data)
		{
			if (data.status == 'OK')
				def.resolve($.map(data.results, function(result)
				{
					// Ignore company entries
					if (result.types.indexOf('companyname') >= 0)
						return;

					var loc = result.geometry.location;
					return {
						address: formatAddress(result),
						coord: new app.GeoCoord(loc.lat-0, loc.lng-0)
					};
				}));
			else
				def.reject(data.status);
		}).fail(function(jqxhr, textStatus, error)
		{
			def.reject(textStatus);
		});

		return def.promise();
	}

	function formatAddress(result)
	{
		var address = [];

		$.each(result.address_components, function(i, component)
		{
			if (component.types.indexOf('route') >= 0)
				address.unshift(component.long_name);
			else if (component.types.indexOf('street_number') >= 0)
				address.push(component.long_name);
			else if (component.types.indexOf('locality') >= 0)
				address.push(component.long_name);
		});

		return address.length ? address.join(' ') : result.formatted_address;
	}

	//--------------------------------------------------------------------------

	app.otp_serverpath = 'http://opentripplanner.nl/otp-rest-servlet/ws';
	//app.otp_serverpath = '' // Debug

	/** Plan a route using OpenTripPlanner (deferred)
		see: http://www.opentripplanner.org/apidoc/0.9.2/resource_Planner.html */
	app.otpPlan = function otpPlan(request)
	{
		var def = $.Deferred();

		// Safeguard in case the default is set too high and makes the server explode
		if (!('maxWalkDistance' in request))
			request['maxWalkDistance'] = 5000;
		
		$.getJSON(app.otp_serverpath + '/plan', request).done(function(data)
		{
			if (typeof data != 'object')
				def.reject(data);
			else if (!data.error)
				def.resolve(data.plan);
			else
				def.reject(data.error.id, data.error.msg);
		}).fail(function(jqxhr, textStatus, error)
		{
			def.reject(textStatus, error);
		});
		
		return def.promise();
	};

})(jQuery, window.app = window.app || {});