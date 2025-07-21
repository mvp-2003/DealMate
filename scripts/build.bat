@echo off
REM DealPal Build Script for Windows

echo Building DealPal for Windows...
echo ==============================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Change to project root
cd /d "%PROJECT_ROOT%"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    exit /b 1
)

REM Read feature-toggles.json
echo Reading feature-toggles.json...
for /f "delims=" %%i in ('python -c "import json; print(json.load(open('feature-toggles.json'))['buildDev'])"') do set BUILD_DEV=%%i
echo BUILD_DEV flag is set to: %BUILD_DEV%

if "%BUILD_DEV%"=="True" (
    echo Building DealPal for Development...
) else (
    echo Building DealPal for Production...
)

REM Frontend Build
echo.
echo Building Frontend...
cd frontend
if "%BUILD_DEV%"=="True" (
    echo Running Development Frontend Setup...
    call npm install --legacy-peer-deps
    if errorlevel 1 goto error
    echo Frontend is ready for development mode
) else (
    echo Running Production Frontend Build...
    call npm install --legacy-peer-deps
    if errorlevel 1 goto error
    set NODE_ENV=production
    call npm run build
    if errorlevel 1 goto error
    echo Frontend production build complete.
)
cd "%PROJECT_ROOT%"

REM Backend Build
echo.
echo Building Backend...
cd backend
cargo build --release
if errorlevel 1 goto error
cd "%PROJECT_ROOT%"

REM AI Service Setup
echo.
echo Setting up AI Service...
cd backend\ai-service
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)
echo Activating virtual environment and installing dependencies...
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 goto error
cd "%PROJECT_ROOT%"

echo.
echo Build Complete!
echo Frontend: .\frontend\.next
echo Backend: .\backend\target\release\dealpal-backend.exe
echo AI Service: .\backend\ai-service\.venv
echo.
exit /b 0

:error
echo.
echo Build failed! See errors above.
exit /b 1
