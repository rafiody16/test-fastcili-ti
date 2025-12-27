@echo off
REM K6 Stress Test Runner
REM Push the system to its limits

echo ========================================
echo   K6 Stress Testing
echo ========================================
echo.

REM Check if k6 is installed
where k6 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: k6 is not installed!
    echo.
    echo Please install k6:
    echo   - Using Chocolatey: choco install k6
    echo   - Or download from: https://k6.io/docs/getting-started/installation/
    echo.
    pause
    exit /b 1
)

REM Check if application is running
echo Checking if application is running...
curl -s -o nul -w "%%{http_code}" http://localhost > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Application may not be running on http://localhost
    echo Please make sure your Laravel application is running.
    echo.
    choice /C YN /M "Continue anyway?"
    if errorlevel 2 exit /b 1
)

echo.
echo WARNING: This test will push your system to its limits!
echo Duration: Approximately 38 minutes
echo.
echo Make sure to monitor:
echo   - CPU usage
echo   - Memory usage
echo   - Database connections
echo   - Disk I/O
echo.
choice /C YN /M "Ready to start stress test?"
if errorlevel 2 exit /b 0

echo.
echo Starting Stress Test...
echo.

REM Create reports directory if it doesn't exist
if not exist "k6-reports" mkdir k6-reports

REM Run the stress test
k6 run k6/stress-test.js

echo.
echo ========================================
echo   Stress Test Completed!
echo ========================================
echo.
echo Check the results in k6-reports/stress-test-summary.json
echo Review system logs and metrics for bottlenecks.
echo.
pause
