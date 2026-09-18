# DevOps Work Breakdown

`DELIVERY-PLAYBOOK.md` split into tickets. Each one is independently
reviewable, has a clear finish line, and says what it blocks.

Branch: `devops-work`
Tick items off as they merge.

---

## How this is ordered

Seven tracks. **A, F1 and F2 have no dependencies — start there today.**
B blocks C. C blocks H. Everything else can run in parallel.

```
A  hygiene ──┐
             ├──▶ C  CI ──▶ H  deploy
B  tests ────┘         ▲
                       │
D  containers ─────────┤
E  migrations ─────────┤
F  observability ──────┘
G  security  (parallel, no blockers)
```

---

## Track A — Repo hygiene

No dependencies. Whole track is about a day. Do it first: it makes every
later diff readable.

- [ ] **A1 · Pin the SDK** — `global.json` at repo root, version `10.0.100`,
      `rollForward: latestFeature`.
      *Done when:* `dotnet --version` in the repo reports the pinned SDK.
      *Size:* 15 min

- [ ] **A2 · Add `.editorconfig`** — C# and TS conventions.
      *Done when:* `dotnet format --verify-no-changes` passes on a clean tree.
      *Size:* 1 h (mostly deciding, then one formatting commit)
      *Note:* commit the reformat **separately** from the config, or every
      later blame is useless.

- [ ] **A3 · Delete dead code** — `backend/EduTracker/` has no `.csproj` and is
      in no solution. `backend/prisma/` and `backend/src/` are from the old
      Node stack.
      *Done when:* the solution still builds and those directories are gone.
      *Size:* 30 min
      *Check first:* `grep -r "EduTracker\.Entities\|prisma" --include=*.cs`
      to confirm nothing references them.

- [ ] **A4 · `.gitignore` for build output** — `*.log`, `lint.txt`, `tmp_*.txt`,
      `dist/`, `TestResults/`, `coverage/`.
      *Done when:* `git status` is clean after a full build and test run.
      *Size:* 15 min
      *Note:* `tmp_migration_log.txt` and `frontend/edu-tracker/lint.txt` are
      already **tracked**, so gitignore alone won't drop them — needs
      `git rm --cached` on both.

---

## Track B — Test foundation

**Blocks C.** A pipeline with no tests only proves the code compiles, then
wears a green tick that makes everyone believe more than that was checked.

- [ ] **B1 · `EduTracker.Domain.Tests`** — xUnit. Test the entity invariants:
      every `Validate*` throwing path, every `Update*` no-op path. No database.
      *Done when:* `dotnet test` runs green and covers `Department`, `Course`,
      `Semester`, `Term`, `Organization`.
      *Size:* 1 day

- [ ] **B2 · Make `Program` reachable** — add `public partial class Program { }`
      to the end of `Program.cs`, and `<InternalsVisibleTo>` for the
      integration test project in `EduTracker.Api.csproj`.
      *Done when:* a test project can reference `Program` and internal handlers.
      *Size:* 15 min
      *Blocks:* B3

- [ ] **B3 · `EduTracker.Api.IntegrationTests`** — `WebApplicationFactory<Program>`
      plus Testcontainers for Postgres 16 and Redis 7. Apply **migrations**, not
      `EnsureCreated` — the latter skips raw `HasFilter` SQL, so the tests would
      not exercise the real schema.
      *Done when:* one endpoint test passes against a real containerised DB.
      *Size:* 1 day
      *Needs:* B2, and Docker running on the dev machine

- [ ] **B4 · The four tests that matter** —
      1. Auth: sign in, cookie issued, protected endpoint accepts, revoked
         session rejected.
      2. One role check per role: Teacher hitting an Owner-only endpoint → 403.
      3. **Cross-organization isolation**: actor in org A, resource id from
         org B → 403 or 404, never 200. Write this for every endpoint taking
         an id.
      4. Unique indexes: insert the duplicate, assert the conflict response.
      *Done when:* all four pass, and #3 exists for every id-taking endpoint.
      *Size:* 1–2 days
      *Note:* #3 is the class of bug that becomes a data breach. Do not skip it.

