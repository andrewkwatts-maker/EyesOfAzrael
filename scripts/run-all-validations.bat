@echo off
REM ============================================================================
REM Eyes of Azrael - Master Validation Script
REM Runs all validation scripts and generates comprehensive reports
REM ============================================================================

echo ============================================================================
echo Eyes of Azrael - Master Validation Suite
echo ============================================================================
echo.

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set ASSETS_DIR=%PROJECT_DIR%\firebase-assets-downloaded
set BACKUP_DIR=%PROJECT_DIR%\backups
set REPORTS_DIR=%SCRIPT_DIR%reports

REM Create directories if not exists
if not exist "%REPORTS_DIR%" mkdir "%REPORTS_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [%time%] Starting validation suite...
echo.

REM ============================================================================
REM Step 1: Download and Backup Assets
REM ============================================================================
echo [Step 1/7] Downloading assets and creating backup...
node "%SCRIPT_DIR%download-and-backup.js"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Asset download/backup had issues
)
echo.

REM ============================================================================
REM Step 2: Check for Duplicate Assets
REM ============================================================================
echo [Step 2/7] Checking for duplicate assets...
node "%SCRIPT_DIR%check-duplicate-assets.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Duplicate assets found - see report
)
echo.

REM ============================================================================
REM Step 3: Validate Connection Schema
REM ============================================================================
echo [Step 3/7] Validating connection schema...
node "%SCRIPT_DIR%validate-connections.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Connection validation issues found
)
echo.

REM ============================================================================
REM Step 4: Analyze Broken Links
REM ============================================================================
echo [Step 4/7] Analyzing broken link patterns...
node "%SCRIPT_DIR%analyze-broken-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Broken link analysis completed with issues
)
echo.

REM ============================================================================
REM Step 5: Validate Cross-Links
REM ============================================================================
echo [Step 5/7] Validating cross-links...
node "%SCRIPT_DIR%validate-cross-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Cross-link issues found
)
echo.

REM ============================================================================
REM Step 6: Validate Mythology Links
REM ============================================================================
echo [Step 6/7] Validating mythology-specific links...
node "%SCRIPT_DIR%validate-mythology-links.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Mythology link issues found
)
echo.

REM ============================================================================
REM Step 7: Generate Summary Report
REM ============================================================================
echo [Step 7/7] Generating summary report...
node "%SCRIPT_DIR%generate-validation-summary.js"
echo.

echo ============================================================================
echo Validation Complete!
echo ============================================================================
echo.
echo Reports saved to: %REPORTS_DIR%
echo.
echo Key reports:
echo   - connection-validation-summary.md
echo   - duplicate-assets-report.json
echo   - broken-link-patterns.json
echo   - mythology-links-report.json
echo   - validation-summary.json
echo.
echo Run this script regularly to track data quality improvements.
echo.

pause
