#!/usr/bin/env python3
"""
DealMate Universal Setup Script
Works on Windows, macOS, and Linux
"""

import os
import sys
import subprocess
import platform
import json
import shutil
from pathlib import Path
import urllib.request
import tempfile
import zipfile
import tarfile

# Colors for terminal output
class Colors:
    """Cross-platform color codes"""
    if platform.system() == "Windows":
        # Windows requires colorama or Windows 10+ with VT100 enabled
        try:
            import colorama
            colorama.init()
            RED = '\033[91m'
            GREEN = '\033[92m'
            YELLOW = '\033[93m'
            BLUE = '\033[94m'
            PURPLE = '\033[95m'
            CYAN = '\033[96m'
            RESET = '\033[0m'
        except ImportError:
            RED = GREEN = YELLOW = BLUE = PURPLE = CYAN = RESET = ''
    else:
        RED = '\033[91m'
        GREEN = '\033[92m'
        YELLOW = '\033[93m'
        BLUE = '\033[94m'
        PURPLE = '\033[95m'
        CYAN = '\033[96m'
        RESET = '\033[0m'

def print_colored(message, color=Colors.RESET):
    """Print colored message"""
    print(f"{color}{message}{Colors.RESET}")

def print_header():
    """Print setup header"""
    print_colored("\n🚀 DealMate Development Environment Setup", Colors.BLUE)
    print_colored("=" * 50, Colors.BLUE)
    print(f"Platform: {platform.system()} {platform.machine()}")
    print(f"Python: {sys.version.split()[0]}")
    print()

def check_command(command):
    """Check if a command exists"""
    return shutil.which(command) is not None

