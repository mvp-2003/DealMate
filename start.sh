#!/bin/bash
set -e

echo "🚀 Starting DealPal Production..."

# Build if needed
if [ ! -f "./backend/target/release/dealpal-backend" ] || [ ! -d "./frontend/.next" ]; then
    echo "📦 Building project first..."
    ./build.sh
fi

# Start Backend in background
echo "🦀 Starting Backend..."
cd backend
./target/release/dealpal-backend &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "📦 Starting Frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Production servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait