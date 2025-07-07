# DealPal Memory Bank

This memory bank contains comprehensive documentation about the DealPal project to maintain context across development sessions. As per the memory bank guidelines, these files should be read at the start of every development session to understand the project state and continue work effectively.

## Memory Bank Structure

### Core Files (Required Reading)

1. **[projectbrief.md](./projectbrief.md)** - Foundation Document
   - Project overview and core mission
   - Key components and target users
   - Success metrics and project scope
   - Legal and ethical framework

2. **[productContext.md](./productContext.md)** - Product Vision
   - Why DealPal exists and problems it solves
   - User experience goals for different user types
   - Product philosophy and competitive advantages
   - Success metrics and business impact

3. **[techContext.md](./techContext.md)** - Technical Foundation
   - Complete technology stack overview
   - Development environment setup
   - Architecture patterns and security implementation
   - Performance considerations and development tools

4. **[systemPatterns.md](./systemPatterns.md)** - Architecture & Patterns
   - Multi-service architecture design
   - Core design patterns and data flow
   - Component interaction patterns
   - Security, performance, and deployment patterns

5. **[activeContext.md](./activeContext.md)** - Current Work Focus
   - Current work focus and recent analysis
   - Active decisions and considerations
   - Important patterns and preferences
   - Project insights and learnings
   - Current challenges and next priorities

6. **[progress.md](./progress.md)** - Implementation Status
   - What's completed vs. what's planned
   - Current system capabilities
   - Known issues and technical debt
   - Development milestones and success metrics

## How to Use This Memory Bank

### For New Development Sessions
1. **Always start by reading ALL memory bank files** - this is critical for understanding project context
2. **Focus particularly on activeContext.md and progress.md** for current state
3. **Update relevant files** when making significant changes or discoveries
4. **Document new patterns and insights** in activeContext.md

### When to Update Memory Bank
- After implementing significant features
- When discovering new project patterns or insights
- When user requests **"update memory bank"** (review ALL files)
- When context needs clarification for future sessions

### File Dependencies
```
projectbrief.md (foundation)
├── productContext.md (why & how)
├── techContext.md (technology choices)
└── systemPatterns.md (architecture)
    └── activeContext.md (current state)
        └── progress.md (implementation status)
```

## Memory Bank Guidelines

### Critical Rules
- **Memory resets completely between sessions** - the memory bank is the only link to previous work
- **Read ALL files at session start** - not optional for effective continuation
- **Maintain precision and clarity** - effectiveness depends entirely on accuracy
- **Update when triggered** - especially when user requests memory bank updates

### Update Process
When updating the memory bank:
1. Review ALL files for completeness
2. Document current state accurately
3. Clarify next steps and priorities
4. Document insights and patterns learned
5. Focus particularly on activeContext.md and progress.md

## Project Status Summary

### Current Phase
**Foundation Complete** - Core infrastructure, authentication, and basic API functionality implemented

### What Works Today
- Complete development environment with scripts and Docker
- Rust backend with Auth0 authentication and database operations
- Next.js frontend with comprehensive UI components
- Python AI service with Google Gemini integration
- Browser extension with Manifest V3 architecture

### What Needs Implementation
- Real deal discovery and price comparison engines
- Advanced StackSmart algorithms for deal optimization
- Real-time price tracking and notifications
- Production-ready performance optimizations
- Comprehensive testing and monitoring

### Next Major Milestones
1. **Core Deal Engine** - Implement actual deal discovery and price comparison
2. **AI Enhancement** - Advanced product detection and personalization
3. **User Experience** - Real-time features and mobile responsiveness
4. **Scale & Optimize** - Production readiness and performance optimization

## Technology Stack Quick Reference

- **Frontend**: Next.js 15.3.3 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Rust (Axum) + PostgreSQL + SQLx + Auth0
- **AI Service**: Python (FastAPI) + Google Gemini
- **Browser Extension**: Manifest V3 + Vanilla JS/TS
- **Infrastructure**: Docker + Railway (PostgreSQL) + Redis

## Development Commands Quick Reference

```bash
# Start all services
cd scripts && ./dev.sh

# Individual services
cd frontend && npm run dev          # :3000
cd backend && cargo run             # :8000
cd backend/ai-service && python main.py  # :8001

# Docker deployment
docker-compose up --build
```

---

**Remember**: This memory bank is essential for maintaining project continuity. Always read these files at the start of each session and keep them updated with new insights and progress.
