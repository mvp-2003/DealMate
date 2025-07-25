# DealMate API Documentation

This document provides comprehensive documentation for all DealMate APIs across our microservices architecture.

## Base URLs

- **Frontend API**: `http://localhost:3000/api`
- **Backend API**: `http://localhost:8000/api/v1`
- **AI Service API**: `http://localhost:8001/api`
- **Auth Service API**: `http://localhost:3001/api`

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Product Comparison API

### Search Products

Search for products across multiple vendors with comprehensive filtering options.

**Endpoint**: `GET /api/comparison/search`

**Parameters**:
- `q` (required, string): Search query
- `category` (optional, string): Product category filter
- `priceMin` (optional, number): Minimum price filter
- `priceMax` (optional, number): Maximum price filter
- `vendors` (optional, string): Comma-separated list of vendor names
- `minRating` (optional, number): Minimum rating filter (1-5)
- `inStock` (optional, boolean): Filter for in-stock items only
- `sortBy` (optional, enum): Sort field - `price`, `rating`, `name`, `discount`
- `sortOrder` (optional, enum): Sort order - `asc`, `desc`

**Example Request**:
```http
GET /api/comparison/search?q=laptop&category=Electronics&priceMin=500&priceMax=2000&sortBy=price&sortOrder=asc
```

**Response**:
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "MacBook Pro 16-inch",
      "price": 1599.99,
      "originalPrice": 1799.99,
      "discount": 11.11,
      "vendor": "Amazon",
      "vendorId": "amazon",
      "rating": 4.5,
      "reviewCount": 1250,
      "imageUrl": "https://example.com/image.jpg",
      "productUrl": "https://amazon.com/product/123",
      "description": "Latest MacBook Pro with M3 chip",
      "inStock": true,
      "deliveryTime": "2-3 days",
      "features": ["M3 Chip", "16GB RAM", "512GB SSD"],
      "category": "Electronics",
      "availability": {
        "inStock": true,
        "quantity": 15,
        "lastUpdated": "2025-07-26T10:30:00Z"
      }
    }
  ],
  "category": "Electronics",
  "searchQuery": "laptop",
  "totalResults": 50,
  "priceRange": {
    "min": 299.99,
    "max": 2499.99
  },
  "avgRating": 4.2,
  "timestamp": "2025-07-26T10:30:00Z"
}
```

### Get Product Categories

Retrieve all available product categories.

**Endpoint**: `GET /api/comparison/categories`

**Response**:
```json
[
  {
    "id": "electronics",
    "name": "Electronics",
    "icon": "💻",
    "description": "Computers, phones, and gadgets",
    "productCount": 15420
  },
  {
    "id": "fashion",
    "name": "Fashion",
    "icon": "👔",
    "description": "Clothing, shoes, and accessories",
    "productCount": 8930
  }
]
```

### Get Search Suggestions

Get search suggestions based on user input and popular searches.

**Endpoint**: `GET /api/comparison/suggestions`

**Parameters**:
- `q` (optional, string): Partial search query for autocomplete

**Response**:
```json
[
  {
    "query": "iPhone 15 Pro",
    "category": "Electronics",
    "popularity": 95,
    "trending": true
  },
  {
    "query": "Nike Air Max",
    "category": "Fashion",
    "popularity": 87,
    "trending": false
  }
]
```

### Get Vendor Information

Retrieve detailed information about a specific vendor.

**Endpoint**: `GET /api/comparison/vendors/{vendorId}`

**Response**:
```json
{
  "id": "amazon",
  "name": "Amazon",
  "logoUrl": "https://example.com/amazon-logo.png",
  "rating": 4.3,
  "deliveryOptions": ["Standard", "Prime", "Same Day"],
  "returnPolicy": "30 days",
  "trustScore": 95,
  "verified": true
}
```

## Coupon System API

### Search Coupons

Find available coupons for a specific merchant.

**Endpoint**: `GET /api/v1/coupons/search`

**Parameters**:
- `domain` (required, string): Merchant domain (e.g., "amazon.com")

**Response**:
```json
{
  "coupons": [
    {
      "id": "coupon_123",
      "code": "SAVE20",
      "description": "20% off electronics",
      "discountType": "percentage",
      "discountValue": 20,
      "minimumOrder": 100,
      "expiryDate": "2025-12-31T23:59:59Z",
      "verified": true,
      "lastTested": "2025-07-26T08:00:00Z",
      "successRate": 85,
      "usageCount": 1250
    }
  ],
  "merchant": {
    "domain": "amazon.com",
    "name": "Amazon",
    "logoUrl": "https://example.com/amazon-logo.png"
  },
  "totalCoupons": 15
}
```

### Test Coupons

Test multiple coupon codes to find the best savings.

**Endpoint**: `POST /api/v1/coupons/test`

**Request Body**:
```json
{
  "codes": ["SAVE20", "FREESHIP", "WELCOME10"],
  "cartTotal": 150.00,
  "merchant": "amazon.com",
  "currency": "USD"
}
```

**Response**:
```json
{
  "results": [
    {
      "code": "SAVE20",
      "valid": true,
      "savings": 30.00,
      "finalTotal": 120.00,
      "discountType": "percentage",
      "message": "20% discount applied"
    },
    {
      "code": "FREESHIP",
      "valid": true,
      "savings": 9.99,
      "finalTotal": 140.01,
      "discountType": "shipping",
      "message": "Free shipping applied"
    }
  ],
  "bestCoupon": {
    "code": "SAVE20",
    "savings": 30.00,
    "finalTotal": 120.00
  },
  "totalPossibleSavings": 30.00
}
```

### Create Merchant

Add a new merchant to the system.

**Endpoint**: `POST /api/v1/coupons/merchants`

**Request Body**:
```json
{
  "name": "Example Store",
  "domain": "example.com",
  "logoUrl": "https://example.com/logo.png",
  "affiliateNetworkId": "impact_123"
}
```

### Create Coupon

Add a new coupon to the system.

**Endpoint**: `POST /api/v1/coupons`

**Request Body**:
```json
{
  "merchantId": "merchant_123",
  "code": "NEWCODE20",
  "description": "20% off all items",
  "discountType": "percentage",
  "discountValue": 20,
  "minimumOrder": 50,
  "expiryDate": "2025-12-31T23:59:59Z",
  "terms": "Valid on all items except gift cards"
}
```

## AI Service API

### Price Comparison Analysis

Get AI-powered price analysis across multiple platforms.

**Endpoint**: `POST /api/ai/price-comparison`

**Request Body**:
```json
{
  "product_name": "iPhone 15 Pro 256GB",
  "platforms": ["amazon", "walmart", "bestbuy", "target"],
  "include_shipping": true,
  "user_location": {
    "zipCode": "10001",
    "state": "NY"
  }
}
```

**Response**:
```json
{
  "product_name": "iPhone 15 Pro 256GB",
  "product_id": "ai_prod_123",
  "comparisons": [
    {
      "platform": "amazon",
      "base_price": 1199.99,
      "shipping_cost": 0.00,
      "tax_amount": 107.99,
      "total_price": 1307.98,
      "currency": "USD",
      "availability": true,
      "delivery_time": "2-3 days",
      "url": "https://amazon.com/iphone-15-pro",
      "deals": [
        {
          "type": "trade_in",
          "value": 200.00,
          "description": "Trade in your old phone"
        }
      ],
      "confidence": 0.95
    }
  ],
  "best_deal": {
    "platform": "amazon",
    "total_price": 1107.98,
    "savings": 200.00
  },
  "total_savings": 200.00,
  "average_price": 1250.00,
  "price_range": [1107.98, 1399.99],
  "processing_time": 1.25
}
```

### Smart Recommendations

Get AI-powered product recommendations based on user preferences.

**Endpoint**: `POST /api/ai/recommendations`

**Request Body**:
```json
{
  "user_id": "user_123",
  "preferences": {
    "categories": ["electronics", "fashion"],
    "budget_range": [100, 500],
    "brands": ["Apple", "Samsung", "Nike"]
  },
  "recent_searches": ["iPhone case", "wireless headphones"],
  "limit": 10
}
```

### Deal Analysis

Analyze if a deal is genuinely good value.

**Endpoint**: `POST /api/ai/deal-analysis`

**Request Body**:
```json
{
  "product_name": "MacBook Pro 16-inch",
  "current_price": 1599.99,
  "original_price": 1999.99,
  "vendor": "Best Buy",
  "historical_data": true
}
```

## Authentication API

### Login

Authenticate user and receive JWT token.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "preferences": {
      "currency": "USD",
      "notifications": true
    }
  },
  "expiresIn": 3600
}
```

