# DealMate Testing Guide

This guide provides comprehensive testing procedures for all DealMate features and components.

## Testing Overview

DealMate uses a multi-layered testing approach:

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Service-to-service communication testing
- **End-to-End Tests**: Complete user workflow testing
- **Performance Tests**: Load testing and optimization validation
- **Security Tests**: Vulnerability scanning and penetration testing

## Quick Test Commands

### Run All Tests
```bash
# Run complete test suite
./scripts/test-all.sh

# Run specific feature tests
./scripts/test-comparison.sh
./scripts/test-coupon-system.sh
./scripts/test-auth0.sh
```

### Service-Specific Tests
```bash
# Frontend tests
cd frontend && npm test

# Backend tests (Rust)
cd backend && cargo test

# AI Service tests (Python)
cd backend/ai-service && python -m pytest

# Integration tests
python tests/integration_tests.py
```

## 1. Product Comparison Feature Testing

### 1.1 Automated Testing

Run the comparison test suite:
```bash
./scripts/test-comparison.sh
```

This script tests:
- ✅ Categories API endpoint
- ✅ Search suggestions API
- ✅ Product search with various filters
- ✅ Frontend accessibility
- ✅ Response time performance

### 1.2 Manual Testing Checklist

#### Basic Search Functionality
- [ ] Navigate to `http://localhost:3000/compare`
- [ ] Search for "laptop" - should return results
- [ ] Search for "iPhone" - should return results
- [ ] Search for "headphones" - should return results
- [ ] Empty search should show categories and suggestions

#### Advanced Filtering
- [ ] **Price Range Filter**:
  - Set min price: $100, max price: $500
  - Verify results are within range
  - Test edge cases (min > max)

- [ ] **Vendor Filter**:
  - Select specific vendors (Amazon, Walmart)
  - Verify results only show selected vendors
  - Test multiple vendor selection

- [ ] **Rating Filter**:
  - Set minimum rating to 4.0
  - Verify all results have rating >= 4.0

- [ ] **Stock Filter**:
  - Enable "In Stock Only"
  - Verify all results show as in stock

#### Sorting Options
- [ ] **Sort by Price** (ascending/descending)
- [ ] **Sort by Rating** (ascending/descending)
- [ ] **Sort by Name** (A-Z, Z-A)
- [ ] **Sort by Discount** (highest first)

#### Display Options
- [ ] **Grid View**: Products displayed in grid layout
- [ ] **List View**: Products displayed in list layout
- [ ] **Toggle between views**: Should maintain search results

#### Category Browsing
- [ ] Click on category badges (Electronics, Fashion, etc.)
- [ ] Verify category-specific results
- [ ] Test category + search term combination

#### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify all elements are accessible and usable

### 1.3 Performance Testing

#### Load Testing
```bash
# Test search endpoint performance
ab -n 1000 -c 10 "http://localhost:3000/api/comparison/search?q=laptop"

# Test categories endpoint
ab -n 500 -c 5 "http://localhost:3000/api/comparison/categories"
```

#### Expected Performance Metrics
- **Search Response Time**: < 500ms
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms
- **Concurrent Users**: 100+ without degradation

### 1.4 API Testing

#### Using cURL
```bash
# Basic search
curl "http://localhost:3000/api/comparison/search?q=laptop"

# Search with filters
curl "http://localhost:3000/api/comparison/search?q=smartphone&priceMin=200&priceMax=800&sortBy=price&sortOrder=asc"

# Categories
curl "http://localhost:3000/api/comparison/categories"

# Suggestions
curl "http://localhost:3000/api/comparison/suggestions?q=iph"
```

#### Using Postman/Insomnia
Import the API collection:
```json
{
  "name": "DealMate Comparison API",
  "requests": [
    {
      "name": "Search Products",
      "method": "GET",
      "url": "{{base_url}}/api/comparison/search",
      "params": [
        {"key": "q", "value": "laptop"},
        {"key": "category", "value": "electronics"},
        {"key": "priceMin", "value": "500"},
        {"key": "priceMax", "value": "2000"}
      ]
    }
  ]
}
```

## 2. Coupon System Testing

