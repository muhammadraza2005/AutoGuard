@echo off
rem Run as administrator. Enables the Microsoft hypervisor used by Android Emulator.
rem This command never restarts Windows automatically.
dism.exe /Online /Enable-Feature /FeatureName:HypervisorPlatform /All /NoRestart > "%~dp0.tools\downloads\windows-hypervisor.log" 2>&1
exit /b %ERRORLEVEL%