def run_command(command, shell=True, check=True, capture_output=False):
    """Run a command with error handling"""
    try:
        if isinstance(command, str) and not shell:
            command = command.split()
        
        result = subprocess.run(
            command,
            shell=shell,
            check=check,
            capture_output=capture_output,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print_colored(f"❌ Command failed: {command}", Colors.RED)
        print_colored(f"Error: {e}", Colors.RED)
        if hasattr(e, 'stderr') and e.stderr:
            print_colored(f"stderr: {e.stderr}", Colors.RED)
        return None
    except Exception as e:
        print_colored(f"❌ Unexpected error running command: {command}", Colors.RED)
        print_colored(f"Error: {e}", Colors.RED)
        return None

def get_os_info():
    """Get detailed OS information"""
    system = platform.system()
    info = {
        'system': system,
        'version': platform.version(),
        'machine': platform.machine(),
        'is_64bit': sys.maxsize > 2**32
    }
    
    if system == "Linux":
        # Try to detect Linux distribution
        try:
            import distro
            info['distro'] = distro.name()
            info['distro_version'] = distro.version()
        except ImportError:
            # Fallback to platform info
            info['distro'] = platform.linux_distribution()[0] if hasattr(platform, 'linux_distribution') else 'Unknown'
    
    return info

def install_rust():
    """Install Rust using rustup"""
    print_colored("\n📦 Installing Rust...", Colors.YELLOW)
    
    if check_command("cargo"):
        print_colored("✅ Rust is already installed", Colors.GREEN)
        return True
    
    system = platform.system()
    
    if system == "Windows":
        # Download rustup-init.exe
        print("Downloading rustup installer...")
        rustup_url = "https://win.rustup.rs/x86_64"
        rustup_exe = os.path.join(tempfile.gettempdir(), "rustup-init.exe")
        
        try:
            urllib.request.urlretrieve(rustup_url, rustup_exe)
            run_command(f'"{rustup_exe}" -y')
            
            # Add cargo to PATH for current session
            cargo_bin = os.path.expanduser("~\\.cargo\\bin")
            os.environ['PATH'] = f"{cargo_bin};{os.environ['PATH']}"
            
            print_colored("✅ Rust installed successfully", Colors.GREEN)
            print_colored("⚠️  Please restart your terminal or run: refreshenv", Colors.YELLOW)
            return True
        except Exception as e:
            print_colored(f"❌ Failed to install Rust: {e}", Colors.RED)
            return False
    else:
        # Unix-like systems (macOS, Linux)
        try:
            rustup_sh = os.path.join(tempfile.gettempdir(), "rustup.sh")
            urllib.request.urlretrieve("https://sh.rustup.rs", rustup_sh)
            os.chmod(rustup_sh, 0o755)
            run_command(f'sh "{rustup_sh}" -y')
            
            # Add cargo to PATH for current session
            cargo_bin = os.path.expanduser("~/.cargo/bin")
            os.environ['PATH'] = f"{cargo_bin}:{os.environ['PATH']}"
            
            print_colored("✅ Rust installed successfully", Colors.GREEN)
            return True
        except Exception as e:
            print_colored(f"❌ Failed to install Rust: {e}", Colors.RED)
            return False

def install_node():
    """Install Node.js"""
    print_colored("\n📦 Checking Node.js...", Colors.YELLOW)
    
    if check_command("node"):
        # Check version
        result = run_command("node --version", capture_output=True)
        if result and result.stdout:
            version = result.stdout.strip()
            print_colored(f"✅ Node.js is already installed ({version})", Colors.GREEN)
            
            # Check if version is >= 18
            try:
                major_version = int(version.split('.')[0].replace('v', ''))
                if major_version < 18:
                    print_colored("⚠️  Node.js version is < 18. Consider upgrading.", Colors.YELLOW)
            except:
                pass
        return True
    
    system = platform.system()
    print_colored(f"Node.js not found. Please install Node.js 18+ for {system}:", Colors.YELLOW)
    
    if system == "Windows":
        print("  1. Download from: https://nodejs.org/")
        print("  2. Or use Chocolatey: choco install nodejs")
        print("  3. Or use Scoop: scoop install nodejs")
    elif system == "Darwin":  # macOS
        print("  1. Download from: https://nodejs.org/")
        print("  2. Or use Homebrew: brew install node")
        print("  3. Or use MacPorts: sudo port install nodejs18")
    else:  # Linux
        print("  1. Using NodeSource (recommended):")
        print("     curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -")
        print("     sudo apt-get install -y nodejs")
        print("  2. Or use your package manager:")
        print("     - Ubuntu/Debian: sudo apt install nodejs npm")
        print("     - Fedora: sudo dnf install nodejs npm")
        print("     - Arch: sudo pacman -S nodejs npm")
    
    return False

def check_python():
    """Check Python version and pip"""
    print_colored("\n🐍 Checking Python...", Colors.YELLOW)
    
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print_colored("❌ Python 3.8+ is required", Colors.RED)
        return False
    
    print_colored(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro} is installed", Colors.GREEN)
    
    # Check pip
    if not check_command("pip") and not check_command("pip3"):
        print_colored("❌ pip is not installed", Colors.RED)
        return False
    
    print_colored("✅ pip is installed", Colors.GREEN)
    return True

def setup_frontend_dependencies():
    """Install frontend dependencies"""
    print_colored("\n📦 Installing Frontend dependencies...", Colors.YELLOW)
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print_colored("❌ Frontend directory not found", Colors.RED)
        return False
    
    os.chdir(frontend_dir)
    
    # Install dependencies
    if platform.system() == "Windows":
        result = run_command("npm.cmd install --legacy-peer-deps", check=False)
    else:
        result = run_command("npm install --legacy-peer-deps", check=False)
    
    os.chdir("..")
    
    if result and result.returncode == 0:
        print_colored("✅ Frontend dependencies installed", Colors.GREEN)
        return True
    else:
        print_colored("❌ Failed to install frontend dependencies", Colors.RED)
        return False

def setup_backend_dependencies():
    """Check backend dependencies"""
    print_colored("\n🦀 Checking Backend dependencies...", Colors.YELLOW)
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print_colored("❌ Backend directory not found", Colors.RED)
        return False
    
    os.chdir(backend_dir)
    
    # Check if cargo is available
    if not check_command("cargo"):
        os.chdir("..")
        print_colored("❌ Cargo not found. Please install Rust first.", Colors.RED)
        return False
    
    # Run cargo check
    result = run_command("cargo check", check=False)
    os.chdir("..")
    
    if result and result.returncode == 0:
        print_colored("✅ Backend dependencies verified", Colors.GREEN)
        return True
    else:
        print_colored("⚠️  Backend check had issues, but continuing...", Colors.YELLOW)
        return True

def setup_ai_service():
    """Setup AI service virtual environment"""
    print_colored("\n🤖 Setting up AI Service environment...", Colors.YELLOW)
    
    ai_service_dir = Path("backend/ai-service")
    if not ai_service_dir.exists():
        print_colored("❌ AI service directory not found", Colors.RED)
        return False
    
    os.chdir(ai_service_dir)
    
    # Create virtual environment
    venv_path = Path(".venv")
    if not venv_path.exists():
        print("Creating virtual environment...")
        run_command(f"{sys.executable} -m venv .venv")
    
    # Determine pip path based on OS
    if platform.system() == "Windows":
        pip_path = ".venv\\Scripts\\pip.exe"
        python_path = ".venv\\Scripts\\python.exe"
    else:
        pip_path = ".venv/bin/pip"
        python_path = ".venv/bin/python"
    
    # Upgrade pip
    print("Upgrading pip...")
    run_command(f'"{python_path}" -m pip install --upgrade pip', check=False)
    
    # Install requirements
    if Path("requirements.txt").exists():
        print("Installing AI service dependencies...")
        result = run_command(f'"{pip_path}" install -r requirements.txt', check=False)
        
        if result and result.returncode == 0:
            print_colored("✅ AI Service environment set up", Colors.GREEN)
        else:
            print_colored("⚠️  Some AI service dependencies may have failed", Colors.YELLOW)
    
    os.chdir("../..")
    return True

def create_env_file():
    """Create .env file template if it doesn't exist"""
    print_colored("\n🔧 Environment Configuration", Colors.YELLOW)
    
    env_path = Path(".env")
    if env_path.exists():
        print_colored("✅ .env file already exists", Colors.GREEN)
        return True
    
    env_template = """# DealMate Environment Configuration
# Copy this to .env and fill in your values

# Gemini AI API Key (Required)
GOOGLE_API_KEY=your_google_api_key_here

# Database Configuration (Optional for local development)
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/dealpal

# Auth0 Configuration (Required for authentication)
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_AUDIENCE=your-auth0-audience
AUTH0_SCOPE=openid profile email

# Gemini Model Configuration (Optional)
GEMINI_MODEL=gemini-1.5-flash

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Development Settings
NODE_ENV=development
RUST_LOG=debug

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3000/api/auth/callback
"""
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_template)
        print_colored("✅ .env template created", Colors.GREEN)
        print_colored("⚠️  Please edit .env file with your actual API keys", Colors.YELLOW)
        return True
    except Exception as e:
        print_colored(f"❌ Failed to create .env file: {e}", Colors.RED)
        return False