- [ ] **B5 · Frontend tests** — Vitest + Testing Library, plus one Playwright
      smoke path: register → create organization → create semester → sign out.
      *Done when:* `npm test` and the smoke path both pass locally.
      *Size:* 1 day

---

## Track C — Continuous integration

**Needs B.** Land C1–C3 together as one `ci.yml`.

- [ ] **C1 · Backend job** — `setup-dotnet` with `global-json-file`, NuGet cache
      keyed on `Directory.Packages.props` + `**/*.csproj`, restore, build
      `-warnaserror`, `dotnet format --verify-no-changes`, test with coverage,
      upload results with `if: always()`.
      *Size:* 2 h

- [ ] **C2 · Frontend job** — Node 22, `npm ci` (not `install`), `tsc -b --noEmit`,
      lint, build.
      *Size:* 1 h

- [ ] **C3 · Image job** — build the API image on every PR to prove the
      Dockerfile still works; push to GHCR only from `main`, tagged
      `${{ github.sha }}`. **Never `:latest`** — that is not a thing you can
      roll back to.
      *Size:* 1 h

- [ ] **C4 · SDK drift check** — regenerate the client, then
      `git diff --exit-code src/api`. Fails the build when the backend contract
      changed and the SDK was not regenerated.
      *Done when:* deliberately changing a request record fails CI.
      *Size:* 2 h
      *Why:* this is exactly how the Create Department 500 reached the frontend.

- [ ] **C5 · Branch protection** — require C1–C3 on `main`, one review, branch
      up to date before merge. Add `concurrency` with `cancel-in-progress`.
      *Done when:* a PR cannot merge with a red check.
      *Size:* 15 min

---

## Track D — Containers

Independent of B and C.

- [ ] **D1 · Frontend Dockerfile** — multi-stage node → nginx, with an SPA
      fallback so a refresh on `/dashboard/organizations` doesn't 404.
      *Size:* 2 h

- [ ] **D2 · Runtime config** — Vite bakes `import.meta.env` at **build** time,
      so one image per environment unless you emit `/config.js` at container
      start. Do the runtime version.
      *Done when:* the same image works against local and staging by env var alone.
      *Size:* 3 h

- [ ] **D3 · Compose profiles** — `profiles: ["full"]` on `api` and `web`, so
      `docker compose up -d` gives dependencies only and `--profile full` gives
      everything.
      *Size:* 1 h

---

## Track E — Migrations as a gate

- [ ] **E1 · Migration script artifact** — `dotnet ef migrations script
      --idempotent` in CI, uploaded so the reviewer reads the SQL that will run
      against production rather than inferring it from C#.
      *Size:* 1 h

- [ ] **E2 · Write down expand/contract** — old and new code run against one
      database during any rolling deploy, so a migration must not break the
      version still running. Add: expand → backfill → contract.
      *Done when:* it is in `CONTRIBUTING.md` and referenced from the PR template.
      *Size:* 1 h
      *Live example:* `MakeDepartmentFacultyOptional` widened a column, which is
      safe. A rename would not have been.

---

## Track F — Observability

**F1 and F2 have no dependencies and are quick. Pull them forward.**

- [ ] **F1 · Health endpoints** — `/health/live` (process only, `Predicate = _ => false`)
      and `/health/ready` (Postgres + Redis, tagged).
      *Done when:* both respond, and `/health/ready` fails when Postgres is stopped.
      *Size:* 2 h
      *Critical:* liveness must **not** check dependencies. If it does, a
      30-second Postgres hiccup fails every replica's liveness, the orchestrator
      kills them all, and they restart into a database already struggling. You
      turn a blip into an outage.

- [ ] **F2 · Compose healthcheck for `api`** — point it at `/health/ready`.
      *Size:* 15 min
      *Needs:* F1

- [ ] **F3 · Structured logging** — Serilog, JSON output.
      *Size:* 3 h
      *Careful:* this system holds student names, emails and grades, and you
      already encrypt some at rest. Never log a request body, a session cookie,
      or an email — log the user id.

