#!/bin/bash

# Load environment variables from .env file
source .env

# Check if DATABASE_URL is set
if [[ -z "$DATABASE_URL" ]]; then
  echo "Error: DATABASE_URL is not set in the .env file."
  exit 1
fi

# Connect to the database and drop all user-defined tables
TABLES=$(psql "$DATABASE_URL" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")

if [[ -z "$TABLES" ]]; then
  echo "No tables found to drop."
  exit 0
fi

for TABLE in $TABLES; do
  echo "Dropping table: $TABLE"
  psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS $TABLE CASCADE;"
  if [ $? -ne 0 ]; then
    echo "Error occurred while dropping table: $TABLE"
    exit 1
  fi
done

echo "All user-defined tables dropped successfully."