def create_vscode_config():
    """Create VS Code configuration"""
    print_colored("\n🎯 VS Code Configuration", Colors.YELLOW)
    
    if not check_command("code"):
        print_colored("ℹ️  VS Code CLI not found, skipping configuration", Colors.CYAN)
        return True
    
    vscode_dir = Path(".vscode")
    vscode_dir.mkdir(exist_ok=True)
    
    # Settings
    settings = {
        "rust-analyzer.cargo.buildScripts.enable": True,
        "python.defaultInterpreterPath": "./backend/ai-service/.venv/bin/python" if platform.system() != "Windows" else "./backend/ai-service/.venv/Scripts/python.exe",
        "typescript.preferences.importModuleSpecifier": "relative",
        "editor.formatOnSave": True,
        "files.exclude": {
            "**/target": True,
            "**/.next": True,
            "**/node_modules": True,
            "**/__pycache__": True,
            "**/.venv": True
        },
        "[python]": {
            "editor.defaultFormatter": "ms-python.black-formatter"
        },
        "[typescript]": {
            "editor.defaultFormatter": "esbenp.prettier-vscode"
        },
        "[typescriptreact]": {
            "editor.defaultFormatter": "esbenp.prettier-vscode"
        },
        "[rust]": {
            "editor.defaultFormatter": "rust-lang.rust-analyzer"
        }
    }
    
    # Extensions
    extensions = {
        "recommendations": [
            "rust-lang.rust-analyzer",
            "ms-python.python",
            "ms-python.vscode-pylance",
            "ms-python.black-formatter",
            "bradlc.vscode-tailwindcss",
            "esbenp.prettier-vscode",
            "dbaeumer.vscode-eslint",
            "ms-vscode.vscode-typescript-next",
            "usernamehw.errorlens",
            "yoavbls.pretty-ts-errors"
        ]
    }
    
    try:
        with open(vscode_dir / "settings.json", 'w') as f:
            json.dump(settings, f, indent=2)
        
        with open(vscode_dir / "extensions.json", 'w') as f:
            json.dump(extensions, f, indent=2)
        
        print_colored("✅ VS Code configuration created", Colors.GREEN)
        return True
    except Exception as e:
        print_colored(f"❌ Failed to create VS Code config: {e}", Colors.RED)
        return False

