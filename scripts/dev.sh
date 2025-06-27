#!/bin/bash

echo "🚀 Starting DealPal Development..."

# Start AI Service in background (development mode with hot reload)
echo "🤖 Starting AI Service with Hot Reload..."
cd ../backend/ai-service
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found! Please run ./build.sh first to set up the environment."
    exit 1
fi
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
AI_SERVICE_PID=$!
cd ../../scripts

# Wait for AI service to start
echo "⏳ Waiting for AI service to initialize..."
sleep 3

# Start Backend in background (development mode with hot reload)
echo "🦀 Starting Backend with Hot Reload..."
cd ../backend
cargo watch -x run &
BACKEND_PID=$!
cd ../scripts

# Start Frontend in development mode
echo "📦 Starting Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
cd ../scripts

echo "✅ Development servers started!"
echo "🤖 AI Service:  http://localhost:8001 (with hot reload)"
echo "🦀 Backend:     http://localhost:8000 (with hot reload)"
echo "📦 Frontend:    http://localhost:3000 (with hot reload)"
echo "📚 API Docs:    http://localhost:8001/docs"
echo ""
echo "🔥 Development mode with hot reload enabled!"
echo "Press Ctrl+C to stop all servers"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all development services..."
    kill $AI_SERVICE_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit
}

# Wait for Ctrl+C
trap cleanup INT
wait