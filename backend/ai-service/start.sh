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

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file with default template..."
    cat > .env << 'EOF'
# AI Service Configuration
# Add your API keys here:
# OPENAI_API_KEY=your_openai_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration (if needed)
# DATABASE_URL=postgresql://user:password@localhost:5432/database_name
EOF
    echo ""
    echo "📝 Please edit .env file to configure your API keys:"
    echo "   - OPENAI_API_KEY for enhanced AI capabilities"
    echo "   - GEMINI_API_KEY for Gemini AI capabilities"
    echo "   - DATABASE_URL for database connection (if needed)"
    echo ""
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
