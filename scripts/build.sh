#!/bin/bash
set -e
set -x # Enable debugging

# This script should be run from the root of the project.

echo "--- Reading feature-toggles.json ---"
# Read the buildDev flag from the feature toggles file
# Using Python for robust JSON parsing, as it's a project dependency.
BUILD_DEV=$(python3 -c "import json; print(json.load(open('feature-toggles.json'))['buildDev'])")
echo "BUILD_DEV flag is set to: $BUILD_DEV"

if [ "$BUILD_DEV" = "True" ]; then
    echo "🚀 Building DealPal for Development (based on feature-toggles.json)..."
else
    echo "🚀 Building DealPal for Production (based on feature-toggles.json)..."
fi

# --- Frontend Build ---
echo "📦 Building Frontend..."
cd frontend

if [ "$BUILD_DEV" = "True" ]; then
    echo "--- Running Development Frontend Build ---"
    npm install --legacy-peer-deps
    echo "✅ Frontend dependencies installed for development."
else
    echo "--- Running Production Frontend Build ---"
    npm install --legacy-peer-deps
    npm run build
    echo "✅ Frontend production build complete."
fi
cd ..
echo "--- Returned to root directory ---"

# --- Backend Build ---
echo "🦀 Building Backend..."
cd backend
cargo build --release
cd ..
echo "--- Returned to root directory ---"

# --- AI Service Setup ---
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
echo "--- Returned to root directory ---"

echo "✅ Build Complete!"
echo "Frontend: ./frontend/.next"
echo "Backend: ./backend/target/release/dealpal-backend"
echo "AI Service: ./backend/ai-service/.venv"

set +x # Disable debugging
