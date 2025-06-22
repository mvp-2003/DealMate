# 🚀 DealPal Scripts Guide

## 🎯 **THE ONE SCRIPT TO RULE THEM ALL**

### **`./run_app.sh`** ⭐ **← USE THIS ONE!**
**This is your main script!** Runs everything you need:
1. ✅ Builds all components
2. ✅ Starts all services 
3. ✅ Runs health checks
4. ✅ Shows platform status
5. ✅ Keeps everything running

```bash
./run_app.sh
# That's it! Your complete DealPal platform will be running.
```

---

## 📋 **Other Available Scripts**

### 🔧 **Setup & Build**
- **`./setup.sh`** - Complete development environment setup (new developers)
- **`./build.sh`** - Build all components (Backend, Frontend, AI Service)

### 🚀 **Start Services**
- **`./start.sh`** - Start production servers
- **`./dev.sh`** - Start development servers (with hot reload)

### 🧪 **Testing & Monitoring**
- **`./test_all.sh`** - Complete test suite for all components
- **`./status.sh`** - Real-time platform health monitoring
- **`./quick_test.sh`** - Quick API tests
- **`./validate_env.py`** - Environment validation

### 🧹 **Maintenance**
- **`./clean.sh`** - Clean build artifacts and reset environment

### 🐳 **Docker & Deployment**
- **`./docker-build.sh`** - Build Docker containers
- **`./podman-build.sh`** - Build with Podman
- **`./setup_railway.sh`** - Setup Railway deployment

---

## 🎯 **Quick Start Guide**

### For New Developers:
```bash
git clone <repo>
cd DealPal
./setup.sh          # One-time setup
./run_app.sh         # Start everything
```

### For Daily Development:
```bash
./run_app.sh         # Start complete platform
# OR for development with hot reload:
./dev.sh
```

### For Testing:
```bash
./test_all.sh        # Run all tests
./status.sh          # Check platform health
```

### For Maintenance:
```bash
./clean.sh           # Clean everything
./build.sh           # Rebuild everything
```

---

## 🌐 **Platform URLs** (after running `./run_app.sh`)

- **🤖 AI Service:** http://localhost:8001
- **🦀 Backend API:** http://localhost:8000  
- **📦 Frontend App:** http://localhost:3000
- **📚 API Documentation:** http://localhost:8001/docs

---

## 🔧 **Script Dependencies**

All scripts are designed to work independently, but they follow this hierarchy:

```
run_app.sh (MASTER)
├── build.sh
├── start.sh (production services)
├── status.sh (health monitoring)
└── test_all.sh (optional validation)

dev.sh (DEVELOPMENT)
├── Same as run_app.sh but with hot reload

setup.sh (ONE-TIME SETUP)
├── Environment setup
├── Dependencies installation
└── Initial build
```

---

## 💡 **Pro Tips**

1. **Always use `./run_app.sh`** for regular development
2. **Use `./dev.sh`** when you're actively coding (hot reload)
3. **Run `./status.sh`** anytime to check if services are healthy
4. **Use `./clean.sh`** if something feels broken
5. **Check logs:** `tail -f *.log` to see service outputs

---

## 🆘 **Troubleshooting**

**Services not starting?**
```bash
./clean.sh          # Clean everything
./build.sh          # Rebuild
./run_app.sh         # Try again
```

**Port conflicts?**
```bash
lsof -i :8000       # Check what's using port 8000
lsof -i :8001       # Check what's using port 8001  
lsof -i :3000       # Check what's using port 3000
```

**Environment issues?**
```bash
python3 validate_env.py    # Check environment
```

---

## 🎉 **You're Ready!**

Just run **`./run_app.sh`** and you'll have your complete DealPal platform running! 🚀
