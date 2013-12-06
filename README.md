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

## Contributors

* Ferry
* Jasper Hartong
* Jeroen

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