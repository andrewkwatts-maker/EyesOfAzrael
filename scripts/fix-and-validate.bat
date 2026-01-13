@echo off
REM ============================================================================
REM Eyes of Azrael - Fix and Validate Script
REM Runs schema fixer with --apply flag, then performs full validation
REM ============================================================================
REM
REM This script:
REM   1. Creates a backup of current assets
REM   2. Applies schema fixes to all assets
REM   3. Runs the validation suite to verify fixes
REM
REM Usage:
REM   fix-and-validate.bat           - Fix issues then validate
REM   fix-and-validate.bat --help    - Show help
REM
REM ============================================================================

setlocal enabledelayedexpansion

REM Enable ANSI escape sequences
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

REM Define colors
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "YELLOW=%ESC%[33m"
set "CYAN=%ESC%[36m"
set "WHITE=%ESC%[97m"
set "DIM=%ESC%[90m"
set "RESET=%ESC%[0m"
set "BOLD=%ESC%[1m"

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set ASSETS_DIR=%PROJECT_DIR%\firebase-assets-downloaded
set BACKUP_DIR=%PROJECT_DIR%\backups
set REPORTS_DIR=%SCRIPT_DIR%reports

REM Track status
set OVERALL_STATUS=0

REM Show help if requested
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
goto start_fix

:show_help
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Fix and Validate Script%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo %WHITE%Usage:%RESET%
echo   fix-and-validate.bat [options]
echo.
echo %WHITE%Options:%RESET%
echo   --help, -h    Show this help message
echo.
echo %WHITE%This script performs:%RESET%
echo   %CYAN%1.%RESET% Creates a backup of current assets
echo   %CYAN%2.%RESET% Applies schema fixes with --apply flag
echo   %CYAN%3.%RESET% Runs validation suite to verify fixes
echo.
echo %YELLOW%CAUTION:%RESET% This script modifies your asset files!
echo          A backup is created before applying changes.
echo.
echo %WHITE%Related Scripts:%RESET%
echo   %CYAN%run-all-validations.bat%RESET%  - Full validation without fixes
echo   %CYAN%validate-only.bat%RESET%        - Quick validation only
echo   %CYAN%push-validated.bat%RESET%       - Validate and push to Firebase
echo.
exit /b 0

:start_fix
cls
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Fix and Validate Script%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %DIM%Started: %date% %time%%RESET%
echo.

REM Create directories if not exists
if not exist "%REPORTS_DIR%" (
    echo   %CYAN%[INFO]%RESET% Creating reports directory...
    mkdir "%REPORTS_DIR%"
)
if not exist "%BACKUP_DIR%" (
    echo   %CYAN%[INFO]%RESET% Creating backups directory...
    mkdir "%BACKUP_DIR%"
)

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo   %RED%[FAIL]%RESET% Node.js is not installed or not in PATH
    echo          Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo   %CYAN%[INFO]%RESET% Node.js version:
for /f "tokens=*" %%i in ('node --version') do echo          %%i
echo.

REM ============================================================================
REM PHASE 1: Backup
REM ============================================================================
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%YELLOW%  PHASE 1: BACKUP%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 1/3]%RESET% Creating backup before applying fixes...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%download-and-backup.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Backup creation had issues - proceeding with caution
) else (
    echo   %GREEN%[OK]%RESET% Backup created successfully
)
echo.

REM ============================================================================
REM PHASE 2: Apply Fixes
REM ============================================================================
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%YELLOW%  PHASE 2: APPLY FIXES%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %YELLOW%IMPORTANT:%RESET% This will modify your asset files!
echo.
echo   Press %CYAN%Ctrl+C%RESET% to cancel, or
pause
echo.

echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 2/3]%RESET% Applying schema fixes...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%fix-schema-issues.js" --apply
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Schema fixer completed with some issues
    set OVERALL_STATUS=1
) else (
    echo   %GREEN%[OK]%RESET% Schema fixes applied successfully
)
echo.

REM ============================================================================
REM PHASE 3: Validate
REM ============================================================================
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%YELLOW%  PHASE 3: VALIDATION%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 3/3]%RESET% Running validation suite to verify fixes...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo.

REM Run validation steps
set PASSED_STEPS=0
set FAILED_STEPS=0
set TOTAL_STEPS=6
set FAILED_NAMES=

echo   %DIM%Validating connection schema...%RESET%
node "%SCRIPT_DIR%validate-connections.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Connection validation issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Connections
) else (
    echo   %GREEN%[OK]%RESET% Connection validation
    set /a PASSED_STEPS+=1
)

echo   %DIM%Analyzing broken links...%RESET%
node "%SCRIPT_DIR%analyze-broken-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Broken link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! BrokenLinks
) else (
    echo   %GREEN%[OK]%RESET% Broken link analysis
    set /a PASSED_STEPS+=1
)

echo   %DIM%Validating cross-links...%RESET%
node "%SCRIPT_DIR%validate-cross-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Cross-link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! CrossLinks
) else (
    echo   %GREEN%[OK]%RESET% Cross-link validation
    set /a PASSED_STEPS+=1
)

echo   %DIM%Validating mythology links...%RESET%
node "%SCRIPT_DIR%validate-mythology-links.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Mythology link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! MythologyLinks
) else (
    echo   %GREEN%[OK]%RESET% Mythology link validation
    set /a PASSED_STEPS+=1
)

echo   %DIM%Checking asset compliance...%RESET%
if exist "%SCRIPT_DIR%find-non-compliant-assets.js" (
    node "%SCRIPT_DIR%find-non-compliant-assets.js"
    if !ERRORLEVEL! NEQ 0 (
        echo   %YELLOW%[WARN]%RESET% Non-compliant assets found
        set /a FAILED_STEPS+=1
        set FAILED_NAMES=!FAILED_NAMES! Compliance
    ) else (
        echo   %GREEN%[OK]%RESET% Asset compliance check
        set /a PASSED_STEPS+=1
    )
) else (
    echo   %YELLOW%[SKIP]%RESET% find-non-compliant-assets.js not found
    set /a PASSED_STEPS+=1
)

echo   %DIM%Generating validation summary...%RESET%
node "%SCRIPT_DIR%generate-validation-summary.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Summary generation had issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Summary
) else (
    echo   %GREEN%[OK]%RESET% Summary generated
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Summary
REM ============================================================================
set /a COMPLIANCE_PCT=(PASSED_STEPS * 100) / TOTAL_STEPS

echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%                  FIX AND VALIDATE COMPLETE%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %DIM%Completed: %date% %time%%RESET%
echo.
echo   %WHITE%Validation Results:%RESET%
echo   %WHITE%-------------------%RESET%
echo   Passed: %GREEN%%PASSED_STEPS%%RESET% / %TOTAL_STEPS%
echo   Failed: %RED%%FAILED_STEPS%%RESET% / %TOTAL_STEPS%
echo   Score:  %BOLD%%COMPLIANCE_PCT%%%%RESET%
echo.

if %FAILED_STEPS% GTR 0 (
    echo   %RED%Failed:%RESET%%FAILED_NAMES%
    echo.
    echo   %YELLOW%Some validation checks still have issues.%RESET%
    echo   Review reports in: %CYAN%%REPORTS_DIR%%RESET%
    set OVERALL_STATUS=1
) else (
    echo   %GREEN%All validation checks passed!%RESET%
    echo   Ready to push with %CYAN%push-validated.bat%RESET%
)

echo.
echo %WHITE%============================================================================%RESET%

pause
exit /b %OVERALL_STATUS%
