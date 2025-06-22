#!/bin/bash
set -e

echo "🚀 Building DealPal..."

# Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# Build Backend
echo "🦀 Building Backend..."
cd backend
cargo build --release
cd ..

# Setup AI Service
echo "🤖 Setting up AI Service..."
cd backend/ai-service
if [ ! -d ".venv" ]; then
    echo "Creating new virtual environment..."
    python3 -m venv .venv
else
    echo "Using existing virtual environment..."
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ../..

echo "✅ Build Complete!"
echo "Frontend: ./frontend/.next"
echo "Backend: ./backend/target/release/dealpal-backend"
echo "AI Service: ./backend/ai-service/.venv"