@echo off
echo ========================================
echo  MIGRATION TRACKING SYSTEM - QUICK START
echo ========================================
echo.
echo [1] Open Dashboard
echo [2] View Progress Report
echo [3] View Statistics
echo [4] View Activity Log
echo [5] Show Mythology Breakdown
echo [6] Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo Opening dashboard...
    start progress-dashboard.html
) else if "%choice%"=="2" (
    echo.
    node scripts\update-tracker.js report
    pause
) else if "%choice%"=="3" (
    echo.
    node scripts\update-tracker.js stats
    pause
) else if "%choice%"=="4" (
    echo Opening activity log...
    start MIGRATION_LOG.md
) else if "%choice%"=="5" (
    echo.
    node scripts\show-breakdown.js
    pause
) else if "%choice%"=="6" (
    exit
) else (
    echo Invalid choice!
    pause
)
