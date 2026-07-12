@echo off
echo Installing LoyaltyPass...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo Node.js found
node --version

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
call npm install

if %ERRORLEVEL% EQU 0 (
    echo Dependencies installed successfully!
) else (
    echo Failed to install dependencies
    exit /b 1
)

REM Check for .env file
echo.
if not exist .env (
    echo No .env file found
    echo Creating .env from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit frontend\.env with your Supabase credentials!
    echo.
    echo Get credentials from:
    echo 1. Create project at https://supabase.com
    echo 2. Go to Settings - API
    echo 3. Copy URL and anon key
    echo.
) else (
    echo .env file found
)

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Setup Supabase (run supabase/schema.sql and policies.sql)
echo 2. Configure frontend/.env with your credentials
echo 3. Run: cd frontend and npm run dev
echo.
echo For detailed instructions, see QUICKSTART.md

cd ..
