# Delivery Playbook

Getting EduTracker from a laptop to something you can operate.

Date: 2026-09-17
Runtime: .NET 10, Postgres 16, Redis 7
Today: docker compose, run by hand. CI: none. Tests: none.

Written for someone learning SRE on the job. Each stage explains the reasoning
before the commands, because the commands change every two years and the reasoning
does not.

## The work splits into three parts

| Part | Stages | Question it answers | Size |
| --- | --- | --- | --- |
| **1 · Build it safely** | 00–02 | Is it safe to merge this? | 2 weeks |
| **2 · Ship it** | 03–05 | Can we release it, and undo it? | 1 week |
| **3 · Operate it** | 06–08 | Is it up, and what do we do when it isn't? | 2 weeks, then ongoing |

Work them in order. Each part is the cheapest thing that makes the next one worth
doing — a pipeline with no tests just ships bugs faster, and a deploy you cannot
observe is one you cannot safely repeat.

The single exception: the **health endpoints** in Stage 06 are two hours with no
dependencies, and Part 2 needs them. Pull those forward.

---

## Baseline: an honest ledger before any advice

You cannot improve delivery without first writing down where it actually is. This
is what the repository contains today, verified rather than assumed.

| | Item | Notes |
| --- | --- | --- |
| ✓ | Dockerfile | Multi-stage, layer-cached restore, runs as `USER app`. Genuinely good. |
| ✓ | docker-compose | Postgres and Redis both have healthchecks and the API waits on `service_healthy`. |
| ✓ | Package versions | Central package management via `Directory.Packages.props`. One place to change a version. |
| ✓ | Secrets hygiene | `.env` is untracked and `.env.example` documents every key. Better than most projects this size. |
| ✓ | Key versioning | `DataEncryptionOptions` holds a keyring plus a current version. Rotation is already possible. Stage 07. |
| ~ | Correlation | `TraceIdMiddleware` exists but is not wired to anything that collects traces. |
| ~ | Migrations | Applied by hand from a developer's shell. Documented in a compose comment, which is not a deploy process. |
| ✗ | Tests | Zero test projects in the solution. This is the single biggest blocker and Stage 01 is about nothing else. |
| ✗ | CI | No `.github/` directory. Nothing has ever been verified anywhere but a laptop. |
| ✗ | Health endpoints | No `AddHealthChecks` anywhere, so the API container has no healthcheck and nothing can tell whether it is ready. |
| ✗ | Telemetry | No structured logging, no metrics, no traces. Production incidents would be debugged by guessing. |
| ✗ | Rate limiting | The login endpoint will take unlimited attempts per second. |
| ✗ | SDK pinning | No `global.json`, no `.editorconfig`. Two machines can produce two different builds. |

> **Why start with a ledger.** The instinct when asked about DevOps is to reach for
> the most advanced thing you have heard of. Resist it. *Maturity is sequential*: a
> deployment pipeline on top of no tests just ships bugs faster, and Kubernetes on
> top of no telemetry gives you more ways to fail and no more ability to see it.
>
> The order below is not arbitrary. Each stage is the cheapest thing that makes the
> next one worth doing.

---

# PART 1 — BUILD IT SAFELY

**Stages 00–02 · about 2 weeks · no dependencies, start here**

Everything in this part answers one question: *is it safe to merge this?* Right
now nothing answers it, because nothing has ever been verified anywhere but a
laptop.

Do not start Part 2 before this is done. A deployment pipeline on top of no
tests just ships bugs faster.

**Part 1 is finished when** a pull request cannot merge without passing real
tests on a machine that is not yours.

| Stage | Work | Size |
| --- | --- | --- |
| 00 | Reproducible builds, dead code, formatting | half a day |
| 01 | Test projects and the four tests that matter | 1 week |
| 02 | GitHub Actions, branch protection, SDK drift check | 2 days |

---

## Stage 00 — Make the build the same everywhere (half a day)

Everything downstream assumes that a build on your machine and a build on a CI
runner produce the same artefact. Right now they might not.

### Pin the SDK

