#!/bin/bash

echo "🚀 Starting DealPal Development..."

# Start Backend in background
echo "🦀 Starting Backend..."
cd backend
cargo run &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "📦 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Development servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:9002"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait