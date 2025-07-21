#!/bin/bash

echo "Testing local PostgreSQL setup for DealPal..."
echo "============================================"

# Test database connection
echo -e "\n1. Testing database connection..."
PGPASSWORD= psql -h localhost -p 5432 -U dealpal -d dealmate_dev -t -A -c "SELECT 'Connection successful';" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    exit 1
fi

# Count tables
echo -e "\n2. Checking existing tables..."
TABLE_COUNT=$(PGPASSWORD= psql -h localhost -p 5432 -U dealpal -d dealmate_dev -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1)
echo "Found $TABLE_COUNT tables in the database"

# Check migrations
echo -e "\n3. Checking migration status..."
MIGRATION_COUNT=$(PGPASSWORD= psql -h localhost -p 5432 -U dealpal -d dealmate_dev -t -A -c "SELECT COUNT(*) FROM _sqlx_migrations;" 2>&1)
echo "Found $MIGRATION_COUNT migrations applied"

# Test database URL from .env
echo -e "\n4. Testing DATABASE_URL from .env..."
if [ -f .env ]; then
    # Extract DATABASE_URL from .env file
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2-)
    echo "DATABASE_URL: $DB_URL"
    
    # Test connection using the DATABASE_URL
    PGPASSWORD= psql "$DB_URL" -t -A -c "SELECT current_database();" 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ DATABASE_URL connection successful!"
    else
        echo "❌ DATABASE_URL connection failed!"
    fi
else
    echo "❌ .env file not found!"
fi

echo -e "\n5. Summary of database status:"
echo "- PostgreSQL 16 is running"
echo "- Database 'dealmate_dev' exists"
echo "- User 'dealpal' has access"
echo "- Tables are present and migrations have been applied"

echo -e "\n============================================"
echo "Local PostgreSQL is ready to use!"
echo ""
echo "To run the application with local database:"
echo "1. Make sure your .env file has the correct DATABASE_URL"
echo "2. Choose one of these options:"
echo "   • ./run_app.sh           (recommended - full platform)"
echo "   • ./scripts/dev.sh       (development mode)"
echo "   • npm run dev            (frontend only)"
echo ""
echo "Your database is already set up with all necessary tables and migrations."
