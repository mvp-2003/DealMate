# DealMate System Patterns & Architecture

## Overall System Architecture

### Multi-Service Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Web App       │   Mobile App    │   Browser Extension     │
│   (Next.js)     │   (Future)      │   (Manifest V3)         │
│   Port: 3000    │                 │   Cross-Browser         │
└─────────────────┴─────────────────┴─────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│              Rust Backend (Axum)                           │
│              Port: 8000                                     │
│              - Authentication & Authorization               │
│              - Request Routing                              │
│              - Business Logic                               │
│              - Database Operations                          │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│              Python AI Service (FastAPI)                   │
│              Port: 8001                                     │
│              - Product Detection                            │
│              - Sentiment Analysis                           │
│              - Price Prediction                             │
│              - ML Model Inference                           │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                              │
├─────────────────┬───────────────────┬─────────────────────────┤
│   PostgreSQL    │      Redis        │   External APIs         │
│   Port: 5432    │   Port: 6379      │   - E-commerce Sites    │
│   - User Data   │   - Caching       │   - Coupon Platforms    │
│   - Deals       │   - Sessions      │   - Bank APIs           │
│   - Analytics   │   - Rate Limiting │   - Google Gemini       │
└─────────────────┴───────────────────┴─────────────────────────┘
```

## Core Design Patterns

### 1. Microservices Pattern
**Implementation**: Clear service boundaries with specific responsibilities
- **Rust Backend**: Core business logic, authentication, data persistence
- **Python AI Service**: Machine learning, AI inference, complex analytics
- **Frontend**: User interface, client-side logic, state management

**Benefits**:
- Independent scaling of services
- Technology-specific optimizations
- Fault isolation
- Team autonomy

### 2. API Gateway Pattern
**Implementation**: Rust backend serves as the primary API gateway
- Centralized authentication and authorization
- Request routing to appropriate services
- Rate limiting and throttling
- Response aggregation and transformation

**Key Components**:
```rust
// Router structure in lib.rs
pub fn app(pool: PgPool) -> Router {
    Router::new()
        .nest("/api/auth", auth_routes())
        .nest("/api/users", user_routes(pool.clone()))
        .nest("/api/deals", deals_routes(pool.clone()))
        .nest("/api/wallet", wallet_routes(pool.clone()))
        .nest("/api/settings", settings_routes(pool.clone()))
        .nest("/api/partnerships", partnerships_routes(pool.clone()))
        .layer(cors_layer())
        .layer(trace_layer())
}
```

### 3. Repository Pattern
**Implementation**: Database access abstraction through model structs
- Type-safe database operations with SQLx
- Centralized query logic
- Migration-based schema management

**Example Structure**:
```rust
// Model definitions in backend/src/models/
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub created_at: DateTime<Utc>,
    // ... other fields
}

// Database operations
impl User {
    pub async fn create(pool: &PgPool, user_data: CreateUser) -> Result<User, Error> {
        // Implementation
    }
    
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, Error> {
        // Implementation
    }
}
```

### 4. Middleware Pattern
**Implementation**: Cross-cutting concerns handled through middleware
- Authentication verification
- Request logging and tracing
- CORS handling
- Error handling and response formatting

**Middleware Stack**:
```rust
// Authentication middleware
pub async fn auth_middleware(
    headers: HeaderMap,
    request: Request<Body>,
    next: Next<Body>,
) -> Result<Response, StatusCode> {
    // JWT token verification
    // User context injection
}
```

### 5. Strategy Pattern for Deal Processing
**Implementation**: StackSmart engine with pluggable algorithms
- Different stacking strategies for various offer types
- Configurable optimization algorithms
- A/B testing support for algorithm variations

**Core Structure**:
```rust
pub struct StackSmartEngine;

