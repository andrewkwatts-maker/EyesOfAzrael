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
echo ============================================================================
echo Eyes of Azrael - Push Validated Script
echo ============================================================================
echo.
echo Usage:
echo   push-validated.bat [options]
echo.
echo Options:
echo   --help, -h     Show this help message
echo   --force, -f    Push even with warnings (70%+ compliance required)
echo.
echo This script performs:
echo   1. Full validation suite
echo   2. If 90%+ compliance: automatically push to Firebase
echo   3. If 70-89% with --force: push with warnings
echo   4. If below threshold: abort push and show issues
echo.
echo IMPORTANT: This script will upload changes to Firebase!
echo Make sure you have reviewed the validation reports.
echo.
echo Related scripts:
echo   run-all-validations.bat  - Full validation without push
echo   fix-and-validate.bat     - Fix issues then validate
echo   validate-only.bat        - Quick validation only
echo.
exit /b 0

:start_validation
echo ============================================================================
echo Eyes of Azrael - Push Validated Script
echo ============================================================================
echo.
echo Started: %date% %time%
echo.

REM Check if assets directory exists
if not exist "%ASSETS_DIR%" (
    echo [ERROR] Assets directory not found: %ASSETS_DIR%
    echo Please run run-all-validations.bat first to download assets.
    pause
    exit /b 1
)

REM Create reports directory if not exists
if not exist "%REPORTS_DIR%" (
    echo [Setup] Creating reports directory...
    mkdir "%REPORTS_DIR%"
)

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [Info] Node.js version:
node --version
echo [Info] Using assets from: %ASSETS_DIR%
if %FORCE_PUSH%==1 (
    echo [Info] Force mode enabled - will push with 70%+ compliance
)
echo.

echo ============================================================================
echo                    PHASE 1: VALIDATION
echo ============================================================================
echo.

REM ============================================================================
REM Step 1: Validate Connection Schema
REM ============================================================================
echo [Step 1/%TOTAL_STEPS%] Validating connection schema... [%time%]
node "%SCRIPT_DIR%validate-connections.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   [WARNING] Connection validation issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Connections
) else (
    echo   [PASSED]
    set /a PASSED_STEPS+=1
)

REM ============================================================================
REM Step 2: Analyze Broken Links
REM ============================================================================
echo [Step 2/%TOTAL_STEPS%] Analyzing broken link patterns... [%time%]
node "%SCRIPT_DIR%analyze-broken-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   [WARNING] Broken link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! BrokenLinks
) else (
    echo   [PASSED]
    set /a PASSED_STEPS+=1
)

REM ============================================================================
REM Step 3: Validate Cross-Links
REM ============================================================================
echo [Step 3/%TOTAL_STEPS%] Validating cross-links... [%time%]
node "%SCRIPT_DIR%validate-cross-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   [WARNING] Cross-link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! CrossLinks
) else (
    echo   [PASSED]
    set /a PASSED_STEPS+=1
)

REM ============================================================================
REM Step 4: Validate Mythology Links
REM ============================================================================
echo [Step 4/%TOTAL_STEPS%] Validating mythology links... [%time%]
node "%SCRIPT_DIR%validate-mythology-links.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   [WARNING] Mythology link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! MythologyLinks
) else (
    echo   [PASSED]
    set /a PASSED_STEPS+=1
)

REM ============================================================================
REM Step 5: Find Non-Compliant Assets
REM ============================================================================
echo [Step 5/%TOTAL_STEPS%] Finding non-compliant assets... [%time%]
if exist "%SCRIPT_DIR%find-non-compliant-assets.js" (
    node "%SCRIPT_DIR%find-non-compliant-assets.js"
    if %ERRORLEVEL% NEQ 0 (
        echo   [WARNING] Non-compliant assets found
        set /a FAILED_STEPS+=1
        set FAILED_NAMES=!FAILED_NAMES! Compliance
    ) else (
        echo   [PASSED]
        set /a PASSED_STEPS+=1
    )
) else (
    echo   [SKIPPED] find-non-compliant-assets.js not found
    set /a PASSED_STEPS+=1
)

REM ============================================================================
REM Step 6: Generate Validation Summary
REM ============================================================================
echo [Step 6/%TOTAL_STEPS%] Generating validation summary... [%time%]
node "%SCRIPT_DIR%generate-validation-summary.js"
if %ERRORLEVEL% NEQ 0 (
    echo   [WARNING] Summary generation had issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Summary
) else (
    echo   [PASSED]
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Calculate Compliance
REM ============================================================================
set /a COMPLIANCE_PCT=(PASSED_STEPS * 100) / TOTAL_STEPS

echo ============================================================================
echo                    VALIDATION RESULTS
echo ============================================================================
echo.
echo   Passed: %PASSED_STEPS% / %TOTAL_STEPS%
echo   Failed: %FAILED_STEPS% / %TOTAL_STEPS%
echo   Compliance: %COMPLIANCE_PCT%%%
echo.

if %FAILED_STEPS% GTR 0 (
    echo   Failed Checks:%FAILED_NAMES%
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

echo ============================================================================
echo                    PHASE 2: FIREBASE PUSH
echo ============================================================================
echo.

if %CAN_PUSH%==0 (
    echo   [ABORTED] %PUSH_MESSAGE%
    echo.
    echo   To fix issues:
    echo     1. Review reports in: %REPORTS_DIR%
    echo     2. Run fix-and-validate.bat to apply automatic fixes
    echo     3. Re-run this script
    echo.
    set OVERALL_STATUS=1
    goto end_script
)

echo   %PUSH_MESSAGE%
echo.
echo   IMPORTANT: This will upload changes to Firebase!
echo.
echo   Press Ctrl+C to cancel, or
pause
echo.

REM ============================================================================
REM Execute Firebase Push
REM ============================================================================
echo [Pushing] Uploading validated assets to Firebase...
echo [%time%]
echo.

REM Check for upload script
if exist "%SCRIPT_DIR%upload-to-firebase.js" (
    node "%SCRIPT_DIR%upload-to-firebase.js"
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Firebase upload failed!
        echo Check the error messages above.
        set OVERALL_STATUS=1
    ) else (
        echo.
        echo [SUCCESS] Assets uploaded to Firebase successfully!
    )
) else if exist "%SCRIPT_DIR%upload-all-content.js" (
    node "%SCRIPT_DIR%upload-all-content.js"
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Firebase upload failed!
        echo Check the error messages above.
        set OVERALL_STATUS=1
    ) else (
        echo.
        echo [SUCCESS] Assets uploaded to Firebase successfully!
    )
) else (
    echo [ERROR] No upload script found!
    echo Expected: upload-to-firebase.js or upload-all-content.js
    set OVERALL_STATUS=1
)

:end_script
echo.
echo ============================================================================
echo                    PUSH VALIDATED COMPLETE
echo ============================================================================
echo.
echo   Completed: %date% %time%
echo   Compliance: %COMPLIANCE_PCT%%%
echo.

if %OVERALL_STATUS%==0 (
    echo   Status: SUCCESS - Assets validated and pushed to Firebase
) else (
    echo   Status: FAILED - See messages above for details
)

echo.
echo ============================================================================

pause
exit /b %OVERALL_STATUS%
