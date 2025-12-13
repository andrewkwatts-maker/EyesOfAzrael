@echo off
REM ============================================================================
REM Advanced Cache Clearing - Eyes of Azrael
REM ============================================================================
REM
REM Advanced cache clearing with more options and detailed reporting.
REM This version provides granular control over what gets cleared.
REM

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo  Eyes of Azrael - Advanced Cache Clearing Tool
echo ============================================================
echo.

REM ============================================================================
REM Menu System
REM ============================================================================

:MENU
echo Select cache clearing option:
echo.
echo   1. Quick Clear (localStorage + DNS only)
echo   2. Standard Clear (Browsers + localStorage + DNS)
echo   3. Deep Clear (Everything including Service Workers)
echo   4. Firebase Only (Firebase caches only)
echo   5. Selective Clear (Choose what to clear)
echo   6. Report Only (Show cache sizes without clearing)
echo   7. Exit
echo.

set /p CHOICE="Enter choice (1-7): "

if "%CHOICE%"=="1" goto QUICK_CLEAR
if "%CHOICE%"=="2" goto STANDARD_CLEAR
if "%CHOICE%"=="3" goto DEEP_CLEAR
if "%CHOICE%"=="4" goto FIREBASE_ONLY
if "%CHOICE%"=="5" goto SELECTIVE_CLEAR
if "%CHOICE%"=="6" goto REPORT_ONLY
if "%CHOICE%"=="7" goto END

echo Invalid choice. Please try again.
echo.
goto MENU

REM ============================================================================
REM Quick Clear
REM ============================================================================

:QUICK_CLEAR
echo.
echo Running Quick Clear...
echo.

call :CLEAR_LOCALSTORAGE
call :CLEAR_DNS

echo.
echo Quick Clear complete!
goto MENU

REM ============================================================================
REM Standard Clear
REM ============================================================================

:STANDARD_CLEAR
echo.
echo Running Standard Clear...
echo.

call :CLEAR_BROWSER_CACHE
call :CLEAR_LOCALSTORAGE
call :CLEAR_DNS

echo.
echo Standard Clear complete!
goto MENU

REM ============================================================================
REM Deep Clear
REM ============================================================================

:DEEP_CLEAR
echo.
echo Running Deep Clear...
echo WARNING: This will clear ALL caches. Continue?
set /p CONFIRM="Type YES to confirm: "

if not "%CONFIRM%"=="YES" (
    echo Deep Clear cancelled.
    goto MENU
)

echo.
call :CLEAR_BROWSER_CACHE
call :CLEAR_LOCALSTORAGE
call :CLEAR_SERVICE_WORKERS
call :CLEAR_DNS
call :CLEAR_FIREBASE
call :CLEAR_PROJECT

echo.
echo Deep Clear complete!
goto MENU

REM ============================================================================
REM Firebase Only
REM ============================================================================

:FIREBASE_ONLY
echo.
echo Clearing Firebase caches only...
echo.

call :CLEAR_FIREBASE

echo.
echo Firebase cache clear complete!
goto MENU

REM ============================================================================
REM Selective Clear
REM ============================================================================

:SELECTIVE_CLEAR
echo.
echo Selective Clear - Choose what to clear:
echo.

set /p CLEAR_BROWSER="Clear browser caches? (Y/N): "
set /p CLEAR_LS="Clear localStorage? (Y/N): "
set /p CLEAR_SW="Clear Service Workers? (Y/N): "
set /p CLEAR_DNS_S="Flush DNS? (Y/N): "
set /p CLEAR_FB="Clear Firebase cache? (Y/N): "
set /p CLEAR_PROJ="Clear project cache? (Y/N): "

echo.
if /i "%CLEAR_BROWSER%"=="Y" call :CLEAR_BROWSER_CACHE
if /i "%CLEAR_LS%"=="Y" call :CLEAR_LOCALSTORAGE
if /i "%CLEAR_SW%"=="Y" call :CLEAR_SERVICE_WORKERS
if /i "%CLEAR_DNS_S%"=="Y" call :CLEAR_DNS
if /i "%CLEAR_FB%"=="Y" call :CLEAR_FIREBASE
if /i "%CLEAR_PROJ%"=="Y" call :CLEAR_PROJECT

echo.
echo Selective Clear complete!
goto MENU

REM ============================================================================
REM Report Only
REM ============================================================================

:REPORT_ONLY
echo.
echo Generating cache size report...
echo.

