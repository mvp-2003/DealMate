#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to clean up background processes
cleanup() {
    echo "Cleaning up background processes..."
    # Kill the backend and frontend server processes started by this script
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # As a fallback, kill any processes listening on the ports
    lsof -t -i:8000 | xargs kill -9 2>/dev/null || true
    lsof -t -i:9002 | xargs kill -9 2>/dev/null || true
}

# Trap script exit (normal or interrupted) to call the cleanup function
trap cleanup EXIT

# Kill any existing processes on the ports before starting
echo "Checking for and killing existing processes on ports 8000 and 9002..."
lsof -t -i:8000 | xargs kill -9 2>/dev/null || true
lsof -t -i:9002 | xargs kill -9 2>/dev/null || true
echo "Ports cleared."

# Build frontend
echo "Building frontend..."
(cd frontend && npm install && npm run build)
echo "Frontend built successfully."

# Start backend server
echo "Starting backend server..."
(cd backend && cargo run &)
BACKEND_PID=$!
echo "Backend server started with PID $BACKEND_PID."

# Start frontend server
echo "Starting frontend server..."
(cd frontend && npm run dev &)
FRONTEND_PID=$!
echo "Frontend server started with PID $FRONTEND_PID."

# Wait for user to stop the script (e.g., with Ctrl+C)
echo "Servers are running. Press Ctrl+C to stop."
wait
