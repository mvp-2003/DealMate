#!/bin/bash

# DealPal Quick Test Script
# This script provides a quick way to test the DealPal platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
AI_SERVICE_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}🚀 DealPal Platform Quick Test${NC}"
echo "=================================="

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running${NC}"
        return 1
    fi
}

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}🧪 Testing $test_name...${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        return 1
    fi
}

# Check if services are running
echo -e "${BLUE}📋 Checking Services...${NC}"
backend_running=false
ai_service_running=false

if check_service "$BACKEND_URL" "Backend Service"; then
    backend_running=true
fi

if check_service "$AI_SERVICE_URL" "AI Service"; then
    ai_service_running=true
fi

echo ""

# Quick API Tests
if [ "$backend_running" = true ] && [ "$ai_service_running" = true ]; then
    echo -e "${BLUE}🔬 Running Quick API Tests...${NC}"
    
    # Test product detection
    run_test "Product Detection" "curl -s -X POST $AI_SERVICE_URL/detect-product -H 'Content-Type: application/json' -d '{\"url\":\"https://amazon.in/test\",\"page_title\":\"Test Product\",\"text_content\":\"Test product price ₹999\"}'"
    
    # Test deal stacking
    run_test "Deal Stacking" "curl -s -X POST $AI_SERVICE_URL/stack-deals -H 'Content-Type: application/json' -d '{\"deals\":[{\"id\":\"test\",\"title\":\"Test Deal\",\"deal_type\":\"coupon\",\"value\":10,\"value_type\":\"percentage\",\"stackable\":true}],\"base_price\":1000}'"
    
    # Test sentiment analysis
    run_test "Sentiment Analysis" "curl -s -X POST $AI_SERVICE_URL/analyze-sentiment -H 'Content-Type: application/json' -d '{\"reviews\":[\"Great product!\",\"Not good\"],\"product_name\":\"Test\"}'"
    
    # Test price prediction
    run_test "Price Prediction" "curl -s -X POST $AI_SERVICE_URL/predict-price -H 'Content-Type: application/json' -d '{\"product_name\":\"Test\",\"current_price\":1000,\"category\":\"electronics\"}'"
    
    echo ""
fi

# Browser Extension Test
echo -e "${BLUE}🌐 Browser Extension Test${NC}"
if [ -d "browser-extension" ]; then
    echo -e "${GREEN}✅ Browser extension files found${NC}"
    
    # Check manifest
    if [ -f "browser-extension/manifest.json" ]; then
        echo -e "${GREEN}✅ Manifest file exists${NC}"
    else
        echo -e "${RED}❌ Manifest file missing${NC}"
    fi
    
    # Check content script
    if [ -f "browser-extension/content.js" ]; then
        echo -e "${GREEN}✅ Content script exists${NC}"
    else
        echo -e "${RED}❌ Content script missing${NC}"
    fi
else
    echo -e "${RED}❌ Browser extension directory not found${NC}"
fi

echo ""

# Database Test (Railway)
echo -e "${BLUE}💾 Railway Database Test${NC}"
if [ -n "$DATABASE_URL" ]; then
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Railway database connection successful${NC}"
        else
            echo -e "${RED}❌ Railway database connection failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ PostgreSQL client not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ DATABASE_URL not set${NC}"
fi

echo ""

# Frontend Test
echo -e "${BLUE}🎨 Frontend Test${NC}"
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
fi

echo ""

# Performance Test
echo -e "${BLUE}⚡ Quick Performance Test${NC}"
if [ "$ai_service_running" = true ]; then
    echo "Testing AI service response time..."
    start_time=$(date +%s%N)
    curl -s -X POST "$AI_SERVICE_URL/detect-product" \
        -H "Content-Type: application/json" \
        -d '{"url":"test","page_title":"test","text_content":"test"}' > /dev/null
    end_time=$(date +%s%N)
    
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 2000 ]; then
        echo -e "${GREEN}✅ AI service response time: ${duration}ms (Good)${NC}"
    elif [ $duration -lt 5000 ]; then
        echo -e "${YELLOW}⚠️ AI service response time: ${duration}ms (Acceptable)${NC}"
    else
        echo -e "${RED}❌ AI service response time: ${duration}ms (Slow)${NC}"
    fi
fi

echo ""

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================================="

if [ "$backend_running" = true ] && [ "$ai_service_running" = true ]; then
    echo -e "${GREEN}✅ Core services are running${NC}"
    echo -e "${GREEN}✅ API endpoints are responding${NC}"
    echo -e "${BLUE}🎯 Platform is ready for testing!${NC}"
    
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Run comprehensive tests: python test_platform.py"
    echo "2. Load browser extension in Chrome/Firefox"
    echo "3. Test on real e-commerce sites"
    echo "4. Check frontend at $FRONTEND_URL"
    
else
    echo -e "${RED}❌ Some services are not running${NC}"
    echo ""
    echo -e "${YELLOW}To start services:${NC}"
    
    if [ "$backend_running" = false ]; then
        echo "Backend: cd backend && cargo run"
    fi
    
    if [ "$ai_service_running" = false ]; then
        echo "AI Service: cd backend/ai-service && python main.py"
    fi
    
    echo "Frontend: cd frontend && npm run dev"
fi

echo ""
echo -e "${BLUE}🔗 Useful URLs:${NC}"
echo "Backend API: $BACKEND_URL"
echo "AI Service: $AI_SERVICE_URL"
echo "Frontend: $FRONTEND_URL"
echo "API Docs: $AI_SERVICE_URL/docs"

echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "Testing Guide: ./TESTING_GUIDE.md"
echo "Feature Spec: ./PRODUCT_FEATURE_SPECIFICATION.md"
echo "Platform Tests: python test_platform.py --help"