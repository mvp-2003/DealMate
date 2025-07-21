# New Developer Guide

Welcome to DealPal! This guide will help you get started quickly.

## Quick Setup

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
   docker-compose up --build
   ```

## Architecture Overview

- **Backend**: Rust API server (port 8000)
- **AI Service**: Python service with Gemini AI (port 8001)
- **Frontend**: Next.js React app (port 3000)
- **Database**: PostgreSQL
- **Cache**: Redis

## Key Files

- `README.md` - Project overview and setup
- `TESTING_GUIDE.md` - Testing procedures
- `PRODUCT_FEATURE_SPECIFICATION.md` - Feature specifications
- `docker-compose.yml` - Service orchestration

## Development Workflow

1. Make changes to your service
2. Test locally with `docker-compose up`
3. Run tests (see TESTING_GUIDE.md)
4. Submit PR

## Need Help?

- Check existing documentation
- Review the codebase structure
- Ask team members for guidance