#!/bin/bash

# DealMate Railway Setup Script
# Sets up environment variables for Railway deployment

set -e

echo "🚂 DealMate Railway Setup"
echo "======================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"

# Login to Railway (if not already logged in)
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

echo "✅ Railway authentication verified"

# Set environment variables
echo "🔧 Setting up environment variables..."

# Database URL (should already be set by Railway PostgreSQL service)
echo "📊 Database URL should be automatically set by Railway PostgreSQL service"

# Gemini API Key
read -p "Enter your Google Gemini API Key: " GEMINI_KEY
if [ -n "$GEMINI_KEY" ]; then
    railway variables set GOOGLE_API_KEY="$GEMINI_KEY"
    echo "✅ Gemini API key set"
else
    echo "❌ Gemini API key is required"
    exit 1
fi

# Other environment variables
railway variables set GEMINI_MODEL="gemini-1.5-flash"
railway variables set LOG_LEVEL="INFO"
railway variables set DEBUG="false"
railway variables set API_HOST="0.0.0.0"
railway variables set API_PORT="8001"

echo "✅ Environment variables configured"

# Deploy services
echo "🚀 Deploying to Railway..."

# Deploy backend
echo "📦 Deploying backend service..."
railway up --service backend

# Deploy AI service
echo "🤖 Deploying AI service..."
railway up --service ai-service

echo "✅ Deployment complete!"

# Show service URLs
echo "🌐 Service URLs:"
railway status

echo ""
echo "🎉 DealMate is now deployed on Railway!"
echo ""
echo "Next steps:"
echo "1. Test your deployed services"
echo "2. Update browser extension with production URLs"
echo "3. Configure custom domain (optional)"