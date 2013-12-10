(function($, app)
{
	/**
	 * Invariant I: app.storage.alarms is always an Array (possibly empty)
	 * Invariant II: for all i: app.storage.alarms[0].time <= app.storage.alarms[i].time
	 * Invariant III: app.storage.alarms[].id is unique
	 */

	 var alarms = (app.alarms = app.alarms || {});

	/**
	 * Get's an unique representation of an alarm event
	 * @param {Number} leg - To which leg this alarm is related
	 * @param {String} alarmType - Alarm type: {departure, arrival}.
	 */
	 app.alarmId = function alarmId(leg, alarmType)
	 {
	 	if ($.isNumeric(leg))
	 	{
	 		if (!('trip' in app.storage)
			|| !(leg in app.storage.trip.itineraries[0].legs))
				return 'null';

			leg = app.storage.trip.itineraries[0].legs[leg];
	 	}

	 	return alarmType == 'departure' ?
	 		'd_' + (leg.from.stopId && leg.from.stopId.agencyId + '_' + leg.from.stopId.id):
	 		'a_' + (leg.to.stopId && leg.to.stopId.agencyId + '_' + leg.to.stopId.id);
	 }

	/**
	 * Recalculates the alarms (should be called when tracked trip data has changed). 
	 */
	app.refreshAlarms = function refreshAlarms()
	{
		var change = undefined; // The trip data has changed

		// Obtain the current trip details or fail.
		if (!('trip' in app.storage)
		|| !(leg in app.storage.trip.itineraries[0].legs))
			return change;

		var legs = app.storage.trip.itineraries[0].legs;
	
		// Loop over all the alarms for updating
		app.storage.alarms = $.map(app.storage.alarms, function(i, alarm)
		{
			var alarmLeg = null;
			$.each(legs, function(i, leg)
			{
				if (alarm.id == app.alarmId(leg, alarm.type))
					alarmLeg = leg;
			});

			// The stop the alarm was set for was not found in the itinerary, cancel the alarm
			if (alarmLeg === null)
			{
				change = 'trip'; // Note that the complete trip has changed
				return undefined;
			}

			var time = (alarm.type == 'departure' ? alarmLeg.startTime : alarmLeg.endTime) - alarm.leadTime;
			if (!change && alarm.time != time)
				change = 'times'; // Note that the times have changed, train is late for instance

			alarm.time = time;
			return alarm;
		});

		// Sort the alarms by firing time
		app.storage.alarms.sort(function(a,b) { return a.time - b.time; });

		alarms.startPolling();
		
		return change;
	};
	
	/**
	 * Check if an alarm would fire and fire it if so
	 * @return {Number} The time of the next alarm that would fire (unix timestamp) or else Infinity
	 */
	app.checkAlarm = function checkAlarm()
	{
		// Get the last alarm from the top that would fire (note invariant II)
		// This ignores backlogged alarms (that prevents a message spree)
		var now = new Date().getTime();
		var alarm = undefined;
		while (app.storage.alarms.length && app.storage.alarms[0].time < now)
			alarm = app.storage.alarms.shift();

		if (alarm)
			app.fireAlarm(alarm);
	
		return app.storage.alarms.length ? app.storage.alarms[0].time : Infinity;
	};
	
	/**
	 * Sets a new alarm or changes the existing alarm
	 * @param {Number} leg - To which leg this alarm is related
	 * @param {String} alarmType - Alarm type: {departure, arrival}.
	 * @param {int} leadTime - The amount of time in miliseconds before the event that the alarm should sound
	 */
	app.setAlarm = function setAlarm(leg, alarmType, leadTime)
	{
		if (!('trip' in app.storage)
		|| !(leg in app.storage.trip.itineraries[0].legs))
			return null;

		// Remove an earlier setting for this alarm if there is one
		app.removeAlarm(leg, alarmType);

		leg = app.storage.trip.itineraries[0].legs[leg];

		// Sanity check: ignore when the alarm is set in the past
		var now = new Date().getTime();
		var alarm = (alarmType == 'departure' ? leg.startTime : leg.endTime) - leadTime;
		if (alarm <= now)
			return null;

		// Calculate the new alarm time
		var alarm = {
			id: app.alarmId(leg, alarmType),
			type: alarmType,
			leadTime: leadTime,
			time: alarm,
		};

		// Push the alarm into the set
		app.storage.alarms.push(alarm);

		// Sort the alarms by firing time
		app.storage.alarms.sort(function(a,b) { return a.time - b.time; });

		alarms.startPolling();

		return alarm;
	};
	
	/**
	 * Removes the alarm specified by the parameters
	 * @param {Number} leg - To which leg this alarm is related
	 * @param {String} alarmType - Alarm type: {departure, arrival}.
	 */
	app.removeAlarm = function removeAlarm(leg, alarmType)
	{
		var id = app.alarmId(leg, alarmType);

		// Find the requested alarm
		for (var i = 0; i < app.storage.alarms.length; ++i) {
			if (app.storage.alarms[i].id == id) {
				
				// Remove the item
				app.storage.alarms.splice(i, 1);

				return true;
			}
		}
		return false;
	};
	
	/**
	 * Removes all alarms.
	 * @param {String} leg - To which leg this alarm is related
	 * @param {String} alarmType - Alarm type: {departure, arrival}.
	 */
	app.removeAllAlarms = function removeAllAlarms()
	{
		app.storage.alarms = [];
		alarms.stopPolling();
	};

	/**
	 * Returns the alarm object of the sepcified leg and type, or null
	 * @param {Number} leg - To which leg this alarm is related
	 * @param {String} alarmType - Alarm type: {departure, arrival}.
	 */
	app.findAlarm = function findAlarm(leg, alarmType)
	{
		var id = app.alarmId(leg, alarmType);

		for (var i = 0; i < app.storage.alarms.length; ++i)
			if (app.storage.alarms[i].id == id)
				return app.storage.alarms[i];

		return null;
	}
	
	/**
	 * Fires an alarm
	 * @param {object} alarm - The alarm object to fire
	 */
	app.fireAlarm = function fireAlarm(alarm)
	{		
		var leg = alarms.findLeg(alarm),
			notification = navigator.notification || window,
			mode = app.formatMode(leg.mode),
			time = app.formatDuration(alarm.leadTime / 1000)
			way = alarm.type == 'departure' ? ' departs in ' : ' arrives in '
			msg = (leg.mode == 'WALK' ?
				(alarm.type == 'departure' ?
					'Your trip starts in ' + time + '!':
					'You will arrive in ' + time + '.') :
				'The ' + mode + way + time + '!');

		notification.alert(msg, function(){}, 'Alarm');
	};

	/** Finds the leg object the alarm belongs to. */
	alarms.findLeg = function findLeg(alarm)
	{
		if (!('trip' in app.storage))
			return null;

		var legs = app.storage.trip.itineraries[0].legs;
		for (var i = 0; i < legs.length; ++i)
			if (alarm.id == app.alarmId(legs[i], alarm.type))
				return legs[i];

		return null;
	}

	/** (Re)starts polling for alarms and fires them automatically. */
	alarms.startPolling = function startPolling()
	{
		if (poll_id)
			clearTimeout(poll_id);

		poll();
	}

	/** Stop alarm polling. */
	alarms.stopPolling = function stopPolling()
	{
		if (poll_id)
			clearTimeout(poll_id);

		poll_id = undefined;
	}

	var poll_id = undefined;

	function poll()
	{
		var now = new Date().getTime();
		var next = app.checkAlarm();
		app.tracker.updateAlarms();

		if (next != Infinity)
			poll_id = setTimeout(poll, Math.max(Math.min((next - now) / 2, 300e3), .5e3));
	};

})(jQuery, window.app = window.app || {});