impl StackSmartEngine {
    pub async fn optimize_deals(&self, request: StackDealsRequest) -> StackedDealResult {
        // 1. Filter compatible offers
        // 2. Apply optimization strategy
        // 3. Validate deal combinations
        // 4. Return optimal stack
    }
}
```

## Data Flow Patterns

### 1. Request-Response Flow
```
Client Request → Rust API Gateway → Business Logic → Database/AI Service → Response
```

### 2. AI Processing Flow
```
Product URL → Rust Backend → Python AI Service → Gemini API → Analysis Results → Cache → Response
```

### 3. Deal Discovery Flow
```
User Query → Deal Scanner → Multiple Sources → Aggregation → StackSmart → Ranking → Response
```

### 4. Real-time Updates Flow
```
Price Changes → Background Jobs → Database Updates → WebSocket/SSE → Client Updates
```

## Component Interaction Patterns

### Frontend-Backend Communication
- **REST API**: Primary communication protocol
- **JSON Payloads**: Standardized data exchange format
- **Type Safety**: Shared TypeScript types for consistency
- **Error Handling**: Standardized error response format

### Backend-AI Service Communication
- **HTTP/REST**: Service-to-service communication
- **Async Processing**: Non-blocking AI operations
- **Timeout Handling**: Graceful degradation for slow AI responses
- **Caching**: Redis caching for expensive AI operations

### Database Interaction Patterns
- **Connection Pooling**: Efficient database connection management
- **Prepared Statements**: SQL injection prevention and performance
- **Transaction Management**: ACID compliance for critical operations
- **Migration Strategy**: Version-controlled schema evolution

## Security Patterns

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with Auth0
- **Role-Based Access**: Granular permission system
- **Token Refresh**: Automatic token renewal
- **Secure Storage**: HttpOnly cookies for sensitive tokens

### Data Protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries with SQLx
- **XSS Protection**: Content Security Policy and input sanitization
- **CORS Configuration**: Proper cross-origin resource sharing

### API Security
- **Rate Limiting**: Request throttling per user/IP
- **Request Size Limits**: Protection against large payload attacks
- **HTTPS Enforcement**: TLS 1.3 for all communications
- **API Key Management**: Secure external API key handling

## Performance Patterns

### Caching Strategy
- **Multi-Level Caching**: Application, database, and CDN caching
- **Cache Invalidation**: Smart cache invalidation strategies
- **Cache Warming**: Proactive cache population
- **Cache Partitioning**: User-specific and global cache separation

### Database Optimization
- **Indexing Strategy**: Optimized database indexes for common queries
- **Query Optimization**: Efficient SQL query patterns
- **Connection Pooling**: Managed database connections
- **Read Replicas**: Planned read/write separation for scaling

### Async Processing
- **Non-Blocking Operations**: Async/await patterns throughout
- **Background Jobs**: Planned job queue for heavy operations
- **Streaming Responses**: Server-sent events for real-time updates
- **Batch Processing**: Efficient bulk operations

## Error Handling Patterns

### Centralized Error Management
```rust
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Authentication error: {0}")]
    Auth(String),
    
    #[error("External API error: {0}")]
    ExternalApi(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // Standardized error response format
    }
}
```

### Graceful Degradation
- **AI Service Fallbacks**: Continue operation when AI services are unavailable
- **External API Failures**: Cached responses when external APIs fail
- **Database Connectivity**: Read-only mode during database issues
- **Feature Toggles**: Disable non-critical features during issues

## Monitoring & Observability Patterns

### Logging Strategy
- **Structured Logging**: JSON-formatted logs with tracing-subscriber
- **Correlation IDs**: Request tracking across services
- **Log Levels**: Appropriate log levels for different environments
- **Sensitive Data**: Careful handling of PII in logs

### Health Checks
- **Service Health**: Individual service health endpoints
- **Dependency Checks**: Database and external service connectivity
- **Performance Metrics**: Response time and throughput monitoring
- **Alerting**: Automated alerts for critical issues

## Deployment Patterns

### Container Strategy
- **Multi-Stage Builds**: Optimized Docker images
- **Service Isolation**: Separate containers for each service
- **Environment Configuration**: Environment-specific configurations
- **Health Checks**: Container health monitoring

### Scaling Patterns
- **Horizontal Scaling**: Stateless service design for easy scaling
- **Load Balancing**: Prepared for multi-instance deployment
- **Database Scaling**: Read replicas and connection pooling
- **CDN Integration**: Static asset optimization

## Development Patterns

### Code Organization
- **Modular Structure**: Clear separation of concerns
- **Shared Types**: Common type definitions across services
- **Configuration Management**: Centralized environment configuration
- **Documentation**: Comprehensive code documentation

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service interaction testing
- **API Tests**: Endpoint functionality testing
- **E2E Tests**: Full user journey testing

This architecture provides a solid foundation for building a scalable, maintainable, and secure deal optimization platform while maintaining flexibility for future enhancements and integrations.
