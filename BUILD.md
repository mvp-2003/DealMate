# DealPal Build & Run Guide

## 🚀 Quick Start Options

### 1. Development Mode
```bash
./dev.sh
```
- Frontend: http://localhost:9002
- Backend: http://localhost:8000

### 2. Production Build & Run
```bash
./build.sh    # Build both
./start.sh    # Run production
```

### 3. Docker/Podman
```bash
./docker-build.sh     # Build images
docker-compose up     # Run containers
```

## 📦 Individual Commands

### Frontend Only
```bash
cd frontend
npm install
npm run dev      # Development
npm run build    # Production build
npm start        # Production run
```

### Backend Only
```bash
cd backend
cargo run        # Development
cargo build --release  # Production build
./target/release/dealpal-backend  # Production run
```

## 🐳 Container Options

### Docker
```bash
docker-compose up
```

### Podman
```bash
podman-compose up
```

## ✅ Architecture Benefits
- ✅ Local development ready
- ✅ Production build ready  
- ✅ Docker/Podman ready
- ✅ Cloud deployment ready
- ✅ Railway PostgreSQL integrated