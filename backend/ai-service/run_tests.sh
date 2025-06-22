#!/bin/bash
set -e

echo "🏃 Running AI Service tests..."

# Activate virtual environment
source .venv/bin/activate

# Run the test script
./.venv/bin/python test_service.py

echo "✅ Tests finished."
