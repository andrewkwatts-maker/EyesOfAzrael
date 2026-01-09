@echo off
REM ============================================================================
REM Eyes of Azrael - Comprehensive Validation System
REM ============================================================================
REM
REM This script runs all validation checks on Firebase content:
REM   1. Pulls/syncs Firebase content (using existing downloaded data)
REM   2. Validates assets against schemas
REM   3. Validates rendering capability
REM   4. Validates internal links
REM   5. Generates comprehensive HTML and JSON reports
REM
REM Usage:
REM   validate-all.bat           - Run all validations
REM   validate-all.bat --help    - Show help
REM   validate-all.bat --verbose - Run with verbose output
REM   validate-all.bat --quick   - Skip Firebase sync, use existing data
REM
REM Exit Codes:
REM   0 - All validations passed
REM   1 - One or more validations failed
REM
REM ============================================================================

setlocal enabledelayedexpansion

REM Configuration
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
set VALIDATION_DIR=%SCRIPT_DIR%validation
set REPORTS_DIR=%PROJECT_DIR%\reports

REM Default options
set VERBOSE=
set QUICK=
set HELP=

REM Parse command line arguments
:parse_args
if "%~1"=="" goto end_parse
if /i "%~1"=="--help" set HELP=1& shift& goto parse_args
if /i "%~1"=="-h" set HELP=1& shift& goto parse_args
if /i "%~1"=="--verbose" set VERBOSE=--verbose& shift& goto parse_args
if /i "%~1"=="-v" set VERBOSE=--verbose& shift& goto parse_args
if /i "%~1"=="--quick" set QUICK=1& shift& goto parse_args
if /i "%~1"=="-q" set QUICK=1& shift& goto parse_args
shift
goto parse_args
:end_parse

REM Show help if requested
if defined HELP (
    echo.
    echo ============================================================================
    echo Eyes of Azrael - Comprehensive Validation System
    echo ============================================================================
    echo.
    echo Usage:
    echo   validate-all.bat [options]
    echo.
    echo Options:
    echo   --help, -h     Show this help message
    echo   --verbose, -v  Show detailed output from each validation step
    echo   --quick, -q    Skip Firebase sync, use existing downloaded data
    echo.
    echo This script performs:
    echo   1. Firebase content sync ^(unless --quick^)
    echo   2. Schema validation
    echo   3. Rendering validation
    echo   4. Link validation
    echo   5. Report generation ^(HTML and JSON^)
    echo.
    echo Reports are saved to: %REPORTS_DIR%
    echo.
    echo Exit Codes:
    echo   0 - All validations passed
    echo   1 - One or more validations failed
    echo.
    exit /b 0
)

REM Print header
echo.
echo ============================================================================
echo Eyes of Azrael - Comprehensive Validation System
echo ============================================================================
echo Started: %date% %time%
echo.

REM Track overall status
set OVERALL_STATUS=0
set FAILED_STEPS=

REM Ensure reports directory exists
if not exist "%REPORTS_DIR%" (
    echo [Setup] Creating reports directory...
    mkdir "%REPORTS_DIR%"
)

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo [Info] Node.js version:
node --version
echo.

REM ============================================================================
REM Step 1: Pull/Sync Firebase Content
REM ============================================================================
if not defined QUICK (
    echo ============================================================================
    echo Step 1: Syncing Firebase Content
    echo ============================================================================

    node "%VALIDATION_DIR%\pull-firebase-content.js" %VERBOSE%

    if errorlevel 1 (
        echo [WARNING] Firebase sync completed with issues
        REM Don't fail here - we can still validate existing content
    ) else (
        echo [OK] Firebase content sync complete
    )
    echo.
) else (
    echo ============================================================================
    echo Step 1: Skipped ^(--quick mode^)
    echo ============================================================================
    echo Using existing downloaded content...
    echo.
)

REM ============================================================================
REM Step 2: Schema Validation
REM ============================================================================
echo ============================================================================
echo Step 2: Schema Validation
echo ============================================================================

node "%VALIDATION_DIR%\validate-schema.js" %VERBOSE%

if errorlevel 1 (
    echo [FAILED] Schema validation found issues
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Schema
) else (
    echo [PASSED] Schema validation complete
)
echo.

REM ============================================================================
REM Step 3: Rendering Validation
REM ============================================================================
echo ============================================================================
echo Step 3: Rendering Validation
echo ============================================================================

node "%VALIDATION_DIR%\validate-rendering.js" %VERBOSE%

if errorlevel 1 (
    echo [FAILED] Rendering validation found issues
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Rendering
) else (
    echo [PASSED] Rendering validation complete
)
echo.

REM ============================================================================
REM Step 4: Link Validation
REM ============================================================================
echo ============================================================================
echo Step 4: Link Validation
echo ============================================================================

node "%VALIDATION_DIR%\validate-links.js" %VERBOSE%

if errorlevel 1 (
    echo [FAILED] Link validation found issues
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Links
) else (
    echo [PASSED] Link validation complete
)
echo.

REM ============================================================================
REM Step 5: Generate Reports
REM ============================================================================
echo ============================================================================
echo Step 5: Generating Reports
echo ============================================================================

node "%VALIDATION_DIR%\generate-report.js" --format=both

if errorlevel 1 (
    echo [FAILED] Report generation failed
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Reports
) else (
    echo [OK] Reports generated successfully
)
echo.

REM ============================================================================
REM Summary
REM ============================================================================
echo ============================================================================
echo Validation Complete
echo ============================================================================
echo Finished: %date% %time%
echo.

if %OVERALL_STATUS%==0 (
    echo Status: ALL VALIDATIONS PASSED
    echo.
    echo Reports available at:
    echo   - %REPORTS_DIR%\validation-report.html
    echo   - %REPORTS_DIR%\validation-report.json
    echo.
) else (
    echo Status: SOME VALIDATIONS FAILED
    echo Failed steps:%FAILED_STEPS%
    echo.
    echo Review the reports for details:
    echo   - %REPORTS_DIR%\validation-report.html
    echo   - %REPORTS_DIR%\validation-report.json
    echo.
)

exit /b %OVERALL_STATUS%
