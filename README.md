# EduTracker

A full‑stack web application with an ASP.NET Core backend API and a React (Vite + TypeScript) frontend. The backend uses Entity Framework Core with PostgreSQL, CQRS-style application layers, and secure session-based authentication. The frontend consumes the API and can generate typed API clients from the OpenAPI spec.

- Backend: ASP.NET Core (net10.0), EF Core, PostgreSQL, Scalar/OpenAPI
- Frontend: React 19, Vite, TypeScript, Tailwind CSS

## Monorepo Layout

```
/ (repo root)
├─ backend/
│  ├─ EduTracker.Api/              # ASP.NET Core web API
│  ├─ EduTracker.Application/      # Business logic, CQRS, responses, validation
│  ├─ EduTracker.Domain/           # Entities, abstractions, enums
│  ├─ EduTracker.Infrastructure/   # Crypto, hashing, cache, external services
│  └─ EduTracker.Persistence/      # EF Core DbContext, configurations, migrations
├─ frontend/
│  └─ edu-tracker/                 # React + Vite frontend
├─ edutracker.slnx                 # Solution
├─ Directory.Build.props           # Shared .NET build properties (net10.0)
├�� Directory.Packages.props        # Central package management
└─ LICENSE
```

## Requirements

- .NET SDK 10.0
- Node.js LTS and npm
- PostgreSQL 18+ (or a compatible managed instance)

Optional but recommended:
- Redis (for distributed cache implementation present in Infrastructure)
- Docker (for local DB if preferred)

## Configuration

Backend configuration is read via appsettings and environment variables.

- Connection string key: `ConnectionStrings:Database`
- CORS: frontend allowed origin defaults to `http://localhost:3000`
- Super admin seeding (executed at startup via mediator):
  - Options type: `SuperAdminSeedOptions`
  - Supplied via user-secrets or environment variables (see example below)

Example environment variables (PowerShell):

```
$env:ConnectionStrings__Database = "Host=localhost;Port=5432;Database=edutracker;Username=postgres;Password=postgres"
$env:SuperAdminSeed__FirstName = "Admin"
$env:SuperAdminSeed__MiddleName = ""
$env:SuperAdminSeed__LastName = "User"
$env:SuperAdminSeed__UserName = "admin"
$env:SuperAdminSeed__Email = "admin@example.com"
$env:SuperAdminSeed__Password = "ChangeMe!123"
```

Alternatively, for local development you can use .NET user-secrets in `EduTracker.Api`:

```
cd backend/EduTracker.Api
# Set secrets
dotnet user-secrets set "ConnectionStrings:Database" "Host=localhost;Port=5432;Database=edutracker;Username=postgres;Password=postgres"
dotnet user-secrets set "SuperAdminSeed:FirstName" "Admin"
dotnet user-secrets set "SuperAdminSeed:MiddleName" ""
dotnet user-secrets set "SuperAdminSeed:LastName" "User"
dotnet user-secrets set "SuperAdminSeed:UserName" "admin"
dotnet user-secrets set "SuperAdminSeed:Email" "admin@example.com"
dotnet user-secrets set "SuperAdminSeed:Password" "ChangeMe!123"
```

## Getting Started (Development)

1) Backend API

``` bash
cd backend/EduTracker.Api
dotnet restore
dotnet ef database update --project ../EduTracker.Persistence
dotnet run
```

- API base URL in development: typically `https://localhost:3187` (per launchSettings)
- OpenAPI JSON: `/openapi/v1.json`
- Scalar UI (interactive docs): available in Development environment

2) Frontend

``` bash
cd frontend/edu-tracker
npm install
npm run dev
```

- Frontend dev server: `http://localhost:3000`
- The frontend expects the API to allow CORS from `http://localhost:3000`

3) Generate typed API client (optional but recommended)

``` bash
cd frontend/edu-tracker
npm run openapi-ts   # reads the backend OpenAPI at http://localhost:3187/openapi/v1.json
```

## Database & Migrations

- DbContext: `EduTracker.Persistence.Context.AppDbContext`
- Provider: Npgsql (PostgreSQL)
- Migrations are located under `backend/EduTracker.Persistence/Migrations`

Common EF Core commands (run in `backend/EduTracker.Api` or a project with the design-time factory, if present):

``` bash
# Add a new migration (from repo root)
 dotnet ef migrations add <Name> --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api

# Update database (from repo root)
 dotnet ef database update --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api
```

## Authentication & Sessions

- Authentication scheme: custom session-based scheme (`AuthenticationSchemes.Session`)
- Middleware: `TraceIdMiddleware`, `ExceptionHandlingMiddleware`
- Authorization: custom policies are registered via extension methods
- Cookies: handled via `CookieService` (backend) with credentials allowed in CORS

Ensure the frontend uses credentials for protected endpoints when necessary.

## Caching & Security Services

- Caching: `RedisCacheService` (wire up Redis connection if using distributed cache)
- Encryption: `AesGcmDataEncryptionService`
- Hashing: `HashingService`

## NPM/Yarn Scripts (frontend)

- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build production bundle
- `npm run preview` — preview build locally
- `npm run lint` — run ESLint
- `npm run openapi-ts` — generate typed API client from backend OpenAPI

## Troubleshooting

- 404 on OpenAPI or Scalar UI:
  - Ensure the environment is Development.
  - Confirm the API is running and `app.MapOpenApi()` is executed (it is within Development block).
- CORS errors from frontend:
  - Verify API is running and CORS origin includes `http://localhost:3000`.
- Database connection failures:
  - Validate `ConnectionStrings:Database` via env vars or user-secrets.
  - Ensure PostgreSQL is reachable and the database exists (EF will create schema on migrate).
- Super admin not created on startup:
  - Check `SuperAdminSeed` values provided via configuration.
  - Inspect logs for mediator/validation errors.

## Build & Deploy (overview)

- Backend can be containerized and configured via environment variables noted above.
- Frontend builds to static assets (`dist/`) via `npm run build` and can be served from any static host or reverse-proxied behind the API.
- For production, disable Developer-only endpoints and ensure HTTPS redirection is enabled (already enabled outside Development).

## License

This project is distributed under the terms of the MIT License. See the LICENSE file for details.
