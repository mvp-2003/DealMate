# DealMate - AI-Powered Smart Shopping Assistant

[![Lighthouse Performance](https://img.shields.io/badge/Lighthouse-Performance-brightgreen)](https://web.dev/lighthouse/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1-green)](https://www.w3.org/WAI/WCAG21/quickref/)

DealMate is a comprehensive, AI-powered savings platform designed to help users discover and maximize real savings through intelligent deal discovery, product comparison, offer stacking, and personalized value-based recommendations. The platform operates across three key touchpoints: web application, mobile app, and browser extension.

## 📊 Performance & Quality

Our platform is optimized for excellent user experience with:
- ⚡ **Core Web Vitals**: Optimized for speed and responsiveness
- 🔍 **SEO Optimized**: Meta tags, structured data, and semantic HTML
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 📱 **Progressive Web App**: Offline-capable with service workers
- 🔒 **Security**: Content Security Policy and secure headers

## 🚀 Quick Start

DealMate uses Docker/Podman for containerization, ensuring consistent development environments across different operating systems and architectures.

### Supported Platforms

Our containers support the following platforms:
- **Operating Systems**: Linux, macOS, Windows (via Docker Desktop)
- **Architectures**: amd64 (x86_64), arm64 (Apple Silicon, ARM servers)

### Prerequisites

#### System Requirements
- **RAM**: Minimum 4GB, recommended 8GB+
- **Disk Space**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

#### Software Requirements

Choose one of the following container runtimes:

**Option 1: Docker**
- **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/)
- **macOS**: [Install Docker Desktop](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: [Install Docker Desktop](https://docs.docker.com/desktop/install/windows-install/)

**Option 2: Podman (Linux/macOS)**
- **Linux**: [Install Podman](https://podman.io/getting-started/installation#linux-distributions)
- **macOS**: [Install Podman Desktop](https://podman-desktop.io/docs/installation/macos-install)

### Getting Started

#### 1. Clone the Repository
```bash
git clone https://github.com/mvp-2003/DealMate.git
cd DealMate
```

#### 2. One-Command Setup and Run
```bash
# Automatic deployment (defaults to native)
./run_app.sh

# Force containerized deployment
./run_app.sh --docker
./run_app.sh --containerized
./run_app.sh -c

# Force native deployment (default behavior)
./run_app.sh --native
./run_app.sh -n
```

**The `run_app.sh` script automatically:**
- Defaults to native deployment for faster development
- Can be forced to containerized mode with `-c` flag
- Runs `docker-setup.sh` if containerized mode is requested
- Prompts for API key configuration
- Starts all services
- Provides health checks
- Shows access URLs and management commands

#### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **AI Service**: http://localhost:8001
- **Auth Service**: http://localhost:3001

Development tools (when using `make up-dev`):
- **Adminer (DB GUI)**: http://localhost:8082
- **Redis Commander**: http://localhost:8081

### For New Developers

Welcome to DealMate! For a complete development setup:

1. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in required API keys (Google API key for AI service)

2. **Development Scripts**
   ```bash
   cd scripts
   ./dev.sh            # Development mode
   ./setup.sh          # Initial project setup (native only)
   ./start.sh          # Start all services  
   ./stop.sh           # Stop all services
   ./build.sh          # Build all components
   ./status.sh         # Check service status
   ```

### Deployment Modes Comparison

| Feature | Native Development (Default) | Containerized (Docker) |
|---------|------------------------------|----------------------|
| **Setup Time** | Faster setup | Slower initial setup |
| **Consistency** | ⚠️ Varies by system | ✅ Identical across all systems |
| **Isolation** | ❌ Uses system dependencies | ✅ Fully isolated environment |
| **Resource Usage** | Lower (direct execution) | Higher (containers overhead) |
| **Development Speed** | Faster (direct access) | Moderate (container overhead) |
| **Team Collaboration** | ⚠️ "Works on my machine" issues | ✅ Same environment for everyone |
| **Cleanup** | Manual dependency removal | ✅ Easy (`make clean`) |
| **Production Parity** | ⚠️ Different from production | ✅ Same as production |

### Script Comparison

#### `run_app.sh` (Unified Application Launcher)
- **Purpose**: Single entry point to run DealMate in any environment
- **Deployment modes**: Defaults to native development for speed
- **Usage Examples:**
  ```bash
  ./run_app.sh                    # Native development (default)
  ./run_app.sh --docker          # Force containerized
  ./run_app.sh -c                # Force containerized (short)
  ./run_app.sh --native          # Force native (explicit)
  ./run_app.sh -n                # Force native (short)
  ./run_app.sh --help            # Show help
  ```

#### `scripts/docker-setup.sh` (Containerized Environment Setup)
- **Purpose**: One-time setup for Docker/Podman environment
- **What it does**:
  - Validates system requirements and container runtime
  - Creates `.env` file with secure passwords
  - Builds/pulls Docker images
  - Initializes containerized database

*Note: This script is automatically called by `run_app.sh` when needed.*

#### `scripts/setup.sh` (Native Environment Setup)
- **Purpose**: One-time setup for native development environment
- **What it does**:
  - Installs language runtimes (Rust, Node.js, Python)
  - Installs system dependencies and package managers
  - Sets up local database (PostgreSQL)

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
DealMate/
├── frontend/                 # Next.js React application
├── backend/
│   └── ai-service/          # Python FastAPI AI service
├── browser-extension/       # Chrome/Firefox extension
├── scripts/                 # Shell scripts for development
└── docs/                   # Documentation
```

## 🐳 Containerized Architecture

DealMate uses a single master Dockerfile with multi-stage builds for all services, simplifying maintenance and ensuring consistency across environments.

### Container Services

1. **Frontend** (`frontend`)
   - Next.js application
   - Port: 3000
   - Built with Node.js 20
   - Target: `frontend-runtime`

2. **Backend** (`backend`)
   - Rust (Axum) API server
   - Port: 8000
   - Built with Rust 1.79
   - Target: `backend-runtime`

3. **AI Service** (`ai-service`)
   - Python FastAPI service
   - Port: 8001
   - Built with Python 3.12
   - Target: `ai-runtime`

4. **Auth Service** (`auth-service`)
   - Node.js authentication service
   - Port: 3001
   - Integrates with Auth0
   - Target: `auth-runtime`

5. **Database** (`db`)
   - PostgreSQL 16
   - Port: 5432
   - Persistent volume for data

6. **Cache** (`redis`)
   - Redis 7
   - Port: 6379
   - Used for caching and sessions

### Common Container Commands

#### Using Make (Recommended)

```bash
# Show all available commands
make help

# Build services
make build              # Build all services
make build-nocache     # Build without cache

# Start/Stop services
make up                # Start core services
make up-dev           # Start with dev tools
make up-full          # Start with Kafka
make down             # Stop services
make restart          # Restart services

# Logs and debugging
make logs             # View all logs
make logs-backend     # View backend logs
make logs-frontend    # View frontend logs
make logs-ai         # View AI service logs

# Access containers
make exec-backend    # Backend shell
make exec-frontend   # Frontend shell
make exec-ai        # AI service shell
make exec-db        # Database shell

# Testing and maintenance
make test           # Run all tests
make health         # Check service health
make backup-db      # Backup database
make clean          # Clean everything
```

#### Using Docker Compose Directly

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild a specific service
docker compose build backend

# Run commands in containers
docker compose exec backend cargo test
docker compose exec frontend npm run lint
```

### Development Workflow

#### Making Code Changes
The containers mount your local code directories, so changes are reflected immediately:
- **Frontend**: Hot reload enabled
- **Backend**: Rebuild required (`make restart`)
- **AI Service**: Auto-reload enabled

#### Database Migrations
```bash
# Create a new migration
docker compose exec backend sqlx migrate add migration_name

# Run migrations
make migrate

# Revert last migration
docker compose exec backend sqlx migrate revert
```

#### Running Tests
```bash
# Run all tests
make test

# Run specific service tests
make test-backend
make test-frontend
make test-ai

# Run tests with coverage
docker compose exec backend cargo tarpaulin
docker compose exec frontend npm run test:coverage
```

### Troubleshooting

#### Port Conflicts
If you get port already in use errors:
```bash
# Check what's using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change ports in .env file
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

#### Permission Issues (Linux)
If you encounter permission issues:
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or:
newgrp docker
```

#### Build Failures
```bash
# Clean and rebuild
make clean
make build-nocache

# Check Docker daemon
docker info

# Increase Docker resources (Docker Desktop)
# Preferences > Resources > Increase CPU/Memory
```

#### Database Connection Issues
```bash
# Check if database is running
docker compose ps db

# Check database logs
docker compose logs db

# Restart database
docker compose restart db

# Reset database (WARNING: destroys data)
make down-volumes
make up
make migrate
```

#### Out of Disk Space
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Check disk usage
docker system df
```

## 📱 Platform Components

### Frontend (Next.js App)

The Next.js frontend provides the main web interface for DealMate. It's a modern React application built with TypeScript and Tailwind CSS.

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

A FastAPI-based microservice that provides advanced AI capabilities for the DealMate ecosystem.

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

### Containerized Deployment (Recommended)

#### Development
```bash
# Quick start (auto-detects environment)
./run_app.sh

# Force containerized deployment
./run_app.sh -c
```

#### Production
```bash
# Build multi-architecture images
make build-multiarch

# Use production profile
make deploy-prod

# Or with docker-compose
docker compose --profile production up -d
```

#### Environment Configuration
Create a production `.env` file with:
- Strong passwords (use password generators)
- Production API endpoints
- SSL certificates paths
- Production database credentials

### Native Deployment

#### Frontend
```bash
cd frontend
npm run build
npm start
```

#### AI Service
```bash
cd backend/ai-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Best Practices

1. **Always use .env files** - Never hardcode credentials
2. **Regular backups** - Use `make backup-db` regularly
3. **Monitor resources** - Check `docker stats` for resource usage
4. **Update base images** - Run `make update-images` periodically
5. **Use health checks** - Run `make health` to verify services
6. **Clean up regularly** - Use `docker system prune` to free space

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

## 🔧 API Documentation

### Comparison API Endpoints

#### Search Products
```http
GET /api/comparison/search?q={query}&category={category}&priceMin={min}&priceMax={max}
```

**Parameters:**
- `q` (required): Search query
- `category` (optional): Product category filter
- `priceMin`, `priceMax` (optional): Price range filters
- `vendors` (optional): Comma-separated vendor list
- `minRating` (optional): Minimum rating filter
- `inStock` (optional): In-stock filter (true/false)
- `sortBy` (optional): Sort field (price, rating, name, discount)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "products": [...],
  "category": "Electronics",
  "searchQuery": "laptop",
  "totalResults": 50,
  "priceRange": { "min": 299.99, "max": 2499.99 },
  "avgRating": 4.2,
  "timestamp": "2025-07-26T..."
}
```

#### Get Categories
```http
GET /api/comparison/categories
```

#### Get Search Suggestions
```http
GET /api/comparison/suggestions?q={query}
```

#### Get Vendor Information
```http
GET /api/comparison/vendors/{vendorId}
```

### Coupon API Endpoints

#### Search Coupons
```http
GET /api/v1/coupons/search?domain={domain}
```

#### Test Coupons
```http
POST /api/v1/coupons/test
Content-Type: application/json

{
  "codes": ["CODE1", "CODE2"],
  "cartTotal": 100.00,
  "merchant": "example.com"
}
```

### AI Service Endpoints

#### Price Comparison
```http
POST /api/ai/price-comparison
Content-Type: application/json

{
  "product_name": "iPhone 15",
  "platforms": ["amazon", "walmart", "bestbuy"]
}
```

## 📊 Performance Metrics

### Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s
- **Time to Interactive (TTI)**: < 3.5s

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

**📋 [Documentation Index](docs/INDEX.md)** - **Complete guide to all documentation**

### Quick Start Guides
- [`docs/NEW_DEVS.md`](docs/NEW_DEVS.md) - **New Developer Quick Start** - Get up and running in minutes
- [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) - **Cross-Platform Setup** - Detailed setup for Windows, macOS, Linux

### Technical Documentation
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) - **Complete API Reference** - All endpoints, examples, and SDKs
- [`docs/PRODUCT_FEATURE_SPECIFICATION.md`](docs/PRODUCT_FEATURE_SPECIFICATION.md) - **Feature Specifications** - Comprehensive technical architecture
- [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) - **Testing Procedures** - Unit, integration, and E2E testing
- [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) - **Deployment Guide** - Local, cloud, and production deployment

### Feature Documentation
- [`docs/demo-coupon-system.md`](docs/demo-coupon-system.md) - **Coupon System** - Implementation details and usage

### Project Context
- [`memory-bank/`](memory-bank/) - **Project Context & History** - Essential reading for understanding project evolution
- [`memory-bank/README.md`](memory-bank/README.md) - **Memory Bank Guide** - How to use the project context system

## 📞 Need Help?

- Check existing documentation in the [`docs/`](docs/) directory
- Review the codebase structure and [`memory-bank/`](memory-bank/) for context
- Ask team members for guidance
- Visit API documentation at `http://localhost:8001/docs` (AI Service)
- Test comparison features at `http://localhost:3000/compare`

---

DealMate combines cutting-edge AI technology with practical user value to revolutionize how consumers discover and maximize savings opportunities across all shopping platforms.
