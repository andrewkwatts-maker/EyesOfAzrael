@echo off
:: ============================================
:: Eyes of Azrael - Validate and Backup Script
:: ============================================
:: Creates dated backup, validates all Firebase content, generates report
::
:: Usage: validate-and-backup.bat
::
:: Output:
::   - Dated backup folder in backups/
::   - Validation report in firebase-assets-downloaded/
::   - Console summary of results
::
:: Exit codes:
::   0 = Success (all validations passed)
::   1 = Backup failed
::   2 = Download failed
::   3 = Validation failed (issues found)

setlocal enabledelayedexpansion

:: ============================================
:: Configuration
:: ============================================
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

:: Generate timestamp for backup folder (YYYY-MM-DD_HHMM)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%
set BACKUP_DIR=backups\firebase-backup-%TIMESTAMP%

:: Colors (using ANSI escape codes where supported)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

:: ============================================
:: Header
:: ============================================
echo.
echo %CYAN%============================================%RESET%
echo %CYAN%  Eyes of Azrael - Validation ^& Backup%RESET%
echo %CYAN%============================================%RESET%
echo.
echo   Date: %date%
echo   Time: %time%
echo   Backup: %BACKUP_DIR%
echo.

:: ============================================
:: Step 1: Create dated backup
:: ============================================
echo %CYAN%[1/4] Creating Firebase backup...%RESET%
echo.

:: Create backup directory
if not exist "backups" mkdir backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Check if backup script exists
if not exist "scripts\backup-firestore.js" (
    echo %RED%ERROR: scripts\backup-firestore.js not found!%RESET%
    echo Please ensure the backup script exists.
    exit /b 1
)

:: Run backup
call node scripts\backup-firestore.js --output="%BACKUP_DIR%"
if errorlevel 1 (
    echo.
    echo %RED%ERROR: Backup failed!%RESET%
    echo Check the error message above for details.
    exit /b 1
)

echo.
echo %GREEN%Backup created successfully!%RESET%
echo.

:: ============================================
:: Step 2: Download latest Firebase assets
:: ============================================
echo %CYAN%[2/4] Downloading latest Firebase assets...%RESET%
echo.

:: Check if download script exists
if not exist "scripts\download-all-firebase-assets.js" (
    echo %YELLOW%WARNING: scripts\download-all-firebase-assets.js not found%RESET%
    echo Skipping download, will validate existing local assets.
    goto :validate
)

:: Run download
call node scripts\download-all-firebase-assets.js
if errorlevel 1 (
    echo.
    echo %RED%ERROR: Download failed!%RESET%
    echo Check the error message above for details.
    exit /b 2
)

echo.
echo %GREEN%Download completed!%RESET%
echo.

:: ============================================
:: Step 3: Validate all entities
:: ============================================
:validate
echo %CYAN%[3/4] Validating all entities...%RESET%
echo.

:: Check if validation script exists
if not exist "scripts\validate-and-report.js" (
    echo %YELLOW%WARNING: scripts\validate-and-report.js not found%RESET%
    echo Trying alternative validation script...

    if exist "scripts\test-live-site-navigation.js" (
        call node scripts\test-live-site-navigation.js --local
    ) else (
        echo %RED%ERROR: No validation script found!%RESET%
        exit /b 3
    )
) else (
    call node scripts\validate-and-report.js
)

set VALIDATION_RESULT=%errorlevel%

echo.

:: ============================================
:: Step 4: Display summary
:: ============================================
echo %CYAN%[4/4] Generating summary...%RESET%
echo.
echo %CYAN%============================================%RESET%
echo %CYAN%  VALIDATION COMPLETE%RESET%
echo %CYAN%============================================%RESET%
echo.

:: Display summary if it exists
if exist "firebase-assets-downloaded\_validation_summary.txt" (
    type "firebase-assets-downloaded\_validation_summary.txt"
    echo.
)

:: Display validation report path
echo   %CYAN%Reports:%RESET%
echo   - Backup: %BACKUP_DIR%\
echo   - Validation: firebase-assets-downloaded\_validation_report.json
echo.

:: Final status
if %VALIDATION_RESULT% equ 0 (
    echo %GREEN%STATUS: ALL VALIDATIONS PASSED%RESET%
    echo.
    exit /b 0
) else (
    echo %RED%STATUS: ISSUES FOUND - Check validation report%RESET%
    echo.
    exit /b 3
)