```json
// global.json — new, repo root
{
  "sdk": {
    "version": "10.0.100",
    // featureBand lets patch upgrades through but blocks a jump to
    // 10.1 that nobody decided on. "latestMinor" would not.
    "rollForward": "latestFeature"
  }
}
```

### Delete what is not in the build

`backend/EduTracker/` has no `.csproj` and is in no solution, so nothing compiles
it. It still gets read, searched and grepped by every person and tool that touches
this repo, and it still shows up in security scans. `backend/prisma/` and
`backend/src/services/` are leftovers from an earlier stack. `tmp_migration_log.txt`
and `frontend/edu-tracker/lint.txt` are committed build output.

```gitignore
# .gitignore — append
# build and tool output that keeps getting committed
*.log
lint.txt
tmp_*.txt
dist/
TestResults/
coverage/
```

> **The principle.** Dead code is not free. It costs every reader a moment of "is
> this live?", and one day somebody will answer wrong. Git remembers it; you do not
> need the working tree to.

### One formatting standard

Add an `.editorconfig` and make `dotnet format --verify-no-changes` a CI step. Not
because tabs matter, but because a formatting-only diff buried inside a logic change
is how real bugs get through review unnoticed.

---

## Stage 01 — Tests, because CI without them is theatre (1 week)

> **What CI is actually for.** A pipeline's job is to answer one question: *is it
> safe to merge this?* A pipeline that only runs `dotnet build` answers a much
> weaker question, "does it compile", and then wears a green tick that makes
> everyone act as though the real question was answered. That green tick is worse
> than no pipeline, because it manufactures confidence.
>
> So tests come before CI, even though CI is more fun to build.

### Two projects, different jobs

| Project | Tests what | Speed | Run |
| --- | --- | --- | --- |
| `EduTracker.Domain.Tests` | Entity invariants. Every `Validate*` throwing path, every `Update*` no-op path. Pure, no database. | < 1s | every commit |
| `EduTracker.Api.IntegrationTests` | Handlers and endpoints against a real Postgres in a container. Auth, role checks, unique indexes, cascade behaviour. | ~60s | every PR |

> **Why not mock the database.** In this codebase a large part of the business logic
> *lives in the schema*: the filtered unique index that allows re-enrolment, the
> `Restrict` versus `Cascade` choice on each foreign key, the snake-cased column a
> raw SQL filter depends on. EF Core's in-memory provider enforces none of that. A
> test suite built on it passes while production violates constraints.
>
> Testcontainers starts a throwaway Postgres 16 per test run. It is slower and it is
> the only version that tells you the truth.

```csharp
// backend/EduTracker.Api/Program.cs — append, last line

// Top-level statements compile into an internal Program class, which a test
// project cannot reach. WebApplicationFactory<Program> needs it public.
// One line, and it is the reason integration tests are possible at all.
public partial class Program { }
```

```xml
<!-- backend/EduTracker.Api/EduTracker.Api.csproj — add -->
<ItemGroup>
  <!-- Almost every type in this repo is internal: handlers, endpoint
       modules, ResponseCatalog. Without this the tests can see nothing. -->
  <InternalsVisibleTo Include="EduTracker.Api.IntegrationTests" />
</ItemGroup>
```

```csharp
// .../IntegrationTests/EduTrackerAppFactory.cs

public sealed class EduTrackerAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")   // same image as compose
        .Build();

    private readonly RedisContainer _redis = new RedisBuilder()
        .WithImage("redis:7-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await _db.StartAsync();
        await _redis.StartAsync();

        // Apply migrations rather than EnsureCreated. EnsureCreated builds
        // the schema from the model and would skip your raw HasFilter SQL,
        // so the tests would not exercise the real database.
        using IServiceScope scope = Services.CreateScope();
        AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Database"] = _db.GetConnectionString(),
                ["ConnectionStrings:Redis"] = _redis.GetConnectionString(),

                // Deterministic test keys. Real ones never touch the repo.
                ["DataEncryptionOptions:CurrentKeyVersion"] = "1",
                ["DataEncryptionOptions:Keys:1"] = TestKeys.DataKeyBase64,
                ["HashingOptions:EmailHmacKey"] = TestKeys.HmacKeyBase64,
            });
        });
    }

    public new async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _redis.DisposeAsync();
    }
}
```