//Actual communication with the background-service below.
/////////////////////////////////////////////////////////////////////////////////////////////


/*
 * Copyright 2013 Red Folder Consultancy Ltd
 *   
 * Licensed under the Apache License, Version 2.0 (the "License");   
 * you may not use this file except in compliance with the License.   
 * You may obtain a copy of the License at       
 * 
 * 	http://www.apache.org/licenses/LICENSE-2.0   
 *
 * Unless required by applicable law or agreed to in writing, software   
 * distributed under the License is distributed on an "AS IS" BASIS,   
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   
 * See the License for the specific language governing permissions and   
 * limitations under the License.
 */

// Link to the native code through cordova
/*cordova.define(	'cordova/plugin/fritsService',	function(require, exports, module) {    
	CreateBackgroundService('com.phonegap.hello_world.FritsService', require, exports, module);
});
var fritsService = cordova.require('cordova/plugin/fritsService');*/
// NOTE: if the plugin works this will be done automatically

// Always start the service even if it isn't needed yet.
$(document).on('deviceready', function() {
	// Make an API call and start the service on success, else handle error.
	if (!('service' in app))
		console.warn('Background service plugin failed!');
	else
		app.service.getStatus(	
			function(r){startBackgroundService(r);},
			function(e){handleError(e);}
		);
});

