#!/bin/bash

# Stop all services
echo "Stopping all services..."
lsof -ti:9002 | xargs kill -9  # Frontend (Next.js)
lsof -ti:8000 | xargs kill -9  # Backend (Rust)
lsof -ti:8001 | xargs kill -9  # AI Service (Python)
lsof -ti:3001 | xargs kill -9  # Auth Service (Node.js)

echo "All services stopped."
