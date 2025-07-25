#!/bin/bash
set -e

echo "🐳 Building Docker Images..."

# Build Frontend
echo "📦 Building Frontend Docker Image..."
docker build -t dealmate-frontend ../frontend

# Build Backend
echo "🦀 Building Backend Docker Image..."
docker build -t dealmate-backend ../backend

echo "✅ Docker images built!"
echo "Frontend: dealmate-frontend"
echo "Backend: dealmate-backend"
echo ""
echo "Run with: docker-compose up"