#!/bin/bash
cd ./client || exit
node ../server/src/index.js &
npm run dev &
wait