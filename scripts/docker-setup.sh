#!/bin/bash

# DealMate Docker Setup Script
# This script sets up the development environment for DealMate using Docker/Podmanin/bash

# DealMate Docker Setup Script
# This script sets up the development environment for DealMate using Docker/Podman

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running on supported OS
check_os() {
    local os=$(uname -s)
    case "$os" in
        Linux|Darwin)
            print_success "Detected OS: $os"
            ;;
        MINGW*|CYGWIN*|MSYS*)
            print_info "Detected Windows environment"
            print_info "Make sure Docker Desktop is installed and running"
            ;;
        *)
            print_error "Unsupported OS: $os"
            exit 1
            ;;
    esac
}

# Check architecture
check_arch() {
    local arch=$(uname -m)
    case "$arch" in
        x86_64|amd64)
            print_success "Detected architecture: amd64"
            ;;
        arm64|aarch64)
            print_success "Detected architecture: arm64"
            ;;
        *)
            print_error "Unsupported architecture: $arch"
            exit 1
            ;;
    esac
}

# Check if Docker or Podman is installed
check_container_runtime() {
    if command -v docker &> /dev/null; then
        CONTAINER_RUNTIME="docker"
        print_success "Docker is installed"
        docker --version
    elif command -v podman &> /dev/null; then
        CONTAINER_RUNTIME="podman"
        print_success "Podman is installed"
        podman --version
    else
        print_error "Neither Docker nor Podman is installed"
        echo "Please install Docker or Podman first:"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Podman: https://podman.io/getting-started/installation"
        exit 1
    fi
}

# Check if Docker Compose or Podman Compose is installed
check_compose() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        print_success "Docker Compose is installed"
    elif command -v podman-compose &> /dev/null; then
        COMPOSE_CMD="podman-compose"
        print_success "Podman Compose is installed"
    elif docker compose version &> /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
        print_success "Docker Compose (plugin) is installed"
    else
        print_error "Docker/Podman Compose is not installed"
        echo "Please install Docker Compose or Podman Compose"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check available memory
    if [[ "$OSTYPE" == "darwin"* ]]; then
        total_mem=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
    else
        total_mem=$(free -g | awk '/^Mem:/{print $2}')
    fi
    
    if (( $(echo "$total_mem < 4" | bc -l) )); then
        print_error "System has less than 4GB RAM. DealMate requires at least 4GB."
        exit 1
    else
        print_success "System has ${total_mem}GB RAM"
    fi
    
    # Check available disk space
    available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if (( available_space < 10 )); then
        print_error "Less than 10GB disk space available. DealMate requires at least 10GB."
        exit 1
    else
        print_success "Available disk space: ${available_space}GB"
    fi
}

# Setup environment file
setup_env() {
    print_info "Setting up environment configuration..."
    
    if [ -f .env ]; then
        print_info ".env file already exists"
        read -p "Do you want to backup and recreate it? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mv .env .env.backup.$(date +%Y%m%d_%H%M%S)
            print_success "Existing .env backed up"
        else
            return
        fi
    fi
    
    cp .env.example .env
    print_success "Created .env file from .env.example"
    
    # Generate secure passwords
    if command -v openssl &> /dev/null; then
        print_info "Generating secure passwords..."
        
        # Update PostgreSQL password
        PG_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        sed -i.bak "s/POSTGRES_PASSWORD=changeme_in_production/POSTGRES_PASSWORD=$PG_PASS/g" .env
        sed -i.bak "s/changeme_in_production@localhost:5432/dealmate:$PG_PASS@localhost:5432/g" .env
        
        # Update Redis password
        REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        sed -i.bak "s/REDIS_PASSWORD=changeme_in_production/REDIS_PASSWORD=$REDIS_PASS/g" .env
        sed -i.bak "s/changeme_in_production@localhost:6379/$REDIS_PASS@localhost:6379/g" .env
        
        # Update JWT secret
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/\n")
        sed -i.bak "s/JWT_SECRET=your-super-secret-jwt-key-changeme/JWT_SECRET=$JWT_SECRET/g" .env
        
        # Clean up backup files
        rm -f .env.bak
        
        print_success "Generated secure passwords"
    fi
    
    print_info "Please update the following in .env file:"
    echo "  - Auth0 configuration (AUTH0_DOMAIN, AUTH0_CLIENT_ID, etc.)"
    echo "  - API keys (GOOGLE_API_KEY, OPENROUTER_API_KEY, etc.)"
}

# Pull or build images
setup_images() {
    print_info "Setting up Docker images..."
    
    read -p "Do you want to build images locally? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Building Docker images (this may take a while)..."
        $COMPOSE_CMD build --parallel
        print_success "Docker images built successfully"
    else
        print_info "Pulling Docker images..."
        $COMPOSE_CMD pull
        print_success "Docker images pulled successfully"
    fi
}

# Initialize database
init_database() {
    print_info "Initializing database..."
    
    # Start only the database service
    $COMPOSE_CMD up -d db
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Check if database is healthy
    if $COMPOSE_CMD exec db pg_isready -U dealmate -d dealmate &> /dev/null; then
        print_success "Database is ready"
    else
        print_error "Database failed to start"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p logs backups ssl
    print_success "Created directories: logs, backups, ssl"
}

# Main setup
main() {
    echo "======================================"
    echo "DealMate Docker Setup"
    echo "======================================"
    echo
    
    # Check prerequisites
    check_os
    check_arch
    check_container_runtime
    check_compose
    check_requirements
    
    # Setup
    setup_env
    create_directories
    setup_images
    init_database
    
    echo
    echo "======================================"
    print_success "Setup completed successfully!"
    echo "======================================"
    echo
    echo "Next steps:"
    echo "1. Update your .env file with your API keys and Auth0 configuration"
    echo "2. Run 'make up' to start all services"
    echo "3. Run 'make migrate' to apply database migrations"
    echo "4. Access the application at http://localhost:3000"
    echo
    echo "Useful commands:"
    echo "  make help     - Show all available commands"
    echo "  make up-dev   - Start with development tools"
    echo "  make logs     - View logs for all services"
    echo "  make health   - Check health of all services"
    echo
    print_info "Happy coding! 🚀"
}

# Run main function
main
