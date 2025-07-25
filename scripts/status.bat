@echo off
REM DealMate Status Check Script for Windows

echo DealMate Platform Status Check
echo =============================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Change to project root
cd /d "%PROJECT_ROOT%"

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js: NOT INSTALLED
) else (
    for /f "delims=" %%i in ('node --version') do echo [OK] Node.js: %%i
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm: NOT INSTALLED
) else (
    for /f "delims=" %%i in ('npm --version') do echo [OK] npm: %%i
)

REM Check Python
echo.
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Python: NOT INSTALLED
) else (
    for /f "delims=" %%i in ('python --version 2^>^&1') do echo [OK] Python: %%i
)

REM Check Rust
echo.
echo Checking Rust...
cargo --version >nul 2>&1
if errorlevel 1 (
    echo [X] Rust/Cargo: NOT INSTALLED
) else (
    for /f "delims=" %%i in ('cargo --version') do echo [OK] Cargo: %%i
    for /f "delims=" %%i in ('rustc --version') do echo [OK] Rustc: %%i
)

REM Check project structure
echo.
echo Checking Project Structure...
if exist "frontend\package.json" (
    echo [OK] Frontend directory exists
) else (
    echo [X] Frontend directory missing
)

if exist "backend\Cargo.toml" (
    echo [OK] Backend directory exists
) else (
    echo [X] Backend directory missing
)

if exist "backend\ai-service\requirements.txt" (
    echo [OK] AI Service directory exists
) else (
    echo [X] AI Service directory missing
)

REM Check .env file
echo.
echo Checking Configuration...
if exist ".env" (
    echo [OK] .env file exists
) else (
    echo [X] .env file missing - run setup.bat to create template
)

REM Check build artifacts
echo.
echo Checking Build Artifacts...
if exist "frontend\.next" (
    echo [OK] Frontend build exists
) else (
    echo [X] Frontend not built - run build.bat
)

if exist "backend\target\release\dealpal-backend.exe" (
    echo [OK] Backend release build exists
) else if exist "backend\target\debug\dealpal-backend.exe" (
    echo [OK] Backend debug build exists
) else (
    echo [X] Backend not built - run build.bat
)

if exist "backend\ai-service\.venv" (
    echo [OK] AI Service virtual environment exists
) else (
    echo [X] AI Service venv missing - run setup.bat
)

REM Check dependencies
echo.
echo Checking Dependencies...
if exist "frontend\node_modules" (
    echo [OK] Frontend dependencies installed
) else (
    echo [X] Frontend dependencies missing - run setup.bat
)

echo.
echo Status check complete!
echo.
pause
