@echo off
setlocal
set "ANDROID_HOME=%~dp0.tools\android-sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "GRADLE_USER_HOME=%~dp0.tools\gradle"
set "JAVA_HOME="
for /d %%J in ("%~dp0.tools\java\jdk-17*") do set "JAVA_HOME=%%~fJ"
if not defined JAVA_HOME (
  echo Project Java installation is missing. See docs\ANDROID-SETUP.md.
  pause
  exit /b 1
)
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"
cd /d "%~dp0mobile"
call npm.cmd run android
pause
