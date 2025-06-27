#!/bin/bash
set -e

echo "🐳 Building Docker Images..."

# Build Frontend
echo "📦 Building Frontend Docker Image..."
docker build -t dealpal-frontend ./frontend

# Build Backend
echo "🦀 Building Backend Docker Image..."
docker build -t dealpal-backend ./backend

echo "✅ Docker images built!"
echo "Frontend: dealpal-frontend"
echo "Backend: dealpal-backend"
echo ""
echo "Run with: docker-compose up"