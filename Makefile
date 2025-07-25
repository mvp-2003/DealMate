# DealMate Docker/Podman Makefile
# Supports cross-platform development with Docker and Podman

# Detect container runtime
CONTAINER_RUNTIME := $(shell command -v podman 2> /dev/null || command -v docker 2> /dev/null)
COMPOSE_CMD := $(shell command -v podman-compose 2> /dev/null || command -v docker-compose 2> /dev/null || echo "docker compose")

# Default environment
ENV_FILE ?= .env
COMPOSE_FILE ?= docker-compose.yml
COMPOSE_OVERRIDE ?= docker-compose.override.yml

# Build arguments
DOCKER_BUILDKIT ?= 1
BUILDKIT_PROGRESS ?= plain

# Export build arguments
export DOCKER_BUILDKIT
export BUILDKIT_PROGRESS

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "DealMate Container Management"
	@echo "============================"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${GREEN}%-20s${NC} %s\n", $$1, $$2}'
	@echo ""
	@echo "Runtime: $(CONTAINER_RUNTIME)"
	@echo "Compose: $(COMPOSE_CMD)"

.PHONY: check-env
check-env: ## Check if .env file exists
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "${RED}Error: $(ENV_FILE) file not found!${NC}"; \
		echo "${YELLOW}Creating from .env.example...${NC}"; \
		cp .env.example $(ENV_FILE); \
		echo "${GREEN}Created $(ENV_FILE). Please update it with your values.${NC}"; \
	fi

.PHONY: setup
setup: check-env ## Initial project setup
	@echo "${GREEN}Setting up DealMate development environment...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) pull
	@echo "${GREEN}Setup complete!${NC}"

.PHONY: build
build: check-env ## Build all services
	@echo "${GREEN}Building all services...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) build --parallel

.PHONY: build-nocache
build-nocache: check-env ## Build all services without cache
	@echo "${GREEN}Building all services (no cache)...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) build --no-cache --parallel

.PHONY: up
up: check-env ## Start all services
	@echo "${GREEN}Starting all services...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) up -d
	@echo "${GREEN}Services started! Access the app at http://localhost:3000${NC}"

.PHONY: up-dev
up-dev: check-env ## Start services with development profile
	@echo "${GREEN}Starting development services...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile dev up -d
	@echo "${GREEN}Development services started!${NC}"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:8000"
	@echo "  AI Service: http://localhost:8001"
	@echo "  Auth Service: http://localhost:3001"
	@echo "  Adminer: http://localhost:8082"
	@echo "  Redis Commander: http://localhost:8081"

.PHONY: up-full
up-full: check-env ## Start all services including Kafka
	@echo "${GREEN}Starting all services with Kafka...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile full up -d

.PHONY: down
down: ## Stop all services
	@echo "${YELLOW}Stopping all services...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile dev --profile full down

.PHONY: down-volumes
down-volumes: ## Stop all services and remove volumes
	@echo "${RED}Stopping all services and removing volumes...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile dev --profile full down -v

.PHONY: restart
restart: down up ## Restart all services

.PHONY: logs
logs: ## View logs for all services
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f

.PHONY: logs-backend
logs-backend: ## View backend service logs
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f backend

.PHONY: logs-frontend
logs-frontend: ## View frontend service logs
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f frontend

.PHONY: logs-ai
logs-ai: ## View AI service logs
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) logs -f ai-service

.PHONY: ps
ps: ## List running services
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) ps

.PHONY: exec-backend
exec-backend: ## Access backend container shell
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend /bin/bash

.PHONY: exec-frontend
exec-frontend: ## Access frontend container shell
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend /bin/sh

.PHONY: exec-ai
exec-ai: ## Access AI service container shell
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec ai-service /bin/bash

.PHONY: exec-db
exec-db: ## Access database with psql
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec db psql -U dealpal -d dealpal

