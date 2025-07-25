#!/bin/bash

# Test script for the coupon system
set -e

echo "🎯 Testing DealMate Coupon System..."

# Start the backend in the background
cd "$(dirname "$0")/../backend"
echo "🚀 Starting backend..."
cargo run --release &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Test creating a merchant
echo "📦 Creating test merchant..."
curl -X POST http://localhost:8000/api/v1/coupons/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Store",
    "domain": "teststore.com",
    "affiliate_network": "test_network",
    "commission_rate": 5.0
  }' || echo "Merchant creation failed (might already exist)"

# Test creating a coupon
echo "🎫 Creating test coupon..."
MERCHANT_ID=$(curl -s http://localhost:8000/api/v1/coupons/search?merchant_domain=teststore.com | jq -r '.[0].merchant_id // empty')

if [ -n "$MERCHANT_ID" ]; then
  curl -X POST http://localhost:8000/api/v1/coupons/ \
    -H "Content-Type: application/json" \
    -d "{
      \"merchant_id\": \"$MERCHANT_ID\",
      \"code\": \"TEST10\",
      \"title\": \"10% Off Test\",
      \"description\": \"Test coupon for 10% off\",
      \"discount_type\": \"percentage\",
      \"discount_value\": 10.0,
      \"minimum_order\": 50.0,
      \"source\": \"test\"
    }" || echo "Coupon creation failed"
fi

# Test searching coupons
echo "🔍 Searching for coupons..."
curl -s http://localhost:8000/api/v1/coupons/search?merchant_domain=teststore.com | jq '.'

# Test coupon validation
echo "✅ Testing coupon validation..."
curl -X POST http://localhost:8000/api/v1/coupons/test \
  -H "Content-Type: application/json" \
  -d '{
    "coupon_codes": ["TEST10", "INVALID"],
    "merchant_domain": "teststore.com",
    "order_value": 100.0
  }' | jq '.'

# Clean up
echo "🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null || true

echo "✅ Coupon system test completed!"