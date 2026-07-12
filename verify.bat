@echo off
echo ========================================
echo LOYALTYPASS SYSTEM VERIFICATION
echo ========================================
echo.

echo [1/5] Checking .env file...
if exist "frontend\.env" (
    findstr /C:"https://" frontend\.env >nul
    if %errorlevel%==0 (
        echo    [OK] Environment variables configured
    ) else (
        echo    [WARNING] Check if .env has https:// in URL
    )
) else (
    echo    [FAIL] .env file missing
)

echo.
echo [2/5] Checking critical files...
if exist "frontend\src\App.tsx" (echo    [OK] App.tsx) else (echo    [FAIL] App.tsx missing)
if exist "frontend\src\lib\supabase.ts" (echo    [OK] supabase.ts) else (echo    [FAIL] supabase.ts missing)
if exist "frontend\src\components\ui\Toggle.tsx" (echo    [OK] Toggle.tsx) else (echo    [FAIL] Toggle.tsx missing)
if exist "COMPLETE_DATABASE_SETUP.sql" (echo    [OK] Database SQL) else (echo    [FAIL] Database SQL missing)

echo.
echo [3/5] Checking Toggle colors...
findstr /C:"bg-red-600" frontend\src\components\ui\Toggle.tsx >nul
if %errorlevel%==0 (
    findstr /C:"bg-green-600" frontend\src\components\ui\Toggle.tsx >nul
    if %errorlevel%==0 (
        echo    [OK] RED off / GREEN on colors present
    )
)

echo.
echo [4/5] Checking Arabic support...
findstr /C:"ar:" frontend\src\i18n.ts >nul
if %errorlevel%==0 (echo    [OK] Arabic translations found) else (echo    [FAIL] Arabic missing)

echo.
echo [5/5] Checking database schema...
findstr /C:"self_service_enabled" COMPLETE_DATABASE_SETUP.sql >nul
if %errorlevel%==0 (echo    [OK] self_service_enabled field present) else (echo    [FAIL] Schema incomplete)

echo.
echo ========================================
echo VERIFICATION COMPLETE
echo ========================================
echo.
echo Next step: Run these commands:
echo   cd frontend
echo   npm install
echo   npm run dev
echo.
pause
