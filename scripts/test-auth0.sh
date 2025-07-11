#!/bin/bash

# Auth0 Configuration Test Script
echo "🔍 Testing Auth0 Configuration..."
echo ""

# Check if environment variables are set
if [ -z "$AUTH0_DOMAIN" ]; then
    echo "❌ AUTH0_DOMAIN is not set"
else
    echo "✅ AUTH0_DOMAIN: $AUTH0_DOMAIN"
fi

if [ -z "$AUTH0_CLIENT_ID" ]; then
    echo "❌ AUTH0_CLIENT_ID is not set"
else
    echo "✅ AUTH0_CLIENT_ID: ${AUTH0_CLIENT_ID:0:8}..."
fi

if [ -z "$AUTH0_CLIENT_SECRET" ]; then
    echo "❌ AUTH0_CLIENT_SECRET is not set"
else
    echo "✅ AUTH0_CLIENT_SECRET: [HIDDEN]"
fi

if [ -z "$AUTH0_AUDIENCE" ]; then
    echo "❌ AUTH0_AUDIENCE is not set"
else
    echo "✅ AUTH0_AUDIENCE: $AUTH0_AUDIENCE"
fi

echo ""
echo "🌐 Testing Auth0 Domain connectivity..."

# Test Auth0 domain connectivity
if curl -s --head "https://$AUTH0_DOMAIN/.well-known/jwks.json" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Auth0 domain is reachable"
else
    echo "❌ Auth0 domain is not reachable"
fi

echo ""
echo "🔧 Recommended Auth0 Application Settings:"
echo "   Application Type: Single Page Application (SPA)"
echo "   Allowed Callback URLs: http://localhost:9002/auth/callback"
echo "   Allowed Logout URLs: http://localhost:9002"
echo "   Allowed Web Origins: http://localhost:9002"
echo ""
echo "📝 Social Connections to Enable:"
echo "   - Google OAuth"
echo "   - Microsoft"
echo ""
