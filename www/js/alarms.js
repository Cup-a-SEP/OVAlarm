(function($, app)
{
	/**
	 * Invariant I: app.storage.alarms is always an Array (possibly empty)
	 * Invariant II: for all i: app.storage.alarms[0].time <= app.storage.alarms[i].time
	 * Invariant III: app.storage.alarms[].id is unique
	 */
	
	/**
	 * Recalculates the alarms (should be called when tracked trip data has changed). 
	 */
	app.refreshAlarms = function refreshAlarms()
	{
		var change = undefined; // The trip data has changed

		// Obtain the current trip details or fail.
		if (!('trip' in app.storage)
		|| !(leg in app.storage.trip.itineraries[0].legs))
			return;

		var legs = app.storage.trip.itineraries[0].legs;
	
		// Loop over all the alarms for updating
		app.storage.alarms = $.map(app.storage.alarms, function(i, alarm)
		{
			var alarmLeg = null;
			$.each(legs, function(i, leg)
			{
				var id = alarm.type == 'departure' ? 'd' + leg.from.stopCode : 'a' + leg.to.stopCode;
				if (alarm.id == id)
					alarmLeg = leg;
			});

			// The stop the alarm was set for was not found in the itinerary, cancel the alarm
			if (alarmLeg === null)
			{
				change = 'trip'; // Note that the complete trip has changed
				return undefined;
			}

			var time = alarm.leadTime + (alarm.type == 'departure' ? alarmLeg.startTime : alarmLeg.endTime);
			if (!change && alarm.time != time)
				change = 'times'; // Note that the times have changed, train is late for instance

			alarm.time = time;
			return alarm;
		});

		// Sort the alarms by firing time
		app.storage.alarms.sort(function(a,b) { return a.time - b.time; });
		
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
	 * @param {int} leadTime - The amount of time in seconds before the event that the alarm should sound
	 */
	app.setAlarm = function setAlarm(leg, alarmType, leadTime)
	{
		if (!('trip' in app.storage)
		|| !(leg in app.storage.trip.itineraries[0].legs))
			return;

		leg = app.storage.trip.itineraries[0].legs[leg];

		// Remove an earlier setting for this alarm if there is one
		app.removeAlarm(leg, alarmType);

		// Sanity check: ignore when the alarm is set in the past
		var now = new Date().getTime();
		var alarm = leadTime + (alarmType == 'departure' ? leg.startTime : leg.endTime);
		if (alarm <= now)
			return;

		// Calculate the new alarm time and push the alarm into the set
		app.storage.alarms.push(
		{
			id: (alarmType == 'departure' ? 'd' + leg.from.stopCode : 'a' + leg.to.stopCode),
			type: alarmType,
			leadTime: leadTime,
			time: alarm,
		});

		// Sort the alarms by firing time
		app.storage.alarms.sort(function(a,b) { return a.time - b.time; });
	};
	
	/**
	 * Removes the alarm specified by the parameters
	 * @param {Number} leg - To which leg this alarm is related
	 * @param {String} alarmType - Alarm type: {departure, arrival}.
	 */
	app.removeAlarm = function removeAlarm(leg, alarmType) {
	
		if (!('trip' in app.storage)
		|| !(leg in app.storage.trip.itineraries[0].legs))
			return;

		leg = app.storage.trip.itineraries[0].legs[leg];
		var id = alarmType == 'departure' ? 'd' + leg.from.stopCode : 'a' + leg.to.stopCode;

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
	};
	
	/**
	 * Fires an alarm
	 * @param {object} alarm - The alarm object to fire
	 */
	app.fireAlarm = function fireAlarm(alarm) {
			
		var map = {
			'departure':'Vertrek',
			'arrival':'Aankomst'
		}, notification = navigator.notification || window;
		notification.alert('De ' + map[alarm.type] + ' wekker ging af!', function(){}, 'Alarm');
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

// Always start the service even if it isn't neede yet.
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
	app.service.startService(	function(r){handleSuccess(r);},
							function(e){handleError(e);});
}

// Enable the service timer with 20s interval
function enableTimer() {
	app.service.enableTimer(	20000,
							function(r){handleSuccess(r);},
							function(e){handleError(e);});
}
 			
// Register the service to start on reboot of the device
function registerForBootStart() {
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
		startService();
		enableTimer();
		
	} 

	if (data.RegisteredForBootStart) {
		// OK
	} else {
		registerForBootStart();
	}

	//setBackgroundAlarm(null, "Frits alarm!", "Tekst");
}
