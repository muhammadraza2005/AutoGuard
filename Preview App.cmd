@echo off
cd /d "%~dp0mobile"
call npm.cmd run web -- --port 8081
