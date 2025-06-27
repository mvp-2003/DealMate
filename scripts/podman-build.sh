#!/bin/bash

# Build the backend image
echo "Building backend image..."
cd ../backend
podman build -t backend .
cd ../scripts

# Build the frontend image
echo "Building frontend image..."
cd ../frontend
podman build -t frontend .
cd ../scripts

echo "All images built successfully!"
