# DealPal - AI-Powered Smart Shopping Assistant

[![Lighthouse Performance](https://img.shields.io/badge/Lighthouse-Performance-brightgreen)](https://web.dev/lighthouse/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1-green)](https://www.w3.org/WAI/WCAG21/quickref/)

DealPal is a comprehensive, AI-powered savings platform designed to help users discover and maximize real savings through intelligent deal discovery, offer stacking, and personalized value-based recommendations. The platform operates across three key touchpoints: web application, mobile app, and browser extension.

## 📊 Performance & Quality

Our platform is optimized for excellent user experience with:
- ⚡ **Core Web Vitals**: Optimized for speed and responsiveness
- 🔍 **SEO Optimized**: Meta tags, structured data, and semantic HTML
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 📱 **Progressive Web App**: Offline-capable with service workers
- 🔒 **Security**: Content Security Policy and secure headers

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

   Or with Podman:
   ```bash
   cd scripts
   ./podman-up.sh
   ```

### Architecture Overview

- **Backend**: Rust API server (port 8000) - High performance, memory safe
- **AI Service**: Python service with Gemini AI (port 8001) - Advanced ML capabilities
- **Auth Service**: Node.js authentication service (port 3001) - OAuth2 & JWT
- **Frontend**: Next.js React app (port 3000) - SSR/SSG for optimal performance
- **Database**: PostgreSQL - ACID compliant relational database
- **Cache**: Redis - In-memory data structure store
- **Message Broker**: Apache Kafka - Real-time event streaming platform
- **Stream Processing**: Kafka Streams - Real-time data processing

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
- **Security**: CSRF tokens, API keys, and JWT secrets

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
AUTH_SERVICE_URL=http://localhost:3001

# Security
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Feature Flags
ENABLE_LOCAL_AI=true
ENABLE_CLOUD_AI=true
ENABLE_PYTHON_AI_SERVICE=false
ENABLE_IMAGE_ANALYSIS=true
ENABLE_SENTIMENT_ANALYSIS=true
ENABLE_PRICE_PREDICTION=true

# Performance & Analytics
ENABLE_LIGHTHOUSE_CI=true
GOOGLE_ANALYTICS_ID=your_ga_id_here

# Apache Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_SCHEMA_REGISTRY=http://localhost:8081
KAFKA_TOPICS_DEALS=dealpal.deals
KAFKA_TOPICS_PRICES=dealpal.prices
KAFKA_TOPICS_USER_EVENTS=dealpal.user.events
KAFKA_TOPICS_NOTIFICATIONS=dealpal.notifications
KAFKA_CONSUMER_GROUP=dealpal-consumers
KAFKA_RETENTION_MS=604800000
```

## 🛠️ Development Scripts

All development scripts are located in the `scripts/` folder. Run them from the scripts directory:

```bash
cd scripts
./setup.sh          # Initial project setup
./start.sh          # Start all services  
./stop.sh           # Stop all services
./build.sh          # Build all components
./clean.sh          # Clean build artifacts
./dev.sh            # Development mode
./status.sh         # Check service status
./setup-kafka.sh    # Setup Kafka topics and configuration
./kafka-monitor.sh  # Monitor Kafka topics and consumer lag
```

### Kafka Management Commands

```bash
# Setup Kafka topics for first time
./setup-kafka.sh

# Monitor Kafka in real-time
./kafka-monitor.sh --watch

# View sample messages from topics
./kafka-monitor.sh --samples

# Check Kafka status
./kafka-monitor.sh
```

## 🎯 Core Features

### Real-Time Event Streaming with Apache Kafka
High-throughput, fault-tolerant event streaming for real-time data processing:
- **Deal Events**: Real-time deal discovery and expiration notifications
- **Price Changes**: Instant price update streaming across retailers
- **User Interactions**: Click-stream data and behavioral analytics
- **Inventory Updates**: Stock level changes and availability alerts
- **Offer Activations**: Real-time coupon usage and success tracking

### Global Offer Scanner
Comprehensive deal aggregation across multiple e-commerce platforms with:
- Multi-threaded Rust-based scraper
- Direct API integrations with partner e-commerce sites
- Regional coverage for 15+ countries and currencies
- Real-time updates with 5-minute refresh cycles
- **Kafka Integration**: Stream deals in real-time to all subscribers

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

- **Core Web Vitals**: 
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms  
  - CLS (Cumulative Layout Shift): <0.1
- **API Response Time**: <200ms average
- **System Uptime**: 99.9% availability
- **Product Detection**: ~200-500ms per request
- **Sentiment Analysis**: ~100-300ms for 10 reviews
- **Concurrent Requests**: 100+ requests/second
- **Lighthouse Score**: 90+ across all categories

## 🔒 Security & Privacy

- **Data Encryption**: AES-256 encryption for sensitive data
- **API Security**: Rate limiting, authentication, and authorization
- **Privacy Controls**: GDPR compliance and user data control
- **Secure Communications**: TLS 1.3 for all data transmission
- **Content Security Policy**: XSS and injection attack prevention
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
- **Regular Security Audits**: Quarterly penetration testing

## 🚀 Performance Optimization

### Lighthouse Integration
Run Google Lighthouse audits to ensure optimal performance:

```bash
# Install Lighthouse CLI
npm install -g @lhci/cli

# Run Lighthouse audit on local development
lhci autorun --upload.target=temporary-public-storage

# Run specific audits
lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices,seo,pwa

# Continuous Integration with Lighthouse CI
# Add to your CI/CD pipeline for automated performance monitoring
```

### Performance Features
- **Static Site Generation (SSG)**: Pre-built pages for faster loading
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic bundle splitting for faster initial loads
- **Service Worker**: Offline functionality and caching
- **CDN Ready**: Optimized for content delivery networks
- **Bundle Analysis**: Webpack bundle analyzer for optimization insights

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