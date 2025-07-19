#!/bin/bash

# DealPal Master Run Script
# This is the ONE SCRIPT to run everything - build, start, test, and monitor
# Usage: ./run_app.sh [--docker|--containerized|-c|--native|-n]

set -e

# Check for required commands
check_required_commands() {
    local missing_commands=()
    
    # Check for make command (required for containerized mode)
    if ! command -v make &> /dev/null; then
        missing_commands+=("make")
    fi
    
    # Check for curl (required for health checks)
    if ! command -v curl &> /dev/null; then
        missing_commands+=("curl")
    fi
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required commands: ${missing_commands[*]}${NC}"
        echo -e "${YELLOW}Please install the missing commands before running this script.${NC}"
        exit 1
    fi
}

# Parse command line arguments
DEPLOYMENT_MODE="auto"
while [[ $# -gt 0 ]]; do
    case $1 in
        --docker|--containerized|-c)
            DEPLOYMENT_MODE="containerized"
            shift
            ;;
        --native|-n)
            DEPLOYMENT_MODE="native"
            shift
            ;;
        --help|-h)
            echo "DealPal Application Runner"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --docker, --containerized, -c    Force containerized deployment"
            echo "  --native, -n                     Force native deployment"
            echo "  --help, -h                       Show this help message"
            echo ""
            echo "If no option is specified, the script will default to native deployment."
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DealPal Master Application Runner${NC}"
echo "====================================="

# Check required commands
check_required_commands

# Function to detect container runtime
detect_container_runtime() {
    if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
        echo "docker"
    elif command -v podman &> /dev/null; then
        echo "podman"
    else
        echo "none"
    fi
}

# Function to detect compose command
detect_compose_command() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif command -v podman-compose &> /dev/null; then
        echo "podman-compose"
    elif docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
    else
        echo ""
    fi
}

# Function to check if containerized setup exists
has_containerized_setup() {
    [[ -f "docker-compose.yml" && -f "Dockerfile" ]]
}

# Function to check API keys in .env
check_api_keys() {
    local env_file=".env"
    if [[ ! -f "$env_file" ]]; then
        return 1
    fi
    
    # Check for empty or missing critical API keys
    if grep -q "GOOGLE_API_KEY=$" "$env_file" || ! grep -q "GOOGLE_API_KEY=" "$env_file"; then
        return 1
    fi
    
    return 0
}

# Determine deployment mode
RUNTIME=$(detect_container_runtime)
if [[ "$DEPLOYMENT_MODE" == "auto" ]]; then
    if [[ "$RUNTIME" != "none" ]] && has_containerized_setup; then
        DEPLOYMENT_MODE="native"
        echo -e "${CYAN}�️  Auto-detected: Native deployment (default)${NC}"
        echo -e "${CYAN}💡 Use './run_app.sh -c' to force containerized deployment${NC}"
    else
        DEPLOYMENT_MODE="native"
        echo -e "${CYAN}🛠️  Auto-detected: Native deployment${NC}"
    fi
else
    echo -e "${CYAN}🎯 Using: ${DEPLOYMENT_MODE} deployment${NC}"
fi

echo ""

