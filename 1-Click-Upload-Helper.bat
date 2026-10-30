@echo off
title KVR Car Care - GitHub Pages Upload Helper
cls
echo ========================================================
echo   KVR CAR CARE - 1-CLICK GITHUB UPLOAD HELPER
echo ========================================================
echo.
echo 1. Opening your GitHub Repository upload page:
echo    https://github.com/maheshreddych8-abhi/kvr-car-care/upload/main
echo.
start "" "https://github.com/maheshreddych8-abhi/kvr-car-care/upload/main"

timeout /t 2 /nobreak >nul
echo 2. Opening the updated files folder...
echo.
explorer "%~dp0"

echo ========================================================
echo   INSTRUCTIONS:
echo   - In the folder that just opened, select ALL files
echo     (index.html, customer.html, css, js, icon-*.png, etc.)
echo   - Drag and drop them into the GitHub browser page
echo   - Scroll down on GitHub and click "Commit changes"
echo.
echo   GitHub Pages will update in 60 seconds!
echo ========================================================
pause
