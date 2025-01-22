#!/bin/bash
cd ./client || exit
npm install &
cd ./server || exit &
npm install