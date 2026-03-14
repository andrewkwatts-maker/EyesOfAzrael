@echo off
echo ==========================================
echo  Eyes of Azrael - Push to Firebase (PUSH)
echo ==========================================
echo.

:: Create timestamped backup before pushing
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%T%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%
set BACKUP_DIR=backups\firebase-pre-push-%TIMESTAMP%

echo [1/5] Backing up current local assets to %BACKUP_DIR%...
if exist firebase-assets-downloaded (
    xcopy /E /I /Q firebase-assets-downloaded "%BACKUP_DIR%" >nul 2>&1
    echo       Backup created: %BACKUP_DIR%
) else (
    echo       WARNING: No firebase-assets-downloaded directory found!
    echo       Run dev.bat first to pull assets.
    pause
    exit /b 1
)
echo.

echo [2/5] Running dry-run sync preview...
echo ==========================================
call node scripts/safe-firebase-sync.js --dry-run
echo ==========================================
echo.

set /p confirm="Proceed with upload to Firebase? (y/n): "
if /i not "%confirm%"=="y" (
    echo.
    echo Aborted. No changes were made to Firebase.
    pause
    exit /b 0
)
echo.

echo [3/5] Uploading to Firebase Firestore...
call node scripts/safe-firebase-sync.js --upload
if errorlevel 1 (
    echo ERROR: Upload failed. Your backup is at %BACKUP_DIR%
    pause
    exit /b 1
)
echo.

echo [4/5] Regenerating inline shader sources...
call node scripts/generate-shader-sources.js
echo.

echo [5/5] Firebase content updated successfully!
echo.
echo  ==========================================
echo   Your data is now live in Firebase.
echo   Backup saved to: %BACKUP_DIR%
echo  ==========================================
echo.

set /p deploy="Also deploy hosting changes? (y/n): "
if /i "%deploy%"=="y" (
    echo.
    echo Deploying to Firebase Hosting...
    call firebase deploy --only hosting
    echo.
    echo Hosting deployed!
)

echo.
echo Done!
pause
