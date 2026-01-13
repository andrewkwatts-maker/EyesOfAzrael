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

REM Show help if requested
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
goto start_validation

:show_help
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Quick Validation Script%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo %WHITE%Usage:%RESET%
echo   validate-only.bat [options]
echo.
echo %WHITE%Options:%RESET%
echo   --help, -h    Show this help message
echo.
echo %WHITE%Validation Steps:%RESET%
echo   %CYAN%1.%RESET% Validate connection schema
echo   %CYAN%2.%RESET% Analyze broken link patterns
echo   %CYAN%3.%RESET% Validate cross-links
echo   %CYAN%4.%RESET% Validate mythology-specific links
echo   %CYAN%5.%RESET% Find non-compliant assets
echo   %CYAN%6.%RESET% Generate validation summary
echo.
echo %DIM%NOTE: This script uses existing downloaded assets.%RESET%
echo       Run run-all-validations.bat for full validation with download/backup.
echo.
echo %WHITE%Related Scripts:%RESET%
echo   %CYAN%run-all-validations.bat%RESET%  - Full validation with download
echo   %CYAN%fix-and-validate.bat%RESET%     - Fix issues then validate
echo   %CYAN%push-validated.bat%RESET%       - Validate and push to Firebase
echo.
exit /b 0

:start_validation
cls
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Quick Validation Script%RESET%
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
echo.

REM ============================================================================
REM Step 1: Validate Connection Schema
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 1/%TOTAL_STEPS%]%RESET% Validating connection schema...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%validate-connections.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Connection validation issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Connections
) else (
    echo   %GREEN%[OK]%RESET% Connection validation complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 2: Analyze Broken Links
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 2/%TOTAL_STEPS%]%RESET% Analyzing broken link patterns...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%analyze-broken-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Broken link analysis completed with issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! BrokenLinks
) else (
    echo   %GREEN%[OK]%RESET% Broken link analysis complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 3: Validate Cross-Links
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 3/%TOTAL_STEPS%]%RESET% Validating cross-links...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%validate-cross-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Cross-link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! CrossLinks
) else (
    echo   %GREEN%[OK]%RESET% Cross-link validation complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 4: Validate Mythology Links
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 4/%TOTAL_STEPS%]%RESET% Validating mythology-specific links...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%validate-mythology-links.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Mythology link issues found
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! MythologyLinks
) else (
    echo   %GREEN%[OK]%RESET% Mythology link validation complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 5: Find Non-Compliant Assets
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 5/%TOTAL_STEPS%]%RESET% Finding non-compliant assets...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
if exist "%SCRIPT_DIR%find-non-compliant-assets.js" (
    node "%SCRIPT_DIR%find-non-compliant-assets.js"
    if !ERRORLEVEL! NEQ 0 (
        echo   %YELLOW%[WARN]%RESET% Non-compliant assets found
        set /a FAILED_STEPS+=1
        set FAILED_NAMES=!FAILED_NAMES! Compliance
    ) else (
        echo   %GREEN%[OK]%RESET% All assets are compliant
        set /a PASSED_STEPS+=1
    )
) else (
    echo   %YELLOW%[SKIP]%RESET% find-non-compliant-assets.js not found
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 6: Generate Validation Summary
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 6/%TOTAL_STEPS%]%RESET% Generating validation summary...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%generate-validation-summary.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Summary generation had issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Summary
) else (
    echo   %GREEN%[OK]%RESET% Summary generated successfully
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Summary
REM ============================================================================
set /a COMPLIANCE_PCT=(PASSED_STEPS * 100) / TOTAL_STEPS

echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%                  QUICK VALIDATION COMPLETE%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %DIM%Completed: %date% %time%%RESET%
echo.
echo   %WHITE%Results:%RESET%
echo   %WHITE%--------%RESET%
echo   Passed Steps:  %GREEN%%PASSED_STEPS%%RESET% / %TOTAL_STEPS%
echo   Failed Steps:  %RED%%FAILED_STEPS%%RESET% / %TOTAL_STEPS%
echo   Compliance:    %BOLD%%COMPLIANCE_PCT%%%%RESET%
echo.

if %FAILED_STEPS% GTR 0 (
    echo   %RED%Failed Validations:%RESET%%FAILED_NAMES%
    echo.
    set OVERALL_STATUS=1
)

echo   %WHITE%Reports Location:%RESET% %CYAN%%REPORTS_DIR%%RESET%
echo.

if %COMPLIANCE_PCT% GEQ 90 (
    echo   %GREEN%%BOLD%Status: EXCELLENT%RESET% %GREEN%- Ready for production%RESET%
) else if %COMPLIANCE_PCT% GEQ 70 (
    echo   %CYAN%%BOLD%Status: GOOD%RESET% %CYAN%- Minor issues to address%RESET%
) else if %COMPLIANCE_PCT% GEQ 50 (
    echo   %YELLOW%%BOLD%Status: FAIR%RESET% %YELLOW%- Several issues need attention%RESET%
) else (
    echo   %RED%%BOLD%Status: NEEDS WORK%RESET% %RED%- Run fix-and-validate.bat to apply fixes%RESET%
)

echo.
echo %WHITE%============================================================================%RESET%

pause
exit /b %OVERALL_STATUS%