### 2.1 Automated Testing

```bash
./scripts/test-coupon-system.sh
```

### 2.2 Manual Testing

#### Backend API Testing
```bash
# Search for coupons
curl "http://localhost:8000/api/v1/coupons/search?domain=amazon.com"

# Test coupons
curl -X POST http://localhost:8000/api/v1/coupons/test \
  -H "Content-Type: application/json" \
  -d '{
    "codes": ["SAVE20", "FREESHIP"],
    "cartTotal": 150.00,
    "merchant": "amazon.com"
  }'
```

#### Browser Extension Testing
1. Install the browser extension (load unpacked from `browser-extension/`)
2. Navigate to a supported e-commerce site
3. Add items to cart and proceed to checkout
4. Extension should automatically detect and test coupons
5. Verify best coupon is applied

#### Database Testing
```bash
# Check database connectivity
./scripts/verify_db.sh

# Run database migrations
./scripts/migrate.sh
```

## 3. AI Service Testing

### 3.1 Price Comparison AI

```bash
# Test AI price comparison
curl -X POST http://localhost:8001/api/ai/price-comparison \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "iPhone 15 Pro",
    "platforms": ["amazon", "walmart", "bestbuy"]
  }'
```

#### Expected Response Structure
```json
{
  "product_name": "iPhone 15 Pro",
  "comparisons": [...],
  "best_deal": {...},
  "total_savings": 150.00,
  "processing_time": 1.25
}
```

### 3.2 AI Recommendations

```bash
# Test recommendation engine
curl -X POST http://localhost:8001/api/ai/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "preferences": {
      "categories": ["electronics"],
      "budget_range": [100, 500]
    }
  }'
```

## 4. Authentication Testing

### 4.1 Auth0 Integration

```bash
./scripts/test-auth0.sh
```

### 4.2 Manual Auth Testing

1. Navigate to login page
2. Test login with valid credentials
3. Test login with invalid credentials
4. Test token refresh
5. Test logout functionality
6. Test protected routes

## 5. Integration Testing

### 5.1 Service Communication

```bash
# Test all service endpoints
python tests/integration_tests.py
```

### 5.2 Database Integration

```bash
# Test database connectivity
./scripts/test-local-db.sh

# Verify data integrity
./scripts/verify_db.sh
```

### 5.3 Cross-Service Testing

Test complete user workflows:

1. **Product Search Flow**:
   - User searches for product
   - Results fetched from comparison API
   - AI service analyzes prices
   - Results displayed with recommendations

2. **Coupon Discovery Flow**:
   - User visits e-commerce site
   - Extension detects checkout page
   - Coupons fetched from backend
   - Best coupon automatically applied

## 6. Performance Testing

### 6.1 Lighthouse Testing

```bash
# Run Lighthouse performance audit
./scripts/lighthouse-audit.sh

# Run Lighthouse CI
npm run lighthouse:ci
```

#### Performance Targets
- **Performance Score**: > 90
- **Accessibility Score**: > 95
- **Best Practices Score**: > 90
- **SEO Score**: > 90

### 6.2 Load Testing

```bash
# Frontend load testing
ab -n 1000 -c 50 "http://localhost:3000/"

# API load testing
ab -n 500 -c 25 "http://localhost:3000/api/comparison/search?q=laptop"

# Backend load testing
ab -n 1000 -c 100 "http://localhost:8000/health"
```

### 6.3 Memory and Resource Testing

Monitor resource usage during testing:
```bash
# Monitor system resources
htop

# Monitor Docker container resources
docker stats

# Memory leak detection
valgrind --tool=memcheck ./target/release/dealpal-backend
```

## 7. Security Testing

### 7.1 Vulnerability Scanning

```bash
# Frontend security audit
cd frontend && npm audit

# Rust security audit
cd backend && cargo audit

# Python dependency check
cd backend/ai-service && safety check
```

### 7.2 Authentication Security

- [ ] Test JWT token expiration
- [ ] Test token refresh mechanism
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test input validation

### 7.3 API Security

- [ ] Test SQL injection protection
- [ ] Test XSS protection
- [ ] Test CORS configuration
- [ ] Test API rate limiting
- [ ] Test input sanitization

