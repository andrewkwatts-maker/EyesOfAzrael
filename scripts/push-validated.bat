@echo off
REM ============================================================================
REM Eyes of Azrael - Push Validated Script
REM Validates assets then pushes to Firebase if validation passes
REM ============================================================================
REM
REM This script:
REM   1. Runs full validation suite
REM   2. If validation passes (90%+ compliance), pushes to Firebase
REM   3. If validation fails, shows report and does NOT push
REM
REM Usage:
REM   push-validated.bat           - Validate and push if clean
REM   push-validated.bat --force   - Push even with warnings (70%+ required)
REM   push-validated.bat --help    - Show help
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
set REPORTS_DIR=%SCRIPT_DIR%reports

REM Track status
set OVERALL_STATUS=0
set PASSED_STEPS=0
set FAILED_STEPS=0
set TOTAL_STEPS=6
set FAILED_NAMES=
set FORCE_PUSH=0

REM Parse arguments
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
if "%~1"=="--force" set FORCE_PUSH=1
if "%~1"=="-f" set FORCE_PUSH=1
goto start_validation

:show_help
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Push Validated Script%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo %WHITE%Usage:%RESET%
echo   push-validated.bat [options]
echo.
echo %WHITE%Options:%RESET%
echo   --help, -h     Show this help message
echo   --force, -f    Push even with warnings (70%% compliance required)
echo.
echo %WHITE%This script performs:%RESET%
echo   %CYAN%1.%RESET% Full validation suite
echo   %CYAN%2.%RESET% If 90%%+ compliance: automatically push to Firebase
echo   %CYAN%3.%RESET% If 70-89%% with --force: push with warnings
echo   %CYAN%4.%RESET% If below threshold: abort push and show issues
echo.
echo %YELLOW%IMPORTANT:%RESET% This script will upload changes to Firebase!
echo           Make sure you have reviewed the validation reports.
echo.
echo %WHITE%Related Scripts:%RESET%
echo   %CYAN%run-all-validations.bat%RESET%  - Full validation without push
echo   %CYAN%fix-and-validate.bat%RESET%     - Fix issues then validate
echo   %CYAN%validate-only.bat%RESET%        - Quick validation only
echo.
exit /b 0

:start_validation
cls
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Push Validated Script%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %DIM%Started: %date% %time%%RESET%
echo.

REM Check if assets directory exists
if not exist "%ASSETS_DIR%" (
    echo   %RED%[FAIL]%RESET% Assets directory not found: %CYAN%%ASSETS_DIR%%RESET%
    echo          Please run %CYAN%run-all-validations.bat%RESET% first to download assets.
    pause
    exit /b 1
)

REM Create reports directory if not exists
if not exist "%REPORTS_DIR%" (
    echo   %CYAN%[INFO]%RESET% Creating reports directory...
    mkdir "%REPORTS_DIR%"
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
echo   %CYAN%[INFO]%RESET% Using assets from: %DIM%%ASSETS_DIR%%RESET%
if %FORCE_PUSH%==1 (
    echo   %YELLOW%[INFO]%RESET% Force mode enabled - will push with 70%%+ compliance
)
echo.

REM ============================================================================
REM PHASE 1: Validation
REM ============================================================================
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%YELLOW%  PHASE 1: VALIDATION%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.

echo   %DIM%[Step 1/%TOTAL_STEPS%]%RESET% Validating connection schema... %DIM%[%time%]%RESET%
node "%SCRIPT_DIR%validate-connections.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Connection validation issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Connections
) else (
    echo   %GREEN%[OK]%RESET%
    set /a PASSED_STEPS+=1
)

echo   %DIM%[Step 2/%TOTAL_STEPS%]%RESET% Analyzing broken link patterns... %DIM%[%time%]%RESET%
node "%SCRIPT_DIR%analyze-broken-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Broken link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! BrokenLinks
) else (
    echo   %GREEN%[OK]%RESET%
    set /a PASSED_STEPS+=1
)

echo   %DIM%[Step 3/%TOTAL_STEPS%]%RESET% Validating cross-links... %DIM%[%time%]%RESET%
node "%SCRIPT_DIR%validate-cross-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Cross-link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! CrossLinks
) else (
    echo   %GREEN%[OK]%RESET%
    set /a PASSED_STEPS+=1
)

echo   %DIM%[Step 4/%TOTAL_STEPS%]%RESET% Validating mythology links... %DIM%[%time%]%RESET%
node "%SCRIPT_DIR%validate-mythology-links.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Mythology link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! MythologyLinks
) else (
    echo   %GREEN%[OK]%RESET%
    set /a PASSED_STEPS+=1
)

