# DealPal Cross-Platform Setup Guide

This guide provides detailed instructions for setting up DealPal on Windows, macOS, and Linux systems.

## 📋 Prerequisites

Before running the setup scripts, ensure you have:

### All Platforms
- **Python 3.8+** installed and in PATH
- **Git** installed for cloning the repository
- **Internet connection** for downloading dependencies

### Platform-Specific Requirements

#### Windows
- Windows 10 or later (for better terminal support)
- PowerShell 5.0+ or Command Prompt
- Optional: Windows Terminal for better experience

#### macOS
- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools (`xcode-select --install`)
- Optional: Homebrew for easier package management

#### Linux
- A modern Linux distribution (Ubuntu 20.04+, Fedora 34+, etc.)
- Build essentials (`build-essential` on Debian/Ubuntu)
- `curl` or `wget` for downloading

## 🚀 Quick Start

### Windows

```batch
# Using Command Prompt
cd scripts
setup.bat

# Using PowerShell
cd scripts
.\setup.ps1
```

### macOS/Linux

```bash
cd scripts
chmod +x setup.sh
./setup.sh
```

## 📦 What Gets Installed

The setup script will install or check for:

1. **Node.js 18+** - Frontend runtime
2. **Rust & Cargo** - Backend language and package manager
3. **Python dependencies** - AI service requirements
4. **Project dependencies** - All npm, cargo, and pip packages

## 🛠️ Available Scripts

### Setup Scripts
- **`setup_universal.py`** - Core Python script that works on all platforms
- **`setup.sh`** - Unix/Linux/macOS wrapper
- **`setup.bat`** - Windows Command Prompt wrapper
- **`setup.ps1`** - Windows PowerShell wrapper

### Build Scripts
- **`build.sh`** / **`build.bat`** - Build all components
- Reads `feature-toggles.json` for dev/prod mode

### Development Scripts
- **`dev.sh`** / **`dev.bat`** - Start all development servers
- Opens separate terminals for each service

### Utility Scripts
- **`clean.sh`** / **`clean.bat`** - Clean build artifacts
- **`status.sh`** / **`status.bat`** - Check installation status

## 📝 Manual Installation

If the automated setup fails, you can install dependencies manually:

### 1. Install Node.js

#### Windows
- Download from [nodejs.org](https://nodejs.org/)
- Or use Chocolatey: `choco install nodejs`
- Or use Scoop: `scoop install nodejs`

#### macOS
- Download from [nodejs.org](https://nodejs.org/)
- Or use Homebrew: `brew install node`

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Rust

#### All Platforms
```bash
# Unix/macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows (PowerShell)
Invoke-WebRequest -Uri https://win.rustup.rs -OutFile rustup-init.exe
.\rustup-init.exe -y
```

### 3. Install Python

#### Windows
- Download from [python.org](https://python.org/)
- **Important**: Check "Add Python to PATH" during installation

#### macOS
- Pre-installed, or use Homebrew: `brew install python@3`

#### Linux
- Usually pre-installed
- Or install: `sudo apt install python3 python3-pip python3-venv`

## 🔧 Environment Configuration

After setup, create a `.env` file in the project root:

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key_here

# Database (optional for local dev)
DATABASE_URL=postgresql://user:pass@localhost:5432/dealpal

# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com

# Other settings...
```

## 🏃 Running the Application

### Development Mode

#### Windows
```batch
scripts\dev.bat
```

#### Unix/macOS/Linux
```bash
./scripts/dev.sh
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- AI Service: http://localhost:8000

### Production Build

#### Windows
```batch
scripts\build.bat
```

#### Unix/macOS/Linux
```bash
./scripts/build.sh
```

## 🐛 Troubleshooting

### Common Issues

#### Python not found
- **Windows**: Ensure Python is in PATH. Reinstall with "Add to PATH" checked
- **Unix**: Use `python3` instead of `python`

#### Node/npm not found
- Restart terminal after installation
- Check PATH includes Node installation directory

#### Permission denied (Unix/macOS)
```bash
chmod +x scripts/*.sh
```

#### Rust installation fails
- **Windows**: Run as Administrator
- **All**: Ensure you have a stable internet connection

#### Virtual environment issues
- Delete `backend/ai-service/.venv` and retry
- Ensure you're using Python 3.8+

### Platform-Specific Issues

#### Windows
- **Long path issues**: Enable long path support in Windows
- **Execution policy**: Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell

#### macOS
- **SSL certificates**: Run `pip install --upgrade certifi`
- **M1/M2 Macs**: Some packages may need Rosetta 2

#### Linux
- **Missing packages**: Install `build-essential` and `python3-dev`
- **Permission issues**: Don't use `sudo` with pip in virtual environments

## 📊 Checking Installation Status

Run the status script to verify everything is installed correctly:

#### Windows
```batch
scripts\status.bat
```

#### Unix/macOS/Linux
```bash
./scripts/status.sh
```

## 🧹 Cleaning Up

To remove all build artifacts and dependencies:

#### Windows
```batch
scripts\clean.bat
```

#### Unix/macOS/Linux
```bash
./scripts/clean.sh
```

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Run the status script to identify missing components
3. Check the project's GitHub Issues
4. Ensure all prerequisites are installed
5. Try manual installation for problematic components

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)
- [DealPal Project Documentation](../README.md)

---

*Note: This guide assumes you're in the project root directory. Adjust paths accordingly if you're in a different location.*
