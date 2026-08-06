start:
	docker compose up --build
stop:
	docker compose down
lint:
	cd apps/finora-web && npm run lint
test-web:
	cd apps/finora-web && npm test -- --watch=false
test-api:
	dotnet test Finora.slnx
migration:
	dotnet ef migrations add $(name) --project apps/Finora.Api
database-update:
	dotnet ef database update --project apps/Finora.Api
