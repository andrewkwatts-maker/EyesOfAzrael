@echo off
echo ============================================================
echo   Eyes of Azrael - Comprehensive Website Crawler/Validator
echo ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is required but not found in PATH.
    echo Install from https://nodejs.org/
    pause
    exit /b 1
)

:: Check Playwright
node -e "require('@playwright/test')" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Playwright not found. Installing...
    call npm install @playwright/test
    call npx playwright install chromium
)

:: Default URL
set BASE_URL=http://localhost:3000

:: Check if local server is running
curl -s -o nul -w "%%{http_code}" %BASE_URL% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Local server not running at %BASE_URL%
    echo.
    echo Options:
    echo   1. Start dev server: dev.bat
    echo   2. Use live site: Validate.bat --url https://eyesofazrael.web.app
    echo.
    set /p USE_LIVE="Use live site instead? (y/n): "
    if /i "!USE_LIVE!"=="y" (
        set BASE_URL=https://eyesofazrael.web.app
    ) else (
        echo Please start the dev server first, then re-run Validate.bat
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Target: %BASE_URL%
echo [INFO] Starting comprehensive crawl validation...
echo.

:: Run the crawler with any additional arguments passed to the bat file
node scripts/crawl-validate-site.js --url %BASE_URL% %*

echo.
echo ============================================================
echo   Reports saved to:
echo     scripts/reports/crawl-validation-report.json
echo ============================================================
pause
