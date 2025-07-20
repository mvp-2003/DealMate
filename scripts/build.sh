#!/bin/bash
set -e
set -x # Enable debugging

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root for consistent paths
cd "$PROJECT_ROOT"

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
    echo "--- Running Development Frontend Setup ---"
    npm install --legacy-peer-deps
    echo "✅ Frontend dependencies installed."
    echo "--- Skipping build for development mode ---"
    echo "✅ Frontend is ready for development mode (use npm run dev to start)."
else
    echo "--- Running Production Frontend Build ---"
    npm install --legacy-peer-deps
    NODE_ENV=production npm run build
    echo "✅ Frontend production build complete."
fi
cd "$PROJECT_ROOT"
echo "--- Returned to project root ---"

# --- Backend Build ---
echo "🦀 Building Backend..."
cd backend
cargo build --release
cd "$PROJECT_ROOT"
echo "--- Returned to project root ---"

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
cd "$PROJECT_ROOT"
echo "--- Returned to project root ---"

echo "✅ Build Complete!"
echo "Frontend: ./frontend/.next"
echo "Backend: ./backend/target/release/dealpal-backend"
echo "AI Service: ./backend/ai-service/.venv"

set +x # Disable debugging
