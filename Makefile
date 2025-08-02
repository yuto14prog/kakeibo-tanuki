# Kakeibo Tanuki - Development Commands

.PHONY: help dev build stop clean logs test-backend test-frontend test-e2e restart

# Default target
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment in background
	docker-compose -f docker-compose.dev.yml up --build -d

dev-logs: ## Start development environment with logs
	docker-compose -f docker-compose.dev.yml up --build

stop: ## Stop all containers
	docker-compose -f docker-compose.dev.yml down

restart: ## Restart development environment
	docker-compose -f docker-compose.dev.yml down
	docker-compose -f docker-compose.dev.yml up --build

clean: ## Remove all containers, volumes, and images
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -af --volumes

# Production commands
build: ## Build production containers
	docker-compose -f docker-compose.yml build

prod: ## Start production environment
	docker-compose -f docker-compose.yml up -d

# Logs
logs: ## Show logs from all containers
	docker-compose -f docker-compose.dev.yml logs -f

logs-backend: ## Show backend logs
	docker-compose -f docker-compose.dev.yml logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose -f docker-compose.dev.yml logs -f frontend

logs-db: ## Show database logs
	docker-compose -f docker-compose.dev.yml logs -f database

# Testing
test-backend: ## Run backend tests
	cd backend && go test ./...

test-frontend: ## Run frontend tests
	cd frontend && npm test

test-e2e: ## Run E2E tests
	cd frontend && npm run e2e

# Database operations
db-migrate: ## Run database migrations
	docker-compose -f docker-compose.dev.yml exec backend go run cmd/migrate/main.go

db-seed: ## Seed database with initial data
	docker-compose -f docker-compose.dev.yml exec backend go run cmd/seed/main.go

db-reset: ## Reset database (drop and recreate)
	docker-compose -f docker-compose.dev.yml down database
	docker volume rm kakeibo-tanuki_postgres_data_dev
	docker-compose -f docker-compose.dev.yml up database -d

# Development utilities
shell-backend: ## Open shell in backend container
	docker-compose -f docker-compose.dev.yml exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose -f docker-compose.dev.yml exec frontend sh

shell-db: ## Open PostgreSQL shell
	docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d kakeibo

# Status
status: ## Show container status
	docker-compose -f docker-compose.dev.yml ps