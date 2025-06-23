dev:
	docker compose -f docker-compose.dev.yml up --build

prod:
	docker compose up --build

stop:
	docker compose down
	docker compose -f docker-compose.dev.yml down

logs:
	docker compose logs -f

clean:
	docker system prune -f