### What to test first, in order

- **Auth.** Sign in, session cookie issued, protected endpoint accepts it, revoked
  session is rejected. If this breaks, everything breaks.
- **One role check per role.** A Teacher hitting an Owner-only endpoint must get 403.
  This is the class of bug that becomes a data breach.
- **Cross-organization isolation.** Actor in org A, resource id from org B, expect
  403 or 404 and never 200. Write this test for every endpoint that takes an id.
- **The unique indexes.** Insert the duplicate, assert the conflict response. That is
  the test that proves the schema, not just the handler.

> **Do not chase a coverage number.** Eighty percent coverage of getters is worth
> less than four good cross-tenant isolation tests. Measure coverage so you can see
> it falling, not so you can hit a target.

### Frontend

Vitest plus Testing Library for component behaviour, and one Playwright smoke path:
register, create an organization, create a semester, sign out. One end-to-end test
that runs on every PR catches more real breakage than fifty shallow component tests.

---

## Stage 02 — Continuous integration (2 days)

```yaml
# .github/workflows/ci.yml

name: ci

on:
  push:
    branches: [main]
  pull_request:

# Pushing twice to a PR should cancel the first run. Without this you pay
# for CI minutes verifying a commit nobody will ever merge.
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

# Default to read-only. Individual jobs opt in to more.
permissions:
  contents: read

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          global-json-file: global.json   # the pin from Stage 00

      # Cache keyed on the lock inputs. Central package management means
      # Directory.Packages.props is the file that actually decides restore.
      - uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: nuget-${{ hashFiles('Directory.Packages.props', '**/*.csproj') }}
          restore-keys: nuget-

      - run: dotnet restore

      # -warnaserror on CI only. Locally warnings are useful noise;
      # on main they are a decision nobody made.
      - run: dotnet build --no-restore -c Release -warnaserror

      - run: dotnet format --verify-no-changes

      - run: dotnet test --no-build -c Release
               --logger trx
               --collect:"XPlat Code Coverage"

      - uses: actions/upload-artifact@v4
        if: always()      # the failing run is when you want these
        with:
          name: test-results
          path: "**/TestResults/**"

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend/edu-tracker
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: frontend/edu-tracker/package-lock.json

      # ci, not install: it honours the lockfile exactly and fails if
      # package.json and the lock have drifted apart.
      - run: npm ci

      - run: npx tsc -b --noEmit
      - run: npm run lint
      - run: npm run build

  image:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      # Build on every PR to prove the Dockerfile still works, but only
      # push from main. A broken image discovered at deploy time is the
      # most expensive place to discover it.
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: backend/EduTracker.Api/Dockerfile
          push: ${{ github.ref == 'refs/heads/main' }}
          tags: ghcr.io/${{ github.repository }}/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

> **Tag images by commit, never by "latest".** `:latest` means "whatever was built
> most recently", which is not a thing you can roll back to. Tag with
> `${{ github.sha }}` and every deployed environment can name *exactly* which commit
> it is running. When somebody asks "is the fix out yet?", that is the difference
> between checking and guessing.

### Branch protection

A workflow file nobody has to pass is a suggestion. In repository settings, require
the `backend`, `frontend` and `image` checks on `main`, require one review, and
require the branch to be up to date before merging.

> **Your branching needs attention too.** The history shows merge commits between
> personal long-lived branches. That pattern produces exactly the conflicts and
> "works on my branch" surprises that CI is supposed to eliminate. Short-lived
> branches off `main`, opened as a PR the same day, merged within a day or two.

---

# PART 2 — SHIP IT

**Stages 03–05 · about 1 week · needs Part 1**

Part 1 proved the code is good. This part gets it onto a server without a human
typing commands, and — more importantly — gets it back off again when something
goes wrong.

The theme here is **reversibility**. Any deploy you cannot undo is a deploy you
will be frightened to make, and a team frightened of deploying ships in large,
risky batches.

**Part 2 is finished when** merging to `main` reaches staging with nobody typing
a command, and you can roll production back to the previous release in one
action.

| Stage | Work | Size |
| --- | --- | --- |
| 03 | Frontend image, runtime config, compose profiles | 3 days |
| 04 | Migrations as a reviewed, gated step | 2 days |
| 05 | Staging, then production behind an approval | 3 days |

---

## Stage 03 — Containers for the whole system (3 days)

The backend is containerised and the frontend is not, so "run the stack" is still
two different sets of instructions. Close the gap.

```dockerfile
# frontend/edu-tracker/Dockerfile

