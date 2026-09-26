# Production CI/CD

`PROD` is the only branch Render uses for the production web service. Keep
feature work on other branches and merge it into `PROD` through a pull request.

## GitHub setup

1. In **Settings → Environments**, create an environment named `production`.
   Restrict deployments to the `PROD` branch.
2. Add an environment secret named `PROD_DATABASE_CONNECTION`. Its value is the
   private Npgsql connection string for Supabase's **Session pooler**, port
   `5432`. Use the same connection details in Render's
   `ConnectionStrings__Database` environment variable. Never put the value in
   Git, an issue, a pull request, or a frontend variable.
3. In **Settings → Branches** or **Rules → Rulesets**, protect `PROD`. Require a
   pull request and these status checks: **Frontend**, **Backend**, and
   **Container**. Prevent force pushes and deletion. The migration job runs
   only after a commit lands on `PROD`, so do not require it on pull requests.

The workflow in `.github/workflows/prod.yml` runs for pull requests targeting
`PROD` and pushes to `PROD`. It builds and tests the frontend, builds the .NET
solution, and builds the same Docker image Render uses. On a push to `PROD`, it
then applies EF Core migrations to Supabase. Missing credentials or a failed
migration leave the workflow red and block Render's automatic deploy.

The repository currently has frontend tests but no .NET test project. The
frontend's existing full lint command has pre-existing failures, so it is not
yet a release gate. Add that gate after its baseline errors are fixed.

## Render setup

Create a Blueprint from the **connected GitHub repository**, with Blueprint
branch `PROD` and the root `render.yaml`. The service specifies `branch: PROD`
and `autoDeployTrigger: checksPass`. Render waits for the GitHub checks on each
new `PROD` commit. A public repository URL without a GitHub connection does
not support automatic deploys.

Enter the six private values requested during Blueprint creation, following
[`render-supabase.md`](render-supabase.md). The database password and admin
password must be unique. Keep the two encryption keys securely backed up;
changing them after data has been written can make user data inaccessible.

## Release flow

1. Open a pull request into `PROD` from a feature branch.
2. Wait for **Frontend**, **Backend**, and **Container** to pass, then merge.
3. On the `PROD` push, **Migrate Supabase** applies pending migrations.
4. Render builds the Docker image and switches traffic only when `/health`
   passes. Check the service's Deploys page and open its `onrender.com` URL.

For schema changes, write migrations that can run while the previous app
version is still serving traffic. If a release needs a breaking migration,
split it into compatible deploys. Render's free web service does not support
pre-deploy commands; the GitHub migration job provides that step instead.
