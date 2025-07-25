#!/bin/bash

set -e

echo "🔨 Building DealMate containers with Podman..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Build backend image with caching
echo "🦀 Building Rust backend..."
podman build -t dealmate/backend:latest \
  --cache-from dealmate/backend:latest \
  --layers \
  ./backend

# Build AI service with caching  
echo "🧠 Building AI service..."
podman build -t dealmate/ai-service:latest \
  --cache-from dealmate/ai-service:latest \
  --layers \
  ./backend/ai-service

# Build auth service
echo "🔐 Building auth service..."
podman build -t dealmate/auth-service:latest \
  --cache-from dealmate/auth-service:latest \
  --layers \
  -f backend/auth-service/Dockerfile .

# Build frontend with optimization
echo "⚡ Building Next.js frontend..."
podman build -t dealmate/frontend:latest \
  --cache-from dealmate/frontend:latest \
  --layers \
  --build-arg NODE_ENV=production \
  -f frontend/Dockerfile .

# Show built images
echo "📦 Built images:"
podman images | grep dealmate

echo ""
echo "✅ All images built successfully!"
echo "🚀 Run './podman-up.sh' to start the application"