# CONTAINERIZED DEPLOYMENT
if [[ "$DEPLOYMENT_MODE" == "containerized" ]]; then
    echo -e "${BLUE}📦 Containerized Deployment Mode${NC}"
    echo "================================="
    echo -e "${CYAN}This will:${NC}"
    echo "1. 🔧 Setup Docker environment"
    echo "2. 🗄️  Run database migrations"
    echo "3. 🚀 Start all containerized services"
    echo "4. 🧪 Run health checks"
    echo "5. 📊 Show platform status"
    echo ""
    
    # Detect compose command
    COMPOSE_CMD=$(detect_compose_command)
    if [[ -z "$COMPOSE_CMD" ]]; then
        echo -e "${RED}❌ Docker Compose is not installed!${NC}"
        echo -e "${YELLOW}Please install Docker Compose or Podman Compose${NC}"
        exit 1
    fi
    echo -e "${CYAN}Using compose command: ${COMPOSE_CMD}${NC}"
    
    # Check if Docker setup is needed
    if [[ ! -f ".env" ]] || ! ${COMPOSE_CMD} config &> /dev/null 2>&1; then
        echo -e "${YELLOW}⚙️  Running Docker setup...${NC}"
        chmod +x scripts/docker-setup.sh
        ./scripts/docker-setup.sh
        echo ""
    fi
    
    # Check API keys
    if ! check_api_keys; then
        echo -e "${YELLOW}⚠️  API keys need to be configured in .env file:${NC}"
        echo "   - AUTH0_* configuration"
        echo "   - GOOGLE_API_KEY"
        echo "   - OPENROUTER_API_KEY (optional)"
        echo "   - HUGGINGFACE_API_KEY (optional)"
        echo ""
        echo -e "${YELLOW}Edit with: nano .env${NC}"
        echo ""
        read -p "Press Enter after adding API keys to continue..."
        echo ""
    fi
    
    # Check if services are already running
    if ${COMPOSE_CMD} ps --services --filter "status=running" | grep -q .; then
        echo -e "${YELLOW}⚠️  Some containers are already running!${NC}"
        echo -e "${YELLOW}Do you want to restart them? (y/N): ${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eS]|[yY])$ ]]; then
            echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
            make down
        else
            echo -e "${GREEN}✅ Skipping to health checks...${NC}"
            echo ""
            make health
            echo ""
            echo -e "${GREEN}🎉 DealPal platform is running!${NC}"
            echo -e "${CYAN}📱 Application URLs:${NC}"
            echo -e "  🌐 Frontend:       ${YELLOW}http://localhost:3000${NC}"
            echo -e "  🦀 Backend API:    ${YELLOW}http://localhost:8000/api${NC}"
            echo -e "  🤖 AI Service:     ${YELLOW}http://localhost:8001${NC}"
            echo -e "  🔐 Auth Service:   ${YELLOW}http://localhost:3001${NC}"
            echo ""
            echo -e "${CYAN}🔧 Management Commands:${NC}"
            echo -e "  Status:    make health"
            echo -e "  Logs:      make logs"
            echo -e "  Stop:      make down"
            echo -e "  Restart:   make restart"
            exit 0
        fi
    fi
    
    # Start containerized services
    echo -e "${BLUE}🚀 Starting containerized services...${NC}"
    make up
    
    # Run migrations
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    make migrate
    
    # Health checks
    echo -e "${BLUE}🧪 Running health checks...${NC}"
    sleep 10  # Give services time to start
    make health
    
    echo ""
    echo -e "${GREEN}🎉 DealPal platform is now fully operational!${NC}"
    echo ""
    echo -e "${CYAN}📱 Application URLs:${NC}"
    echo -e "  🌐 Frontend:       ${YELLOW}http://localhost:3000${NC}"
    echo -e "  🦀 Backend API:    ${YELLOW}http://localhost:8000/api${NC}"
    echo -e "  🤖 AI Service:     ${YELLOW}http://localhost:8001${NC}"
    echo -e "  🔐 Auth Service:   ${YELLOW}http://localhost:3001${NC}"
    echo -e "  📚 API Docs:       ${YELLOW}http://localhost:8001/docs${NC}"
    echo ""
    echo -e "${CYAN}🔧 Development Tools (if using make up-dev):${NC}"
    echo -e "  📊 Adminer (DB):   ${YELLOW}http://localhost:8082${NC}"
    echo -e "  🔴 Redis GUI:      ${YELLOW}http://localhost:8081${NC}"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo -e "  View logs:     make logs"
    echo -e "  Stop services: make down"
    echo -e "  Restart:       make restart"
    echo -e "  Run tests:     make test"
    echo -e "  Health check:  make health"
    echo ""
    echo -e "${GREEN}🎯 Ready for development!${NC}"
    echo -e "${YELLOW}Use Ctrl+C to stop monitoring, or 'make down' to stop services${NC}"
    
    # Monitor services
    trap 'echo -e "\n${YELLOW}🛑 Monitoring stopped. Services are still running.${NC}\n${CYAN}Use \"make down\" to stop services.${NC}"; exit 0' INT
    
    while true; do
        sleep 30
        echo -e "${CYAN}[$(date '+%H:%M:%S')] Services running... (Ctrl+C to stop monitoring)${NC}"
    done

