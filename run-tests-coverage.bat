@echo off
echo ================================
echo   Running Tests with Coverage
echo ================================
echo.

REM Run tests with coverage
php artisan test --coverage

echo.
echo ================================
echo   Coverage Report Complete!
echo ================================
echo.

pause