- [ ] **F4 · One trace id** — make `TraceIdMiddleware` read W3C `traceparent`
      when present, fall back to generating, and emit the same value in the
      response header, every log line and the OTel trace.
      *Done when:* an id from a support ticket finds the logs and the trace.
      *Size:* 3 h

- [ ] **F5 · OpenTelemetry** — ASP.NET Core, EF Core, Npgsql and Redis
      instrumentation, OTLP exporter. Filter `/health` or probes drown the trace
      store.
      *Size:* 1 day

- [ ] **F6 · SLOs and burn-rate alerts** — availability 99.5% on `/api/*`,
      p95 400ms on authenticated reads, 99.9% on session creation. Alert on
      **budget burn**, not CPU: page at 14.4× over 1 h, ticket at 6× over 6 h.
      *Size:* 1 day
      *Needs:* F5
      *Note:* schools use this 8am–4pm on weekdays. Ten minutes down on a Sunday
      is not the same event as ten minutes down during registration — your
      alerting policy is allowed to say so.

---

## Track G — Security and supply chain

No blockers. G1 is the one with a live exposure.

- [ ] **G1 · Rate limiting** — `AddRateLimiter` on the sign-in endpoint. Partition
      **by IP, not username** — limiting by username lets an attacker lock every
      real account out by failing logins on their behalf.
      *Done when:* the 11th sign-in attempt in a minute returns 429.
      *Size:* 2 h

- [ ] **G2 · Dependabot** — NuGet, npm, Docker, GitHub Actions. Group patch
      updates into one weekly PR so it stays readable.
      *Size:* 1 h

- [ ] **G3 · CodeQL** — both languages, on PRs and weekly.
      *Size:* 1 h

- [ ] **G4 · Image scanning** — Trivy on the built image, plus an SBOM. Pin
      actions to a commit SHA, not a tag — tags are mutable.
      *Size:* 2 h

- [ ] **G5 · Key rotation runbook** — `DataEncryptionOptions` already holds a
      keyring plus `CurrentKeyVersion`, so rotation is possible today. Write the
      four steps down: add v2 → switch current → re-encrypt → **verify zero rows
      on v1, then** retire v1.
      *Size:* 2 h
      *Warning:* removing a key while ciphertext still references it destroys
      that data as surely as dropping the table. There is no recovery.

---

## Track H — Deployment

**Last.** Needs C, D and F1.

- [ ] **H1 · Staging environment** — managed container service, managed Postgres
      with automated backups, managed Redis. Not Kubernetes.
      *Size:* 1–2 days

- [ ] **H2 · Deploy pipeline** — migration job, then rolling deploy, then the
      Playwright smoke path against staging.
      *Size:* 1 day

- [ ] **H3 · Production with a gate** — GitHub environment protection requiring
      human approval, migration applied as its own job before the app rolls.
      *Size:* 1 day

- [ ] **H4 · Prove the restore** — restore a backup to a scratch database and run
      the test suite against it. **Write down how long it took** — that number is
      your real recovery time and it is the one you will be asked for.
      *Size:* half a day
      *Note:* a backup you have never restored is a hypothesis, not a backup.

---

## Suggested first sprint

If you want one week that visibly moves the needle:

| Day | Work |
| --- | --- |
| 1 | A1, A2, A3, A4 — whole hygiene track |
| 1 | F1, F2 — health endpoints (quick, unblocks compose and deploy) |
| 2–3 | B1, B2, B3 — test projects standing up |
| 4 | B4 — auth and isolation tests |
| 5 | C1, C2, C3, C5 — CI green and required |

**Done when:** a PR cannot merge without passing real tests, and you can tell
whether the app is up.

G1 (rate limiting) is 2 hours and closes a live brute-force hole — slot it in
wherever there is a gap.

---

## What not to build

- **Kubernetes.** Solves problems you do not have and needs its own on-call.
- **A service mesh.** You have one service.
- **Terraform**, until the infrastructure is stable enough to be worth
  codifying. Before that you fight state more than you provision.
- **Multi-region.** Spend it on H4 instead.
