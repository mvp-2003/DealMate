#!/bin/bash

echo "Testing local PostgreSQL setup for DealMate..."
echo "============================================"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Parse DATABASE_URL to extract connection details
# Format: postgresql://username:password@host:port/database
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env file!"
    exit 1
fi

# Extract components from DATABASE_URL using sed
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:@]*\).*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "Using connection details from DATABASE_URL:"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"

# Test database connection
echo -e "\n1. Testing database connection..."
psql "$DATABASE_URL" -t -A -c "SELECT 'Connection successful';" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    exit 1
fi

# Count tables
echo -e "\n2. Checking existing tables..."
TABLE_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1)
echo "Found $TABLE_COUNT tables in the database"

# Check migrations
echo -e "\n3. Checking migration status..."
MIGRATION_COUNT=$(psql "$DATABASE_URL" -t -A -c "SELECT COUNT(*) FROM _sqlx_migrations;" 2>&1)
if [ $? -eq 0 ]; then
    echo "Found $MIGRATION_COUNT migrations applied"
else
    echo "No migrations table found (database might not be initialized)"
fi

# List all tables
echo -e "\n4. Listing all tables in the database..."
psql "$DATABASE_URL" -t -A -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>&1

echo -e "\n5. Summary of database status:"
echo "- PostgreSQL is running"
echo "- Database '$DB_NAME' exists"
echo "- User '$DB_USER' has access"
if [ "$TABLE_COUNT" -gt "0" ]; then
    echo "- $TABLE_COUNT tables are present"
else
    echo "- No tables found - you may need to run migrations"
fi

echo -e "\n============================================"
echo "Local PostgreSQL is ready to use!"
echo ""
echo "To run the application with local database:"
echo "1. Your .env file is correctly configured with DATABASE_URL"
echo "2. Choose one of these options:"
echo "   • ./run_app.sh           (recommended - full platform)"
echo "   • ./scripts/dev.sh       (development mode)"
echo "   • npm run dev            (frontend only)"
echo ""

if [ "$TABLE_COUNT" -eq "0" ]; then
    echo "⚠️  No tables found. Run migrations with:"
    echo "   ./scripts/migrate.sh"
    echo ""
fi

echo "Your DATABASE_URL is properly configured and working!"
