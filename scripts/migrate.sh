#!/bin/bash

# DealPal Database Migration Script
# Runs SQLx migrations for the backend database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  DealPal Database Migration${NC}"
echo "================================="

# Load environment variables
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${YELLOW}⚠️  No .env file found, using default environment${NC}"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL in your .env file or environment"
    exit 1
fi

# Navigate to backend directory
cd backend

echo -e "${BLUE}📋 Checking migration status...${NC}"

# Check if sqlx-cli is installed
if ! command -v sqlx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing sqlx-cli...${NC}"
    cargo install sqlx-cli --no-default-features --features postgres
    echo -e "${GREEN}✅ sqlx-cli installed${NC}"
else
    echo -e "${GREEN}✅ sqlx-cli is available${NC}"
fi

# Check database connection
echo -e "${BLUE}🔗 Testing database connection...${NC}"
if sqlx database create 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Database already exists or connection issue${NC}"
fi

# Run migrations
echo -e "${BLUE}🚀 Running database migrations...${NC}"
if sqlx migrate run; then
    echo -e "${GREEN}✅ Database migrations completed successfully${NC}"
    
    # Show migration status
    echo -e "${BLUE}📊 Migration status:${NC}"
    sqlx migrate info
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database migration completed successfully!${NC}"
echo -e "${BLUE}💡 Your database is now ready for the DealPal backend${NC}"
