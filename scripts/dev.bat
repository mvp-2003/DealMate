@echo off
REM DealPal Development Server Script for Windows

echo Starting DealPal Development Servers...
echo =====================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Change to project root
cd /d "%PROJECT_ROOT%"

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please run setup.bat first and configure your .env file
    exit /b 1
)

REM Start services in new windows
echo Starting Backend Server...
start "DealPal Backend" cmd /k "cd backend && cargo run"

echo Starting AI Service...
start "DealPal AI Service" cmd /k "cd backend\ai-service && .venv\Scripts\activate.bat && python main.py"

echo Starting Frontend Server...
start "DealPal Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting in separate windows!
echo.
echo Service URLs:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8080
echo - AI Service: http://localhost:8000
echo.
echo Press Ctrl+C in each window to stop the services.
echo.
pause
