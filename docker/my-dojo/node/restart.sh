#!/bin/bash

cd /home/node/app/accounts
forever start -a -l /dev/stdout -o /dev/null -e /dev/null index.js

cd /home/node/app/pushtx
forever start -a -l /dev/stdout -o /dev/null -e /dev/null index.js
forever start -a -l /dev/stdout -o /dev/null -e /dev/null index-orchestrator.js

cd /home/node/app/tracker
forever start -a -l /dev/stdout -o /dev/null -e /dev/null index.js

# Keep the container up
while true
do
  sleep 1
done