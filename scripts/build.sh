#!/bin/bash
set -e

echo "🚀 Building DealPal..."

# Build Frontend
echo "📦 Building Frontend..."
npm install --legacy-peer-deps
npm run build

# Build Backend
echo "🦀 Building Backend..."
cd backend
cargo build --release
cd ..

# Setup AI Service
echo "🤖 Setting up AI Service..."
cd backend/ai-service
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "Virtual environment exists, updating dependencies..."
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi
cd ../../

echo "✅ Build Complete!"
echo "Frontend: frontend/.next"
echo "Backend: backend/target/release/dealpal-backend"
echo "AI Service: backend/ai-service/.venv"
