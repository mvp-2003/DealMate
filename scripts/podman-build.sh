#!/bin/bash

set -e

echo "🔨 Building DealMate containers with Podman..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Build backend image with caching
echo "🦀 Building Rust backend..."
podman build -t dealpal/backend:latest \
  --cache-from dealpal/backend:latest \
  --layers \
  ./backend

# Build AI service with caching  
echo "🧠 Building AI service..."
podman build -t dealpal/ai-service:latest \
  --cache-from dealpal/ai-service:latest \
  --layers \
  ./backend/ai-service

# Build auth service
echo "🔐 Building auth service..."
podman build -t dealpal/auth-service:latest \
  --cache-from dealpal/auth-service:latest \
  --layers \
  -f backend/auth-service/Dockerfile .

# Build frontend with optimization
echo "⚡ Building Next.js frontend..."
podman build -t dealpal/frontend:latest \
  --cache-from dealpal/frontend:latest \
  --layers \
  --build-arg NODE_ENV=production \
  -f frontend/Dockerfile .

# Show built images
echo "📦 Built images:"
podman images | grep dealpal

echo ""
echo "✅ All images built successfully!"
echo "🚀 Run './podman-up.sh' to start the application"
