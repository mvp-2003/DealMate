#!/bin/bash

echo "🚀 DealPal Authentication Test Suite"
echo "===================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is required but not installed"
    exit 1
fi

# Install required Python packages
echo "📦 Installing test dependencies..."
pip3 install requests > /dev/null 2>&1

# Run the authentication flow test
echo "🧪 Running Authentication Flow Tests..."
python3 tests/auth_flow_test.py

echo ""
echo "📋 Test Summary:"
echo "- Authentication flow test completed"
echo "- Check output above for detailed results"
echo ""
echo "🔧 To run individual tests:"
echo "- Backend tests: cd backend && cargo test"
echo "- Frontend tests: cd frontend && npm test"
echo "- Full flow test: python3 tests/auth_flow_test.py"