# NATIVE DEPLOYMENT
else
    echo -e "${BLUE}🛠️  Native Deployment Mode${NC}"
    echo "=========================="
    echo -e "${CYAN}This will:${NC}"
    echo "1. 🔧 Build all components"
    echo "2. 🗄️  Run database migrations"
    echo "3. 🚀 Start all services"
    echo "4. 🧪 Run health checks"
    echo "5. 📊 Show platform status"
    echo "6. 🎯 Keep services running"
    echo ""
    
    # Load environment variables
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi

    # Function to show spinner while waiting
    show_spinner() {
        local pid=$1
        local delay=0.1
        local spinstr='|/-\'
        while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
            local temp=${spinstr#?}
            printf " [%c]  " "$spinstr"
            local spinstr=$temp${spinstr%"$temp"}
            sleep $delay
            printf "\b\b\b\b\b\b"
        done
        printf "    \b\b\b\b"
    }

    # Function to check if services are running (native)
    check_services_running() {
        local ai_running=false
        local auth_running=false
        local backend_running=false
        local frontend_running=false
        
        if curl -s --max-time 2 "http://localhost:8001" > /dev/null 2>&1; then
            ai_running=true
        fi
        
        if curl -s --max-time 2 "http://localhost:3001/api/public" > /dev/null 2>&1; then
            auth_running=true
        fi
        
        if curl -s --max-time 2 "http://localhost:8000" > /dev/null 2>&1; then
            backend_running=true
        fi
        
        if curl -s --max-time 2 "http://localhost:3000" > /dev/null 2>&1; then
            frontend_running=true
        fi
        
        if [ "$ai_running" = true ] && [ "$auth_running" = true ] && [ "$backend_running" = true ] && [ "$frontend_running" = true ]; then
            return 0
        else
            return 1
        fi
    }

    # Check if services are already running
    if check_services_running; then
        echo -e "${YELLOW}⚠️  Services appear to be already running!${NC}"
        echo -e "${YELLOW}Do you want to restart them? (y/N): ${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eS]|[yY])$ ]]; then
            echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
            # Kill existing services
            pkill -f "dealpal-backend" 2>/dev/null || true
            pkill -f "python main.py" 2>/dev/null || true
            pkill -f "node.*auth-service" 2>/dev/null || true
            pkill -f "npm.*start\|next.*start" 2>/dev/null || true
            sleep 2
        else
            echo -e "${GREEN}✅ Skipping to health checks...${NC}"
            echo ""
            ./scripts/status.sh
            exit 0
        fi
    fi

    # Step 1: Build everything
    echo -e "${BLUE}📦 Step 1: Building All Components${NC}"
    echo "=================================="
    ./scripts/build.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build completed successfully${NC}"
    else
        echo -e "${RED}❌ Build failed! Exiting...${NC}"
        exit 1
    fi
    echo ""

    # Step 2: Run Database Migrations
    echo -e "${BLUE}🗄️  Step 2: Database Migrations${NC}"
    echo "=================================="
    ./scripts/migrate.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations completed successfully${NC}"
    else
        echo -e "${RED}❌ Database migration failed! Exiting...${NC}"
        exit 1
    fi
    echo ""

    # Step 3: Start all services (native)
    echo -e "${BLUE}🚀 Step 3: Starting All Services${NC}"
    echo "================================="

    # Start AI Service
    echo -e "${YELLOW}🤖 Starting AI Service...${NC}"
    cd backend/ai-service

    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
        python3 -m venv .venv
    fi

    # Activate virtual environment and install dependencies
    echo -e "${YELLOW}🔧 Activating virtual environment and installing dependencies...${NC}"
    source .venv/bin/activate
    pip install -r requirements.txt

    # Start the AI service
    nohup python main.py > ../../logs/ai-service.log 2>&1 &
    AI_SERVICE_PID=$!
    cd ../../
    echo "AI Service PID: $AI_SERVICE_PID"

    # Wait for AI service to start
    echo -e "${YELLOW}⏳ Waiting for AI service to initialize...${NC}"
    sleep 5

    # Start Auth Service
    echo -e "${YELLOW}🔐 Starting Auth Service...${NC}"
    nohup node backend/auth-service/index.js > logs/auth-service.log 2>&1 &
    AUTH_SERVICE_PID=$!
    echo "Auth Service PID: $AUTH_SERVICE_PID"

    # Wait for auth service to start
    echo -e "${YELLOW}⏳ Waiting for auth service to initialize...${NC}"
    sleep 3

    # Start Backend
    echo -e "${YELLOW}🦀 Starting Backend...${NC}"
    cd backend
    nohup ./target/release/dealpal-backend > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo "Backend PID: $BACKEND_PID"

    # Wait for backend to start
    echo -e "${YELLOW}⏳ Waiting for backend to initialize...${NC}"
    sleep 3

    # Start Frontend
    echo -e "${YELLOW}📦 Starting Frontend...${NC}"
    cd frontend
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    echo "Frontend PID: $FRONTEND_PID"

    # Wait for frontend to start
    echo -e "${YELLOW}⏳ Waiting for frontend to initialize...${NC}"
    sleep 8

    echo -e "${GREEN}✅ All services started${NC}"
    echo ""

    # Step 4: Health checks
    echo -e "${BLUE}🧪 Step 4: Running Health Checks${NC}"
    echo "================================="

    # Wait a bit more for services to fully start
    echo -e "${YELLOW}⏳ Allowing services to fully initialize...${NC}"
    sleep 5

    # Check each service
    echo -e "${YELLOW}Testing AI Service...${NC}"
    if curl -s --max-time 10 "http://localhost:8001" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ AI Service is responding${NC}"
    else
        echo -e "${RED}❌ AI Service not responding${NC}"
    fi

    echo -e "${YELLOW}Testing Auth Service...${NC}"
    if curl -s --max-time 10 "http://localhost:3001/api/public" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Auth Service is responding${NC}"
    else
        echo -e "${RED}❌ Auth Service not responding${NC}"
    fi

    echo -e "${YELLOW}Testing Backend...${NC}"
    if curl -s --max-time 10 "http://localhost:8000/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is responding${NC}"
    else
        echo -e "${RED}❌ Backend not responding${NC}"
    fi

    echo -e "${YELLOW}Testing Frontend...${NC}"
    if curl -s --max-time 10 "http://localhost:3000" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is responding${NC}"
    else
        echo -e "${RED}❌ Frontend not responding${NC}"
    fi

    echo ""

    # Step 5: Platform status
    echo -e "${BLUE}📊 Step 5: Platform Status${NC}"
    echo "=========================="
    ./scripts/status.sh
    echo ""

    # Step 6: Keep running and show info
    echo -e "${BLUE}🎯 Step 6: DealPal Platform Running${NC}"
    echo "==================================="
    echo -e "${GREEN}🎉 DealPal platform is now fully operational!${NC}"
    echo ""
    echo -e "${CYAN}📱 Application URLs:${NC}"
    echo -e "  🤖 AI Service:     ${YELLOW}http://localhost:8001${NC}"
    echo -e "  🔐 Auth Service:   ${YELLOW}http://localhost:3001${NC}"
    echo -e "  🦀 Backend API:    ${YELLOW}http://localhost:8000/api${NC}"
    echo -e "  🌐 Frontend App:   ${YELLOW}http://localhost:3000${NC}"
    echo -e "  📚 API Docs:       ${YELLOW}http://localhost:8001/docs${NC}"
    echo ""
    echo -e "${CYAN}📋 Service Information:${NC}"
    echo -e "  AI Service PID:    $AI_SERVICE_PID"
    echo -e "  Auth Service PID:  $AUTH_SERVICE_PID"
    echo -e "  Backend PID:       $BACKEND_PID"
    echo -e "  Frontend PID:      $FRONTEND_PID"
    echo ""
    echo -e "${CYAN}📄 Logs:${NC}"
    echo -e "  AI Service:        tail -f logs/ai-service.log"
    echo -e "  Auth Service:      tail -f logs/auth-service.log"
    echo -e "  Backend:           tail -f logs/backend.log"
    echo -e "  Frontend:          tail -f logs/frontend.log"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo -e "  Status Check:      ./scripts/status.sh"
    echo -e "  Run Tests:         ./scripts/test_all.sh"
    echo -e "  Stop Services:     Press Ctrl+C or run: kill $AI_SERVICE_PID $AUTH_SERVICE_PID $BACKEND_PID $FRONTEND_PID"
    echo ""
    echo -e "${GREEN}🎯 Ready for browser extension testing!${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

    # Cleanup function for native deployment
    cleanup() {
        echo ""
        echo -e "${YELLOW}🛑 Shutting down DealPal platform...${NC}"
        
        # Kill processes gracefully
        if [ ! -z "$AI_SERVICE_PID" ]; then
            kill -TERM $AI_SERVICE_PID 2>/dev/null || true
        fi
        if [ ! -z "$AUTH_SERVICE_PID" ]; then
            kill -TERM $AUTH_SERVICE_PID 2>/dev/null || true
        fi
        if [ ! -z "$BACKEND_PID" ]; then
            kill -TERM $BACKEND_PID 2>/dev/null || true
        fi
        if [ ! -z "$FRONTEND_PID" ]; then
            kill -TERM $FRONTEND_PID 2>/dev/null || true
        fi
        
        # Wait for processes to terminate
        sleep 2
        
        # Force kill if still running
        if [ ! -z "$AI_SERVICE_PID" ]; then
            kill -KILL $AI_SERVICE_PID 2>/dev/null || true
        fi
        if [ ! -z "$AUTH_SERVICE_PID" ]; then
            kill -KILL $AUTH_SERVICE_PID 2>/dev/null || true
        fi
        if [ ! -z "$BACKEND_PID" ]; then
            kill -KILL $BACKEND_PID 2>/dev/null || true
        fi
        if [ ! -z "$FRONTEND_PID" ]; then
            kill -KILL $FRONTEND_PID 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ All services stopped${NC}"
        echo -e "${BLUE}👋 Thank you for using DealPal!${NC}"
        exit 0
    }

    # Set up signal handling
    trap cleanup INT TERM

    # Keep script running and show periodic status
    while true; do
        sleep 30
        echo -e "${CYAN}[$(date '+%H:%M:%S')] Services running... (Press Ctrl+C to stop)${NC}"
    done
fi
