@echo off
title Moevisuals — Local Server
echo.
echo  Starting Moevisuals local server...
echo  Open your browser at: http://localhost:3000
echo.
start "" "http://localhost:3000"
node "%~dp0server.js"
pause
