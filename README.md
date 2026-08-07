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

Copy the example environment file, replace its placeholder password, and build and start the complete stack:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open the application at http://localhost:4200. The API is available at http://localhost:5080, with its health endpoint at http://localhost:5080/health.

Useful Docker commands:

```powershell
# Start or rebuild the stack in the background
docker compose up -d --build

# Show container state and health
docker compose ps

# Follow logs from every service
docker compose logs -f

# Follow logs from one service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db

# Rebuild only the API image without its build cache
docker compose build --no-cache api

# Stop and remove the containers and network
docker compose down
```

PostgreSQL data and ASP.NET Core data-protection keys persist in named volumes. `docker compose down` preserves those volumes. To also delete all local Finora database data, run `docker compose down --volumes`; this is destructive and cannot be undone.

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

## Production deployment

The root `Dockerfile` builds the Angular application and serves it from the ASP.NET Core API so the UI, API, and secure authentication cookie share one origin. `render.yaml` defines a Render web service in Frankfurt with automatic deploys after CI passes and `/health` monitoring.

To deploy entirely within the free tiers:

1. Create a Neon project on the **Free** plan in a European region, leave scale-to-zero enabled, and copy its pooled connection details. Do not upgrade the project to a usage-based plan.
2. In Render, create a Blueprint from this repository. The Blueprint explicitly selects the **Free** web-service plan and does not create a paid disk or Render database. When prompted for `ConnectionStrings__DefaultConnection`, enter the Neon connection as an Npgsql connection string:

   ```text
   Host=<host-pooler>;Database=<database>;Username=<user>;Password=<password>;SSL Mode=Require;Channel Binding=Require
   ```

3. Deploy the Blueprint. The API applies EF Core migrations automatically during startup, and Render verifies `/health` before marking the deployment healthy.

Do not commit the Neon connection string. Render stores the `sync: false` value as a secret environment variable.

The free Render service sleeps after inactivity, so the first request after an idle period can take about a minute. Neon also scales idle compute to zero. Stay within Neon's free storage and compute allowances to keep the deployment at $0.

## Project structure

- `apps/finora-web`: Angular UI, core auth/layout, shared utilities, and lazy features
- `apps/Finora.Api`: API composition, Identity, EF data model, and feature services
- `tests/Finora.Api.Tests`: isolated backend tests
- `docker-compose.yml`: web, API, and PostgreSQL development stack
- `Dockerfile` and `render.yaml`: production container and Render Blueprint
- `.github/workflows/ci.yml`: frontend and backend CI

## Security

Identity's password hashing and secure HttpOnly cookies handle authentication. Production cookies require HTTPS. CORS is limited to the configured frontend origin. API DTOs avoid exposing Identity or EF internals, login errors do not reveal whether an email exists, and user-owned reads/writes validate ownership. Keep `.env` out of source control, rotate deployed secrets, terminate TLS at the edge, and use a managed secret store in production.
