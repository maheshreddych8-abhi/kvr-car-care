@echo off
echo Opening GitHub New Repository page in your browser...
start "" "https://github.com/new?name=kvr-car-care&description=KVR+Car+Care+Platform"
timeout /t 2 /nobreak >nul
echo Opening the files folder...
explorer "%~dp0"
echo.
echo Drag all the files from the opened folder directly into GitHub!
pause
