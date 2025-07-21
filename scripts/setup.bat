@echo off
REM DealPal Windows Setup Script
REM This is a wrapper that calls the universal Python setup script

echo DealPal Development Environment Setup for Windows
echo ==============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Run the universal setup script
python "%~dp0setup_universal.py" %*

REM Check if the setup was successful
if errorlevel 1 (
    echo.
    echo Setup failed. Please check the error messages above.
    pause
    exit /b 1
)

pause
