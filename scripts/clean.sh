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
    cd ../frontend
    rm -rf .next
    rm -rf node_modules
    rm -rf .turbo
    echo "✅ Frontend cleaned"
    cd ../scripts
fi

# Clean Backend
if confirm "Clean Backend build artifacts?"; then
    echo "🗑️  Cleaning Backend..."
    cd ../backend
    cargo clean
    echo "✅ Backend cleaned"
    cd ../scripts
fi

# Clean root node_modules
if [ -d "../node_modules" ] && confirm "Clean root node_modules?"; then
    echo "🗑️  Cleaning root node_modules..."
    cd ..
    rm -rf node_modules
    rm -rf package-lock.json
    cd scripts
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
    find .. -name "*.log" -type f -delete 2>/dev/null || true
    echo "✅ Test artifacts cleaned"
fi

echo ""
echo "🎉 Clean and reset complete!"
echo ""
echo "To rebuild everything, run:"
echo "  ./build.sh"
echo ""
echo "To start development, run:"
echo "  ./dev.sh"