.PHONY: migrate
migrate: ## Run database migrations
	@echo "${GREEN}Running database migrations...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend ./scripts/migrate.sh

.PHONY: test
test: ## Run all tests
	@echo "${GREEN}Running tests...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend cargo test
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend npm test
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec ai-service pytest

.PHONY: test-backend
test-backend: ## Run backend tests
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend cargo test

.PHONY: test-frontend
test-frontend: ## Run frontend tests
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend npm test

.PHONY: test-ai
test-ai: ## Run AI service tests
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec ai-service pytest

.PHONY: lint
lint: ## Run linters
	@echo "${GREEN}Running linters...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend cargo clippy
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend npm run lint
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec ai-service flake8

.PHONY: format
format: ## Format code
	@echo "${GREEN}Formatting code...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec backend cargo fmt
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec frontend npm run format
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec ai-service black .

.PHONY: clean
clean: down-volumes ## Clean up everything
	@echo "${RED}Cleaning up Docker resources...${NC}"
	@$(CONTAINER_RUNTIME) system prune -f
	@echo "${GREEN}Cleanup complete!${NC}"

.PHONY: backup-db
backup-db: ## Backup database
	@echo "${GREEN}Backing up database...${NC}"
	@mkdir -p backups
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec -T db pg_dump -U dealpal dealpal > backups/dealpal_$$(date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}Database backed up to backups/dealpal_$$(date +%Y%m%d_%H%M%S).sql${NC}"

.PHONY: restore-db
restore-db: ## Restore database from backup (usage: make restore-db FILE=backups/dealpal_20240120_120000.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "${RED}Error: Please specify backup file. Usage: make restore-db FILE=backups/dealpal_20240120_120000.sql${NC}"; \
		exit 1; \
	fi
	@echo "${YELLOW}Restoring database from $(FILE)...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) exec -T db psql -U dealpal dealpal < $(FILE)
	@echo "${GREEN}Database restored!${NC}"

.PHONY: health
health: ## Check health of all services
	@echo "${GREEN}Checking service health...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "Health checks:"
	@curl -s http://localhost:8000/health > /dev/null && echo "✅ Backend API" || echo "❌ Backend API"
	@curl -s http://localhost:8001/health > /dev/null && echo "✅ AI Service" || echo "❌ AI Service"
	@curl -s http://localhost:3000/api/health > /dev/null && echo "✅ Frontend" || echo "❌ Frontend"
	@curl -s http://localhost:3001/health > /dev/null && echo "✅ Auth Service" || echo "❌ Auth Service"

.PHONY: update-images
update-images: ## Update all base images
	@echo "${GREEN}Updating base images...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) pull

# Multi-architecture build targets
.PHONY: build-multiarch
build-multiarch: ## Build images for multiple architectures
	@echo "${GREEN}Building multi-architecture images...${NC}"
	@$(CONTAINER_RUNTIME) buildx create --use --name dealpal-builder 2>/dev/null || true
	@$(CONTAINER_RUNTIME) buildx build --platform linux/amd64,linux/arm64 -t dealpal/backend:latest -f backend/Dockerfile backend
	@$(CONTAINER_RUNTIME) buildx build --platform linux/amd64,linux/arm64 -t dealpal/ai-service:latest -f backend/ai-service/Dockerfile backend/ai-service
	@$(CONTAINER_RUNTIME) buildx build --platform linux/amd64,linux/arm64 -t dealpal/frontend:latest -f frontend/Dockerfile .
	@$(CONTAINER_RUNTIME) buildx build --platform linux/amd64,linux/arm64 -t dealpal/auth-service:latest -f backend/auth-service/Dockerfile .

# Production deployment
.PHONY: deploy-prod
deploy-prod: ## Deploy to production
	@echo "${GREEN}Deploying to production...${NC}"
	@$(COMPOSE_CMD) -f $(COMPOSE_FILE) --profile production up -d
	@echo "${GREEN}Production deployment complete!${NC}"