echo   %DIM%[Step 5/%TOTAL_STEPS%]%RESET% Finding non-compliant assets... %DIM%[%time%]%RESET%
if exist "%SCRIPT_DIR%find-non-compliant-assets.js" (
    node "%SCRIPT_DIR%find-non-compliant-assets.js"
    if !ERRORLEVEL! NEQ 0 (
        echo   %YELLOW%[WARN]%RESET% Non-compliant assets found
        set /a FAILED_STEPS+=1
        set FAILED_NAMES=!FAILED_NAMES! Compliance
    ) else (
        echo   %GREEN%[OK]%RESET%
        set /a PASSED_STEPS+=1
    )
) else (
    echo   %YELLOW%[SKIP]%RESET% find-non-compliant-assets.js not found
    set /a PASSED_STEPS+=1
)

echo   %DIM%[Step 6/%TOTAL_STEPS%]%RESET% Generating validation summary... %DIM%[%time%]%RESET%
node "%SCRIPT_DIR%generate-validation-summary.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Summary generation had issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Summary
) else (
    echo   %GREEN%[OK]%RESET%
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Calculate Compliance
REM ============================================================================
set /a COMPLIANCE_PCT=(PASSED_STEPS * 100) / TOTAL_STEPS

echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %WHITE%Validation Results:%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   Passed: %GREEN%%PASSED_STEPS%%RESET% / %TOTAL_STEPS%
echo   Failed: %RED%%FAILED_STEPS%%RESET% / %TOTAL_STEPS%
echo   Compliance: %BOLD%%COMPLIANCE_PCT%%%%RESET%
echo.

if %FAILED_STEPS% GTR 0 (
    echo   %RED%Failed Checks:%RESET%%FAILED_NAMES%
    echo.
)

REM ============================================================================
REM Decision: Push or Abort
REM ============================================================================
set CAN_PUSH=0
set PUSH_MESSAGE=

if %COMPLIANCE_PCT% GEQ 90 (
    set CAN_PUSH=1
    set PUSH_MESSAGE=Excellent compliance - proceeding with push
) else if %COMPLIANCE_PCT% GEQ 70 (
    if %FORCE_PUSH%==1 (
        set CAN_PUSH=1
        set PUSH_MESSAGE=Good compliance with --force flag - proceeding with push
    ) else (
        set PUSH_MESSAGE=Good compliance but below 90%% threshold. Use --force to push anyway.
    )
) else (
    set PUSH_MESSAGE=Compliance too low. Fix issues before pushing.
)

REM ============================================================================
REM PHASE 2: Firebase Push
REM ============================================================================
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%YELLOW%  PHASE 2: FIREBASE PUSH%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.

if %CAN_PUSH%==0 (
    echo   %RED%[ABORTED]%RESET% %PUSH_MESSAGE%
    echo.
    echo   %WHITE%To fix issues:%RESET%
    echo     1. Review reports in: %CYAN%%REPORTS_DIR%%RESET%
    echo     2. Run %CYAN%fix-and-validate.bat%RESET% to apply automatic fixes
    echo     3. Re-run this script
    echo.
    set OVERALL_STATUS=1
    goto end_script
)

echo   %GREEN%%PUSH_MESSAGE%%RESET%
echo.
echo   %YELLOW%IMPORTANT:%RESET% This will upload changes to Firebase!
echo.
echo   Press %CYAN%Ctrl+C%RESET% to cancel, or
pause
echo.

REM ============================================================================
REM Execute Firebase Push
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%Uploading validated assets to Firebase...%RESET%
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo.

REM Check for upload script
if exist "%SCRIPT_DIR%upload-to-firebase.js" (
    node "%SCRIPT_DIR%upload-to-firebase.js"
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo   %RED%[FAIL]%RESET% Firebase upload failed!
        echo          Check the error messages above.
        set OVERALL_STATUS=1
    ) else (
        echo.
        echo   %GREEN%[OK]%RESET% Assets uploaded to Firebase successfully!
    )
) else if exist "%SCRIPT_DIR%upload-all-content.js" (
    node "%SCRIPT_DIR%upload-all-content.js"
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo   %RED%[FAIL]%RESET% Firebase upload failed!
        echo          Check the error messages above.
        set OVERALL_STATUS=1
    ) else (
        echo.
        echo   %GREEN%[OK]%RESET% Assets uploaded to Firebase successfully!
    )
) else (
    echo   %RED%[FAIL]%RESET% No upload script found!
    echo          Expected: upload-to-firebase.js or upload-all-content.js
    set OVERALL_STATUS=1
)

:end_script
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%                    PUSH VALIDATED COMPLETE%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %DIM%Completed: %date% %time%%RESET%
echo   Compliance: %BOLD%%COMPLIANCE_PCT%%%%RESET%
echo.

if %OVERALL_STATUS%==0 (
    echo   %GREEN%%BOLD%Status: SUCCESS%RESET% %GREEN%- Assets validated and pushed to Firebase%RESET%
) else (
    echo   %RED%%BOLD%Status: FAILED%RESET% %RED%- See messages above for details%RESET%
)

echo.
echo %WHITE%============================================================================%RESET%

pause
exit /b %OVERALL_STATUS%
