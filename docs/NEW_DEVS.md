# New Developer Guide

Welcome to DealPal! This guide will help you get started quickly with our AI-powered smart shopping assistant platform.

## 🚀 Quick Setup

### Prerequisites
- Docker or Podman installed
- Python 3.8+ for universal setup script
- Git for version control
- 8GB+ RAM recommended

### 1. Clone and Navigate
```bash
git clone https://github.com/mvp-2003/DealPal.git
cd DealPal
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with required API keys:
# - GOOGLE_API_KEY (for AI service)
# - DATABASE_URL (automatically configured)
# - REDIS_URL (automatically configured)
```

### 3. One-Command Development Start
```bash
# For fastest development (native mode - default)
./run_app.sh

# For consistent containerized environment
./run_app.sh --docker

# For specific deployment modes
./run_app.sh --native    # Native development
./run_app.sh -c          # Containerized (short)
```

### 4. Access the Application
Once started, access these URLs:

- **Frontend (Main App)**: http://localhost:3000
- **Product Comparison**: http://localhost:3000/compare
- **Backend API**: http://localhost:8000
- **AI Service**: http://localhost:8001
- **Auth Service**: http://localhost:3001

**Development Tools** (containerized mode only):
- **Database GUI (Adminer)**: http://localhost:8082
- **Redis Commander**: http://localhost:8081

## 🏗️ Architecture Overview

DealPal uses a modern microservices architecture:

### Core Services
- **Frontend**: Next.js 15 React app with TypeScript (port 3000)
- **Backend**: Rust (Axum) API server for high performance (port 8000)
- **AI Service**: Python FastAPI service with Gemini AI (port 8001)
- **Auth Service**: Node.js authentication with OAuth2/JWT (port 3001)

### Infrastructure
- **Database**: PostgreSQL 15 with connection pooling
- **Cache**: Redis 7 for session and data caching
- **Message Broker**: Apache Kafka for real-time events
- **Stream Processing**: Kafka Streams for real-time analytics

### Key Features Implemented
- ✅ **Product Comparison Engine**: Multi-vendor price comparison
- ✅ **AI-Powered Search**: Intelligent product discovery
- ✅ **Coupon Aggregation**: Automated coupon testing and application
- ✅ **Real-time Price Tracking**: Live price monitoring across platforms
- ✅ **Smart Recommendations**: Personalized deal suggestions
- ✅ **Browser Extension**: Auto-coupon testing on checkout pages

## 📁 Project Structure

```
DealPal/
├── frontend/                 # Next.js React application
│   ├── src/app/(app)/compare/   # Product comparison pages
│   ├── src/components/comparison/  # Comparison UI components
│   ├── src/services/           # API service layers
│   └── src/types/              # TypeScript type definitions
├── backend/
│   ├── src/                    # Rust API server
│   └── ai-service/            # Python FastAPI AI service
├── browser-extension/         # Chrome/Firefox extension
├── scripts/                   # Development and deployment scripts
├── docs/                      # Comprehensive documentation
└── memory-bank/              # Project context and history
```

## 🛠️ Development Workflow

### Daily Development
```bash
# Start development environment
./run_app.sh

# Check service status
./scripts/status.sh

# View logs for debugging
./scripts/clear-logs.sh  # Clear old logs
tail -f logs/frontend.log
tail -f logs/backend.log
tail -f logs/ai-service.log
```

### Testing
```bash
# Test comparison feature
./scripts/test-comparison.sh

# Run all tests
./scripts/test-all.sh

# Test coupon system
./scripts/test-coupon-system.sh
```

### Building
```bash
# Build all components
./scripts/build.sh

# Clean build artifacts
./scripts/clean.sh
```

## 🔑 Key Development Areas

### 1. Product Comparison (`/compare`)
- **Frontend**: `frontend/src/app/(app)/compare/page.tsx`
- **API**: `frontend/src/app/api/comparison/search/route.ts`
- **Service**: `frontend/src/services/comparison.ts`
- **Components**: `frontend/src/components/comparison/`

### 2. AI Service Integration
- **Service**: `backend/ai-service/`
- **Price Comparison**: `backend/ai-service/price_comparison.py`
- **Smart Recommendations**: AI-powered deal discovery

### 3. Coupon System
- **Backend**: Rust coupon aggregation service
- **Browser Extension**: Auto-testing functionality
- **Database**: Comprehensive coupon and merchant tracking

## 📊 Testing Your Changes

### 1. Comparison Feature
Visit http://localhost:3000/compare and test:
- Search for products (try "laptop", "iPhone", "headphones")
- Use filters (price range, vendors, ratings)
- Test different view modes (grid/list)
- Check category browsing

### 2. API Endpoints
```bash
# Test comparison API
curl "http://localhost:3000/api/comparison/search?q=laptop"

# Test categories
curl "http://localhost:3000/api/comparison/categories"

# Test with filters
curl "http://localhost:3000/api/comparison/search?q=smartphone&priceMin=100&priceMax=500"
```

## 📚 Essential Documentation

### Must-Read Files
1. **[README.md](../README.md)** - Project overview and setup
2. **[PRODUCT_FEATURE_SPECIFICATION.md](PRODUCT_FEATURE_SPECIFICATION.md)** - Complete feature specs
3. **[memory-bank/](../memory-bank/)** - Project context and history
4. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Cross-platform setup details

### Development References
- **API Documentation**: Available in README.md
- **Component Documentation**: Check individual component files
- **Type Definitions**: `frontend/src/types/comparison.ts`

## 🔧 Common Development Tasks

### Adding New Comparison Features
1. Update types in `frontend/src/types/comparison.ts`
2. Modify API in `frontend/src/app/api/comparison/search/route.ts`
3. Update service in `frontend/src/services/comparison.ts`
4. Add UI components in `frontend/src/components/comparison/`

### Debugging Issues
```bash
# Check service status
./scripts/status.sh

# View real-time logs
tail -f logs/frontend.log
tail -f logs/backend.log
tail -f logs/ai-service.log

# Test specific APIs
./scripts/test-comparison.sh
```

### Environment Issues
```bash
# Reset environment
./scripts/stop.sh
./scripts/clean.sh
./run_app.sh --docker  # Use containerized mode for consistency
```

## 🚨 Common Gotchas

1. **Environment Variables**: Always ensure `.env` file is properly configured
2. **Port Conflicts**: Check if ports 3000, 8000, 8001, 3001 are available
3. **API Keys**: Google API key is required for AI service functionality
4. **Memory**: Ensure sufficient RAM (8GB+) for full containerized deployment
5. **Docker/Podman**: Use containerized mode if you encounter "works on my machine" issues

## 🆘 Need Help?

1. **Check Documentation**: Start with the [`docs/`](.) directory
2. **Review Memory Bank**: Check [`memory-bank/`](../memory-bank/) for project context
3. **Test Your Setup**: Run `./scripts/test-comparison.sh`
4. **Ask Questions**: Reach out to team members with specific error messages
5. **Check Logs**: Always include relevant log output when reporting issues

Welcome to the team! DealPal is building the future of smart shopping, and your contributions will help millions of users save money and time.