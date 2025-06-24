#!/bin/bash

# DealPal Python AI Service Startup Script

set -e

echo "🚀 Starting DealPal Python AI Service..."

# Activate virtual environment
echo "⚙️ Activating virtual environment..."
source .venv/bin/activate

# Check if we're in the correct directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found. Please run this script from the ai-service directory."
    exit 1
fi

# Check Python version
python_version=$(python3 --version 2>&1 | grep -o "Python 3\.[0-9]\+")
if [ -z "$python_version" ]; then
    echo "❌ Error: Python 3 is required but not found."
    echo "Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Found $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check for master .env file
if [ ! -f "../../.env" ]; then
    echo "⚠️ Warning: Master .env file not found at project root."
    echo "   Please ensure ../../.env exists with all necessary environment variables:"
    echo "   - GOOGLE_API_KEY for Gemini AI capabilities"
    echo "   - DATABASE_URL for database connection"
    echo "   - REDIS_URL for Redis connection"
    echo "   - Other service configuration variables"
    echo ""
else
    echo "✅ Master .env file found. Using centralized configuration."
fi

# Check if ports are available
if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Warning: Port 8001 is already in use."
    echo "The AI service may not start properly."
fi

# Start the service
echo "🤖 Starting DealPal AI Service on http://localhost:8001"
echo "📖 API documentation will be available at http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

# Run the service in the background
python main.py &
SERVER_PID=$!

# Wait for the server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Run the test script
echo "🏃 Running tests..."
./.venv/bin/python test_service.py
TEST_EXIT_CODE=$?

# Stop the server
echo "🛑 Stopping DealPal AI Service..."
kill $SERVER_PID

# Exit with the test result
exit $TEST_EXIT_CODE
