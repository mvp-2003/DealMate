#!/bin/bash

# DealMate Build Script - Unix/Linux/macOS
# Builds all components of the DealMate platformin/bash

# DealMate Build Script - Unix/Linux/macOS
# Builds all components of the DealMate platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 DealMate Build Script${NC}"
echo "========================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root for consistent paths
cd "$PROJECT_ROOT"

# Check if Python is available
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${RED}❌ Python 3 is required to read feature-toggles.json${NC}"
    exit 1
fi

# Read feature-toggles.json
echo -e "${YELLOW}Reading feature-toggles.json...${NC}"
BUILD_DEV=$(python3 -c "import json; print(json.load(open('feature-toggles.json'))['buildDev'])" 2>/dev/null || echo "True")
echo "BUILD_DEV flag is set to: $BUILD_DEV"

if [ "$BUILD_DEV" = "True" ]; then
    echo -e "${BLUE}🚀 Building DealMate for Development${NC}"
else
    echo -e "${BLUE}🚀 Building DealMate for Production${NC}"
fi

# Frontend Build
echo -e "\n${YELLOW}📦 Building Frontend...${NC}"
cd frontend

if [ "$BUILD_DEV" = "True" ]; then
    echo "Running Development Frontend Setup..."
    npm install --legacy-peer-deps
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
        echo -e "${GREEN}✅ Frontend is ready for development mode (use npm run dev to start)${NC}"
    else
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
else
    echo "Running Production Frontend Build..."
    npm install --legacy-peer-deps
    if [ $? -eq 0 ]; then
        NODE_ENV=production npm run build
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Frontend production build complete${NC}"
        else
            echo -e "${RED}❌ Frontend build failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
fi
cd "$PROJECT_ROOT"

# Backend Build
echo -e "\n${YELLOW}🦀 Building Backend...${NC}"
cd backend
cargo build --release
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend build complete${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
cd "$PROJECT_ROOT"

# AI Service Setup
echo -e "\n${YELLOW}🤖 Setting up AI Service...${NC}"
cd backend/ai-service
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ AI Service dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some AI Service dependencies may have failed${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create virtual environment${NC}"
    exit 1
fi
cd "$PROJECT_ROOT"

echo -e "\n${GREEN}✅ Build Complete!${NC}"
echo -e "${BLUE}Build artifacts:${NC}"
echo "  Frontend: ./frontend/.next"
echo "  Backend:  ./backend/target/release/dealmate-backend"
echo "  AI Service: ./backend/ai-service/.venv"
echo ""
