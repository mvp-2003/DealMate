# DealPal Windows PowerShell Setup Script
# This is a wrapper that calls the universal Python setup script

Write-Host "DealPal Development Environment Setup for Windows" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://python.org/" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Run the universal setup script
Write-Host "Running setup..." -ForegroundColor Cyan
$setupScript = Join-Path $scriptDir "setup_universal.py"
python $setupScript $args

# Check if the setup was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Setup failed. Please check the error messages above." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"
