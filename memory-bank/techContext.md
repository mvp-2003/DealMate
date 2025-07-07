# DealPal Technical Context

## Technology Stack Overview

### Frontend Technologies
- **Framework**: Next.js 15.3.3 with React 18.3.1
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 3.4.1 with custom design system
- **UI Components**: Radix UI primitives with ShadCN UI components
- **State Management**: React Hook Form with Zod validation
- **Charts/Analytics**: Recharts for data visualization
- **AI Integration**: Google Genkit for AI-powered features
- **Authentication**: Auth0 integration for secure user management

### Backend Technologies
- **Primary API**: Rust with Axum framework (port 8000)
- **AI Service**: Python FastAPI microservice (port 8001)
- **Database**: PostgreSQL with SQLx for type-safe queries
- **Caching**: Redis for performance optimization
- **Authentication**: JWT tokens with Auth0 integration
- **Migrations**: SQLx migrations for database schema management

### Browser Extension
- **Manifest**: Version 3 for modern browser compatibility
- **Languages**: Vanilla JavaScript/TypeScript
- **Architecture**: Modular design with content scripts and background workers
- **AI Integration**: Direct connection to Python AI service
- **Cross-Browser**: Chrome, Firefox, Edge, Safari, Brave support

### AI & Machine Learning
- **Primary AI**: Google Gemini via Firebase AI Studio
- **Models**: Gemini-1.5-flash for fast responses
- **Capabilities**: Product detection, sentiment analysis, price prediction
- **Integration**: Python FastAPI service with async processing
- **Features**: Computer vision, NLP, pattern recognition

### Infrastructure & DevOps
- **Containerization**: Docker with docker-compose for development
- **Database Hosting**: Railway for PostgreSQL
- **Environment Management**: Centralized .env configuration
- **Development Scripts**: Shell scripts for common operations
- **Testing**: Jest for frontend, Rust built-in testing for backend

## Development Environment Setup

### Required Dependencies
```bash
# System Requirements
- Node.js 18+ (for frontend)
- Rust 1.70+ (for backend)
- Python 3.9+ (for AI service)
- PostgreSQL 14+ (database)
- Redis 6+ (caching)
- Docker & Docker Compose (optional)
```

### Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost/dealpal

# AI Service Configuration
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

# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

### Port Configuration
- **Frontend**: 3000 (Next.js development server)
- **Backend API**: 8000 (Rust Axum server)
- **AI Service**: 8001 (Python FastAPI)
- **Database**: 5432 (PostgreSQL)
- **Cache**: 6379 (Redis)

## Architecture Patterns

### Microservices Design
- **API Gateway**: Centralized request routing through Rust backend
- **Service Separation**: Clear boundaries between core API and AI services
- **Inter-Service Communication**: HTTP/REST APIs with JSON payloads
- **Error Handling**: Centralized error types and consistent response formats

### Database Design
- **Schema Management**: SQLx migrations for version control
- **Type Safety**: Rust structs mapped to database tables
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Prepared statements and indexing strategies

### Frontend Architecture
- **Component Structure**: Modular components with clear separation of concerns
- **State Management**: Server state with React Query patterns
- **Type Safety**: Full TypeScript coverage with strict mode
- **Performance**: Next.js optimizations with Turbopack

### Security Implementation
- **Authentication**: JWT tokens with Auth0 integration
- **Authorization**: Role-based access control
- **Data Encryption**: AES-256 for sensitive data
- **API Security**: Rate limiting and request validation
- **CORS**: Proper cross-origin resource sharing configuration

## Development Workflow

### Local Development
```bash
# Start all services
cd scripts && ./dev.sh

# Individual service startup
cd frontend && npm run dev          # Frontend on :3000
cd backend && cargo run             # Backend on :8000
cd backend/ai-service && python main.py  # AI service on :8001
```

### Testing Strategy
- **Frontend**: Jest with React Testing Library
- **Backend**: Rust built-in test framework with integration tests
- **AI Service**: Python unittest with FastAPI test client
- **E2E Testing**: Planned Playwright integration
- **API Testing**: HTTP client testing for all endpoints

### Build & Deployment
```bash
# Production builds
cd frontend && npm run build        # Next.js production build
cd backend && cargo build --release # Optimized Rust binary
cd backend/ai-service && pip install -r requirements.txt  # Python dependencies

# Docker deployment
docker-compose up --build          # Full stack deployment
```

## Performance Considerations

### Response Time Targets
- **API Endpoints**: <200ms average response time
- **Product Detection**: ~200-500ms per request
- **Sentiment Analysis**: ~100-300ms for 10 reviews
- **Price Comparison**: <500ms for multi-platform queries
- **Deal Stacking**: <300ms for optimization algorithms

### Scalability Design
- **Horizontal Scaling**: Stateless services for easy scaling
- **Caching Strategy**: Redis for frequently accessed data
- **Database Optimization**: Proper indexing and query optimization
- **CDN Integration**: Static asset delivery optimization
- **Load Balancing**: Prepared for multi-instance deployment

### Monitoring & Observability
- **Logging**: Structured logging with tracing-subscriber (Rust)
- **Metrics**: Performance metrics collection
- **Error Tracking**: Centralized error logging and alerting
- **Health Checks**: Service health monitoring endpoints

## Technical Constraints & Decisions

### Language Choices
- **Rust for Backend**: Performance, safety, and concurrency benefits
- **Python for AI**: Rich ML ecosystem and library support
- **TypeScript for Frontend**: Type safety and developer experience
- **Vanilla JS for Extension**: Browser compatibility and performance

### Database Decisions
- **PostgreSQL**: ACID compliance, JSON support, and scalability
- **SQLx**: Type-safe database interactions without ORM overhead
- **Migration Strategy**: Version-controlled schema changes

### AI Integration Strategy
- **Google Gemini**: Cost-effective and capable AI model
- **Microservice Pattern**: Isolated AI processing for scalability
- **Async Processing**: Non-blocking AI operations
- **Fallback Mechanisms**: Graceful degradation when AI services unavailable

## Development Tools & Scripts

### Available Scripts
```bash
./scripts/setup.sh      # Initial project setup
./scripts/start.sh      # Start all services
./scripts/stop.sh       # Stop all services
./scripts/build.sh      # Build all components
./scripts/clean.sh      # Clean build artifacts
./scripts/dev.sh        # Development mode
./scripts/status.sh     # Check service status
```

### Code Quality Tools
- **Rust**: Clippy for linting, rustfmt for formatting
- **TypeScript**: ESLint and Prettier for code quality
- **Python**: Black for formatting, pylint for linting
- **Git Hooks**: Pre-commit hooks for code quality enforcement
