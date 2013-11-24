



//OLD CODE TO BE ADAPTED



/**
 * Foreground services as a counterpart for the services that run in the background
 * @namespace Service
 */
var Service = {};

/**
 * Alarm service: functionality for firing alarms.
 * @namespace Service.Alarm 
 */
Service.Alarm = {};

/**
 * Recalculates the alarms (should be called when tracked trip data or alarm settings have changed). 
 */
Service.Alarm.refresh = function ServiceAlarmRefresh()
{
	
	// Obtain the current trip details or fail.
	var res = localStorage['OTP data'] && $.parseJSON(localStorage['OTP data']);
	if (!res)
		return;
		
	var alarms = localStorage['Alarm data'] && $.parseJSON(localStorage['Alarm data']);
	if (!alarms)
		return;
		
	var legs = res.itineraries[0].legs;

	// Loop over all the alarms for updating
	for (var i = 0; i < alarms.length; ++i) {
	
		var alarmLeg = null;
		while (legs.length) {
			var thisleg = legs.shift;
			if (thisleg.id == alarms[i].leg) {
				alarmLeg = thisleg;
				break;
			}
		}
		if (alarmLeg == null) return false; //There is a serious error, so abort.
		
		// Calculate new time for alarm
		alarms[i].time: alarms[i].leadTime + (alarmType == 'departure' ? alarmLeg.startTime : alarmLeg.endTime),

	}
	
	localStorage['Alarm data'] = $.toJSON(alarms);
	
	return alarms;
};

/**
 * Check if an alarm would fire and fire it if so
 * @return {Number} The time of the next alarm that would fire (unix timestamp) or else Infinity
 */
Service.Alarm.check = function ServiceAlarmCheck()
{
	var alarms = localStorage['Alarm data'] && $.parseJSON(localStorage['Alarm data']);
	if (!alarms || !alarms.length)
		return Infinity;
	
	var now = new Date().getTime();

	var nextAlarm = null
	// Check each alarm (they are out of order)
	for (var i = 0; i < alarms.length; ++i) {
		var thisAlarm = alarms[i];
		
		// Check if the alarm should fire, and do so
		if (thisAlarm.time <= now) {
			
			// Remove the item. Compensate the iterator variable.
			alarms.splice(i--, 1);
			
			// Fire the alarm
			Service.Alarm.Fire(alarm);
			
			// Save our alarm set
			localStorage['Alarm data'] = $.toJSON(alarms);

		} else {
			
			// If the alarm should not fire, then it might be the next alarm to fire.
			if (thisAlarm.time < nextAlarm.time) {
				nextAlarm = thisAlarm;
			}
		}
	}

	return alarms.length ? nextAlarm.time : Infinity;
};

/**
 * Sets a new alarm or changes the existing alarm
 * @param {String} leg - To which leg this alarm is related
 * @param {String} alarmType - Alarm type: {departure, arrival}.
 * @param {int} leadTime - The amount of time in seconds before the event that the alarm should sound
 */
Service.Alarm.set = function ServiceAlarmSet(leg, alarmType, leadTime) {
	
	// Remove an earlier setting for this alarm if there is one
	Service.Alarm.remove(leg, alarmType);
	
	
	var alarmData = localStorage['OTP data'] && $.parseJSON(localStorage['OTP data']);

	// Gather trip data in order to calculate alarm time
	var res = localStorage['OTP data'] && $.parseJSON(localStorage['OTP data']);
	if (!res)
		return;
	
	// Find the requested leg
	var legs = res.itineraries[0].legs;
	var alarmLeg = null;
	while (legs.length) {
		var thisleg = legs.shift;
		if (thisleg.id == leg) {
			alarmLeg = thisleg;
			break;
		}
	}
	if (alarmLeg == null) return false;
		
		
	// Calculate the new alarm time and push the alarm into the set
	alarmData.push(
			{
				type: alarmType,
				leadTime: leadTime,
				time: leadTime + (alarmType == 'departure' ? alarmLeg.startTime : alarmLeg.endTime),
				leg: leg
			});

	// Save our alarm set
	localStorage['Alarm data'] = $.toJSON(alarmData);

};

/**
 * Removes the alarm specified by the parameters
 * @param {String} leg - To which leg this alarm is related
 * @param {String} alarmType - Alarm type: {departure, arrival}.
 */
Service.Alarm.remove = function ServiceAlarmRemove(leg, alarmType) {

	var alarmData = localStorage['OTP data'] && $.parseJSON(localStorage['OTP data']);

	// Find the requested alarm
	for (var i = 0; i < alarmData.length; ++i) {
		var thisAlarm = alarmData[i];
		if (thisAlarm.leg == leg && thisAlarm.type == alarmType) {
			
			// Remove the item
			alarmData.splice(i, 1);
			
			// Save our alarm set
			localStorage['Alarm data'] = $.toJSON(alarmData);
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
Service.Alarm.removeAll = function ServiceAlarmRemoveAll() {
	var alarmData = [];
	
	localStorage['Alarm data'] = $.toJSON(alarmData);
};

/**
 * Fires an alarm
 * @param {object} alarm - The alarm object to fire
 */
Service.Alarm.fire = function ServiceAlarmFire(alarm) {
		
	var map = {
		'departure':'Vertrek',
		'arrival':'Aankomst'
	};
	(navigator.notification ? navigator.notification : window).alert('De ' + map[alarm.type] + ' wekker ' ging af!', function(){}, 'Alarm');
		
};



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
cordova.define(	'cordova/plugin/fritsService',	function(require, exports, module) {    
	CreateBackgroundService('com.phonegap.hello_world.FritsService', require, exports, module);
});
var fritsService = cordova.require('cordova/plugin/fritsService');
        	
// Always start the service even if it isn't neede yet.
document.addEventListener('deviceready', function() {
	// Make an API call and start the service on success, else handle error.
	fritsService.getStatus(	
		function(r){startBackgroundService(r);},
		function(e){handleError(e);}
	);
}, true);

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
	fritsService.startService(	function(r){handleSuccess(r);},
							function(e){handleError(e);});
}

// Enable the service timer with 20s interval
function enableTimer() {
	fritsService.enableTimer(	20000,
							function(r){handleSuccess(r);},
							function(e){handleError(e);});
}
 			
// Register the service to start on reboot of the device
function registerForBootStart() {
	fritsService.registerForBootStart(	function(r){handleSuccess(r);},
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
	fritsService.setConfiguration(	config,
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
	fritsService.setConfiguration(	config,
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
