# DealPal Python AI Service

A FastAPI-based microservice that provides advanced AI capabilities for the DealPal ecosystem.

## Features

### 🧠 Advanced Product Detection
- **Multi-modal Analysis**: Text, images, and structured data
- **LLM Enhancement**: OpenAI GPT integration for complex pages
- **Confidence Scoring**: Probabilistic product page detection
- **Fallback Support**: Works with browser extension's local AI

### 📊 Sentiment Analysis
- **Review Analysis**: Multi-review sentiment classification
- **Aspect Extraction**: Positive/negative feature identification
- **Summary Generation**: LLM-powered review summarization
- **Confidence Metrics**: Sentiment strength scoring

### 📈 Price Intelligence
- **Trend Prediction**: Historical price analysis
- **Category Insights**: Product category-specific trends
- **Recommendations**: Buy/wait recommendations
- **Forecasting**: Multi-timeframe price predictions

### 🎯 Future-Ready Architecture
- **Scalable Design**: Horizontal scaling support
- **Model Flexibility**: Easy to swap/upgrade AI models
- **API-First**: RESTful API for integration
- **Performance Optimized**: Async processing and caching

## Quick Start

### 1. Installation

```bash
cd backend/ai-service
pip install -r requirements.txt
```

### 2. Environment Setup

Create `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
POSTGRES_URL=postgresql://user:pass@localhost/dealpal
REDIS_URL=redis://localhost:6379
LOG_LEVEL=INFO
```

### 3. Run the Service

```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Test the API

Visit: http://localhost:8001/docs for interactive API documentation

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and loaded models.

### Product Detection
```
POST /detect-product
```
Advanced product page analysis using multiple AI techniques.

**Request Body:**
```json
{
  "url": "https://amazon.com/product/...",
  "page_title": "Product Title",
  "text_content": "Page text content...",
  "structured_data": {...},
  "images": ["base64_image1", "base64_image2"],
  "local_ai_result": {...}
}
```

**Response:**
```json
{
  "is_product_page": true,
  "confidence": 0.92,
  "source": "python-ai-combined",
  "product": {...},
  "analysis": {...},
  "processing_time": 0.45
}
```

### Sentiment Analysis
```
POST /analyze-sentiment
```
Analyze product reviews for sentiment and insights.

**Request Body:**
```json
{
  "reviews": ["Great product!", "Not worth it..."],
  "product_name": "Product Name"
}
```

**Response:**
```json
{
  "overall_sentiment": "positive",
  "sentiment_score": 0.7,
  "review_summary": "Customers generally like...",
  "positive_aspects": ["quality", "design"],
  "negative_aspects": ["price", "shipping"]
}
```

### Price Prediction
```
POST /predict-price
```
Predict price trends and provide recommendations.

**Request Body:**
```json
{
  "product_name": "Product Name",
  "current_price": 299.99,
  "category": "electronics",
  "historical_prices": [...]
}
```

**Response:**
```json
{
  "predicted_price_trend": "decreasing",
  "confidence": 0.8,
  "price_forecast": {
    "1_week": 289.99,
    "1_month": 279.99,
    "3_months": 269.99
  },
  "recommendation": "Wait for better deals"
}
```

## Integration

### Browser Extension Integration

The browser extension can call this service for enhanced detection:

```javascript
// In browser extension
async function enhanceWithPythonAI(localResult, pageContent) {
  try {
    const response = await fetch('http://localhost:8001/detect-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: window.location.href,
        page_title: document.title,
        text_content: pageContent.textContent,
        structured_data: pageContent.structuredData,
        local_ai_result: localResult
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Python AI enhancement failed:', error);
    return localResult; // Fallback to local result
  }
}
```

### Backend Integration

The Rust backend can proxy requests to the Python AI service:

```rust
// In Rust backend
async fn enhance_product_detection(
    product_data: ProductDetectionRequest
) -> Result<EnhancedProductResult, Error> {
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:8001/detect-product")
        .json(&product_data)
        .send()
        .await?;
    
    let ai_result: ProductDetectionResponse = response.json().await?;
    Ok(ai_result.into())
}
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Browser         │    │ Rust Backend    │    │ Python AI       │
│ Extension       │◄──►│ (Axum)          │◄──►│ Service         │
│                 │    │                 │    │ (FastAPI)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        ▼
        │                        │              ┌─────────────────┐
        │                        │              │ AI Models       │
        │                        │              │ - Transformers  │
        │                        │              │ - OpenAI GPT    │
        │                        │              │ - Computer      │
        │                        │              │   Vision        │
        └────────────────────────┼──────────────┤ - Embeddings    │
                                 │              └─────────────────┘
                                 ▼
                       ┌─────────────────┐
                       │ PostgreSQL      │
                       │ Database        │
                       └─────────────────┘
```

## Models & Capabilities

### Currently Loaded Models

1. **Sentiment Analysis**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
2. **Text Classification**: `facebook/bart-large-mnli`
3. **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2`
4. **LLM Integration**: OpenAI GPT-3.5/GPT-4 (when API key provided)

### Future Model Integration

- **Computer Vision**: Product image classification
- **OCR**: Text extraction from product images
- **Custom Models**: Fine-tuned for e-commerce specific tasks
- **Local LLMs**: Privacy-focused local language models

## Performance

### Benchmarks (Expected)
- **Product Detection**: ~200-500ms per request
- **Sentiment Analysis**: ~100-300ms for 10 reviews
- **Price Prediction**: ~50-100ms per request
- **Concurrent Requests**: 100+ requests/second

### Optimization Features
- **Model Caching**: Keep models in memory
- **Result Caching**: Cache API responses
- **Batch Processing**: Process multiple requests together
- **Async Processing**: Non-blocking request handling

## Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Docker Compose Integration

Add to main `docker-compose.yml`:

```yaml
services:
  # ... existing services ...
  
  ai-service:
    build: ./backend/ai-service
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - POSTGRES_URL=${DATABASE_URL}
    depends_on:
      - db
    volumes:
      - ./backend/ai-service:/app
```

## Monitoring & Logging

The service includes comprehensive logging and monitoring:

- **Request/Response Logging**: All API calls tracked
- **Performance Metrics**: Processing time monitoring
- **Error Tracking**: Detailed error reporting
- **Model Performance**: Accuracy and confidence tracking

## Security

- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Pydantic model validation
- **Data Privacy**: Option for local-only processing
- **API Key Management**: Secure credential handling

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Include docstrings for public methods
4. Add tests for new features
5. Update this README for new endpoints

## License

Part of the DealPal project - see main project license.