def run_initial_build():
    """Run initial build"""
    print_colored("\n🔨 Running Initial Build", Colors.YELLOW)
    
    build_script = Path("scripts/build.sh")
    if platform.system() == "Windows":
        build_script = Path("scripts/build.bat")
        if not build_script.exists():
            build_script = Path("scripts/build.ps1")
    
    if build_script.exists():
        if platform.system() == "Windows":
            if build_script.suffix == ".bat":
                run_command(f'cmd /c "{build_script}"', check=False)
            else:  # PowerShell
                run_command(f'powershell -ExecutionPolicy Bypass -File "{build_script}"', check=False)
        else:
            run_command(f'bash "{build_script}"', check=False)
        print_colored("✅ Initial build completed", Colors.GREEN)
    else:
        print_colored("⚠️  Build script not found, skipping initial build", Colors.YELLOW)

def print_next_steps():
    """Print next steps for the user"""
    print_colored("\n🎉 Development Environment Setup Complete!", Colors.GREEN)
    print()
    print_colored("Next Steps:", Colors.BLUE)
    print("1. Edit .env file with your API keys and configuration")
    print("2. Install any missing dependencies manually if needed")
    
    if platform.system() == "Windows":
        print("3. Run 'scripts\\dev.bat' to start development servers")
        print("4. Run 'scripts\\test.bat' to verify everything works")
    else:
        print("3. Run './scripts/dev.sh' to start development servers")
        print("4. Run './scripts/test_all.sh' to verify everything works")
    
    print()
    print_colored("Happy coding! 🚀", Colors.PURPLE)

def main():
    """Main setup function"""
    print_header()
    
    # Get OS info
    os_info = get_os_info()
    print(f"Detected OS: {os_info['system']} ({os_info.get('distro', 'N/A')})")
    
    # Check Python
    if not check_python():
        print_colored("\n❌ Python requirements not met. Please install Python 3.8+", Colors.RED)
        sys.exit(1)
    
    # Check/Install Node.js
    node_installed = install_node()
    if not node_installed:
        print_colored("\n⚠️  Node.js is required. Please install it and run this script again.", Colors.YELLOW)
    
    # Install Rust
    rust_installed = install_rust()
    
    # Create .env file
    create_env_file()
    
    # Setup dependencies if tools are installed
    if node_installed:
        setup_frontend_dependencies()
    
    if rust_installed:
        setup_backend_dependencies()
    
    setup_ai_service()
    
    # Create VS Code config
    create_vscode_config()
    
    # Run initial build
    if node_installed and rust_installed:
        run_initial_build()
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    try:
        # Change to project root
        script_dir = Path(__file__).parent
        project_root = script_dir.parent
        os.chdir(project_root)
        
        main()
    except KeyboardInterrupt:
        print_colored("\n\n⚠️  Setup interrupted by user", Colors.YELLOW)
        sys.exit(1)
    except Exception as e:
        print_colored(f"\n❌ Setup failed with error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        sys.exit(1)
