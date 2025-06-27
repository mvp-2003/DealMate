# DealPal - AI-Powered Smart Shopping Assistant

DealPal is a comprehensive, AI-powered savings platform designed to help users discover and maximize real savings through intelligent deal discovery, offer stacking, and personalized value-based recommendations. The platform operates across three key touchpoints: web application, mobile app, and browser extension.

## 🚀 Quick Start

### For New Developers

Welcome to DealPal! This guide will help you get started quickly.

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd DealPal
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in required API keys (Google API key for AI service)

3. **Start Development**
   ```bash
   cd scripts
   ./dev.sh
   ```
   
   Or with Docker:
   ```bash
   docker-compose up --build
   ```

### Architecture Overview

- **Backend**: Rust API server (port 8000)
- **AI Service**: Python service with Gemini AI (port 8001)
- **Frontend**: Next.js React app (port 3000)
- **Database**: PostgreSQL
- **Cache**: Redis

## 🏗️ Project Structure

```
DealPal/
├── frontend/                 # Next.js React application
├── backend/
│   └── ai-service/          # Python FastAPI AI service
├── browser-extension/       # Chrome/Firefox extension
├── scripts/                 # Shell scripts for development
└── docs/                   # Documentation
```

## 📱 Platform Components

### Frontend (Next.js App)

The Next.js frontend provides the main web interface for DealPal. It's a modern React application built with TypeScript and Tailwind CSS.

**Key Features:**
- Comprehensive dashboard for deal management
- Advanced search and filtering capabilities
- Analytics and reporting for savings tracking
- User account management and preferences

**Getting Started:**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Backend AI Service (Python FastAPI)

A FastAPI-based microservice that provides advanced AI capabilities for the DealPal ecosystem.

**🧠 Features:**
- **Advanced Product Detection**: Multi-modal analysis with text, images, and structured data
- **Sentiment Analysis**: Review analysis with aspect extraction and summary generation
- **Price Intelligence**: Trend prediction and buy/wait recommendations
- **LLM Enhancement**: OpenAI GPT integration for complex pages

**Quick Start:**
```bash
cd backend/ai-service
pip install -r requirements.txt
python main.py
```

**API Endpoints:**
- `GET /health` - Service status and loaded models
- `POST /detect-product` - Advanced product page analysis
- `POST /analyze-sentiment` - Product review sentiment analysis
- `POST /predict-price` - Price trend predictions

Visit `http://localhost:8001/docs` for interactive API documentation.

### Browser Extension

Chrome/Firefox extension for seamless shopping assistance with AI-powered product detection.

**Features:**
- Automatic product page detection
- One-click coupon application
- Real-time price comparison overlay
- Deal notifications and quick access popup

**Installation:**
1. Load the extension in Chrome developer mode
2. Navigate to any e-commerce site
3. The extension will automatically detect products and show deals

**Icons Setup:**
The extension requires icons in the `browser-extension/images/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create simple colored squares as PNG files or use any existing icons as placeholders.

## 🔧 Environment Configuration

All environment variables are centralized in the root `.env` file containing configuration for:

- **Database**: PostgreSQL connection
- **AI Services**: Gemini API keys and models
- **Service URLs**: Backend and AI service endpoints
- **Feature Flags**: Enable/disable various features
- **Performance**: Rate limiting and caching settings

### Key Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/dealpal

# AI Configuration
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=5000

# Service URLs
RUST_BACKEND_URL=http://localhost:8000
PYTHON_AI_SERVICE_URL=http://localhost:8001

# Feature Flags
ENABLE_LOCAL_AI=true
ENABLE_CLOUD_AI=true
ENABLE_PYTHON_AI_SERVICE=false
ENABLE_IMAGE_ANALYSIS=true
ENABLE_SENTIMENT_ANALYSIS=true
ENABLE_PRICE_PREDICTION=true
```

## 🛠️ Development Scripts

All development scripts are located in the `scripts/` folder. Run them from the scripts directory:

```bash
cd scripts
./setup.sh     # Initial project setup
./start.sh     # Start all services
./stop.sh      # Stop all services
./build.sh     # Build all components
./clean.sh     # Clean build artifacts
./dev.sh       # Development mode
./status.sh    # Check service status
```

## 🎯 Core Features

### Global Offer Scanner
Comprehensive deal aggregation across multiple e-commerce platforms with:
- Multi-threaded Rust-based scraper
- Direct API integrations with partner e-commerce sites
- Regional coverage for 15+ countries and currencies
- Real-time updates with 5-minute refresh cycles

### StackSmart Engine
Intelligent combination of multiple offers for maximum savings:
- Offer compatibility matrix with predefined stacking rules
- Application sequence optimization for maximum savings
- Real-time validation of coupon codes and offers
- Smart recommendations to reach bonus thresholds

### Real-Time Price Comparison
Comprehensive price analysis across retailers:
- Base product price comparison
- Shipping costs and delivery speed options
- Import duties for international purchases
- Tax implications (GST, VAT, local taxes)
- Final checkout price with all fees and discounts

### AI-Powered Features
- **Computer Vision**: Product image recognition and categorization
- **Natural Language Processing**: Product description analysis
- **Pattern Recognition**: E-commerce page structure detection
- **Personalization Engine**: Shopping pattern recognition and recommendations

## 🚀 Deployment

### Docker Deployment

```bash
docker-compose up --build
```

### Individual Services

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**AI Service:**
```bash
cd backend/ai-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

## 📊 Performance Metrics

- **API Response Time**: <200ms average
- **System Uptime**: 99.9% availability
- **Product Detection**: ~200-500ms per request
- **Sentiment Analysis**: ~100-300ms for 10 reviews
- **Concurrent Requests**: 100+ requests/second

## 🔒 Security & Privacy

- **Data Encryption**: AES-256 encryption for sensitive data
- **API Security**: Rate limiting, authentication, and authorization
- **Privacy Controls**: GDPR compliance and user data control
- **Secure Communications**: TLS 1.3 for all data transmission

## 🤝 Contributing

1. Follow coding standards for each platform (PEP 8 for Python, Rust conventions)
2. Add type hints and documentation
3. Include tests for new features
4. Update documentation for new endpoints/features

## 📄 Documentation

- `PRODUCT_FEATURE_SPECIFICATION.md` - Complete feature specifications and technical architecture
- `NEW_DEVS.md` - Quick start guide for new developers

## 📞 Need Help?

- Check existing documentation
- Review the codebase structure
- Ask team members for guidance
- Visit API documentation at `http://localhost:8001/docs`

---

DealPal combines cutting-edge AI technology with practical user value to revolutionize how consumers discover and maximize savings opportunities across all shopping platforms.