FROM node:22-alpine AS build
WORKDIR /app

# Lockfile first so a source-only change reuses the install layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS final

# SPA fallback: every unknown path serves index.html, or a refresh on
# /dashboard/organizations returns 404 from nginx instead of your router.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
```

> **The Vite trap that catches everyone once.** Vite substitutes `import.meta.env`
> values at *build* time, not at run time. So an image built with a staging API URL
> is permanently a staging image. Passing a different environment variable to the
> container at start does nothing at all, silently.
>
> Two ways out. Build one image per environment, which is simple and means the thing
> you tested in staging is not byte-identical to production. Or emit a small
> `/config.js` at container start and read it at runtime, which keeps one image all
> the way through. Pick the second once you have more than one environment.

```sh
#!/bin/sh
# frontend entrypoint — runtime config
# Written on every container start, before nginx boots.
cat > /usr/share/nginx/html/config.js <<EOF
window.__EDUTRACKER_CONFIG__ = {
  apiBaseUrl: "${API_BASE_URL}"
};
EOF

exec nginx -g "daemon off;"
```

### Compose profiles

Most days you want Postgres and Redis running while the API runs in your debugger.
Occasionally you want the whole stack. Profiles let one file do both: put
`profiles: ["full"]` on the `api` and `web` services, so `docker compose up -d`
gives you dependencies only and `--profile full` gives you everything.

---

## Stage 04 — Migrations as a reviewed, gated step (2 days)

> **Never do this.** `db.Database.Migrate()` on application startup. With one replica
> it usually works. With two replicas both race to take the migration lock; one
> wins, the other waits on a lock while its readiness probe fails, and the
> orchestrator kills and restarts it into the same queue. Your compose file already
> says the app does not auto-migrate. Keep it that way.

```yaml
# .github/workflows/ci.yml — add to the backend job

# The SQL that will run against production, generated and attached to the
# PR. A reviewer reads this rather than trying to infer it from C#.
# --idempotent means it is safe to apply twice.
- name: Generate migration script
  run: |
    dotnet ef migrations script --idempotent \
      --project backend/EduTracker.Persistence \
      --startup-project backend/EduTracker.Api \
      --output migration.sql

- uses: actions/upload-artifact@v4
  with:
    name: migration-sql
    path: migration.sql
