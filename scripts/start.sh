#!/bin/bash
set -e

echo "🚀 Starting DealPal Production..."

# Build if needed
if [ ! -f "../backend/target/release/dealpal-backend" ] || [ ! -f "../frontend/.next" ] || [ ! -d "../backend/ai-service/.venv" ]; then
    echo "📦 Building project first..."
    ./build.sh
fi

# Start AI Service in background
echo "🤖 Starting AI Service..."
cd ../backend/ai-service
source .venv/bin/activate
python main.py &
AI_SERVICE_PID=$!
cd ../../scripts

# Wait for AI service to start
echo "⏳ Waiting for AI service to initialize..."
sleep 3

# Start Backend in background
echo "🦀 Starting Backend..."
cd ../backend
./target/release/dealpal-backend &
BACKEND_PID=$!
cd ../scripts

# Start Frontend
echo "📦 Starting Frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!
cd ../scripts

echo "✅ Production servers started!"
echo "🤖 AI Service:  http://localhost:8001"
echo "🦀 Backend:     http://localhost:8000"
echo "📦 Frontend:    http://localhost:3000"
echo "📚 API Docs:    http://localhost:8001/docs"
echo ""
echo "🎯 Ready for testing with browser extension!"
echo "Press Ctrl+C to stop all servers"

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