#!/bin/bash
set -e

echo "🚀 Building DealPal..."

# Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# Build Backend
echo "🦀 Building Backend..."
cd backend
cargo build --release
cd ..

echo "✅ Build Complete!"
echo "Frontend: ./frontend/.next"
echo "Backend: ./backend/target/release/dealpal-backend"