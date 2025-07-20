#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root for consistent paths
cd "$PROJECT_ROOT"

echo "🔍 DealPal Build Status"
echo "======================="

# Read the buildDev flag from the feature toggles file
BUILD_DEV=$(python3 -c "import json; print(json.load(open('feature-toggles.json'))['buildDev'])" 2>/dev/null || echo "False")
echo "Build Mode: $([ "$BUILD_DEV" = "True" ] && echo "Development" || echo "Production")"
echo ""

# Backend Status
echo "🦀 Backend:"
if [ -f "backend/target/release/dealpal-backend" ]; then
    echo "  ✅ Binary exists"
    ls -lh backend/target/release/dealpal-backend | awk '{print "     Size: " $5 ", Modified: " $6 " " $7 " " $8}'
else
    echo "  ❌ Binary not found"
fi

# Frontend Status
echo ""
echo "📦 Frontend:"
if [ "$BUILD_DEV" = "True" ]; then
    # In development mode, check for node_modules
    if [ -d "frontend/node_modules" ]; then
        echo "  ✅ Dependencies installed (development mode)"
        echo "     Ready for: npm run dev"
    else
        echo "  ❌ Dependencies not installed"
    fi
else
    # In production mode, check for .next build
    if [ -d "frontend/.next" ]; then
        echo "  ✅ Production build exists"
        du -sh frontend/.next | awk '{print "     Size: " $1}'
    else
        echo "  ❌ Production build not found"
    fi
fi

# AI Service Status
echo ""
echo "🤖 AI Service:"
if [ -d "backend/ai-service/.venv" ]; then
    echo "  ✅ Virtual environment exists"
    echo "     Python: $(cd backend/ai-service && .venv/bin/python --version 2>&1)"
else
    echo "  ❌ Virtual environment not found"
fi

# Auth Service Status
echo ""
echo "🔐 Auth Service:"
if [ -d "node_modules" ]; then
    echo "  ✅ Dependencies installed (uses root node_modules)"
else
    echo "  ❌ Dependencies not installed"
fi

# Database Status
echo ""
echo "💾 Database:"
if command -v psql &> /dev/null; then
    # Try to connect to the database
    if DATABASE_URL=$(grep DATABASE_URL .env 2>/dev/null | cut -d '=' -f2-); then
        if [ ! -z "$DATABASE_URL" ]; then
            echo "  ✅ PostgreSQL configured"
            echo "     Connection string found in .env"
        else
            echo "  ⚠️  DATABASE_URL is empty in .env"
        fi
    else
        echo "  ❌ DATABASE_URL not found in .env"
    fi
else
    echo "  ⚠️  PostgreSQL client not installed (cannot verify connection)"
fi

echo ""
echo "========================"
echo ""

# Check build artifacts based on mode
if [ "$BUILD_DEV" = "True" ]; then
    echo "Build Artifacts (Development Mode):"
    if [ -d "frontend/node_modules" ] && [ -f "backend/target/release/dealpal-backend" ] && [ -d "backend/ai-service/.venv" ]; then
        echo "  ✅ All development dependencies ready!"
        echo "     Run './start.sh' to start in development mode"
    else
        echo "  ❌ Some artifacts missing. Run './build.sh' to set up development environment."
    fi
else
    echo "Build Artifacts (Production Mode):"
    if [ -d "frontend/.next" ] && [ -f "backend/target/release/dealpal-backend" ] && [ -d "backend/ai-service/.venv" ]; then
        echo "  ✅ All production builds complete!"
        echo "     Run './start.sh' to start in production mode"
    else
        echo "  ❌ Some artifacts missing. Run './build.sh' to build for production."
    fi
fi

echo ""
echo "Build Status Details:"
echo "  Frontend Build: $([ "$BUILD_DEV" = "True" ] && ([ -d "frontend/node_modules" ] && echo "✅ READY" || echo "❌ MISSING") || ([ -d "frontend/.next" ] && echo "✅ READY" || echo "❌ MISSING"))"
echo "  Backend Build: $([ -f "backend/target/release/dealpal-backend" ] && echo "✅ READY" || echo "❌ MISSING")"
echo "  AI Service Env: $([ -d "backend/ai-service/.venv" ] && echo "✅ READY" || echo "❌ MISSING")"
echo "  Auth Service Deps: $([ -d "node_modules" ] && echo "✅ READY" || echo "❌ MISSING")"
