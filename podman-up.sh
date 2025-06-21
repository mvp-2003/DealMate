#!/bin/bash

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null
then
    echo "podman-compose is not installed. Please install it using:"
    echo "pip install podman-compose"
    exit 1
fi

# Bring up the application using podman-compose
echo "Bringing up the application with podman-compose..."
podman-compose up -d

echo "Application is running! (hopefully)"
