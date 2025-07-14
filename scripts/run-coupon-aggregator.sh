#!/bin/bash

# DealPal Coupon Aggregator Runner
# This script runs the coupon aggregation service

set -e

echo "🎯 Starting DealPal Coupon Aggregator..."

# Change to backend directory
cd "$(dirname "$0")/../backend"

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "❌ Error: .env file not found in project root"
    exit 1
fi

# Build the aggregator binary
echo "🔨 Building coupon aggregator..."
cargo build --release --bin coupon_aggregator

# Run the aggregator
echo "🚀 Starting coupon aggregation service..."
./target/release/coupon_aggregator