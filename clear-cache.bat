@echo off
REM ============================================================================
REM Clear Cache - Eyes of Azrael Firebase Cache Clearing Utility
REM ============================================================================
REM
REM This batch file clears all Firebase-related caches for the Eyes of Azrael
REM mythology website. Run this when you need to force-reload fresh data from
REM Firebase or after deploying new content.
REM
REM Usage: Double-click this file or run from command line: clear-cache.bat
REM

echo.
echo ========================================
echo  Eyes of Azrael - Cache Clearing Tool
echo ========================================
echo.

REM Check if running with admin privileges (needed for some cache locations)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: Not running as Administrator
    echo Some cache locations may not be cleared.
    echo For complete cache clearing, right-click and "Run as Administrator"
    echo.
    pause
)

echo Starting cache clearing process...
echo.

REM ============================================================================
REM 1. Clear Browser Caches (for default browsers)
REM ============================================================================

echo [1/6] Clearing Browser Caches...

REM Chrome/Edge Cache
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" (
    echo   - Clearing Chrome cache...
    del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*.*" >nul 2>&1
    for /d %%d in ("%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*") do @rmdir /s /q "%%d" >nul 2>&1
)

if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" (
    echo   - Clearing Edge cache...
    del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*.*" >nul 2>&1
    for /d %%d in ("%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*") do @rmdir /s /q "%%d" >nul 2>&1
)

REM Firefox Cache
if exist "%LOCALAPPDATA%\Mozilla\Firefox\Profiles" (
    echo   - Clearing Firefox cache...
    for /d %%d in ("%LOCALAPPDATA%\Mozilla\Firefox\Profiles\*") do (
        if exist "%%d\cache2" (
            del /q /f /s "%%d\cache2\*.*" >nul 2>&1
            for /d %%c in ("%%d\cache2\*") do @rmdir /s /q "%%c" >nul 2>&1
        )
    )
)

echo   ✓ Browser caches cleared
echo.

REM ============================================================================
REM 2. Clear localStorage (Firebase cache data)
REM ============================================================================

echo [2/6] Clearing localStorage data...

REM Chrome localStorage
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage" (
    echo   - Clearing Chrome localStorage...
    del /q /f "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage\leveldb\*.*" >nul 2>&1
)

REM Edge localStorage
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage" (
    echo   - Clearing Edge localStorage...
    del /q /f "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage\leveldb\*.*" >nul 2>&1
)

REM Firefox localStorage
if exist "%APPDATA%\Mozilla\Firefox\Profiles" (
    echo   - Clearing Firefox localStorage...
    for /d %%d in ("%APPDATA%\Mozilla\Firefox\Profiles\*") do (
        if exist "%%d\webappsstore.sqlite" (
            del /q /f "%%d\webappsstore.sqlite" >nul 2>&1
        )
    )
)

echo   ✓ localStorage cleared
echo.

REM ============================================================================
REM 3. Clear Service Worker Caches
REM ============================================================================

echo [3/6] Clearing Service Worker caches...

REM Chrome Service Workers
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" (
    echo   - Clearing Chrome Service Workers...
    rmdir /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" >nul 2>&1
)

REM Edge Service Workers
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Service Worker" (
    echo   - Clearing Edge Service Workers...
    rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Service Worker" >nul 2>&1
)

echo   ✓ Service Worker caches cleared
echo.

REM ============================================================================
REM 4. Clear DNS Cache
REM ============================================================================

echo [4/6] Flushing DNS cache...
ipconfig /flushdns >nul 2>&1
echo   ✓ DNS cache flushed
echo.

REM ============================================================================
REM 5. Clear Firebase Emulator Cache (if running locally)
REM ============================================================================

echo [5/6] Clearing Firebase emulator cache...

if exist "%USERPROFILE%\.cache\firebase" (
    echo   - Clearing Firebase CLI cache...
    rmdir /s /q "%USERPROFILE%\.cache\firebase" >nul 2>&1
)

if exist ".firebase" (
    echo   - Clearing local Firebase cache...
    rmdir /s /q ".firebase" >nul 2>&1
)

echo   ✓ Firebase cache cleared
echo.

REM ============================================================================
REM 6. Clear Project-Specific Caches
REM ============================================================================

echo [6/6] Clearing project-specific caches...

REM Clear any local cache files in FIREBASE directory
if exist "FIREBASE\cache" (
    echo   - Clearing FIREBASE\cache directory...
    rmdir /s /q "FIREBASE\cache" >nul 2>&1
)

REM Clear temporary migration files
if exist "FIREBASE\migration\*.tmp" (
    echo   - Clearing temporary migration files...
    del /q /f "FIREBASE\migration\*.tmp" >nul 2>&1
)

REM Clear any cached parsed data (optional - uncomment if needed)
REM if exist "FIREBASE\parsed_data\.cache" (
REM     echo   - Clearing parsed data cache...
REM     rmdir /s /q "FIREBASE\parsed_data\.cache" >nul 2>&1
REM )

echo   ✓ Project caches cleared
echo.

REM ============================================================================
REM Summary
REM ============================================================================

echo ========================================
echo  Cache Clearing Complete!
echo ========================================
echo.
echo The following caches have been cleared:
echo   ✓ Browser caches (Chrome, Edge, Firefox)
echo   ✓ localStorage data
echo   ✓ Service Worker caches
echo   ✓ DNS cache
echo   ✓ Firebase emulator cache
echo   ✓ Project-specific caches
echo.
echo IMPORTANT:
echo   1. Close and reopen your browser to complete cache clearing
echo   2. Press Ctrl+F5 to hard-refresh the website
echo   3. If using Firebase emulator, restart it
echo.
echo Next steps:
echo   - Visit https://eyesofazrael.web.app
echo   - Verify fresh data loads from Firebase
echo   - Check browser console for any errors
echo.

REM ============================================================================
REM Optional: Open browser to test
REM ============================================================================

set /p OPEN_BROWSER="Open website in browser to test? (Y/N): "
if /i "%OPEN_BROWSER%"=="Y" (
    echo.
    echo Opening Eyes of Azrael in default browser...
    start https://eyesofazrael.web.app
)

echo.
echo Press any key to exit...
pause >nul

REM ============================================================================
REM End of script
REM ============================================================================
