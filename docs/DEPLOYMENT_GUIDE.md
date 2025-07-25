# DealPal Deployment Guide

This guide provides comprehensive instructions for deploying DealPal across different environments and platforms.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Docker/Container Deployment](#dockercontainer-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

## Deployment Overview

DealPal supports multiple deployment modes:

- **🔧 Development**: Local development with hot reload
- **🧪 Staging**: Production-like environment for testing
- **🚀 Production**: High-availability production deployment
- **☁️ Cloud**: Scalable cloud deployment (AWS, GCP, Azure)
- **🐳 Container**: Docker/Podman containerized deployment

## Environment Setup

### Required Environment Variables

Create `.env` file in project root:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dealpal_prod
REDIS_URL=redis://localhost:6379

# Authentication (Auth0)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=your_api_audience

# AI Service (Google Gemini)
GOOGLE_API_KEY=your_google_ai_api_key
GEMINI_MODEL=gemini-1.5-flash

# External APIs
AMAZON_ACCESS_KEY=your_amazon_access_key
AMAZON_SECRET_KEY=your_amazon_secret_key
AMAZON_PARTNER_TAG=your_partner_tag

# Application Configuration
NODE_ENV=production
RUST_LOG=info
API_BASE_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com

# Security
JWT_SECRET=your-super-secure-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Performance & Monitoring
PERFORMANCE_MONITORING=true
LOG_LEVEL=info
METRICS_ENABLED=true

# Email & Notifications
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_email_password

# CDN & Storage
CDN_URL=https://cdn.your-domain.com
STORAGE_BUCKET=dealpal-assets
```

### Environment-Specific Configurations

#### Development (`.env.development`)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://dealpal:dealpal@localhost:5432/dealpal_dev
RUST_LOG=debug
LOG_LEVEL=debug
PERFORMANCE_MONITORING=false
```

#### Staging (`.env.staging`)
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://dealpal:password@staging-db:5432/dealpal_staging
RUST_LOG=info
LOG_LEVEL=info
PERFORMANCE_MONITORING=true
```

#### Production (`.env.production`)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://dealpal:secure_password@prod-db:5432/dealpal_prod
RUST_LOG=warn
LOG_LEVEL=warn
PERFORMANCE_MONITORING=true
METRICS_ENABLED=true
```

## Local Development

### Quick Start
```bash
# Clone repository
git clone https://github.com/mvp-2003/DealPal.git
cd DealPal

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development (native mode - fastest)
./run_app.sh

# Or force containerized mode for consistency
./run_app.sh --docker
```

### Development Services

After running `./run_app.sh`, access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **AI Service**: http://localhost:8001
- **Auth Service**: http://localhost:3001

**Development Tools** (containerized mode):
- **Database GUI**: http://localhost:8082 (Adminer)
- **Redis GUI**: http://localhost:8081 (Redis Commander)

### Development Workflow

```bash
# Daily development workflow
./run_app.sh                    # Start all services
./scripts/status.sh             # Check service status
./scripts/test-comparison.sh    # Test features

# Make changes to code...

# Test changes
./scripts/test-all.sh           # Run all tests
./scripts/lighthouse-audit.sh   # Performance check

# Stop services
./scripts/stop.sh
```

## Production Deployment

### Prerequisites

#### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **CPU**: 4+ cores recommended
- **Storage**: 50GB minimum, SSD recommended
- **Network**: High-speed internet connection

#### Software Requirements
- **Operating System**: Ubuntu 20.04+, CentOS 8+, or similar
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Reverse Proxy**: Nginx or Apache
- **SSL Certificate**: Let's Encrypt or commercial SSL

### Production Setup

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y postgresql redis-server nginx certbot python3-certbot-nginx

# Install Docker (optional for containerized deployment)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

#### 2. Database Setup
```bash
# Create production database
sudo -u postgres createuser --interactive dealpal
sudo -u postgres createdb dealpal_prod -O dealpal

# Set password for dealpal user
sudo -u postgres psql -c "ALTER USER dealpal PASSWORD 'secure_password';"

# Configure PostgreSQL for production
sudo nano /etc/postgresql/15/main/postgresql.conf
# Update: shared_buffers, max_connections, etc.
```

#### 3. Application Deployment
```bash
# Clone and build application
git clone https://github.com/mvp-2003/DealPal.git /opt/dealpal
cd /opt/dealpal

# Setup environment
cp .env.example .env.production
# Configure production environment variables

# Build application
./scripts/build.sh --production

# Run database migrations
./scripts/migrate.sh

# Start production services
./scripts/start.sh --production
```

#### 4. Nginx Configuration
```nginx
# /etc/nginx/sites-available/dealpal
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # AI Service
    location /ai/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

#### 5. SSL Certificate Setup
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 6. Systemd Services
Create systemd service files for each component:

```bash
# /etc/systemd/system/dealpal-backend.service
[Unit]
Description=DealPal Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=dealpal
WorkingDirectory=/opt/dealpal
Environment=RUST_LOG=info
ExecStart=/opt/dealpal/target/release/dealpal-backend
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start services
sudo systemctl enable dealpal-backend
sudo systemctl start dealpal-backend
sudo systemctl status dealpal-backend
```

## Cloud Deployment

### AWS Deployment

#### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │───▶│   Application   │───▶│   Database      │
│   (CDN)         │    │   Load Balancer │    │   (RDS)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   ECS Cluster   │
                       │   - Frontend    │
                       │   - Backend     │
                       │   - AI Service  │
                       └─────────────────┘
```

#### AWS Services Used
- **ECS Fargate**: Container orchestration
- **RDS PostgreSQL**: Managed database
- **ElastiCache Redis**: Managed cache
- **CloudFront**: CDN and caching
- **ALB**: Application Load Balancer
- **Route 53**: DNS management
- **Certificate Manager**: SSL certificates
- **CloudWatch**: Monitoring and logging

#### Deployment Steps

1. **Setup Infrastructure with Terraform**
```hcl
# infrastructure/aws/main.tf
provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "dealpal" {
  name = "dealpal-cluster"
}

resource "aws_rds_instance" "dealpal_db" {
  identifier = "dealpal-postgres"
  engine     = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  
  db_name  = "dealpal_prod"
  username = "dealpal"
  password = var.db_password
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  deletion_protection = true
}
```

2. **Deploy with GitHub Actions**
```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build and push Docker images
        run: |
          docker build -t dealpal/frontend .
          docker tag dealpal/frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/dealpal/frontend:latest
          docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/dealpal/frontend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster dealpal-cluster --service dealpal-frontend --force-new-deployment
```

### Google Cloud Platform (GCP)

#### Services Used
- **Cloud Run**: Serverless container deployment
- **Cloud SQL**: Managed PostgreSQL
- **Memorystore**: Managed Redis
- **Cloud CDN**: Content delivery
- **Cloud Load Balancing**: Traffic distribution
- **Cloud DNS**: Domain management

#### Deployment Command
```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/your-project/dealpal-frontend
gcloud run deploy dealpal-frontend \
  --image gcr.io/your-project/dealpal-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Deployment

#### Services Used
- **Container Instances**: Container hosting
- **Azure Database for PostgreSQL**: Managed database
- **Azure Cache for Redis**: Managed cache
- **Application Gateway**: Load balancing
- **CDN**: Content delivery

## Docker/Container Deployment

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: frontend-runtime
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - backend
      - postgres
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: backend-runtime
    ports:
      - "8000:8000"
    environment:
      - RUST_LOG=info
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  ai-service:
    build:
      context: .
      dockerfile: Dockerfile
      target: ai-runtime
    ports:
      - "8001:8001"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dealpal_prod
      POSTGRES_USER: dealpal
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dealpal-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dealpal-frontend
  template:
    metadata:
      labels:
        app: dealpal-frontend
    spec:
      containers:
      - name: frontend
        image: dealpal/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: dealpal-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && cargo build
          cd ../backend/ai-service && pip install -r requirements.txt
      
      - name: Run tests
        run: |
          ./scripts/test-all.sh
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          # Deploy to your production environment
          ./scripts/deploy-production.sh
```

## Monitoring & Maintenance

### Health Checks

```bash
# Health check endpoints
curl http://localhost:8000/health    # Backend health
curl http://localhost:8001/health    # AI service health
curl http://localhost:3000/api/health # Frontend API health
```

### Monitoring Setup

#### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'dealpal-backend'
    static_configs:
      - targets: ['localhost:8000']
  
  - job_name: 'dealpal-ai-service'
    static_configs:
      - targets: ['localhost:8001']
```

#### Grafana Dashboards
- **System Metrics**: CPU, memory, disk usage
- **Application Metrics**: Request rate, response time, error rate
- **Business Metrics**: User activity, comparison searches, coupon usage

### Backup Strategy

#### Database Backups
```bash
# Automated daily backups
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U dealpal dealpal_prod > /backups/dealpal_${DATE}.sql
aws s3 cp /backups/dealpal_${DATE}.sql s3://dealpal-backups/
```

#### Application Backups
```bash
# Backup application data and configurations
tar -czf dealpal_app_backup_$(date +%Y%m%d).tar.gz \
  /opt/dealpal \
  /etc/nginx/sites-available/dealpal \
  /etc/systemd/system/dealpal-*
```

### Log Management

#### Centralized Logging
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/dealpal

/opt/dealpal/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check service status
sudo systemctl status dealpal-backend

# Check logs
sudo journalctl -u dealpal-backend -f

# Check port availability
sudo netstat -tlnp | grep :8000
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U dealpal -d dealpal_prod

# Check PostgreSQL status
sudo systemctl status postgresql

# Check firewall
sudo ufw status
```

#### Performance Issues
```bash
# Monitor system resources
htop
iotop
nethogs

# Check application metrics
curl http://localhost:8000/metrics
```

### Emergency Procedures

#### Quick Rollback
```bash
# Rollback to previous version
git checkout previous-stable-tag
./scripts/build.sh --production
./scripts/start.sh --production
```

#### Database Recovery
```bash
# Restore from backup
pg_restore -h localhost -U dealpal -d dealpal_prod /backups/latest_backup.sql

# If corruption detected
sudo -u postgres /usr/lib/postgresql/15/bin/pg_resetwal /var/lib/postgresql/15/main
```

## Security Considerations

### Production Security Checklist

- [ ] **SSL/TLS**: Valid certificates installed
- [ ] **Firewall**: Only necessary ports open
- [ ] **Database**: Non-default passwords, restricted access
- [ ] **API**: Rate limiting enabled
- [ ] **Headers**: Security headers configured
- [ ] **Updates**: System and dependencies updated
- [ ] **Monitoring**: Security monitoring enabled
- [ ] **Backups**: Regular backups tested
- [ ] **Access**: SSH key-based authentication
- [ ] **Secrets**: Environment variables secured

### Security Monitoring

```bash
# Regular security checks
sudo apt update && sudo apt list --upgradable
npm audit
cargo audit
safety check
```

---

This deployment guide provides comprehensive instructions for deploying DealPal across various environments. Choose the deployment method that best fits your infrastructure and requirements.

**Last Updated**: July 26, 2025  
**Next Review**: August 26, 2025
