@echo off
setlocal enabledelayedexpansion

echo === e-Belediyem Local PostgreSQL Setup ===
echo.

:: Check required tools
where psql >nul 2>&1
if errorlevel 1 (
  echo ERROR: psql not found. PostgreSQL client tools are required.
  echo Please install PostgreSQL and make sure psql is on your PATH.
  pause
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  echo ERROR: python not found. Install Python 3.12+ and add it to PATH.
  pause
  exit /b 1
)

:: Ensure .env exists
if not exist .env (
  if exist .env.example (
    copy /Y .env.example .env >nul
    echo Copied .env.example to .env
  ) else (
    echo ERROR: .env.example not found. Create .env manually.
    pause
    exit /b 1
  )
)

:: Default PostgreSQL settings
set "DB_NAME=akilli_belediye"
set "DB_USER=postgres"
set "DB_HOST=localhost"
set "DB_PORT=5432"

:: Create database if it does not exist
echo Creating PostgreSQL database '%DB_NAME%' if missing...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" 2>nul | findstr /b /c:"1" >nul
if errorlevel 1 (
  echo Database %DB_NAME% not found. Attempting to create...
  psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"
  if errorlevel 1 (
    echo ERROR: Could not create database %DB_NAME%.
    echo Make sure PostgreSQL is running and your credentials are correct.
    pause
    exit /b 1
  )
  echo Created database %DB_NAME%.
) else (
  echo Database %DB_NAME% already exists.
)

:: Setup Python environment and dependencies
echo.
echo Setting up backend virtual environment...
if not exist backend\.venv (
  pushd backend
  python -m venv .venv
  if errorlevel 1 (
    echo ERROR: Failed to create Python virtual environment.
    popd
    pause
    exit /b 1
  )
  popd
)

pushd backend
call .venv\Scripts\activate.bat
if errorlevel 1 (
  echo ERROR: Failed to activate virtual environment.
  popd
  pause
  exit /b 1
)
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
  echo ERROR: Backend dependency installation failed.
  popd
  pause
  exit /b 1
)
echo Running backend seed script...
python -m app.db.seed
if errorlevel 1 (
  echo ERROR: Backend seed script failed.
  popd
  pause
  exit /b 1
)
popd

echo.
echo Local PostgreSQL setup completed successfully.
echo Run the backend with: cd backend && .venv\Scripts\activate.bat && uvicorn app.main:app --reload
echo Run the frontend with: cd frontend && npm install && npm run dev
pause
