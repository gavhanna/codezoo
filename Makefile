.PHONY: build up down logs migrate restart clean help

# Image name (matches GHCR)
IMAGE_NAME := ghcr.io/gavhanna/codezoo:latest

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker image locally
	docker build -t $(IMAGE_NAME) .

up: ## Start services (pulls or uses local image)
	docker-compose up -d

down: ## Stop and remove services
	docker-compose down

logs: ## View application logs
	docker-compose logs -f app

migrate: ## Run database migrations
	docker-compose exec app bunx prisma migrate deploy

restart: ## Restart services
	docker-compose restart

clean: ## Stop services and remove volumes (WARNING: deletes data)
	docker-compose down -v

build-up: build up ## Build image and start services

test-local: build-up migrate ## Full local test: build, start, and migrate
	@echo "Services started. Access at http://localhost:3000"
	@echo "Run 'make logs' to view logs"

pull: ## Pull latest image from GHCR
	docker-compose pull

update: pull up ## Pull latest image and restart services
