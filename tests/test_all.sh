#!/bin/bash

# DealPal Complete Test Suite
# Tests all components: Backend, Frontend, AI Service, and Browser Extension

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
AI_SERVICE_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}🧪 DealPal Complete Test Suite${NC}"
echo "========================================"

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    
    echo -e "${YELLOW}Checking $name...${NC}"
    if curl -s "$url/health" > /dev/null 2>&1 || curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running${NC}"
        return 1
    fi
}

# Function to run tests
run_tests() {
    local component=$1
    local test_command=$2
    
    echo -e "${PURPLE}🔬 Running $component tests...${NC}"
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $component tests: PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $component tests: FAILED${NC}"
        return 1
    fi
}

# Check if services are running
echo -e "\n${BLUE}📡 Service Health Check${NC}"
services_running=true
check_service "$AI_SERVICE_URL" "AI Service" || services_running=false
check_service "$BACKEND_URL" "Backend" || services_running=false
check_service "$FRONTEND_URL" "Frontend" || services_running=false

if [ "$services_running" = false ]; then
    echo -e "\n${RED}⚠️  Some services are not running. Start them with: ./start.sh or ./dev.sh${NC}"
    exit 1
fi

# Run component tests
echo -e "\n${BLUE}🧪 Component Tests${NC}"
all_tests_passed=true

# Backend tests
if [ -f "./backend/tests/health_check.rs" ]; then
    run_tests "Backend (Rust)" "cd backend && cargo test" || all_tests_passed=false
else
    echo -e "${YELLOW}⚠️  Backend tests not found${NC}"
fi

# AI Service tests
if [ -f "./backend/ai-service/test_service.py" ]; then
    run_tests "AI Service (Python)" "cd backend/ai-service && source .venv/bin/activate && python -m pytest test_service.py -v" || all_tests_passed=false
else
    echo -e "${YELLOW}⚠️  AI Service tests not found${NC}"
fi

# Frontend tests
if [ -f "./frontend/jest.config.js" ]; then
    run_tests "Frontend (Next.js)" "cd frontend && npm test" || all_tests_passed=false
else
    echo -e "${YELLOW}⚠️  Frontend tests not found${NC}"
fi

# Integration tests
if [ -f "./tests/frontend/main.test.ts" ]; then
    run_tests "Integration" "cd tests && npm test" || all_tests_passed=false
else
    echo -e "${YELLOW}⚠️  Integration tests not found${NC}"
fi

# API Endpoint tests
echo -e "\n${BLUE}🌐 API Endpoint Tests${NC}"
api_tests_passed=true

# Test AI Service endpoints
echo -e "${YELLOW}Testing AI Service endpoints...${NC}"
if curl -s "$AI_SERVICE_URL/health" | grep -q "OK\|healthy"; then
    echo -e "${GREEN}✅ AI Service health endpoint${NC}"
else
    echo -e "${RED}❌ AI Service health endpoint${NC}"
    api_tests_passed=false
fi

# Test Backend endpoints  
echo -e "${YELLOW}Testing Backend endpoints...${NC}"
if curl -s "$BACKEND_URL/health" | grep -q "OK\|healthy"; then
    echo -e "${GREEN}✅ Backend health endpoint${NC}"
else
    echo -e "${RED}❌ Backend health endpoint${NC}"
    api_tests_passed=false
fi

# Environment validation
echo -e "\n${BLUE}🔍 Environment Validation${NC}"
if [ -f "./validate_env.py" ]; then
    if python3 validate_env.py; then
        echo -e "${GREEN}✅ Environment validation passed${NC}"
    else
        echo -e "${RED}❌ Environment validation failed${NC}"
        all_tests_passed=false
    fi
else
    echo -e "${YELLOW}⚠️  Environment validation script not found${NC}"
fi

# Browser Extension validation
echo -e "\n${BLUE}🔌 Browser Extension Validation${NC}"
if [ -f "./browser-extension/manifest.json" ]; then
    echo -e "${GREEN}✅ Browser extension manifest found${NC}"
    if [ -f "./browser-extension/content.js" ] && [ -f "./browser-extension/background.js" ]; then
        echo -e "${GREEN}✅ Browser extension core files present${NC}"
    else
        echo -e "${RED}❌ Browser extension missing core files${NC}"
        all_tests_passed=false
    fi
else
    echo -e "${RED}❌ Browser extension manifest not found${NC}"
    all_tests_passed=false
fi

# Final results
echo -e "\n${BLUE}📊 Test Results Summary${NC}"
echo "========================================"
if [ "$all_tests_passed" = true ] && [ "$api_tests_passed" = true ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ DealPal platform is ready for use${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}🔧 Please fix the issues before deployment${NC}"
    exit 1
fi
