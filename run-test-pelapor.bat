@echo off
echo ================================
echo Running E2E Test for Pelapor
echo ================================
echo.

REM Change to project directory
cd /d "%~dp0"

REM Run playwright test
node node_modules\playwright\cli.js test e2e/pelapor.spec.js --project=chromium --workers=1 --max-failures=3

echo.
echo ================================
echo Test completed!
echo ================================
pause
