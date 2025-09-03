.PHONY: help dev build up down clean seed migrate test lint format

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	docker-compose up -d postgres redis
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "📦 Installing dependencies..."
	cd .. && pnpm install
	@echo "🗄️  Running database migrations..."
	cd .. && cd apps/api && pnpm db:migrate
	@echo "🌱 Seeding database..."
	cd .. && cd apps/api && pnpm db:seed
	@echo "🔧 Starting development servers..."
	cd .. && pnpm dev

build: ## Build all applications
	@echo "🔨 Building applications..."
	cd .. && pnpm build

up: ## Start all services with Docker Compose
	@echo "🐳 Starting all services..."
	docker-compose up -d

down: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker-compose down

clean: ## Clean all build artifacts and containers
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f
	cd .. && pnpm clean
	cd .. && rm -rf node_modules
	cd .. && rm -rf apps/*/node_modules
	cd .. && rm -rf packages/*/node_modules

seed: ## Seed the database with sample data
	@echo "🌱 Seeding database..."
	cd .. && cd apps/api && pnpm db:seed

migrate: ## Run database migrations
	@echo "🗄️  Running migrations..."
	cd .. && cd apps/api && pnpm db:migrate

test: ## Run all tests
	@echo "🧪 Running tests..."
	cd .. && pnpm test

lint: ## Run linting
	@echo "🔍 Running linter..."
	cd .. && pnpm lint

format: ## Format code
	@echo "💅 Formatting code..."
	cd .. && pnpm format

logs: ## Show logs from all services
	docker-compose logs -f

api-logs: ## Show API logs
	docker-compose logs -f api

web-logs: ## Show web logs
	docker-compose logs -f web

db-logs: ## Show database logs
	docker-compose logs -f postgres

studio: ## Open Prisma Studio
	@echo "🔍 Opening Prisma Studio..."
	cd .. && cd apps/api && pnpm db:studio

shell: ## Open shell in API container
	docker-compose exec api sh

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U pokt_ai -d pokt_ai
