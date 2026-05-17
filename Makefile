.PHONY: dev prod health migrate-up migrate-down logs stop clean build

COMPOSE_DEV = docker compose -f infra/docker-compose.dev.yml --env-file infra/.env

# ── local dev ────────────────────────────────────────────────────────────────
dev:
	$(COMPOSE_DEV) up -d --build
	@echo "Waiting for backend..."
	@sleep 5
	@$(MAKE) migrate-up
	@$(MAKE) health

health:
	@curl -sf http://localhost/health && echo " ✓ /health OK" || echo " ✗ /health FAILED"

# ── migrations ───────────────────────────────────────────────────────────────
migrate-up:
	$(COMPOSE_DEV) exec backend sh -c \
		'goose -dir /app/migrations postgres "$$DATABASE_URL" up' 2>/dev/null || \
	docker run --rm --network survey-infra_survey-internal \
		-e GOOSE_DRIVER=postgres \
		-e GOOSE_DBSTRING="$(DATABASE_URL)" \
		ghcr.io/kukymbr/goose-docker:latest up

migrate-down:
	$(COMPOSE_DEV) exec backend sh -c \
		'goose -dir /app/migrations postgres "$$DATABASE_URL" down'

# ── operations ───────────────────────────────────────────────────────────────
logs:
	$(COMPOSE_DEV) logs -f --tail=100

stop:
	$(COMPOSE_DEV) down

clean:
	$(COMPOSE_DEV) down -v --remove-orphans

build:
	$(COMPOSE_DEV) build --no-cache

ps:
	$(COMPOSE_DEV) ps
