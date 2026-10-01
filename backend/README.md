# EduTracker backend

ASP.NET Core (.NET 10) API + background worker + admin CLI. Clean Architecture with hand-rolled CQRS, EF Core + PostgreSQL, Redis (HybridCache + Streams), session-cookie auth, and a live SSE event stream.

Root overview: [../README](../README.md). Frontend guide: [../frontend/README](../frontend/README.md).

---

## Contents

1. [Projects](#1-projects)
2. [Running](#2-running)
3. [Architecture](#3-architecture)
4. [API docs](#4-api-docs)
5. [Auth, sessions, security](#5-auth-sessions-security)
6. [Realtime events](#6-realtime-events)
7. [Worker and outbox](#7-worker-and-outbox)
8. [CLI tool](#8-cli-tool)
9. [Database and migrations](#9-database-and-migrations)
10. [Configuration](#10-configuration)
11. [Tests](#11-tests)
12. [Docker](#12-docker)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Projects

```
backend/
├─ src/
│  ├─ EduTracker.Api/                  # HTTP host: Program.cs, Endpoints/, auth, middleware, rate limiting, OpenAPI/Scalar
│  ├─ EduTracker.Application/          # CQRS (IMediator/IHandler), Features/*, validation, OutboxProcessor, responses
│  ├─ EduTracker.Domain/               # Entities, roles/statuses, Guard, audit/sensitive/event components
│  ├─ EduTracker.Infrastructure/       # AES-GCM, BCrypt, HMAC, HybridCache+Redis, Redis Streams/StreamHub
│  ├─ EduTracker.Persistence/          # AppDbContext, entity configs, interceptors, outbox + audit, Migrations/
│  ├─ EduTracker.Worker/               # Background host: OutboxDispatcherHostedService only
│  ├─ EduTracker.Cli/                  # System.CommandLine admin tool (db, seed, sensitive-data, config)
│  └─ EduTracker.Shared/               # Host bootstrap only: config loader + OpenTelemetry setup
└─ test/
   ├─ EduTracker.Api.IntegrationTests/ # xUnit + Testcontainers (Postgres + Redis)
   └─ EduTracker.Domain.Tests/         # Pure xUnit domain unit tests
```

Solution: `EduTracker.slnx` (aspire + all backend projects). SDK pinned by `global.json`; `Directory.Build.props` sets `net10.0`, `ImplicitUsings`, `Nullable`, lock files; versions centrally pinned in `Directory.Packages.props`.

---

## 2. Running

Via Aspire from the repo root (starts API + worker; see root README for secrets):

```bash
aspire run
```

Standalone API:

```bash
cd backend/src/EduTracker.Api
dotnet restore
dotnet run
```

---

## 3. Architecture

Hand-rolled CQRS (no MediatR):

```
Endpoint handler (thin) → IMediator.Send(Command|Query)
  → ActorContextBehavior → ValidationBehavior (FluentValidation)
  → LoggingBehavior → RetryBehavior
  → Handler uses AppDbContext directly (no generic repository/UoW)
  → OutboxInterceptor converts DomainEvents → OutboxMessage rows
  → AuditInterceptor fills audit columns
```

* **`EduTracker.Domain`** — rich entities with `Try*` mutators that raise domain events. Users (`User`, `UserSensitive`, `UserSession`, roles `User|Admin|SuperAdmin`); organizations (`Organization`, `OrganizationMember` roles `Owner|Admin|Member`, statuses `Active|Banned`, invites `Pending|Accepted|Rejected|Cancelled`); incidents (`Incident` status `Open|InProgress|Resolved|Closed`, priority `Low|Medium|High|Critical`, severity `Minor|Moderate|Major|Critical`, plus `IncidentWorkbook`, `IncidentSheet`, `IncidentShareLink`, `IncidentSensitive`). Cross-cutting: `AuditState`, `SensitiveDataState<T>`, `DomainEvent`, `Guard`.
* **`EduTracker.Application`** — `Features/{Auth,Users,Sessions,Organizations,OrganizationMembers,OrganizationInvites,Incidents,IncidentWorkbooks,IncidentSheets,IncidentShares,Streams,Security,Seeders}`, each with `Command|Query + Handler + Validator`. Responses use `OperationResult<T>`; failures throw `AppException`, mapped to `ApiResponse<T>` at the edge.
* **`EduTracker.Persistence`** — `AppDbContext`, 11 entity configs, snake_case Npgsql. Interceptors: `OutboxInterceptor`, `AuditInterceptor`, `DomainEventClearingInterceptor`.
* **`EduTracker.Infrastructure`** — `AesGcmEncryptionService` (versioned envelope, HKDF per key-version + purpose), `PasswordHashService` (BCrypt), `EmailHashService` (HMAC), `TokenService`, HybridCache + Redis, Redis Streams publisher + `StreamHub`.
* **`EduTracker.Shared`** — no DTOs. Layered config loader + `AddOpenTelemetryObservability(serviceName)`.
* **`EduTracker.Api`** — Minimal API host. Middleware: `ForwardedHeaders → CORS → (dev) OpenAPI+Scalar → TraceId → ExceptionHandling → Authentication → RateLimiter → Authorization → endpoints`. JSON: camelCase, ignore nulls, string enums. `RedisMessageListener` bridges Redis Streams → `StreamHub`.
* **`EduTracker.Worker`** — generic host + `OutboxDispatcherHostedService` on a poll interval.

---

## 4. API docs

Live reference in Development: Scalar UI plus `/openapi/v1.json`. Run the API and open Scalar to browse every endpoint, shape, and auth requirement.

Groups: auth, users, sessions, organizations, members, invites, workbooks, sheets, incidents, shares, public incident links, events (SSE), base info.

---

## 5. Auth, sessions, security

* Custom **session scheme** (`"Session"`), not JWT. `SessionAuthenticationHandler` reads the `HttpOnly` cookie, validates the session snapshot, checks user state (missing/locked = reject), then issues `NameIdentifier + Role + SessionId` claims.
* Policies: `UserOnly (User)`, `AdminsOnly (Admin, SuperAdmin)`, `SuperAdminOnly (SuperAdmin)`.
* Passwords: BCrypt (`PasswordWorkFactor 12`). Emails: HMAC lookup hash + AES-GCM encrypted `UserSensitive`. Incident text: encrypted `IncidentSensitive` with a separate purpose.
* Lifetimes from `SessionLifetimeOptions` (8h standard, 168h remember-me, 2160h absolute cap, sliding extension). Session/auth snapshots cached 10 min via HybridCache.
* Rate limiting: global per-IP `300/60s` + tiers `Strict 10`, `Moderate 30`, `Standard 80`, `Relaxed 120` per 60s. `429` returns `SYSTEM:TOO_MANY_REQUESTS`.

Key rotation: add `DataEncryptionOptions:Keys:2` in user-secrets, bump `DataEncryptionOptions:CurrentKeyVersion` to `2`, re-run. Old keys are kept for decryption.

---

## 6. Realtime events

Topic subscribe/unsubscribe plus an SSE stream backed by `StreamHub`. Flow: domain event → outbox → worker/handlers → `RedisStreamService` → `RedisMessageListener` → per-user `StreamEventBuffer` (`MaxEventsPerUser: 200`, `RetentionMinutes: 5`) → SSE.

---

## 7. Worker and outbox

`EduTracker.Worker` runs `OutboxDispatcherHostedService`, looping `OutboxProcessor.ProcessOutboxMessagesAsync` then delaying by the poll interval. The processor claims a batch with `SELECT ... FOR UPDATE SKIP LOCKED`, dispatches to `IDomainEventHandler<T>`, retries with backoff, dead-letters after `MaxRetryCount`.

---

## 8. CLI tool

Same DI as API/worker (`System.CommandLine`):

```bash
dotnet run --project backend/src/EduTracker.Cli -- --help
dotnet run --project backend/src/EduTracker.Cli -- db migrate
dotnet run --project backend/src/EduTracker.Cli -- seed super-admin --first-name Jane --last-name Doe --username janedoe --email j.doe@EduTracker.dev --password "SecurePass123!"
dotnet run --project backend/src/EduTracker.Cli -- config validate
dotnet run --project backend/src/EduTracker.Cli -- sensitive-data migrate --entity all --target-key-version 2
# --entity|-e {all|user|incident} (repeatable, required), --target-key-version|-t required,
# --batch-size (default 512), --dry-run
```

---

## 9. Database and migrations

`EduTracker.Persistence/Context/AppDbContext.cs` (+ design-time `AppDbContextFactory` honoring `ConnectionStrings__Database`).

```bash
dotnet ef migrations add <Name> --project backend/src/EduTracker.Persistence
dotnet ef database update --project backend/src/EduTracker.Persistence
dotnet ef database drop --project backend/src/EduTracker.Persistence
```

Policy: only additive/backfill (expand/contract) migrations go through the automated CI `migrate` job. Destructive migrations are applied manually with services stopped.

---

## 10. Configuration

Loaded via `EduTracker.Shared` (`SharedConfig.props` into Api/Worker/Cli):

```
appsettings.Shared.json → appsettings.Shared.{Env}.json
  → appsettings.json → appsettings.{Env}.json
  → user-secrets (Development) → DOTNET_/ASPNETCORE_ + bare env vars
```

Required secrets (shared User Secrets ID across Api/Worker/Cli/Persistence/AppHost):

```bash
cd backend/src/EduTracker.Api
dotnet user-secrets set "ConnectionStrings:Database" "Host=localhost;Port=5432;Database=EduTracker;Username=postgres;Password=postgres"
dotnet user-secrets set "ConnectionStrings:Redis" "localhost:6379,abortConnect=false"
dotnet user-secrets set "DataEncryptionOptions:Keys:1" "<YOUR_32_BYTE_KEY_BASE64>"
dotnet user-secrets set "DataEncryptionOptions:CurrentKeyVersion" "1"
dotnet user-secrets set "HashingOptions:EmailHmacKey" "<YOUR_32_BYTE_KEY_BASE64>"
```

Everything else ships with defaults (`shared-config/appsettings.Shared.json`). `OTEL_EXPORTER_OTLP_ENDPOINT` enables OTLP export when set.

---

## 11. Tests

```bash
dotnet restore EduTracker.slnx --locked-mode
dotnet build EduTracker.slnx -c Release -p:TreatWarningsAsErrors=true
dotnet test EduTracker.slnx -c Release
# Narrower:
dotnet test backend/test/EduTracker.Domain.Tests
dotnet test backend/test/EduTracker.Api.IntegrationTests   # needs Docker (Testcontainers)
```

* `EduTracker.Domain.Tests`: entity-invariant unit tests.
* `EduTracker.Api.IntegrationTests`: boots Postgres + Redis via Testcontainers; currently `Auth/RegisterThenLoginTests`.

---

## 12. Docker

* `backend/Dockerfile` — combined Render image (publishes Api + Worker, `entrypoint.combined.sh`).
* `backend/src/EduTracker.Api/Dockerfile` + `backend/src/EduTracker.Worker/Dockerfile` — per-service images validated by CI.

---

## 13. Troubleshooting

* Scalar not loading — dev-only (`ASPNETCORE_ENVIRONMENT=Development`), API must be running.
* DB connection — verify `ConnectionStrings:Database`, Postgres running, migrations applied.
* Redis connection — verify `ConnectionStrings:Redis` (local needs `,abortConnect=false`).
* Seed rejected — password complexity / valid email required.
* `429` — rate limiter window (60s); wait and retry.
