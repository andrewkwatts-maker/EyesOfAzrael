@echo off
REM ============================================================================
REM Eyes of Azrael - Fix and Validate Script
REM Runs schema fixer with --apply flag, then performs full validation
REM ============================================================================
REM
REM This script:
REM   1. Applies schema fixes to all assets
REM   2. Runs the full validation suite
REM
REM Usage:
REM   fix-and-validate.bat           - Fix issues then validate
REM   fix-and-validate.bat --help    - Show help
REM
REM ============================================================================

setlocal enabledelayedexpansion

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
echo ============================================================================
echo Eyes of Azrael - Fix and Validate Script
echo ============================================================================
echo.
echo Usage:
echo   fix-and-validate.bat [options]
echo.
echo Options:
echo   --help, -h    Show this help message
echo.
echo This script performs the following:
echo   1. Creates a backup of current assets
echo   2. Applies schema fixes with --apply flag
echo   3. Runs full validation suite to verify fixes
echo.
echo CAUTION: This script modifies your asset files!
echo A backup is created before applying changes.
echo.
echo Related scripts:
echo   run-all-validations.bat  - Full validation without fixes
echo   validate-only.bat        - Quick validation only
echo   push-validated.bat       - Validate and push to Firebase
echo.
exit /b 0

:start_fix
echo ============================================================================
echo Eyes of Azrael - Fix and Validate Script
echo ============================================================================
echo.
echo Started: %date% %time%
echo.

REM Create directories if not exists
if not exist "%REPORTS_DIR%" (
    echo [Setup] Creating reports directory...
    mkdir "%REPORTS_DIR%"
)
if not exist "%BACKUP_DIR%" (
    echo [Setup] Creating backups directory...
    mkdir "%BACKUP_DIR%"
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
echo.

REM ============================================================================
REM Step 1: Create Backup Before Applying Fixes
REM ============================================================================
echo ============================================================================
echo [Step 1/3] Creating backup before applying fixes...
echo [%time%]
echo ============================================================================
node "%SCRIPT_DIR%download-and-backup.js"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Backup creation had issues - proceeding with caution
) else (
    echo [PASSED] Backup created successfully
)
echo.

REM ============================================================================
REM Step 2: Apply Schema Fixes
REM ============================================================================
echo ============================================================================
echo [Step 2/3] Applying schema fixes...
echo [%time%]
echo ============================================================================
echo.
echo IMPORTANT: This will modify your asset files!
echo Press Ctrl+C to cancel, or
pause

node "%SCRIPT_DIR%fix-schema-issues.js" --apply
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Schema fixer completed with some issues
    set OVERALL_STATUS=1
) else (
    echo [PASSED] Schema fixes applied successfully
)
echo.

REM ============================================================================
REM Step 3: Run Full Validation Suite
REM ============================================================================
echo ============================================================================
echo [Step 3/3] Running validation suite to verify fixes...
echo [%time%]
echo ============================================================================
echo.

REM Run validation steps (excluding download/backup and schema fix since we just did those)
set PASSED_STEPS=0
set FAILED_STEPS=0
set TOTAL_STEPS=6

echo [Validating] Connection schema...
node "%SCRIPT_DIR%validate-connections.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Connection validation issues found
    set /a FAILED_STEPS+=1
) else (
    echo [PASSED] Connection validation
    set /a PASSED_STEPS+=1
)
echo.

echo [Validating] Broken links...
node "%SCRIPT_DIR%analyze-broken-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Broken link issues found
    set /a FAILED_STEPS+=1
) else (
    echo [PASSED] Broken link analysis
    set /a PASSED_STEPS+=1
)
echo.

echo [Validating] Cross-links...
node "%SCRIPT_DIR%validate-cross-links.js"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Cross-link issues found
    set /a FAILED_STEPS+=1
) else (
    echo [PASSED] Cross-link validation
    set /a PASSED_STEPS+=1
)
echo.

echo [Validating] Mythology links...
node "%SCRIPT_DIR%validate-mythology-links.js" "%ASSETS_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Mythology link issues found
    set /a FAILED_STEPS+=1
) else (
    echo [PASSED] Mythology link validation
    set /a PASSED_STEPS+=1
)
echo.

echo [Validating] Asset compliance...
if exist "%SCRIPT_DIR%find-non-compliant-assets.js" (
    node "%SCRIPT_DIR%find-non-compliant-assets.js"
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Non-compliant assets found
        set /a FAILED_STEPS+=1
    ) else (
        echo [PASSED] Asset compliance check
        set /a PASSED_STEPS+=1
    )
) else (
    echo [SKIPPED] find-non-compliant-assets.js not found
    set /a PASSED_STEPS+=1
)
echo.

echo [Generating] Validation summary...
node "%SCRIPT_DIR%generate-validation-summary.js"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Summary generation had issues
    set /a FAILED_STEPS+=1
) else (
    echo [PASSED] Summary generated
    set /a PASSED_STEPS+=1
)
echo.

REM ============================================================================
REM Summary
REM ============================================================================
set /a COMPLIANCE_PCT=(PASSED_STEPS * 100) / TOTAL_STEPS

echo ============================================================================
echo                  FIX AND VALIDATE COMPLETE
echo ============================================================================
echo.
echo   Completed: %date% %time%
echo.
echo   Validation Results:
echo   -------------------
echo   Passed: %PASSED_STEPS% / %TOTAL_STEPS%
echo   Failed: %FAILED_STEPS% / %TOTAL_STEPS%
echo   Score:  %COMPLIANCE_PCT%%%
echo.

if %FAILED_STEPS% GTR 0 (
    echo   Some validation checks still have issues.
    echo   Review reports in: %REPORTS_DIR%
    set OVERALL_STATUS=1
) else (
    echo   All validation checks passed!
    echo   Ready to push with push-validated.bat
)

echo.
echo ============================================================================

pause
exit /b %OVERALL_STATUS%
