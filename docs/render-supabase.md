# Render + Supabase deployment

EduTracker runs as one Render Docker web service. The container builds the React
app and serves it from ASP.NET Core alongside `/api`. The browser uses one origin
for pages, API requests, and session cookies. Supabase supplies PostgreSQL;
Redis is optional and disabled in this setup.

## What this deploy includes

The real API supports authentication, organizations, departments, courses,
classes, and assignments. The cohort, faculty workspace, academic structure,
and portal sign-in flows run with browser-side demo handlers on this deployment. Their
sample records and edits stay in each browser and are not shared through
Supabase. The site labels this state as **Demo data**. The API's
`DemoMode__Enabled=true` setting turns those handlers on without changing the
real authentication and organization requests. After matching backend
endpoints are built, switch the setting to `false` and redeploy.

## 1. Create the database

Create a Supabase project on the Free plan in **Central EU (Frankfurt)**, the
same region as the Render service. Disable the Data API during project
creation; this app accesses PostgreSQL through its server. In **Connect**, choose **Session
pooler** (port 5432), since Render does not support the IPv6-only direct
connection on Supabase Free. Copy the host, database, and username exactly as
shown; the pooler username includes the project reference. Use a .NET/Npgsql
connection string with those values:

```text
Host=<SESSION_POOLER_HOST>;Port=5432;Database=postgres;Username=postgres.<PROJECT_REF>;Password=<PASSWORD>;SSL Mode=Require;Maximum Pool Size=5
```

Keep this value private. The frontend does not connect to Supabase directly.
The Free plan can pause after a week of low database activity, so check that the
project is active before a presentation.

## 2. Apply the database migrations

The API does not migrate on startup. Apply migrations once before the first
Render deployment, then repeat for future schema changes. From the repo root in
PowerShell, with `dotnet ef` installed:

```powershell
$env:ConnectionStrings__Database = '<NPGSQL_CONNECTION_STRING>'
dotnet ef database update --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api
Remove-Item Env:ConnectionStrings__Database
```

Use Supabase's Session pooler connection details here too. Do not commit the
connection string or put it in a frontend `VITE_` variable.

## 3. Create the Render service

Push the deployment changes to the branch you want to host. In Render, create
a **Blueprint** from `render.yaml` and select that branch. It creates one free
Docker web service and deploys when new commits reach the linked branch.
During creation, fill in the `sync: false` environment variables:

| Variable | Value |
| --- | --- |
| `ConnectionStrings__Database` | Npgsql Session pooler string from step 1 |
| `DataEncryptionOptions__Keys__1` | Fresh 32-byte Base64 key |
| `HashingOptions__EmailHmacKey` | Different fresh 32-byte Base64 key |
| `SuperAdminSeedOptions__UserName` | Your bootstrap admin username |
| `SuperAdminSeedOptions__Email` | Your bootstrap admin email |
| `SuperAdminSeedOptions__Password` | A unique strong password |

Generate each key separately in PowerShell:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Render's HTTPS domain serves the site and API together. The API base URL is the
browser's current origin, so no `VITE_API_BASE_URL` or CORS origin is needed.
`/health` checks database connectivity for Render's health check. Free web
services sleep after inactivity, so open the site ahead of a demo.

## 4. Check the deployment

1. Open the Render URL and confirm the landing page loads.
2. Open `/health` and confirm it returns `{"status":"ok"}`.
3. Sign in and confirm `/api/users/me` returns the signed-in user.
4. In browser developer tools, confirm `edu_session_id` is `HttpOnly`, `Secure`,
   and `SameSite=Lax` on the Render host.
5. Open a nested route such as `/dashboard` directly to verify SPA fallback.
6. Confirm the **Demo data** label appears. Open an academic structure or cohort
   screen and verify it loads sample data. Changes there stay in that browser.

Keep the Supabase database password and encryption keys backed up securely.
Changing the encryption or HMAC key after data has been written can make
existing user data inaccessible.
