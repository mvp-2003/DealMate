#!/bin/bash
set -e

# Build the backend service
echo "Building the backend service..."
docker build -t dealpal-backend ./backend

echo "Backend service built successfully."
