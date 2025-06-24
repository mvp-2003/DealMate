# DealPal Platform Testing Guide

This comprehensive guide covers testing all features of the DealPal platform, from basic functionality to advanced AI-powered features.

## Prerequisites

### System Requirements
- **Operating System**: macOS, Linux, or Windows
- **Node.js**: Version 18+ 
- **Python**: Version 3.9+
- **Rust**: Latest stable version
- **PostgreSQL**: Version 14+
- **Redis**: Version 6+

### Environment Setup

1. **Clone and Setup**
   ```bash
   cd /Users/rishabh.das/Desktop/Personal/DealPal
   
   # Install dependencies
   npm install
   cd frontend && npm install && cd ..
   cd backend && cargo build && cd ..
   cd backend/ai-service && pip install -r requirements.txt && cd ../..
   ```

2. **Environment Configuration**
   ```bash
   # All services now use the master .env file at the project root
   # Ensure .env file contains all necessary environment variables:
   # - DATABASE_URL (PostgreSQL connection)
   # - GOOGLE_API_KEY (Gemini API key)
   # - REDIS_URL (Redis connection)
   # - All service configuration variables
   
   # No need for separate .env files in subdirectories
   # All configuration is centralized in the master .env file
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL and Redis
   brew services start postgresql
   brew services start redis
   
   # Run database migrations
   cd backend
   sqlx migrate run
   cd ..
   ```

## Testing Methodology

### 1. Automated Testing

#### Run Complete Test Suite
```bash
# Make the test script executable
chmod +x test_platform.py

# Run all tests
python test_platform.py

# Run specific component tests
python test_platform.py --component backend
python test_platform.py --component ai
python test_platform.py --component detection
python test_platform.py --component stacking
```

#### Expected Test Results
- **Backend Health**: ✅ Service running on port 8000
- **AI Service Health**: ✅ Service running on port 8001, Gemini models loaded
- **Product Detection**: ✅ AI confidence > 0.6, processing time < 2s
- **Deal Stacking**: ✅ StackSmart optimization working, savings calculated
- **Sentiment Analysis**: ✅ Review analysis with positive/negative aspects
- **Price Prediction**: ✅ Trend analysis with confidence scores

### 2. Manual Testing

#### A. Start All Services

1. **Backend Service**
   ```bash
   cd backend
   cargo run
   # Should start on http://localhost:8000
   ```

2. **AI Service**
   ```bash
   cd backend/ai-service
   python main.py
   # Should start on http://localhost:8001
   ```

3. **Frontend Application**
   ```bash
   cd frontend
   npm run dev
   # Should start on http://localhost:3000
   ```

#### B. Browser Extension Testing

