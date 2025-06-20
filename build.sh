#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Frontend built successfully."

# Run backend
echo "Starting backend server..."
cd backend
cargo run &
BACKEND_PID=$!
cd ..

echo "Backend server started with PID $BACKEND_PID."

# Run frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Frontend server started with PID $FRONTEND_PID."

# Wait for both processes to complete
wait $BACKEND_PID
wait $FRONTEND_PID
