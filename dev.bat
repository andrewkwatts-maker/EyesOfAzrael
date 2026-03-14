@echo off
echo ==========================================
echo  Eyes of Azrael - Local Development (PULL)
echo ==========================================
echo.

:: Create timestamped backup of current local assets before overwriting
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%T%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%
set BACKUP_DIR=backups\firebase-backup-%TIMESTAMP%

if exist firebase-assets-downloaded (
    echo [1/4] Backing up current local assets to %BACKUP_DIR%...
    xcopy /E /I /Q firebase-assets-downloaded "%BACKUP_DIR%" >nul 2>&1
    echo       Backup created: %BACKUP_DIR%
) else (
    echo [1/4] No existing local assets to backup - skipping
)
echo.

echo [2/4] Downloading latest Firebase assets...
call node scripts/download-all-firebase-assets.js
if errorlevel 1 (
    echo ERROR: Failed to download Firebase assets. Check your connection and credentials.
    pause
    exit /b 1
)
echo.

echo [3/4] Generating inline shader sources...
call node scripts/generate-shader-sources.js
echo.

echo [4/4] Starting local development server...
echo.
echo  ==========================================
echo   Open http://localhost:3000 in your browser
echo   Press Ctrl+C to stop the server
echo  ==========================================
echo.
node dev-server.js
