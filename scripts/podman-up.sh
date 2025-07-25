#!/bin/bash

set -e

echo "🚀 Starting DealMate with Podman..."

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null
then
    echo "❌ podman-compose is not installed. Please install it using:"
    echo "pip install podman-compose"
    exit 1
fi

# Check if podman is running
if ! podman info > /dev/null 2>&1; then
    echo "❌ Podman is not running. Please start Podman service:"
    echo "systemctl --user start podman.socket"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Create volumes if they don't exist
echo "📦 Creating volumes..."
podman volume create dealpal_postgres_data 2>/dev/null || true
podman volume create dealpal_redis_data 2>/dev/null || true
podman volume create dealpal_ai_models_cache 2>/dev/null || true

# Build and start services with optimizations
echo "🔨 Building and starting services..."
podman-compose -f docker-compose.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
for i in {1..30}; do
    if podman-compose -f docker-compose.yml ps --filter "health=healthy" | grep -q "healthy"; then
        echo "✅ Services are healthy!"
        break
    fi
    echo "   Checking... ($i/30)"
    sleep 2
done

# Show service status
echo "📊 Service Status:"
podman-compose -f docker-compose.yml ps

echo ""
echo "🎉 DealMate is running!"
echo "📱 Frontend: http://localhost:9002"
echo "🔧 Backend API: http://localhost:8000"
echo "🤖 AI Service: http://localhost:8001"
echo "🔐 Auth Service: http://localhost:3001"
echo ""
echo "📋 To stop: podman-compose down"
echo "📋 To view logs: podman-compose logs -f [service-name]"
