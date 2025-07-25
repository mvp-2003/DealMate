#!/bin/bash

# DealMate Development Environment Setup Script - Unix/Linux/macOS
# This script wraps the universal Python setup script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DealMate Development Environment Setup${NC}"
echo "=============================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

# Check if Python 3 is installed
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ using your package manager:"
    echo ""
    
    # Detect OS and provide installation instructions
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            echo "  sudo apt-get update && sudo apt-get install python3 python3-pip"
        elif command -v yum >/dev/null 2>&1; then
            echo "  sudo yum install python3 python3-pip"
        elif command -v pacman >/dev/null 2>&1; then
            echo "  sudo pacman -S python python-pip"
        else
            echo "  Please use your distribution's package manager to install Python 3"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Download from https://python.org/ or use Homebrew:"
        echo "  brew install python@3"
    else
        echo "  Please install Python 3.8+ from https://python.org/"
    fi
    
    exit 1
fi

# Run the universal setup script
echo -e "${YELLOW}Running universal setup script...${NC}"
python3 "$SCRIPT_DIR/setup_universal.py" "$@"

# Check if the setup was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Setup completed successfully!${NC}"
else
    echo -e "\n${RED}❌ Setup failed. Please check the error messages above.${NC}"
    exit 1
fi
