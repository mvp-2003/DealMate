#!/bin/bash

# Load environment variables from .env file
source ../.env

# Check if DATABASE_URL is set
if [[ -z "$DATABASE_URL" ]]; then
  echo "Error: DATABASE_URL is not set in the .env file."
  exit 1
fi

# Drop all user-defined tables
TABLES=$(psql "$DATABASE_URL" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")

if [[ -n "$TABLES" ]]; then
  for TABLE in $TABLES; do
    echo "Dropping table: $TABLE"
    psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS $TABLE CASCADE;"
  done
fi

# Drop all user-defined types
TYPES=$(psql "$DATABASE_URL" -t -c "SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');")

if [[ -n "$TYPES" ]]; then
  for TYPE in $TYPES; do
    echo "Dropping type: $TYPE"
    psql "$DATABASE_URL" -c "DROP TYPE IF EXISTS $TYPE CASCADE;"
  done
fi

# Drop all user-defined sequences
SEQUENCES=$(psql "$DATABASE_URL" -t -c "SELECT relname FROM pg_class WHERE relkind = 'S' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');")

if [[ -n "$SEQUENCES" ]]; then
  for SEQUENCE in $SEQUENCES; do
    echo "Dropping sequence: $SEQUENCE"
    psql "$DATABASE_URL" -c "DROP SEQUENCE IF EXISTS $SEQUENCE CASCADE;"
  done
fi

echo "All user-defined objects dropped successfully."
