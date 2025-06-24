# DealPal - Environment Configuration

## Master Environment File

All environment variables are now centralized in the root `.env` file. This file contains configuration for:

- **Database**: PostgreSQL connection
- **AI Services**: Gemini API keys and models
- **Service URLs**: Backend and AI service endpoints
- **Feature Flags**: Enable/disable various features
- **Performance**: Rate limiting and caching settings

## Setup Instructions

1. **Copy the master environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update your API keys and settings in `.env`**

3. **Each service will automatically load from the master `.env` file:**
   - Rust Backend: Loads from `../.env` then local `.env`
   - Python AI Service: Loads from `../../.env` then local `.env`
   - Browser Extension: Uses `config.js` with values from master `.env`

## Environment Variables

### Database
- `DATABASE_URL`: PostgreSQL connection string

### AI Configuration
- `GOOGLE_API_KEY`: Google Gemini API key
- `GEMINI_MODEL`: Model version to use
- `GEMINI_MAX_TOKENS`: Maximum tokens per request

### Service URLs
- `RUST_BACKEND_URL`: Rust backend service URL
- `PYTHON_AI_SERVICE_URL`: Python AI service URL

### Feature Flags
- `ENABLE_LOCAL_AI`: Enable local AI processing
- `ENABLE_CLOUD_AI`: Enable cloud AI services
- `ENABLE_PYTHON_AI_SERVICE`: Enable Python AI service
- `ENABLE_IMAGE_ANALYSIS`: Enable image analysis features
- `ENABLE_SENTIMENT_ANALYSIS`: Enable sentiment analysis
- `ENABLE_PRICE_PREDICTION`: Enable price prediction

### Performance
- `RATE_LIMIT_REQUESTS_PER_MINUTE`: API rate limiting
- `MAX_WORKERS`: Maximum worker threads
- `REQUEST_TIMEOUT`: Request timeout in seconds

### Debug
- `DEBUG`: Enable debug mode
- `LOG_LEVEL`: Logging level (INFO, DEBUG, ERROR)

## Migration from Individual .env Files

The individual `.env` files in each service directory are now optional and will be used as fallbacks if the master `.env` file is not found.