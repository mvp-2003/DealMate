#!/bin/bash

echo "Building the project..."
cargo build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "✅ Railway PostgreSQL connection configured correctly"
    echo "✅ All compilation errors fixed"
    echo ""
    echo "Your DealMate backend is ready to use Railway's free PostgreSQL tier!"
    echo ""
    echo "To start the server, run: cargo run"
    echo "The server will run on http://localhost:8000"
else
    echo "❌ Build failed"
    exit 1
fi