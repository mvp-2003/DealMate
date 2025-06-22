#!/bin/bash

# DealPal Clean and Reset Script
# Cleans build artifacts and resets the development environment

set -e

echo "🧹 DealPal Clean and Reset"
echo "=========================="

# Function to ask for confirmation
confirm() {
    read -p "$1 (y/N): " response
    case "$response" in
        [yY][eS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Clean Frontend
if confirm "Clean Frontend build artifacts and node_modules?"; then
    echo "🗑️  Cleaning Frontend..."
    cd frontend
    rm -rf .next
    rm -rf node_modules
    rm -rf .turbo
    echo "✅ Frontend cleaned"
    cd ..
fi

# Clean Backend
if confirm "Clean Backend build artifacts?"; then
    echo "🗑️  Cleaning Backend..."
    cd backend
    cargo clean
    echo "✅ Backend cleaned"
    cd ..
fi

# Clean AI Service
if confirm "Clean AI Service virtual environment?"; then
    echo "🗑️  Cleaning AI Service..."
    cd backend/ai-service
    rm -rf venv
    rm -rf __pycache__
    rm -rf .pytest_cache
    echo "✅ AI Service cleaned"
    cd ../..
fi

# Clean root node_modules
if [ -d "node_modules" ] && confirm "Clean root node_modules?"; then
    echo "🗑️  Cleaning root node_modules..."
    rm -rf node_modules
    rm -rf package-lock.json
    echo "✅ Root node_modules cleaned"
fi

# Clean Docker artifacts
if confirm "Clean Docker artifacts?"; then
    echo "🗑️  Cleaning Docker..."
    docker system prune -f 2>/dev/null || echo "Docker not available or no containers to clean"
    echo "✅ Docker artifacts cleaned"
fi

# Clean test artifacts
if confirm "Clean test artifacts and logs?"; then
    echo "🗑️  Cleaning test artifacts..."
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.pyc" -type f -delete 2>/dev/null || true
    echo "✅ Test artifacts cleaned"
fi

# Reset git (optional)
if confirm "Reset git to clean state (WARNING: This will discard uncommitted changes)?"; then
    echo "🔄 Resetting git..."
    git clean -fd
    git reset --hard HEAD
    echo "✅ Git reset complete"
fi

echo ""
echo "🎉 Clean and reset complete!"
echo ""
echo "To rebuild everything, run:"
echo "  ./build.sh"
echo ""
echo "To start development, run:"
echo "  ./dev.sh"
