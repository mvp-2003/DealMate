#!/bin/bash

# Clear all logs script
echo "Clearing all logs..."

# Remove all log files from logs directory
rm -f ../logs/*.log

# Create logs directory if it doesn't exist
mkdir -p ../logs

echo "All logs cleared successfully!"