## 8. Browser Extension Testing

### 8.1 Manual Testing

1. **Installation**:
   - Load extension in Chrome/Firefox
   - Verify all permissions are granted
   - Check extension icon appears

2. **Functionality**:
   - Visit supported e-commerce sites
   - Add items to cart
   - Proceed to checkout
   - Verify coupon auto-detection
   - Test manual coupon search

3. **Cross-Browser Testing**:
   - Test in Chrome
   - Test in Firefox
   - Test in Edge (Chromium)

### 8.2 Automated Extension Testing

```bash
# Run extension tests
cd browser-extension
npm test

# Test with Selenium
python tests/test_browser_extension.py
```

## 9. Error Handling Testing

### 9.1 Network Failures

- [ ] Test API failures
- [ ] Test network timeouts
- [ ] Test partial service failures
- [ ] Test graceful degradation

### 9.2 Invalid Input Testing

- [ ] Test malformed API requests
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts
- [ ] Test buffer overflow attempts

### 9.3 Rate Limiting

- [ ] Test API rate limits
- [ ] Test graceful rate limit handling
- [ ] Test rate limit recovery

## 10. Continuous Integration Testing

### 10.1 GitHub Actions

Our CI pipeline runs:
- Unit tests for all services
- Integration tests
- Security scans
- Performance benchmarks
- Lighthouse audits

### 10.2 Local CI Testing

```bash
# Simulate CI environment locally
act -j test

# Run pre-commit hooks
pre-commit run --all-files
```

## 11. Testing Data and Environment

### 11.1 Test Data

Use the following test data for consistent results:

#### Search Terms
- "laptop" - should return 20+ results
- "iPhone 15" - should return 10+ results
- "nonexistent product xyz" - should return 0 results

#### Coupon Codes (for testing)
- "SAVE20" - 20% discount
- "FREESHIP" - free shipping
- "INVALID123" - invalid coupon

### 11.2 Test Environment Setup

```bash
# Setup test environment
export NODE_ENV=test
export DATABASE_URL=postgresql://test:test@localhost/dealpal_test

# Initialize test database
./scripts/setup-test-db.sh

# Run tests
npm run test:all
```

## 12. Troubleshooting Common Issues

### 12.1 Service Not Starting

```bash
# Check port availability
lsof -i :3000
lsof -i :8000
lsof -i :8001

# Check service logs
tail -f logs/frontend.log
tail -f logs/backend.log
tail -f logs/ai-service.log
```

### 12.2 Database Connection Issues

```bash
# Test database connection
psql -h localhost -U dealpal -d dealpal_dev

# Check database status
./scripts/status_check.sh
```

### 12.3 API Response Issues

```bash
# Check API health
curl http://localhost:8000/health
curl http://localhost:8001/health

# Verify environment variables
./scripts/verify_env.sh
```

## 13. Test Reporting

### 13.1 Coverage Reports

```bash
# Frontend coverage
cd frontend && npm run test:coverage

# Backend coverage
cd backend && cargo tarpaulin

# AI service coverage
cd backend/ai-service && pytest --cov=.
```

### 13.2 Performance Reports

```bash
# Generate performance report
./scripts/performance-report.sh

# Lighthouse report
lighthouse http://localhost:3000 --output html --output-path=./reports/lighthouse.html
```

## 14. Best Practices

### 14.1 Test-Driven Development

1. Write tests before implementing features
2. Use descriptive test names
3. Test both success and failure cases
4. Mock external dependencies
5. Keep tests fast and isolated

### 14.2 Continuous Testing

1. Run tests on every commit
2. Use pre-commit hooks
3. Monitor test coverage
4. Fix flaky tests immediately
5. Update tests with feature changes

### 14.3 Documentation

1. Document test procedures
2. Keep test data current
3. Update testing guide regularly
4. Share testing knowledge
5. Document known issues

---

This testing guide ensures comprehensive coverage of all DealMate features and helps maintain high quality and reliability across the platform.

**Last Updated**: July 26, 2025  
**Next Review**: August 26, 2025
