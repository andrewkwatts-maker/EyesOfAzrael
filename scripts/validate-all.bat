@echo off
REM ============================================================================
REM Eyes of Azrael - Comprehensive Validation System
REM ============================================================================
REM
REM DEPRECATED: This script is maintained for backwards compatibility.
REM             Please use run-all-validations.bat for the full validation suite.
REM
REM This script runs validation checks on Firebase content using the
REM validation/ subfolder scripts (schema, rendering, links).
REM
REM For comprehensive validation including:
REM   - Duplicate detection
REM   - Connection validation
REM   - Cross-link validation
REM   - Mythology link validation
REM   - Non-compliant asset detection
REM
REM Use: run-all-validations.bat
REM
REM Usage:
REM   validate-all.bat           - Run all validations
REM   validate-all.bat --help    - Show help
REM   validate-all.bat --verbose - Run with verbose output
REM   validate-all.bat --quick   - Skip Firebase sync, use existing data
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
    echo %BOLD%%WHITE%============================================================================%RESET%
    echo %BOLD%%CYAN%  Eyes of Azrael - Validation System%RESET%
    echo %BOLD%%WHITE%============================================================================%RESET%
    echo.
    echo   %YELLOW%DEPRECATED:%RESET% Use %CYAN%run-all-validations.bat%RESET% for comprehensive validation.
    echo.
    echo %WHITE%Usage:%RESET%
    echo   validate-all.bat [options]
    echo.
    echo %WHITE%Options:%RESET%
    echo   --help, -h     Show this help message
    echo   --verbose, -v  Show detailed output from each validation step
    echo   --quick, -q    Skip Firebase sync, use existing downloaded data
    echo.
    echo %WHITE%This script performs:%RESET%
    echo   %CYAN%1.%RESET% Firebase content sync ^(unless --quick^)
    echo   %CYAN%2.%RESET% Schema validation
    echo   %CYAN%3.%RESET% Rendering validation
    echo   %CYAN%4.%RESET% Link validation
    echo   %CYAN%5.%RESET% Report generation ^(HTML and JSON^)
    echo.
    echo %WHITE%Output:%RESET%
    echo   Reports: %CYAN%%REPORTS_DIR%%RESET%
    echo.
    echo %WHITE%Recommended Scripts:%RESET%
    echo   %CYAN%run-all-validations.bat%RESET%  - %GREEN%Full validation suite (RECOMMENDED)%RESET%
    echo   %CYAN%fix-and-validate.bat%RESET%     - Fix issues then validate
    echo   %CYAN%validate-only.bat%RESET%        - Quick validation only
    echo   %CYAN%push-validated.bat%RESET%       - Validate and push to Firebase
    echo.
    exit /b 0
)

REM Print header
cls
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Validation System%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %DIM%Started: %date% %time%%RESET%
echo.
echo   %YELLOW%NOTE:%RESET% This script is %YELLOW%DEPRECATED%RESET%.
echo         Consider using %CYAN%run-all-validations.bat%RESET% for comprehensive validation.
echo.

REM Track overall status
set OVERALL_STATUS=0
set FAILED_STEPS=

REM Ensure reports directory exists
if not exist "%REPORTS_DIR%" (
    echo   %CYAN%[INFO]%RESET% Creating reports directory...
    mkdir "%REPORTS_DIR%"
)

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo   %RED%[FAIL]%RESET% Node.js is not installed or not in PATH
    echo          Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo   %CYAN%[INFO]%RESET% Node.js version:
for /f "tokens=*" %%i in ('node --version') do echo          %%i
echo.

REM ============================================================================
REM Step 1: Pull/Sync Firebase Content
REM ============================================================================
if not defined QUICK (
    echo %WHITE%----------------------------------------------------------------------------%RESET%
    echo   %BOLD%[Step 1/5]%RESET% Syncing Firebase Content
    echo   %DIM%%time%%RESET%
    echo %WHITE%----------------------------------------------------------------------------%RESET%

    node "%VALIDATION_DIR%\pull-firebase-content.js" %VERBOSE%

    if errorlevel 1 (
        echo   %YELLOW%[WARN]%RESET% Firebase sync completed with issues
        REM Don't fail here - we can still validate existing content
    ) else (
        echo   %GREEN%[OK]%RESET% Firebase content sync complete
    )
    echo.
) else (
    echo %WHITE%----------------------------------------------------------------------------%RESET%
    echo   %BOLD%[Step 1/5]%RESET% %YELLOW%Skipped%RESET% ^(--quick mode^)
    echo %WHITE%----------------------------------------------------------------------------%RESET%
    echo   %DIM%Using existing downloaded content...%RESET%
    echo.
)

REM ============================================================================
REM Step 2: Schema Validation
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 2/5]%RESET% Schema Validation
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%

node "%VALIDATION_DIR%\validate-schema.js" %VERBOSE%

if errorlevel 1 (
    echo   %RED%[FAIL]%RESET% Schema validation found issues
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Schema
) else (
    echo   %GREEN%[OK]%RESET% Schema validation complete
)
echo.

REM ============================================================================
REM Step 3: Rendering Validation
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 3/5]%RESET% Rendering Validation
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%

node "%VALIDATION_DIR%\validate-rendering.js" %VERBOSE%

if errorlevel 1 (
    echo   %RED%[FAIL]%RESET% Rendering validation found issues
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Rendering
) else (
    echo   %GREEN%[OK]%RESET% Rendering validation complete
)
echo.

REM ============================================================================
REM Step 4: Link Validation
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 4/5]%RESET% Link Validation
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%

node "%VALIDATION_DIR%\validate-links.js" %VERBOSE%

if errorlevel 1 (
    echo   %RED%[FAIL]%RESET% Link validation found issues
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Links
) else (
    echo   %GREEN%[OK]%RESET% Link validation complete
)
echo.

REM ============================================================================
REM Step 5: Generate Reports
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 5/5]%RESET% Generating Reports
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%

node "%VALIDATION_DIR%\generate-report.js" --format=both

if errorlevel 1 (
    echo   %RED%[FAIL]%RESET% Report generation failed
    set OVERALL_STATUS=1
    set FAILED_STEPS=!FAILED_STEPS! Reports
) else (
    echo   %GREEN%[OK]%RESET% Reports generated successfully
)
echo.

REM ============================================================================
REM Summary
REM ============================================================================
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%                    VALIDATION COMPLETE%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %DIM%Finished: %date% %time%%RESET%
echo.

if %OVERALL_STATUS%==0 (
    echo   %GREEN%%BOLD%Status: ALL VALIDATIONS PASSED%RESET%
    echo.
    echo   %WHITE%Reports available at:%RESET%
    echo   %DIM%- %REPORTS_DIR%\validation-report.html%RESET%
    echo   %DIM%- %REPORTS_DIR%\validation-report.json%RESET%
    echo.
) else (
    echo   %RED%%BOLD%Status: SOME VALIDATIONS FAILED%RESET%
    echo   %RED%Failed steps:%RESET%%FAILED_STEPS%
    echo.
    echo   %WHITE%Review the reports for details:%RESET%
    echo   %DIM%- %REPORTS_DIR%\validation-report.html%RESET%
    echo   %DIM%- %REPORTS_DIR%\validation-report.json%RESET%
    echo.
)

echo   %YELLOW%TIP:%RESET% Use %CYAN%run-all-validations.bat%RESET% for comprehensive validation.
echo.
echo %WHITE%============================================================================%RESET%

pause
exit /b %OVERALL_STATUS%
