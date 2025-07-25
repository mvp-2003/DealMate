#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root for consistent paths
cd "$PROJECT_ROOT"

echo "--- Reading feature-toggles.json ---"
# Read the buildDev flag from the feature toggles file
BUILD_DEV=$(python3 -c "import json; print(json.load(open('feature-toggles.json'))['buildDev'])")
echo "BUILD_DEV flag is set to: $BUILD_DEV"

if [ "$BUILD_DEV" = "True" ]; then
    echo "🚀 Starting DealMate in Development Mode..."
    
    # Check if dependencies are installed
    if [ ! -d "backend/ai-service/.venv" ] || [ ! -f "backend/target/release/dealmate-backend" ]; then
        echo "📦 Building project first..."
        "$SCRIPT_DIR/build.sh"
    fi
    
    # Start AI Service in background
    echo "🤖 Starting AI Service..."
    cd backend/ai-service
    source .venv/bin/activate
    python main.py &
    AI_SERVICE_PID=$!
    cd "$PROJECT_ROOT"
    
    # Wait for AI service to start
    echo "⏳ Waiting for AI service to initialize..."
    sleep 3
    
    # Start Backend in background
    echo "🦀 Starting Backend..."
    cd backend
    ./target/release/dealmate-backend &
    BACKEND_PID=$!
    cd "$PROJECT_ROOT"
    
    # Start Frontend in development mode
    echo "📦 Starting Frontend in development mode..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd "$PROJECT_ROOT"
    
    echo "✅ Development servers started!"
    echo "🤖 AI Service:  http://localhost:8001"
    echo "🦀 Backend:     http://localhost:8000"
    echo "📦 Frontend:    http://localhost:3000"
    echo "📚 API Docs:    http://localhost:8001/docs"
    echo ""
    echo "🎯 Ready for development!"
    echo "Press Ctrl+C to stop all servers"
else
    echo "🚀 Starting DealMate in Production Mode..."
    
    # Build if needed
    if [ ! -f "backend/target/release/dealmate-backend" ] || [ ! -d "frontend/.next" ] || [ ! -d "backend/ai-service/.venv" ]; then
        echo "📦 Building project first..."
        "$SCRIPT_DIR/build.sh"
    fi
    
    # Start AI Service in background
    echo "🤖 Starting AI Service..."
    cd backend/ai-service
    source .venv/bin/activate
    python main.py &
    AI_SERVICE_PID=$!
    cd "$PROJECT_ROOT"
    
    # Wait for AI service to start
    echo "⏳ Waiting for AI service to initialize..."
    sleep 3
    
    # Start Backend in background
    echo "🦀 Starting Backend..."
    cd backend
    ./target/release/dealmate-backend &
    BACKEND_PID=$!
    cd "$PROJECT_ROOT"
    
    # Start Frontend in production mode
    echo "📦 Starting Frontend in production mode..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd "$PROJECT_ROOT"
    
    echo "✅ Production servers started!"
    echo "🤖 AI Service:  http://localhost:8001"
    echo "🦀 Backend:     http://localhost:8000"
    echo "📦 Frontend:    http://localhost:3000"
    echo "📚 API Docs:    http://localhost:8001/docs"
    echo ""
    echo "🎯 Ready for production testing!"
    echo "Press Ctrl+C to stop all servers"
fi

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $AI_SERVICE_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit
}

# Wait for Ctrl+C
trap cleanup INT
wait
