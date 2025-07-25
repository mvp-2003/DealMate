#!/bin/bash

# DealMate Comparison Feature Test Script
# This script tests the comparison feature functionality

echo "🚀 Testing DealMate Comparison Feature..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test API endpoints
BASE_URL="http://localhost:9002"
API_BASE="$BASE_URL/api/comparison"

echo -e "${YELLOW}1. Testing Categories API...${NC}"
curl -s "$API_BASE/categories" | jq '.[0:3]' 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Categories API working${NC}"
else
    echo -e "${RED}✗ Categories API failed${NC}"
fi

echo ""
echo -e "${YELLOW}2. Testing Search Suggestions API...${NC}"
curl -s "$API_BASE/suggestions" | jq '.[0:3]' 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Suggestions API working${NC}"
else
    echo -e "${RED}✗ Suggestions API failed${NC}"
fi

echo ""
echo -e "${YELLOW}3. Testing Product Search API...${NC}"
curl -s "$API_BASE/search?q=laptop" | jq '.products[0:2]' 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Search API working${NC}"
else
    echo -e "${RED}✗ Search API failed${NC}"
fi

echo ""
echo -e "${YELLOW}4. Testing Search with Filters...${NC}"
curl -s "$API_BASE/search?q=smartphone&priceMin=100&priceMax=500&sortBy=price&sortOrder=asc" | jq '.totalResults' 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Filtered Search API working${NC}"
else
    echo -e "${RED}✗ Filtered Search API failed${NC}"
fi

echo ""
echo -e "${YELLOW}5. Testing Frontend Routes...${NC}"

# Test if the comparison page loads
if curl -s "$BASE_URL/compare" | grep -q "Compare Products"; then
    echo -e "${GREEN}✓ Compare page accessible${NC}"
else
    echo -e "${RED}✗ Compare page not accessible${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Comparison Feature Test Complete!${NC}"
echo ""
echo "📖 To test manually:"
echo "1. Open $BASE_URL/compare"
echo "2. Search for 'laptop' or 'iPhone'"
echo "3. Try different filters and view modes"
echo "4. Test category browsing"
echo ""
echo "🔧 API Endpoints:"
echo "- Categories: $API_BASE/categories"
echo "- Suggestions: $API_BASE/suggestions"
echo "- Search: $API_BASE/search?q=QUERY"
echo ""
echo "📱 Mobile Testing:"
echo "- Resize browser window to test responsive design"
echo "- Test QR code generation for mobile sharing"
echo ""
