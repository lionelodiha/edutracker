# EduTracker

School management platform. Multi-tenant organizations own academic records with invites, member roles, session auth, and secure data handling.

| Layer    | Stack                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| Backend  | ASP.NET Core (.NET 10), EF Core + PostgreSQL, Redis, session auth — see [backend/README](./backend/README.md)     |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS — see [frontend/edu-tracker/README](../../frontend/edu-tracker/README.md) |
| Ops      | Aspire (local orchestration), Docker, Render, GitHub Actions CI                                                   |

---

## Repository layout

```
/
├─ .github/                 # CI: check → build → migrate → deploy
├─ aspire/                  # Local orchestration: api + worker + web
├─ backend/                 # src + test
├─ frontend/                # React SPA
├─ shared-config/           # Shared appsettings (base defaults + Development overrides)
├─ monitoring/              # Standalone Prometheus + Grafana datasource configs
├─ global.json              # .NET SDK pin
├─ LICENSE                  # MIT
├─ edutracker.slnx          # Solution (aspire + backend projects)
└─ render.yaml              # Render DB + Redis + backend + frontend
```

Detailed guides:

* [backend/README](./backend/README.md) — architecture, auth, worker/outbox, CLI, database, backend tests

---

## Prerequisites

* **.NET SDK 10.0** (pinned by `global.json`)
* **Node** + npm (Docker builds use `node:24-alpine`; CI uses Node 24)
* **Your own PostgreSQL and Redis locally** — Aspire orchestrates only API + worker + web
* **Aspire CLI**: [Get started with Aspire](https://aspire.dev/get-started/install-cli/)
* **Docker** — required for backend integration tests (Testcontainers)

---

## Quickstart (full stack via Aspire)

```bash
# 1. Set secrets once (shared across Api/Worker/Cli/Persistence/AppHost)
cd backend/src/EduTracker.Api
dotnet user-secrets set "ConnectionStrings:Database" "Host=localhost;Port=5432;Database=edutracker;Username=postgres;Password=postgres"
dotnet user-secrets set "ConnectionStrings:Redis" "localhost:6379,abortConnect=false"
dotnet user-secrets set "DataEncryptionOptions:Keys:1" "<YOUR_32_BYTE_KEY_BASE64>"
dotnet user-secrets set "DataEncryptionOptions:CurrentKeyVersion" "1"
dotnet user-secrets set "HashingOptions:EmailHmacKey" "<YOUR_32_BYTE_KEY_BASE64>"

# 2. Run everything from the repo root
cd ../../..
aspire run
```

First run: the Aspire dashboard prompts for any missing values (prefilled from user-secrets). Tick **Save** for future runs.

```bash
# 3. Migrate + seed
dotnet ef database update --project backend/src/EduTracker.Persistence
dotnet run --project backend/src/EduTracker.Cli -- seed super-admin --first-name Admin --last-name Super --username admin --email admin@example.com --password "ChangeMe!123"
```

Open the Vite app URL shown by Aspire and sign in. API reference: Scalar UI + `/openapi/v1.json` in Development.

Key rotation and per-service config: see [backend/README](./backend/README.md).

---

## Configuration

Base defaults live in `shared-config/appsettings.Shared.json`. The five secrets above are the only required values; everything else ships with working defaults. No `.env` files in the repo. CI needs `DB_CONNECTION_STRING`, `RENDER_API_DEPLOY_HOOK`, `RENDER_WEB_DEPLOY_HOOK`; Render uses `sync: false` dashboard secrets (see `render.yaml`).

---

## CI and deployment

`.github/workflows/ci.yml` on `main`: `check` (lint + typecheck + build + test) → `build` (validates Docker images) → `migrate` (CLI `db migrate`, additive-only) → `deploy` (Render hooks). `render.yaml` has `autoDeploy: false` — deploys are gated on CI.

---

## Troubleshooting

* Scalar not loading — dev-only, API must be running.
* DB/Redis connection — verify the two connection strings, services running, migrations applied.
* Aspire blocks on secrets — fill the 5 prompts or prefill via user-secrets.
* Frontend “Can’t reach the server” — API down or Render cold-start; retry. `401` alone means signed out.

---

## License

MIT — see [LICENSE](./LICENSE). Copyright (c) 2026 Victor Awugosi.