call :REPORT_BROWSER_CACHE
call :REPORT_LOCALSTORAGE
call :REPORT_SERVICE_WORKERS
call :REPORT_FIREBASE
call :REPORT_PROJECT

echo.
echo Report complete!
pause
goto MENU

REM ============================================================================
REM FUNCTIONS
REM ============================================================================

:CLEAR_BROWSER_CACHE
echo [Browser Cache] Clearing...
REM Chrome
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" (
    del /q /f /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*.*" >nul 2>&1
    echo   ✓ Chrome cache cleared
)
REM Edge
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" (
    del /q /f /s "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*.*" >nul 2>&1
    echo   ✓ Edge cache cleared
)
REM Firefox
if exist "%LOCALAPPDATA%\Mozilla\Firefox\Profiles" (
    for /d %%d in ("%LOCALAPPDATA%\Mozilla\Firefox\Profiles\*") do (
        if exist "%%d\cache2" (
            del /q /f /s "%%d\cache2\*.*" >nul 2>&1
        )
    )
    echo   ✓ Firefox cache cleared
)
goto :eof

:CLEAR_LOCALSTORAGE
echo [localStorage] Clearing...
REM Chrome
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage\leveldb" (
    del /q /f "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage\leveldb\*.*" >nul 2>&1
    echo   ✓ Chrome localStorage cleared
)
REM Edge
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage\leveldb" (
    del /q /f "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Local Storage\leveldb\*.*" >nul 2>&1
    echo   ✓ Edge localStorage cleared
)
REM Firefox
for /d %%d in ("%APPDATA%\Mozilla\Firefox\Profiles\*") do (
    if exist "%%d\webappsstore.sqlite" (
        del /q /f "%%d\webappsstore.sqlite" >nul 2>&1
    )
)
echo   ✓ Firefox localStorage cleared
goto :eof

:CLEAR_SERVICE_WORKERS
echo [Service Workers] Clearing...
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" (
    rmdir /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" >nul 2>&1
    echo   ✓ Chrome Service Workers cleared
)
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Service Worker" (
    rmdir /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Service Worker" >nul 2>&1
    echo   ✓ Edge Service Workers cleared
)
goto :eof

:CLEAR_DNS
echo [DNS Cache] Flushing...
ipconfig /flushdns >nul 2>&1
echo   ✓ DNS cache flushed
goto :eof

:CLEAR_FIREBASE
echo [Firebase Cache] Clearing...
if exist "%USERPROFILE%\.cache\firebase" (
    rmdir /s /q "%USERPROFILE%\.cache\firebase" >nul 2>&1
    echo   ✓ Firebase CLI cache cleared
)
if exist ".firebase" (
    rmdir /s /q ".firebase" >nul 2>&1
    echo   ✓ Local .firebase cache cleared
)
goto :eof

:CLEAR_PROJECT
echo [Project Cache] Clearing...
if exist "FIREBASE\cache" (
    rmdir /s /q "FIREBASE\cache" >nul 2>&1
    echo   ✓ FIREBASE\cache cleared
)
if exist "FIREBASE\migration\*.tmp" (
    del /q /f "FIREBASE\migration\*.tmp" >nul 2>&1
    echo   ✓ Temporary files cleared
)
goto :eof

:REPORT_BROWSER_CACHE
echo [Browser Cache Sizes]
REM This would calculate sizes - simplified for now
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" (
    echo   Chrome: Cache exists
) else (
    echo   Chrome: No cache
)
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" (
    echo   Edge: Cache exists
) else (
    echo   Edge: No cache
)
goto :eof

:REPORT_LOCALSTORAGE
echo [localStorage Status]
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage" (
    echo   Chrome localStorage: Exists
) else (
    echo   Chrome localStorage: Empty
)
goto :eof

:REPORT_SERVICE_WORKERS
echo [Service Workers]
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" (
    echo   Chrome Service Workers: Active
) else (
    echo   Chrome Service Workers: None
)
goto :eof

:REPORT_FIREBASE
echo [Firebase Cache]
if exist "%USERPROFILE%\.cache\firebase" (
    echo   Firebase CLI cache: Exists
) else (
    echo   Firebase CLI cache: Empty
)
if exist ".firebase" (
    echo   Local .firebase: Exists
) else (
    echo   Local .firebase: Empty
)
goto :eof

:REPORT_PROJECT
echo [Project Cache]
if exist "FIREBASE\cache" (
    echo   FIREBASE\cache: Exists
) else (
    echo   FIREBASE\cache: Empty
)
goto :eof

:END
echo.
echo Exiting...
endlocal
exit /b
