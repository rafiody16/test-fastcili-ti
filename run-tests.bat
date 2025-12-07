@echo off
echo ================================
echo   Running Unit Tests
echo ================================
echo.

REM Run all tests
php artisan test

echo.
echo ================================
echo   Test Complete!
echo ================================
echo.

pause
