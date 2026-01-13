@echo off
REM ============================================================================
REM Eyes of Azrael - Master Validation Script
REM Runs all validation scripts and generates comprehensive reports
REM ============================================================================
REM
REM This script performs a complete validation pipeline:
REM   1. Download and backup assets
REM   2. Check for duplicate assets
REM   3. Run schema fixer (dry-run mode)
REM   4. Validate connections
REM   5. Analyze broken links
REM   6. Validate cross-links
REM   7. Validate mythology links
REM   8. Find non-compliant assets
REM   9. Generate validation summary
REM  10. Display final summary with compliance percentage
REM
REM Usage:
REM   run-all-validations.bat           - Run full validation suite
REM   run-all-validations.bat --help    - Show help
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

REM Track overall status
set OVERALL_STATUS=0
set PASSED_STEPS=0
set FAILED_STEPS=0
set TOTAL_STEPS=10
set FAILED_NAMES=

REM Show help if requested
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
goto start_validation

:show_help
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Master Validation Suite%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo %WHITE%Usage:%RESET%
echo   run-all-validations.bat [options]
echo.
echo %WHITE%Options:%RESET%
echo   --help, -h    Show this help message
echo.
echo %WHITE%Validation Steps:%RESET%
echo   %CYAN%1.%RESET%  Download and backup assets from Firebase
echo   %CYAN%2.%RESET%  Check for duplicate assets
echo   %CYAN%3.%RESET%  Run schema fixer in dry-run mode
echo   %CYAN%4.%RESET%  Validate connection schema
echo   %CYAN%5.%RESET%  Analyze broken link patterns
echo   %CYAN%6.%RESET%  Validate cross-links
echo   %CYAN%7.%RESET%  Validate mythology-specific links
echo   %CYAN%8.%RESET%  Find non-compliant assets
echo   %CYAN%9.%RESET%  Generate validation summary
echo   %CYAN%10.%RESET% Display final summary with compliance percentage
echo.
echo %WHITE%Output:%RESET%
echo   Reports: %CYAN%%REPORTS_DIR%%RESET%
echo   Backups: %CYAN%%BACKUP_DIR%%RESET%
echo.
echo %WHITE%Related Scripts:%RESET%
echo   %CYAN%fix-and-validate.bat%RESET%   - Fix issues then validate
echo   %CYAN%validate-only.bat%RESET%      - Quick validation (steps 4-9)
echo   %CYAN%push-validated.bat%RESET%     - Validate and push to Firebase
echo.
exit /b 0

:start_validation
cls
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%  Eyes of Azrael - Master Validation Suite%RESET%
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
REM Step 1: Download and Backup Assets
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 1/%TOTAL_STEPS%]%RESET% Downloading assets and creating backup...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%download-and-backup.js"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Asset download/backup had issues
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Download
) else (
    echo   %GREEN%[OK]%RESET% Asset download and backup complete
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 2: Check for Duplicate Assets
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 2/%TOTAL_STEPS%]%RESET% Checking for duplicate assets...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%check-duplicate-assets.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Duplicate assets found - see report
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Duplicates
) else (
    echo   %GREEN%[OK]%RESET% No duplicate assets found
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 3: Run Schema Fixer (Dry-Run Mode)
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 3/%TOTAL_STEPS%]%RESET% Running schema fixer (dry-run mode)...
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
node "%SCRIPT_DIR%fix-schema-issues.js" --dry-run
if %ERRORLEVEL% NEQ 0 (
    echo   %YELLOW%[WARN]%RESET% Schema issues detected - run fix-and-validate.bat to apply fixes
    set /a FAILED_STEPS+=1
    set FAILED_NAMES=!FAILED_NAMES! Schema
) else (
    echo   %GREEN%[OK]%RESET% Schema validation passed
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Step 4: Validate Connection Schema
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 4/%TOTAL_STEPS%]%RESET% Validating connection schema...
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
REM Step 5: Analyze Broken Links
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 5/%TOTAL_STEPS%]%RESET% Analyzing broken link patterns...
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
REM Step 6: Validate Cross-Links
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 6/%TOTAL_STEPS%]%RESET% Validating cross-links...
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
REM Step 7: Validate Mythology Links
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 7/%TOTAL_STEPS%]%RESET% Validating mythology-specific links...
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
REM Step 8: Find Non-Compliant Assets
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 8/%TOTAL_STEPS%]%RESET% Finding non-compliant assets...
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
REM Step 9: Generate Validation Summary
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 9/%TOTAL_STEPS%]%RESET% Generating validation summary...
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
REM Step 10: Display Final Summary
REM ============================================================================
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo   %BOLD%[Step 10/%TOTAL_STEPS%]%RESET% Final Summary
echo   %DIM%%time%%RESET%
echo %WHITE%----------------------------------------------------------------------------%RESET%
echo.

