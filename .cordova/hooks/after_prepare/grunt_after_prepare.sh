#!/bin/bash
if hash grunt 2>/dev/null; then
    grunt after_prepare
else
    echo 'please install grunt if you want to minimize the amount of files in your cordova project and let grunt work for you'
fi