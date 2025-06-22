#!/bin/bash

# Define the target directory with the virtual environment
TARGET_DIR="/Users/rishabh.das/Desktop/Personal/DealPal/backend/ai-service"
VENV_NAME=".venv"

# Check if script is being sourced (required for activation to persist)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Error: This script must be sourced, not executed directly."
    echo "Usage: source $0"
    echo "   or: . $0"
    exit 1
fi

# Check if any virtual environment is currently activated
if [ -n "$VIRTUAL_ENV" ]; then
    echo "Deactivating current virtual environment: $VIRTUAL_ENV"
    deactivate
fi

# Check if the target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Directory $TARGET_DIR does not exist"
    return 1
fi

# Check if the virtual environment exists
if [ ! -d "$TARGET_DIR/$VENV_NAME" ]; then
    echo "Error: Virtual environment $TARGET_DIR/$VENV_NAME does not exist"
    return 1
fi

# Navigate to the target directory
echo "Navigating to $TARGET_DIR"
cd "$TARGET_DIR"

# Activate the virtual environment
echo "Activating $VENV_NAME virtual environment"
source "$VENV_NAME/bin/activate"

if [ -n "$VIRTUAL_ENV" ]; then
    echo "✅ Virtual environment activated successfully: $VIRTUAL_ENV"
else
    echo "❌ Failed to activate virtual environment"
    return 1
fi
