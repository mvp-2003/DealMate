#!/bin/bash

# DealPal Status and Health Check Script
# Provides real-time status of all platform components

# Load environment variables
if [ -f "../.env" ]; then
    set -a
    source ../.env
    set +a
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
AUTH_SERVICE_URL="http://localhost:3001"
AI_SERVICE_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:9002"

clear
echo -e "${BLUE}🔍 DealPal Platform Status${NC}"
echo "=============================="

# Function to check service status with detailed info
check_service_detailed() {
    local url=$1
    local name=$2
    local port=$3
    
    echo -e "${CYAN}$name${NC}"
    echo -n "  Status: "
    
    # Check if service is responding
    if curl -s --max-time 3 "$url" > /dev/null 2>&1 || curl -s --max-time 3 "$url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}🟢 RUNNING${NC}"
        
        # Get response time
        response_time=$(curl -s -w "%{time_total}" -o /dev/null --max-time 3 "$url" 2>/dev/null || echo "N/A")
        echo "  Response Time: ${response_time}s"
        
        # Check if port is listening
        if lsof -i ":$port" > /dev/null 2>&1; then
            echo -e "  Port $port: ${GREEN}LISTENING${NC}"
        else
            echo -e "  Port $port: ${YELLOW}NOT FOUND${NC}"
        fi
        
        # Get process info
        local pid=$(lsof -t -i ":$port" 2>/dev/null | head -1)
        if [ -n "$pid" ]; then
            echo "  PID: $pid"
            local cpu_mem=$(ps -p "$pid" -o %cpu,%mem --no-headers 2>/dev/null || echo "N/A N/A")
            echo "  CPU/Memory: $cpu_mem"
        fi
        
    else
        echo -e "${RED}🔴 DOWN${NC}"
        if lsof -i ":$port" > /dev/null 2>&1; then
            echo -e "  Port $port: ${YELLOW}OCCUPIED (different service?)${NC}"
        else
            echo -e "  Port $port: ${RED}NOT LISTENING${NC}"
        fi
    fi
    echo ""
}

# Function to check file/directory status
check_build_status() {
    echo -e "${CYAN}Build Artifacts${NC}"
    
    # Frontend build
    if [ -d "../.next" ]; then
        echo -e "  Frontend Build: ${GREEN}✅ EXISTS${NC}"
        local build_size=$(du -sh ../.next 2>/dev/null | cut -f1)
        echo "  Size: $build_size"
    else
        echo -e "  Frontend Build: ${RED}❌ MISSING${NC}"
    fi
    
    # Backend build
    if [ -f "../backend/target/release/dealpal-backend" ]; then
        echo -e "  Backend Build: ${GREEN}✅ EXISTS${NC}"
        local build_size=$(ls -lh ../backend/target/release/dealpal-backend 2>/dev/null | awk '{print $5}')
        echo "  Size: $build_size"
    else
        echo -e "  Backend Build: ${RED}❌ MISSING${NC}"
    fi
    
    # AI Service environment
    if [ -d "../backend/ai-service/.venv" ]; then
        echo -e "  AI Service Env: ${GREEN}✅ EXISTS${NC}"
        local packages=$(../backend/ai-service/.venv/bin/pip list 2>/dev/null | wc -l)
        echo "  Packages: $packages"
    else
        echo -e "  AI Service Env: ${RED}❌ MISSING${NC}"
    fi
    
    # Auth Service dependencies
    if [ -d "../backend/auth-service/node_modules" ]; then
        echo -e "  Auth Service Deps: ${GREEN}✅ EXISTS${NC}"
    else
        echo -e "  Auth Service Deps: ${RED}❌ MISSING${NC}"
    fi
    
    echo ""
}

# Function to check dependencies
check_dependencies() {
    echo -e "${CYAN}Dependencies${NC}"
    
    # Node.js
    if command -v node > /dev/null 2>&1; then
        local node_version=$(node --version)
        echo -e "  Node.js: ${GREEN}✅ $node_version${NC}"
    else
        echo -e "  Node.js: ${RED}❌ NOT INSTALLED${NC}"
    fi
    
    # Rust
    if command -v cargo > /dev/null 2>&1; then
        local rust_version=$(rustc --version | cut -d' ' -f2)
        echo -e "  Rust: ${GREEN}✅ $rust_version${NC}"
    else
        echo -e "  Rust: ${RED}❌ NOT INSTALLED${NC}"
    fi
    
    # Python
    if command -v python3 > /dev/null 2>&1; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        echo -e "  Python: ${GREEN}✅ $python_version${NC}"
    else
        echo -e "  Python: ${RED}❌ NOT INSTALLED${NC}"
    fi
    
    # Docker
    if command -v docker > /dev/null 2>&1; then
        local docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        echo -e "  Docker: ${GREEN}✅ $docker_version${NC}"
    else
        echo -e "  Docker: ${YELLOW}⚠️  NOT INSTALLED${NC}"
    fi
    
    echo ""
}

# Function to check environment variables
check_environment() {
    echo -e "${CYAN}Environment Variables${NC}"
    
    if [ -n "$GOOGLE_API_KEY" ]; then
        echo -e "  GOOGLE_API_KEY: ${GREEN}✅ SET${NC}"
    else
        echo -e "  GOOGLE_API_KEY: ${RED}❌ NOT SET${NC}"
    fi
    
    if [ -n "$DATABASE_URL" ]; then
        echo -e "  DATABASE_URL: ${GREEN}✅ SET${NC}"
    else
        echo -e "  DATABASE_URL: ${YELLOW}⚠️  NOT SET${NC}"
    fi
    
    echo ""
}

# Function to show quick actions
show_quick_actions() {
    echo -e "${PURPLE}Quick Actions${NC}"
    echo "  ./start.sh     - Start production servers"
    echo "  ./dev.sh       - Start development servers"
    echo "  ./build.sh     - Build all components"
    echo "  ./test_all.sh  - Run complete test suite"
    echo "  ./clean.sh     - Clean and reset environment"
    echo ""
}

# Run all checks
check_service_detailed "$AI_SERVICE_URL" "🤖 AI Service" "8001"
check_service_detailed "$AUTH_SERVICE_URL" "🔐 Auth Service" "3001"
check_service_detailed "$BACKEND_URL" "🦀 Backend" "8000"
check_service_detailed "$FRONTEND_URL" "📦 Frontend" "9002"

check_build_status
check_dependencies
check_environment
show_quick_actions

# Summary
echo -e "${BLUE}💡 Platform URLs${NC}"
echo "  🤖 AI Service:    http://localhost:8001"
echo "  🔐 Auth Service:  http://localhost:3001"
echo "  🦀 Backend:       http://localhost:8000" 
echo "  📦 Frontend:      http://localhost:9002"
echo "  📚 API Docs:      http://localhost:8001/docs"
echo ""

echo -e "${GREEN}Status check complete!${NC}"
