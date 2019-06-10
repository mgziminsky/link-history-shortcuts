#!/bin/bash
set -x

cd $(dirname $0)

zip -r -ll Browser_Extension.zip . -i *.js options.html clock.png manifest.json CHANGELOG LICENSE
