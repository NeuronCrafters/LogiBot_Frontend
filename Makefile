# Caminhos dos docker-compose
DEV_COMPOSE=docker-compose.dev.yml
PROD_COMPOSE=docker-compose.yml

# ======================
# 💻 Comandos de Dev
# ======================

dev:
	docker compose -f $(DEV_COMPOSE) up --build

dev-down:
	docker compose -f $(DEV_COMPOSE) down

dev-restart:
	docker compose -f $(DEV_COMPOSE) down && docker compose -f $(DEV_COMPOSE) up --build

# ======================
# 🚀 Comandos de Prod
# ======================

prod:
	docker compose -f $(PROD_COMPOSE) up --build

prod-down:
	docker compose -f $(PROD_COMPOSE) down

prod-restart:
	docker compose -f $(PROD_COMPOSE) down && docker compose -f $(PROD_COMPOSE) up --build

# ======================
# 🔧 Utilitários
# ======================

logs:
	docker compose logs -f

ps:
	docker compose ps

clean:
	docker system prune -f --volumes

prune-images:
	docker image prune -a -f

# ======================
# 🧪 Testes futuros
# ======================

test:
	echo "FUTURAMENTE TEREMOS TESTES AQUI."

# ======================
# 📦 Build manual (avançado)
# ======================

build-dev:
	docker compose -f $(DEV_COMPOSE) build

build-prod:
	docker compose -f $(PROD_COMPOSE) build
