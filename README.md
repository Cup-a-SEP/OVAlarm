# OVAlarm App

A simple alarm app to support the traveller on its public transport journey.

* Requires an [openTripPlanner](https://github.com/opentripplanner/OpenTripPlanner/wiki) instance to talk to.
* Build on top of [Cordova](cordova.apache.org/)
* The alarm functionaility only works on Android for now

## Miscellaneous

### After prepare process hook

A [Grunt](http://gruntjs.com/) process is triggered by a shell script located in ./.cordova/hooks/after_prepare/

* Compiles the .less to .css
* Removes unnecessary files copied over in the cordova prepare process

#### Installation

Requires the global installation of nodejs, npm and grunt-cli

* [nodejs & npm](http://nodejs.org)
* installing grunt-cli globally:
* `sudo npm install grunt-cli@0.1.9 -g`

After that requires to install based on the package.json

* `cd reponame`
* `npm install`

### Background Service

The App is capable of triggering alarms even when it is not running in the foreground. It uses a cordova plugin to add this behaviour to phonegap. The plugin contains platform specific implementations and might require additional care when compiling for a certain platform. When the background service is not installed it will fail silently.

#### Installation

(For a clean installation the following two step can be ommitted)

* Remove the platform specific directories in `/platforms` (leaving `dummy`)
* Remove all files and directries in `/plugins` (leaving `dummy`)

Compile for the selected platform (Android for example)

* `phonegap local build android`

After that delete all platform directories *other than* the one you are targetting from `/platforms`.

Then we add the plugin to the project:

* `phonegap local plugin add plugins-dev/OVAlarmService`

To see if the installation has succeeded see if the config files in `/plaforms` contain the right sections and if the source files were copied to the right folders in `platforms/.../src/`.

When changes were made to the plugin or the platform folders get mangled these steps might be required again.

## Contributors

* Ferry Timmers
* Jasper Hartong
* Jeroen van de Ven

## License

(The MIT License)

Copyright (c) 2013 Plannerstack &lt;jasper@calendar42.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