```

> **Expand and contract.** During any rolling deploy, old code and new code run
> against one database at the same time. So a migration must never break the version
> that is still running. Renaming a column in one step guarantees an outage.
>
> Split it across three deploys instead: *expand*, add the new nullable column and
> write to both; *migrate*, backfill and switch reads; *contract*, drop the old
> column once nothing references it. Slower, and it is the difference between a
> deploy and an incident.
>
> This is live for you right now: the working tree modifies `OrganizationMember`,
> `OrganizationMemberRole` and `AcademicLimits`. Any of those that narrows a column
> or removes an enum value needs this treatment before it ships.

---

## Stage 05 — Deployment, and the ability to undo it (3 days)

| Step | What happens | Gate |
| --- | --- | --- |
| 1 · build | CI builds and pushes `api:<sha>` and `web:<sha>` to GHCR. | all checks green |
| 2 · staging | Migration job runs, then the new image rolls. | automatic on main |
| 3 · smoke | Playwright smoke path against staging. | must pass |
| 4 · approve | A human approves the production environment. | GitHub environment protection |
| 5 · migrate | Idempotent SQL applied as its own job. Nothing else runs concurrently. | must succeed |
| 6 · roll | New containers start, pass readiness, old ones drain. | readiness probe |
| 7 · watch | Error rate and latency watched for fifteen minutes. | auto-rollback on burn |

> **Rollback is a schema question, not a deploy question.** Rolling the application
> back is easy: you kept the previous image tag, so redeploy it. What is not easy is
> rolling back a migration, because the forward migration may already have destroyed
> data the old version needs.
>
> This is the practical reason expand-and-contract matters. If every migration is
> backwards compatible with the previous release, then "roll back the app" is always
> a complete answer, and you never have to make that call at 2am. *Design so that
> the emergency action is the simple one.*

### Right-size the target

For a product at this stage: one managed container service, one managed Postgres
with automated backups, one managed Redis. Not Kubernetes. A managed Postgres gives
you point-in-time recovery, which matters far more than orchestration flexibility
when the data is children's academic records.

> **Test the restore, not the backup.** A backup you have never restored is a
> hypothesis. Once a quarter, restore to a scratch database and run the test suite
> against it. Write down how long it took: that number is your real recovery time,
> and it is the one you will be asked for.

---

# PART 3 — OPERATE IT

**Stages 06–08 · about 2 weeks, then ongoing · Stage 06 can start during Part 1**

Parts 1 and 2 got working code onto a server. This part is about the years
afterwards: knowing whether it is up, knowing when it is getting worse, and
knowing what to do at 9am on a Monday when three hundred teachers cannot sign
in.

This is the part that is actually SRE. It is also the part teams skip, and then
debug production by guessing.

**One exception to the ordering:** the health endpoints at the top of Stage 06
are two hours of work, have no dependencies, and Part 2 needs them for container
healthchecks and rolling deploys. Pull them forward into Part 1.

**Part 3 is finished when** an alert fires, points at a runbook, and the runbook
helps.

| Stage | Work | Size |
| --- | --- | --- |
| 06 | Health, logs, traces, SLOs and burn-rate alerts | 1 week |
| 07 | Rate limiting, secrets, supply chain, key rotation | 4 days |
| 08 | Runbooks, incident severity, postmortems, DORA | ongoing |

---

## Stage 06 — Observability, and the SLOs that give it a point (1 week)

### Health endpoints first

```csharp
// backend/EduTracker.Api/Program.cs — add

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Database")!,
        name: "postgres", tags: ["ready"])
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!,
        name: "redis", tags: ["ready"]);

// Liveness: is this process wedged? Checks NOTHING external.
app.MapHealthChecks("/health/live", new()
{
    Predicate = _ => false
});

