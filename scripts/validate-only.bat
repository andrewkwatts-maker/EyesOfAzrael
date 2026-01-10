@echo off
REM ============================================================================
REM Eyes of Azrael - Quick Validation Script
REM Runs validation checks only (steps 4-9) without download/backup/fix
REM ============================================================================
REM
REM This script performs quick validation using existing downloaded assets:
REM   1. Validate connections
REM   2. Analyze broken links
REM   3. Validate cross-links
REM   4. Validate mythology links
REM   5. Find non-compliant assets
REM   6. Generate validation summary
REM
REM Usage:
REM   validate-only.bat           - Run quick validation
REM   validate-only.bat --help    - Show help
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

REM Show help if requested
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
goto start_validation

:show_help
echo.
echo ============================================================================
echo Eyes of Azrael - Quick Validation Script
echo ============================================================================
echo.
echo Usage:
echo   validate-only.bat [options]
echo.
echo Options:
echo   --help, -h    Show this help message
echo.
echo This script performs quick validation:
echo   1. Validate connection schema
echo   2. Analyze broken link patterns
echo   3. Validate cross-links
echo   4. Validate mythology-specific links
echo   5. Find non-compliant assets
echo   6. Generate validation summary
echo.
echo NOTE: This script uses existing downloaded assets.
echo Run run-all-validations.bat for full validation with download/backup.
echo.
echo Related scripts:
echo   run-all-validations.bat  - Full validation with download
echo   fix-and-validate.bat     - Fix issues then validate
echo   push-validated.bat       - Validate and push to Firebase
echo.
exit /b 0

:start_validation
echo ============================================================================
echo Eyes of Azrael - Quick Validation Script
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
echo.

REM ============================================================================
REM Step 1: Validate Connection Schema
REM ============================================================================
echo ============================================================================
echo [Step 1/%TOTAL_STEPS%] Validating connection schema...
echo [%time%]
echo ============================================================================
node "%SCRIPT_DIR%validate-connections.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Connection validation issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Connections
) else (
    echo [PASSED] Connection validation complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 2: Analyze Broken Links
REM ============================================================================
echo ============================================================================
echo [Step 2/%TOTAL_STEPS%] Analyzing broken link patterns...
echo [%time%]
echo ============================================================================
node "%SCRIPT_DIR%analyze-broken-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Broken link analysis completed with issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! BrokenLinks
) else (
    echo [PASSED] Broken link analysis complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 3: Validate Cross-Links
REM ============================================================================
echo ============================================================================
echo [Step 3/%TOTAL_STEPS%] Validating cross-links...
echo [%time%]
echo ============================================================================
node "%SCRIPT_DIR%validate-cross-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Cross-link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! CrossLinks
) else (
    echo [PASSED] Cross-link validation complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 4: Validate Mythology Links
REM ============================================================================
echo ============================================================================
echo [Step 4/%TOTAL_STEPS%] Validating mythology-specific links...
echo [%time%]
echo ============================================================================
node "%SCRIPT_DIR%validate-mythology-links.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Mythology link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! MythologyLinks
) else (
    echo [PASSED] Mythology link validation complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 5: Find Non-Compliant Assets
REM ============================================================================
echo ============================================================================
echo [Step 5/%TOTAL_STEPS%] Finding non-compliant assets...
echo [%time%]
echo ============================================================================
if exist "%SCRIPT_DIR%find-non-compliant-assets.js" (
    node "%SCRIPT_DIR%find-non-compliant-assets.js"
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Non-compliant assets found
        set /a FAILED_STEPS+=1
        set FAILED_NAMES=!FAILED_NAMES! Compliance
    ) else (
        echo [PASSED] All assets are compliant
        set /a PASSED_STEPS+=1
    )
) else (
    echo [SKIPPED] find-non-compliant-assets.js not found
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 6: Generate Validation Summary
REM ============================================================================
echo ============================================================================
echo [Step 6/%TOTAL_STEPS%] Generating validation summary...
echo [%time%]
echo ============================================================================
node "%SCRIPT_DIR%generate-validation-summary.js"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Summary generation had issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Summary
) else (
    echo [PASSED] Summary generated successfully
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Summary
REM ============================================================================
set /a COMPLIANCE_PCT=(PASSED_STEPS * 100) / TOTAL_STEPS

echo ============================================================================
echo                  QUICK VALIDATION COMPLETE
echo ============================================================================
echo.
echo   Completed: %date% %time%
echo.
echo   Results:
echo   --------
echo   Passed Steps:  %PASSED_STEPS% / %TOTAL_STEPS%
echo   Failed Steps:  %FAILED_STEPS% / %TOTAL_STEPS%
echo   Compliance:    %COMPLIANCE_PCT%%%
echo.

if %FAILED_STEPS% GTR 0 (
    echo   Failed Validations:%FAILED_NAMES%
    echo.
    set OVERALL_STATUS=1
)

echo   Reports Location: %REPORTS_DIR%
echo.

if %COMPLIANCE_PCT% GEQ 90 (
    echo   Status: EXCELLENT - Ready for production
) else if %COMPLIANCE_PCT% GEQ 70 (
    echo   Status: GOOD - Minor issues to address
) else if %COMPLIANCE_PCT% GEQ 50 (
    echo   Status: FAIR - Several issues need attention
) else (
    echo   Status: NEEDS WORK - Run fix-and-validate.bat to apply fixes
)

echo.
echo ============================================================================

pause
exit /b %OVERALL_STATUS%