1. **Load Extension**
   - Open Chrome/Firefox
   - Go to Extensions page (chrome://extensions/)
   - Enable "Developer mode"
   - Click "Load unpacked" and select `browser-extension` folder

2. **Test Product Detection**
   - Visit supported e-commerce sites:
     - Amazon.in: https://amazon.in/dp/B08N5WRWNW
     - Flipkart: https://flipkart.com/mobiles
     - Myntra: https://myntra.com/casual-shoes
   
   - Expected behavior:
     - Extension icon shows active state
     - Product detection notification appears
     - Deals and offers are highlighted
     - Popup shows detected product info

3. **Test AI Enhancement**
   - Visit complex product pages
   - Check console for AI detection logs
   - Verify confidence scores > 0.6
   - Confirm deal stacking recommendations

### 3. Feature-Specific Testing

#### A. Global Offer Scanner

**Test Cases:**
1. **Multi-Platform Detection**
   ```bash
   # Test different platforms
   curl -X POST http://localhost:8001/detect-product \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://amazon.in/dp/example",
       "page_title": "Product Title",
       "text_content": "Product description with price ₹999"
     }'
   ```

2. **Deal Aggregation**
   - Visit product pages with multiple offers
   - Verify all deal types are detected:
     - Percentage discounts
     - Fixed amount discounts
     - Cashback offers
     - Payment-based deals

**Expected Results:**
- ✅ Detects 5+ different deal types
- ✅ Confidence scores > 0.7
- ✅ Processing time < 3 seconds

#### B. StackSmart Engine

**Test Cases:**
1. **Deal Optimization**
   ```bash
   curl -X POST http://localhost:8001/stack-deals \
     -H "Content-Type: application/json" \
     -d '{
       "deals": [
         {
           "id": "coupon1",
           "title": "10% Off Coupon",
           "deal_type": "coupon",
           "value": 10,
           "value_type": "percentage",
           "stackable": true
         },
         {
           "id": "cashback1", 
           "title": "5% Cashback",
           "deal_type": "cashback",
           "value": 5,
           "value_type": "percentage",
           "stackable": true
         }
       ],
       "base_price": 1000
     }'
   ```

2. **Stack Validation**
   ```bash
   curl -X POST http://localhost:8001/validate-stack \
     -H "Content-Type: application/json" \
     -d '{
       "deals": [...],
       "base_price": 1000
     }'
   ```

**Expected Results:**
- ✅ Optimizes deal combinations
- ✅ Calculates maximum savings
- ✅ Provides application order
- ✅ Identifies incompatible deals

#### C. Real-Time Price Comparison

**Test Cases:**
1. **Multi-Platform Comparison**
   - Test with same product across platforms
   - Verify shipping cost calculations
   - Check tax calculations by region

2. **Price History Tracking**
   - Verify historical data collection
   - Test trend analysis
   - Validate price predictions

**Expected Results:**
- ✅ Compares prices across 5+ platforms
- ✅ Includes shipping and tax calculations
- ✅ Identifies best total value

#### D. AI-Powered Features

**Test Cases:**
1. **Product Detection Accuracy**
   - Test on 20+ different product pages
   - Measure accuracy vs. manual verification
   - Check processing times

2. **Sentiment Analysis**
   ```bash
   curl -X POST http://localhost:8001/analyze-sentiment \
     -H "Content-Type: application/json" \
     -d '{
       "reviews": [
         "Great product, highly recommended!",
         "Poor quality, not worth the money",
         "Average product, works as expected"
       ],
       "product_name": "Test Product"
     }'
   ```

**Expected Results:**
- ✅ Product detection accuracy > 85%
- ✅ Sentiment analysis with clear positive/negative aspects
- ✅ Processing time < 2 seconds

### 4. Performance Testing

#### A. Load Testing

1. **Concurrent Requests**
   ```bash
   # Test AI service under load
   for i in {1..10}; do
     curl -X POST http://localhost:8001/detect-product \
       -H "Content-Type: application/json" \
       -d '{"url":"test","page_title":"test","text_content":"test"}' &
   done
   wait
   ```

2. **Memory Usage**
   - Monitor RAM usage during operation
   - Check for memory leaks
   - Verify garbage collection

**Expected Results:**
- ✅ Handles 10+ concurrent requests
- ✅ Response time < 5 seconds under load
- ✅ Memory usage stable over time

#### B. Browser Extension Performance

1. **Page Load Impact**
   - Measure page load time with/without extension
   - Check CPU usage
   - Monitor network requests

2. **Memory Footprint**
   - Extension memory usage < 50MB
   - No memory leaks over extended use
   - Proper cleanup on page navigation

### 5. Integration Testing

#### A. End-to-End Workflows

1. **Complete User Journey**
   - Install browser extension
   - Visit product page
   - View detected deals
   - Apply deal stacking
   - Check price comparison
   - Add to wishlist
   - Receive price alerts

2. **Cross-Platform Consistency**
   - Test same product across platforms
   - Verify data consistency
   - Check deal availability

**Expected Results:**
- ✅ Seamless user experience
- ✅ Data consistency across platforms
- ✅ All features work together

#### B. API Integration

1. **Backend ↔ AI Service**
   ```bash
   # Test backend calling AI service
   curl -X POST http://localhost:8000/deals/enhance-detection \
     -H "Content-Type: application/json" \
     -d '{
       "product": {"productName": "Test", "price": "₹999"},
       "deals": {"coupons": [], "offers": []}
     }'
   ```

2. **Extension ↔ Backend**
   - Test product detection flow
   - Verify data storage
   - Check real-time updates

### 6. Error Handling Testing

#### A. Service Failures

1. **AI Service Down**
   - Stop AI service
   - Test fallback behavior
   - Verify graceful degradation

2. **Database Connection Issues**
   - Simulate database failures
   - Test error recovery
   - Check data persistence

**Expected Results:**
- ✅ Graceful fallback to rule-based detection
- ✅ User-friendly error messages
- ✅ Service recovery after issues resolved

#### B. Network Issues

1. **Slow Network**
   - Simulate slow connections
   - Test timeout handling
   - Verify retry mechanisms

2. **Intermittent Failures**
   - Test partial failures
   - Check data consistency
   - Verify error reporting

### 7. Security Testing

#### A. Input Validation

1. **Malicious Input**
   ```bash
   # Test XSS prevention
   curl -X POST http://localhost:8001/detect-product \
     -H "Content-Type: application/json" \
     -d '{
       "url": "<script>alert(\"xss\")</script>",
       "text_content": "<?php echo \"test\"; ?>"
     }'
   ```

2. **SQL Injection**
   - Test database queries with malicious input
   - Verify parameterized queries
   - Check input sanitization

**Expected Results:**
- ✅ All inputs properly sanitized
- ✅ No code execution vulnerabilities
- ✅ Database queries protected

#### B. API Security

1. **Rate Limiting**
   ```bash
   # Test rate limits
   for i in {1..100}; do
     curl -X POST http://localhost:8001/detect-product \
       -H "Content-Type: application/json" \
       -d '{"url":"test"}' &
   done
   ```

2. **Authentication**
   - Test API key validation
   - Verify access controls
   - Check session management

## Troubleshooting

### Common Issues

1. **AI Service Not Starting**
   ```bash
   # Check Gemini API key
   echo $GOOGLE_API_KEY
   
   # Verify Python dependencies
   cd backend/ai-service
   pip install -r requirements.txt
   ```

2. **Database Connection Errors**
   ```bash
   # Check PostgreSQL status
   brew services list | grep postgresql
   
   # Verify connection string
   psql $DATABASE_URL
   ```

3. **Extension Not Loading**
   - Check manifest.json syntax
   - Verify permissions
   - Check console for errors

### Performance Issues

1. **Slow AI Processing**
   - Check Gemini API quota
   - Monitor network latency
   - Verify model loading

2. **High Memory Usage**
   - Check for memory leaks
   - Monitor garbage collection
   - Optimize caching

### Debug Commands

```bash
# Check service health
curl http://localhost:8000/health
curl http://localhost:8001/health

# View logs
tail -f backend/logs/app.log
tail -f backend/ai-service/logs/ai.log

# Monitor performance
top -p $(pgrep -f "dealpal")
```

## Success Criteria

### Functional Requirements
- ✅ All automated tests pass (>90% success rate)
- ✅ Manual testing scenarios complete successfully
- ✅ AI detection accuracy >85%
- ✅ Deal stacking optimization working
- ✅ Price comparison across multiple platforms

### Performance Requirements
- ✅ API response time <2 seconds
- ✅ Extension page load impact <500ms
- ✅ Memory usage <100MB per service
- ✅ Handles 50+ concurrent users

### Quality Requirements
- ✅ Error handling graceful
- ✅ Security vulnerabilities addressed
- ✅ User experience smooth and intuitive
- ✅ Data accuracy >95%

## Reporting Issues

When reporting issues, include:
1. **Environment Details**: OS, browser version, service versions
2. **Steps to Reproduce**: Exact steps that cause the issue
3. **Expected vs Actual**: What should happen vs what actually happens
4. **Logs**: Relevant console logs and error messages
5. **Screenshots**: Visual evidence of the issue

## Next Steps

After successful testing:
1. **Production Deployment**: Deploy to staging environment
2. **User Acceptance Testing**: Beta testing with real users
3. **Performance Optimization**: Based on test results
4. **Feature Enhancement**: Add advanced features
5. **Monitoring Setup**: Production monitoring and alerting

This testing guide ensures comprehensive validation of all DealPal platform features and provides a solid foundation for production deployment.