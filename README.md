# Finora

Finora is a production-oriented personal finance starter: an Angular 22 standalone SPA backed by an ASP.NET Core 10 API and PostgreSQL.

## Architecture

`apps/finora-web` uses lazy feature routes, Angular Material, strict TypeScript/templates, and Signals for authentication state. Cookies are sent with API calls; credentials are never stored in browser storage. `apps/Finora.Api` uses minimal HTTP endpoints, feature services, Identity, EF Core, Problem Details, UTC timestamps, and PostgreSQL `numeric(18,2)` money columns. Every financial query includes the authenticated user ID. `tests/Finora.Api.Tests` uses EF Core's isolated in-memory provider.

## Prerequisites

- Node.js 22.22.3 or newer and npm 10+
- .NET SDK 10
- PostgreSQL 17, or Docker Desktop
- `dotnet-ef` 10 for migration commands

## Setup and local development

Copy `.env.example` to `.env` and replace the development password. For a local (non-Docker) database, update `apps/Finora.Api/appsettings.Development.json` or set `ConnectionStrings__DefaultConnection`.

```powershell
cd apps/finora-web
npm ci
npm start
```

In a second terminal:

```powershell
dotnet restore Finora.slnx
dotnet run --project apps/Finora.Api --urls http://localhost:5080
```

Open http://localhost:4200. OpenAPI is available at `/openapi/v1.json` in Development and health status at `/health`.

## Docker development

```powershell
Copy-Item .env.example .env
docker compose up --build
docker compose down
```

PostgreSQL data persists in the `postgres_data` named volume.

## Migrations

```powershell
dotnet tool install --global dotnet-ef --version 10.*
dotnet ef migrations add MigrationName --project apps/Finora.Api
dotnet ef database update --project apps/Finora.Api
```

## Quality checks

```powershell
cd apps/finora-web
npm run lint
npm test -- --watch=false
npm run build
cd ../..
dotnet test Finora.slnx
```

## Project structure

- `apps/finora-web`: Angular UI, core auth/layout, shared utilities, and lazy features
- `apps/Finora.Api`: API composition, Identity, EF data model, and feature services
- `tests/Finora.Api.Tests`: isolated backend tests
- `docker-compose.yml`: web, API, and PostgreSQL development stack
- `.github/workflows/ci.yml`: frontend and backend CI

## Security

Identity's password hashing and secure HttpOnly cookies handle authentication. Production cookies require HTTPS. CORS is limited to the configured frontend origin. API DTOs avoid exposing Identity or EF internals, login errors do not reveal whether an email exists, and user-owned reads/writes validate ownership. Keep `.env` out of source control, rotate deployed secrets, terminate TLS at the edge, and use a managed secret store in production.

To launch with Docker:
Copy-Item .env.example .env
# Replace placeholder passwords in .env
docker compose up --build
Then open http://localhost:4200.
To launch directly:
dotnet ef database update --project apps/Finora.Api
dotnet run --project apps/Finora.Api --urls http://localhost:5080
In another terminal:
cd apps/finora-web
npm ci
npm start