// Readiness: can this instance serve a real request right now?
app.MapHealthChecks("/health/ready", new()
{
    Predicate = check => check.Tags.Contains("ready")
});
```

> **Why liveness must not check the database.** Say you check Postgres in the
> liveness probe. Postgres has a thirty-second hiccup. Every replica fails liveness,
> so the orchestrator kills every replica. They all restart, all open fresh
> connection pools against a database that is already struggling, and the hiccup
> becomes an outage you caused.
>
> *Liveness answers "restart me?"; readiness answers "send me traffic?"* Only one of
> those should ever depend on something outside the process. Add a `healthcheck:` on
> the api service in compose pointing at `/health/ready` while you are here.

### Make the trace id one id

`TraceIdMiddleware` already generates a correlation id. Make it read W3C
`traceparent` when present and fall back to generating one, then emit the same value
in the response header, in every log line, and as the OpenTelemetry trace id. One
value that a support ticket, a log search and a trace view all agree on turns most
debugging into a single lookup.

```csharp
// Program.cs — OpenTelemetry

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("edutracker-api"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation(o =>
        {
            // Health probes fire every few seconds and would drown the trace
            // store in noise while telling you nothing.
            o.Filter = ctx => !ctx.Request.Path.StartsWithSegments("/health");
        })
        .AddEntityFrameworkCoreInstrumentation()
        .AddRedisInstrumentation()
        .AddOtlpExporter())
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter());
```

> **Logs are where personal data leaks.** This system holds student names, emails and
> grades, and you already encrypt some of it at rest. Do not then log the plaintext.
> Never log a full request body, never log the session cookie, and keep emails out
> of log messages: log the user id instead. An unstructured
> `LogInformation($"User {email} signed in")` quietly undoes the encryption work.

### Three SLIs, three SLOs

> **The vocabulary, briefly.** An **SLI** is a measurement of something a user feels.
> An **SLO** is the target you set for it. The **error budget** is the difference
> between that target and perfection, and it is a *budget*: something to spend on
> shipping, not a number to keep at zero. A quarter with an untouched error budget
> means you were too cautious, not that you were excellent.

| SLI | Target | Measures | Notes |
| --- | --- | --- | --- |
| Availability | **99.5%** | Non-5xx on `/api/*` | Over 30 days. Budget: 3h 39m of failure per month. |
| Latency | **400ms** | p95 on authenticated reads | 95% of requests under this. Track p99 too, but do not page on it. |
| Sign-in | **99.9%** | Session creation success | Tighter, because a teacher who cannot sign in cannot take the register at 9am. |

> **Alert on burn rate, not on thresholds.** "Alert when CPU is over 80%" pages you
> for things users never noticed and stays quiet during outages that have nothing to
> do with CPU. Alert instead on how fast you are consuming the error budget.
>
> Burning at **14.4x** for an hour would exhaust a month's budget in about two days:
> page someone. Burning at **6x** sustained over six hours: open a ticket for the
> next working day. Two alerts, both tied to something a user actually experiences.
>
> And be honest about the 99.5%. Schools use this between 8am and 4pm on weekdays.
> Ten minutes down on a Sunday night is not the same event as ten minutes down during
> morning registration, and your alerting policy is allowed to say so.

---

## Stage 07 — Security and supply chain (4 days)

### You already built key rotation. Now write the runbook.

`DataEncryptionOptions` holds `Dictionary<byte, string> Keys` alongside
`CurrentKeyVersion`. That is a keyring, and it is a better design than most projects
this size manage. It means you can rotate without a big-bang re-encryption, but only
if somebody knows the steps.

```text
runbooks/rotate-data-encryption-key.md

1. Generate a new 32-byte key. Add it as version 2.
   Leave version 1 in place and leave CurrentKeyVersion at 1.
   Deploy. Nothing changes yet; every instance can now READ v2.

2. Set CurrentKeyVersion = 2. Deploy.
   New writes use v2. Existing v1 ciphertext still decrypts,
   because v1 is still in the ring.

3. Run the re-encryption job: read with whatever version the row
   carries, write back with v2. Batch it, make it resumable,
   run it out of hours.

4. Confirm zero rows remain at v1, THEN remove the v1 key.
   Removing it early makes those rows permanently unreadable.
   There is no recovery from that step.
```

> **Step 4 is irreversible.** Deleting a key while ciphertext still references it
> destroys that data as surely as dropping the table. Verify the count is zero,
> twice, and keep the retired key in offline storage for one full backup-retention
> cycle so a restored old backup is still readable.

### Secrets do not live in .env forever

`.env` is right for local development and wrong for production, where it means the
AES key sits in plaintext on a disk that several people can read. Move to your
platform's secret store, and have CI authenticate with GitHub OIDC so there is no
long-lived cloud credential in repository settings at all.

### Rate limiting: the gap that matters today

```csharp
// Program.cs — add

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Per IP, not per username. Limiting by username lets an attacker
    // lock every real account out by failing logins on their behalf.
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new()
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
});

app.UseRateLimiter();

// then on the sign-in endpoint: .RequireRateLimiting("auth")
```

### Supply chain

- **Dependabot** on NuGet, npm, Docker and GitHub Actions. Group patch updates into
  one weekly PR so it stays readable.
- **CodeQL** on both languages, on PRs and weekly.
- **Trivy** against the built image. Base images accumulate CVEs even when your code
  does not change, which is the argument for rebuilding on a schedule.
- **Pin actions to a commit SHA,** not a tag. Tags are mutable, so `@v4` is a promise
  the author can rewrite.
- **Read-only root filesystem** and dropped capabilities on the API container. It
  already runs as `USER app`, which is the harder half.

---

## Stage 08 — Operating it, which is the part that is actually SRE (ongoing)

> **Toil.** Toil is manual, repetitive work that scales with usage and produces no
> lasting value. Applying migrations by hand is toil. Copying a key into a `.env` on
> a server is toil. Restarting a container when it wedges is toil.
>
> The standard target is to keep toil under half of operational time. Track it
> honestly for two weeks before deciding what to automate, because the task that
> feels most annoying is rarely the one that costs the most hours.

### Runbooks

One markdown file per alert, in the repository, linked from the alert itself.
Symptom, likely causes in order of probability, the diagnostic command for each, the
fix, and when to escalate. Write it the first time you handle the incident, while
you still remember what confused you.

### Incident severity

| Sev | Means | Response |
| --- | --- | --- |
| SEV1 | Nobody can sign in, or data is being lost or exposed. | Page immediately, any hour. Postmortem required. |
| SEV2 | A major feature is broken for many users. Attendance cannot be taken. | Page during school hours. Postmortem required. |
| SEV3 | Degraded or broken for a few, with a workaround. | Ticket, next working day. |

> **Blameless postmortems, and what "blameless" means.** It does not mean pretending
> nobody did anything. It means the write-up asks *why the system allowed it* rather
> than who typed it. "Sam dropped the column" stops the investigation. "A migration
> that was not backwards compatible reached production because nothing in review
> surfaced the generated SQL" leads to Stage 04, and Stage 04 prevents the next one.
>
> The practical test: if people are reluctant to volunteer that they caused
> something, your postmortems are not blameless yet, and you will find out about the
> next incident later than you should.

### Measure delivery with four numbers

| Metric | Where from | First target |
| --- | --- | --- |
| Deploy frequency | Count of production deploy runs | weekly, then daily |
| Lead time for change | First commit on a branch to production | under a week |
| Change failure rate | Deploys causing an incident or rollback | under 15% |
| Time to restore | Alert fired to service recovered | under an hour |

Track them to see the trend, and never as an individual performance measure. The
moment they are used that way, people optimise the number instead of the system, and
you lose the signal permanently.

---

## Sequence: six weeks, in order

| Week | Work | Done when |
| --- | --- | --- |
| 1 | Stage 00 and the first half of 01: `global.json`, cleanup, domain test project, auth and isolation integration tests. | `dotnet test` runs green from a clean clone. |
| 2 | Finish 01, all of 02. Frontend smoke test, CI workflow, branch protection. | A PR cannot merge without passing checks. |
| 3 | Stage 03 and 04. Frontend image, compose profiles, migration script artefact. | One command brings the whole stack up. |
| 4 | Stage 06 first: health endpoints, structured logs, trace id alignment. | You can answer "what happened to this request" from an id. |
| 5 | Stage 05. Staging, then production with approval and a migration gate. | A merge reaches staging with nobody typing a command. |
| 6 | Stage 07, and the SLO half of 06. Rate limiting, Dependabot, CodeQL, burn-rate alerts, first runbook. | An alert fires and points at a document that helps. |

> **If you only get three weeks.** Do Stage 01, Stage 02 and the health endpoints
> from Stage 06. Tests, a pipeline that runs them, and the ability to tell whether
> the thing is up. Everything else is an improvement on a system you can already
> reason about; without those three you are operating blind.

---

## What to leave alone for now

- **Kubernetes.** It solves problems you do not have and adds a system that needs its
  own on-call. Revisit when one machine genuinely is not enough.
- **A service mesh.** You have one service.
- **Microservices.** The clean-architecture boundaries you already have give you most
  of the modularity at none of the distributed-systems cost.
- **Multi-region.** A school system serves one geography. Spend the effort on tested
  backups instead.
- **A full IaC platform.** Terraform is worth it once the infrastructure is stable
  enough to be worth codifying. Before that you will spend more time fighting state
  than provisioning.

> **The judgement this is teaching.** Choosing not to adopt something is as much a
> part of the job as adopting it. Every tool you run is a tool you maintain, upgrade,
> secure and get paged by. *The right amount of infrastructure is the least that
> meets your reliability target*, and that target comes from the SLOs in Stage 06,
> not from what other teams are using.

---

Baseline verified against the working tree: `Dockerfile`, `docker-compose.yml`,
`Program.cs`, `Directory.Packages.props`, `.gitignore` and the absence of
`.github/`, `global.json`, `.editorconfig` and any test project.
