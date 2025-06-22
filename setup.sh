#!/bin/bash

# DealPal Development Environment Setup Script
# Sets up everything needed for new developers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DealPal Development Environment Setup${NC}"
echo "=============================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install if missing
check_and_install() {
    local tool=$1
    local install_command=$2
    
    if command_exists "$tool"; then
        echo -e "${GREEN}✅ $tool is already installed${NC}"
    else
        echo -e "${YELLOW}📦 Installing $tool...${NC}"
        eval "$install_command"
        if command_exists "$tool"; then
            echo -e "${GREEN}✅ $tool installed successfully${NC}"
        else
            echo -e "${RED}❌ Failed to install $tool${NC}"
            exit 1
        fi
    fi
}

# Check system
echo -e "${BLUE}🔍 Checking System Requirements${NC}"

# Check Node.js
check_and_install "node" "curl -fsSL https://nodejs.org/dist/v20.10.0/node-v20.10.0-darwin-x64.tar.gz | tar -xz --strip-components=1 -C /usr/local"

# Check Rust
if ! command_exists "cargo"; then
    echo -e "${YELLOW}📦 Installing Rust...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    echo -e "${GREEN}✅ Rust installed successfully${NC}"
else
    echo -e "${GREEN}✅ Rust is already installed${NC}"
fi

# Check Python
check_and_install "python3" "echo 'Python3 should be installed via official installer or brew install python'"

# Install project dependencies
echo -e "\n${BLUE}📦 Installing Project Dependencies${NC}"

# Frontend dependencies
echo -e "${YELLOW}Installing Frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Backend dependencies (Rust dependencies are handled by Cargo)
echo -e "${YELLOW}Checking Backend dependencies...${NC}"
cd backend
cargo check
cd ..
echo -e "${GREEN}✅ Backend dependencies verified${NC}"

# AI Service dependencies
echo -e "${YELLOW}Setting up AI Service environment...${NC}"
cd backend/ai-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ../..
echo -e "${GREEN}✅ AI Service environment set up${NC}"

# Environment setup
echo -e "\n${BLUE}🔧 Environment Configuration${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file template...${NC}"
    cat > .env << EOF
# DealPal Environment Configuration
# Copy this to .env and fill in your values

# Gemini AI API Key (Required)
GOOGLE_API_KEY=your_google_api_key_here

# Database Configuration (Optional for local development)
DATABASE_URL=postgresql://username:password@localhost:5432/dealpal

# Gemini Model Configuration (Optional)
GEMINI_MODEL=gemini-1.5-flash

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Development Settings
NODE_ENV=development
RUST_LOG=debug
EOF
    echo -e "${GREEN}✅ .env template created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your actual API keys${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Browser Extension environment setup
echo -e "\n${BLUE}🔌 Browser Extension Environment${NC}"

if [ ! -f "browser-extension/.env" ]; then
    echo -e "${YELLOW}Creating browser-extension/.env file template...${NC}"
    cat > browser-extension/.env << EOF
# DealPal Browser Extension Environment Configuration
# Fill in your Gemini API key below

# Google Gemini API Configuration (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom Gemini model (defaults to gemini-1.5-flash)
GEMINI_MODEL=gemini-1.5-flash

# Optional: Backend AI Service URL (if using Python AI service)
PYTHON_AI_SERVICE_URL=http://localhost:8001

# Feature Flags for Extension
ENABLE_LOCAL_AI=true
ENABLE_CLOUD_AI=true
ENABLE_PYTHON_AI_SERVICE=false

# Debug Mode
DEBUG=false
EOF
    echo -e "${GREEN}✅ Browser extension .env template created${NC}"
    echo -e "${YELLOW}⚠️  Please edit browser-extension/.env with your actual Gemini API key${NC}"
else
    echo -e "${GREEN}✅ Browser extension .env file already exists${NC}"
fi

# VSCode setup
if command_exists "code"; then
    echo -e "\n${BLUE}🎯 VSCode Configuration${NC}"
    
    # Create VSCode settings
    mkdir -p .vscode
    
    cat > .vscode/settings.json << EOF
{
    "rust-analyzer.cargo.buildScripts.enable": true,
    "python.defaultInterpreterPath": "./backend/ai-service/venv/bin/python",
    "typescript.preferences.importModuleSpecifier": "relative",
    "editor.formatOnSave": true,
    "files.exclude": {
        "**/target": true,
        "**/.next": true,
        "**/node_modules": true,
        "**/__pycache__": true
    }
}
EOF

    cat > .vscode/extensions.json << EOF
{
    "recommendations": [
        "rust-lang.rust-analyzer",
        "ms-python.python",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next"
    ]
}
EOF

    echo -e "${GREEN}✅ VSCode configuration created${NC}"
fi

# Build everything
echo -e "\n${BLUE}🔨 Initial Build${NC}"
./build.sh

# Final validation
echo -e "\n${BLUE}✅ Setup Validation${NC}"
./status.sh

echo -e "\n${GREEN}🎉 Development Environment Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Edit .env file with your API keys"
echo "2. Run './dev.sh' to start development servers"
echo "3. Run './test_all.sh' to verify everything works"
echo "4. Check './status.sh' anytime for platform status"
echo ""
echo -e "${PURPLE}Happy coding! 🚀${NC}"
