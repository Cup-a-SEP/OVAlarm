/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var exec = require('cordova/exec'),
    CreateBackgroundService = require('./backgroundService'),
    service = CreateBackgroundService('nl.cup_a_sep.ovalarm.OVAlarmService', require, exports, module);

module.exports = service;


//Bovenstaande werkt niet (Issue #5). Code van vroeger:
/*
cordova.define(	'cordova/plugin/fritsService',	function(require, exports, module) {    
	CreateBackgroundService('com.phonegap.hello_world.FritsService', require, exports, module);
});
var fritsService = cordova.require('cordova/plugin/fritsService');
*/