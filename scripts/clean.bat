@echo off
REM DealPal Clean Script for Windows

echo Cleaning DealPal project...
echo ==========================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Change to project root
cd /d "%PROJECT_ROOT%"

REM Frontend cleanup
echo Cleaning Frontend...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next"
    echo - Removed .next directory
)
if exist "frontend\node_modules" (
    echo - Removing node_modules (this may take a while)...
    rmdir /s /q "frontend\node_modules"
    echo - Removed node_modules directory
)

REM Backend cleanup
echo.
echo Cleaning Backend...
if exist "backend\target" (
    echo - Removing target directory (this may take a while)...
    rmdir /s /q "backend\target"
    echo - Removed target directory
)

REM AI Service cleanup
echo.
echo Cleaning AI Service...
if exist "backend\ai-service\.venv" (
    rmdir /s /q "backend\ai-service\.venv"
    echo - Removed .venv directory
)
if exist "backend\ai-service\__pycache__" (
    rmdir /s /q "backend\ai-service\__pycache__"
    echo - Removed __pycache__ directory
)

REM Clean Python cache files
echo.
echo Cleaning Python cache files...
for /r %%i in (*.pyc) do del "%%i" 2>nul
for /d /r %%i in (__pycache__) do rmdir /s /q "%%i" 2>nul

REM Clean VS Code settings (optional)
choice /C YN /M "Do you want to remove VS Code settings"
if errorlevel 2 goto skip_vscode
if errorlevel 1 (
    if exist ".vscode" (
        rmdir /s /q ".vscode"
        echo - Removed .vscode directory
    )
)
:skip_vscode

REM Clean logs
if exist "logs" (
    rmdir /s /q "logs"
    echo - Removed logs directory
)

echo.
echo Clean complete!
echo.
echo To rebuild the project, run:
echo   scripts\setup.bat  - to set up the environment
echo   scripts\build.bat  - to build the project
echo.
pause