// Something to do when an API call succeeds. Do nothing in our case.
function handleSuccess(data) {
	//console.log(data);
}

// Something to do when an API call fails. We log some messages.
function handleError(data) {
	console.log("Error: " + data.ErrorMessage);
	console.log(JSON.stringify(data));
}

// Start the service
function startService() {
	console.log('startservice');
	app.service.startService(	function(r){handleSuccess(r);},
							function(e){handleError(e);});
}

// Enable the service timer with 20s interval
function enableTimer() {
	console.log('enabletimer');
	app.service.enableTimer(	20000,
							function(r){handleSuccess(r);},
							function(e){handleError(e);});
}

// Start the service and then enable the timer
function startServiceAndEnableTimer() {
	console.log('startservice');
	app.service.startService(	function(r){enableTimer();},
							function(e){handleError(e);});
}
 			
// Register the service to start on reboot of the device
function registerForBootStart() {
	console.log('registerboot');
	app.service.registerForBootStart(	function(r){handleSuccess(r);},
									function(e){handleError(e);});
}

/**
 * Public function to set the parameters for an alarm
 * @param {Number} NextAlarmTimestamp - time when alarm will trigger (unix timestamp)
 * @param {String} SBNTitle - statusbar notification title
 * @param {String} SBNBody - statusbar notification message
 */
function setBackgroundAlarm(NextAlarmTimestamp, SBNTitle, SBNBody) {
	//Default 20 second alarm
	NextAlarmTimestamp = NextAlarmTimestamp || (20 + new Date().getTime() / 1000);
	var config = { 
					"NextAlarmTimestamp" : '' + NextAlarmTimestamp,
					"SBNTitle" : SBNTitle,
					"SBNBody" : SBNBody
				}; 
	app.service.setConfiguration(	config,
								function(r){handleSuccess(r);},
								function(e){handleError(e);});
}

/**
 * Public function to cancel the next alarm
 */
function cancelBackgroundAlarm() {
	NextAlarmTimestamp = -1;
	var config = { 
					"NextAlarmTimestamp" : '' + NextAlarmTimestamp,
				}; 
	app.service.setConfiguration(	config,
								function(r){handleSuccess(r);},
								function(e){handleError(e);});
}

// Configure and start the service
function startBackgroundService(data) {
	
	console.log("Starting FritsService in background");
	
	if (data.ServiceRunning) {
		// OK
		if (data.TimerEnabled) {
			// OK
		} else {
			enableTimer();
		} 

	} else { 
		startServiceAndEnableTimer();
		
	} 

	if (data.RegisteredForBootStart) {
		// OK
	} else {
		registerForBootStart();
	}

	//setBackgroundAlarm(null, "Frits alarm!", "Tekst");
}
