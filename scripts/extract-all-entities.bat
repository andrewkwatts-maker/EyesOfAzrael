@echo off
REM Master extraction script - extracts all entity types

echo ========================================
echo MASTER ENTITY EXTRACTION PIPELINE
echo ========================================
echo.

echo [1/3] Extracting Heroes...
python extract-heroes.py --all --output heroes_extraction.json
if %errorlevel% neq 0 (
    echo ERROR: Hero extraction failed
    exit /b 1
)
echo.

echo [2/3] Extracting Creatures...
python extract-creatures.py --all --output creatures_extraction.json
if %errorlevel% neq 0 (
    echo ERROR: Creature extraction failed
    exit /b 1
)
echo.

echo [3/3] Extracting Rituals...
python extract-rituals.py --all --output rituals_extraction.json
if %errorlevel% neq 0 (
    echo ERROR: Ritual extraction failed
    exit /b 1
)
echo.

echo ========================================
echo EXTRACTION COMPLETE!
echo ========================================
echo Heroes: heroes_extraction.json
echo Creatures: creatures_extraction.json
echo Rituals: rituals_extraction.json
echo.