### Register

Create a new user account.

**Endpoint**: `POST /api/auth/register`

### Refresh Token

Get a new access token using refresh token.

**Endpoint**: `POST /api/auth/refresh`

### Logout

Invalidate current session.

**Endpoint**: `POST /api/auth/logout`

## Error Responses

All APIs use consistent error response format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is missing required parameters",
    "details": {
      "missing_fields": ["q"]
    }
  },
  "timestamp": "2025-07-26T10:30:00Z",
  "path": "/api/comparison/search"
}
```

### Common Error Codes

- `INVALID_REQUEST` (400): Bad request or missing parameters
- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Search APIs**: 100 requests per minute per user
- **Comparison APIs**: 50 requests per minute per user
- **AI APIs**: 20 requests per minute per user
- **Auth APIs**: 10 requests per minute per IP

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1627834800
```

## SDKs and Examples

### JavaScript/TypeScript Example

```typescript
import { DealMateAPI } from '@dealmate/sdk';

const api = new DealMateAPI({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

// Search for products
const results = await api.comparison.search({
  query: 'laptop',
  category: 'electronics',
  priceRange: { min: 500, max: 2000 }
});

console.log(results.products);
```

### Python Example

```python
import requests

# Search for products
response = requests.get(
    'http://localhost:3000/api/comparison/search',
    params={
        'q': 'laptop',
        'category': 'electronics',
        'priceMin': 500,
        'priceMax': 2000
    }
)

data = response.json()
print(f"Found {data['totalResults']} products")
```

### cURL Examples

```bash
# Search products
curl "http://localhost:3000/api/comparison/search?q=laptop&category=electronics"

# Test coupons
curl -X POST http://localhost:8000/api/v1/coupons/test \
  -H "Content-Type: application/json" \
  -d '{
    "codes": ["SAVE20", "FREESHIP"],
    "cartTotal": 150.00,
    "merchant": "amazon.com"
  }'

# Get AI price analysis
curl -X POST http://localhost:8001/api/ai/price-comparison \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "iPhone 15 Pro",
    "platforms": ["amazon", "walmart", "bestbuy"]
  }'
```

## Testing

Use the provided test scripts to verify API functionality:

```bash
# Test comparison API
./scripts/test-comparison.sh

# Test coupon system
./scripts/test-coupon-system.sh

# Test all APIs
./scripts/test-all.sh
```

## Support

For API support and questions:

1. Check this documentation first
2. Review the [README.md](../README.md) for setup issues
3. Check logs in the `logs/` directory
4. Run test scripts to verify functionality
5. Contact the development team with specific error messages

---

This documentation is automatically updated as the API evolves. Last updated: July 26, 2025