REM Calculate compliance percentage
set /a COMPLIANCE_PCT=(PASSED_STEPS * 100) / TOTAL_STEPS

echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%                      VALIDATION COMPLETE%RESET%
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

echo   %WHITE%Reports Location:%RESET%
echo   %CYAN%%REPORTS_DIR%%RESET%
echo.
if %COMPLIANCE_PCT% GEQ 90 (
    echo   %GREEN%%BOLD%Status: EXCELLENT%RESET% %GREEN%- Ready for production%RESET%
) else if %COMPLIANCE_PCT% GEQ 70 (
    echo   %CYAN%%BOLD%Status: GOOD%RESET% %CYAN%- Minor issues to address%RESET%
) else if %COMPLIANCE_PCT% GEQ 50 (
    echo   %YELLOW%%BOLD%Status: FAIR%RESET% %YELLOW%- Several issues need attention%RESET%
) else (
    echo   %RED%%BOLD%Status: NEEDS WORK%RESET% %RED%- Multiple issues require fixes%RESET%
)

echo.
echo %WHITE%============================================================================%RESET%
echo   %DIM%Run fix-and-validate.bat to apply fixes and re-validate%RESET%
echo %WHITE%============================================================================%RESET%
echo.

REM ============================================================================
REM Display Connection Validation Report
REM ============================================================================
if exist "%REPORTS_DIR%\connection-validation-summary.md" (
    echo.
    echo %BOLD%%WHITE%============================================================================%RESET%
    echo %BOLD%%CYAN%                    CONNECTION VALIDATION REPORT%RESET%
    echo %BOLD%%WHITE%============================================================================%RESET%
    echo.
    type "%REPORTS_DIR%\connection-validation-summary.md"
    echo.
)

REM ============================================================================
REM Display Broken Links Summary
REM ============================================================================
if exist "%REPORTS_DIR%\broken-link-patterns.json" (
    echo.
    echo %BOLD%%WHITE%============================================================================%RESET%
    echo %BOLD%%CYAN%                    BROKEN LINKS SUMMARY%RESET%
    echo %BOLD%%WHITE%============================================================================%RESET%
    echo.
    echo   %WHITE%See full details:%RESET% %CYAN%%REPORTS_DIR%\broken-link-patterns.json%RESET%
    echo.
)

REM ============================================================================
REM Display Key Reports Location
REM ============================================================================
echo.
echo %BOLD%%WHITE%============================================================================%RESET%
echo %BOLD%%CYAN%                    REPORTS GENERATED%RESET%
echo %BOLD%%WHITE%============================================================================%RESET%
echo.
echo   %WHITE%Location:%RESET% %CYAN%%REPORTS_DIR%%RESET%
echo.
echo   %WHITE%Key Reports:%RESET%
echo   %DIM%- connection-validation-summary.md  (Connection validation details)%RESET%
echo   %DIM%- duplicate-assets-report.json      (Duplicate asset detection)%RESET%
echo   %DIM%- broken-link-patterns.json         (Broken link analysis)%RESET%
echo   %DIM%- mythology-links-report.json       (Mythology link validation)%RESET%
echo   %DIM%- validation-summary.json           (Overall validation summary)%RESET%
echo   %DIM%- non-compliant-assets.json         (Schema compliance issues)%RESET%
echo.
echo %WHITE%============================================================================%RESET%

pause
exit /b %OVERALL_STATUS%
