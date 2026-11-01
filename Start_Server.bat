@echo off
title Smart Home Gardening and Decoration System - Auto Server ^& App Launcher
cd /d "%~dp0"

rem Machine-specific SDK locations are only used if they exist on this PC.
if exist "D:\sdk\platform-tools" (
  set ANDROID_HOME=D:\sdk
  set ANDROID_SDK_ROOT=D:\sdk
  set PATH=D:\sdk\platform-tools;D:\sdk\emulator;%PATH%
)
if exist "D:\.android\avd" set ANDROID_AVD_HOME=D:\.android\avd
set PATH=%~dp0frontend\node_modules\.bin;%PATH%

echo ====================================================
echo    Smart Home Gardening ^& Decoration System
echo ====================================================
echo.
echo [1/3] Detecting Android Emulator / Device...
echo [2/3] Starting Firebase Auth + Backend API (Port 4000)...
echo [3/3] Opening App on your phone screen...
echo.
echo (Press 'r' anytime to reload, 'a' to reopen on phone)
echo ====================================================
echo.

node scripts/dev.js

echo.
pause
