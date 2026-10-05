@echo off
setlocal
set "APK_NUMBER=%~1"
if not defined APK_NUMBER set "APK_NUMBER=1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Build-ClientApk.ps1" -Number "%APK_NUMBER%"
set "BUILD_RESULT=%ERRORLEVEL%"
pause
exit /b %BUILD_RESULT%
