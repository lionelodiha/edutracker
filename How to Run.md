# EduTracker Backend – How to Run

This guide walks you through setting up configuration, preparing the database (clean/reset), applying the latest EF Core migrations, and starting the API from the repository root.

## Prerequisites

Ensure the following are available on your machine:

- PostgreSQL database (local via Docker is fine, or a hosted provider like Neon/Supabase)
- Optional: Redis server (local via Docker or a hosted provider like Redis Cloud). The API runs without Redis, but some requests may be slower without caching.
- .NET 10 SDK installed

## Configuration

The API reads configuration from appsettings and environment sources. You can keep secrets out of source control using dotnet user-secrets.

Base structure (for reference) of appsettings.json values used by the API:

```json
{
  "ConnectionStrings": {
    "Database": "Host=<YOUR_DB_SERVER>;Port=<YOUR_DB_PORT>;Username=<YOUR_DB_USER>;Password=<YOUR_DB_PASSWORD>;Database=<YOUR_DB_NAME>;",
    "Redis": "<YOUR_REDIS_HOST_AND_PORT>[, password=<YOUR_REDIS_PASSWORD_IF_ANY>]"
  },
  "DataEncryptionOptions": {
    "CurrentKeyVersion": 1,
    "Keys": {
      "1": "<YOUR_ENCRYPTION_KEY_BASE64>"
    }
  },
  "HashingOptions": {
    "EmailHmacKey": "<YOUR_ENCRYPTION_KEY_BASE64>",
    "PasswordWorkFactor": 12
  },
  "SessionLifetimeOptions": {
    "StandardSessionDurationHours": 8,
    "ExtendedSessionDurationDays": 7,
    "AbsoluteSessionLimitDays": 90,
    "StandardExpiryExtensionHours": 1,
    "ExtendedExpiryExtensionHours": 12,
    "ExpiryExtensionTriggerPercent": 5
  },
  "CacheTimeToLiveOptions": {
    "AuthSessionByIdMinutes": 10,
    "UserAuthenticationStateMinutes": 10,
    "UserProfileByIdMinutes": 5
  },
  "SuperAdminSeedOptions": {
    "FirstName": "Admin",
    "MiddleName": null,
    "LastName": "Super",
    "UserName": "<YOUR_SUPERADMIN_USERNAME>",
    "Email": "<YOUR_SUPERADMIN_EMAIL>",
    "Password": "<YOUR_SUPERADMIN_PASSWORD>"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

Notes:

- The API requires a live PostgreSQL database. It will fail to start if the database is unreachable.
- If using Redis, provide a proper connection string; otherwise omit or leave it unset and the API will operate without caching.

### Recommended: store secrets with user-secrets

Run these from the repository root to attach user-secrets to the API project and set values safely (replace placeholders):

- Project: backend/EduTracker.Api

```bash
# Attach user-secrets to the API project (one-time)
dotnet user-secrets init --project backend/EduTracker.Api

# Database connection string
dotnet user-secrets set "ConnectionStrings:Database" "Host=<HOST>;Port=<PORT>;Username=<USER>;Password=<PASS>;Database=<DB>" --project backend/EduTracker.Api

# Optional Redis connection
dotnet user-secrets set "ConnectionStrings:Redis" "<REDIS_HOST>:<PORT>, password=<REDIS_PASSWORD>" --project backend/EduTracker.Api

# Encryption and hashing keys (Base64 for DataEncryption; arbitrary secret for EmailHmacKey)
dotnet user-secrets set "DataEncryptionOptions:CurrentKeyVersion" "1" --project backend/EduTracker.Api
dotnet user-secrets set "DataEncryptionOptions:Keys:1" "<BASE64_KEY>" --project backend/EduTracker.Api

dotnet user-secrets set "HashingOptions:EmailHmacKey" "<EMAIL_HMAC_KEY>" --project backend/EduTracker.Api

# Super admin seed (used by seeders)
`dotnet user-secrets set "SuperAdminSeedOptions:FirstName" "Admin" --project backend/EduTracker.Api`
dotnet user-secrets set "SuperAdminSeedOptions:LastName" "Super" --project backend/EduTracker.Api
dotnet user-secrets set "SuperAdminSeedOptions:UserName" "<ADMIN_USERNAME>" --project backend/EduTracker.Api
dotnet user-secrets set "SuperAdminSeedOptions:Email" "<ADMIN_EMAIL>" --project backend/EduTracker.Api
dotnet user-secrets set "SuperAdminSeedOptions:Password" "<ADMIN_PASSWORD>" --project backend/EduTracker.Api
```

## Database: clean reset and migrations (from repo root)

Entity Framework Core migrations live in backend/EduTracker.Persistence. Use these commands from the repository root to ensure you run against the correct startup project and migrations assembly.

- Startup project: backend/EduTracker.Api
- Migrations assembly/context: backend/EduTracker.Persistence (AppDbContext)

Clean reset (drop and recreate the database), then apply the latest migration:

```bash
# 1) Drop database (if it exists) — WARNING: destructive so be sure it is what you want, else skip!
dotnet ef database drop --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api

# 2) Ensure latest migration exists locally (optional)
dotnet ef migrations list --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api

# 3) Apply the latest migration (create database and schema)
dotnet ef database update --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api
```

If you need to add a new migration (schema changes in code):

```bash
# Create a new migration
dotnet ef migrations add <MigrationName> --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api

# Apply it
dotnet ef database update --project backend/EduTracker.Persistence --startup-project backend/EduTracker.Api
```

Note: Ensure the database user has permissions to create/drop databases and schemas.

## Run the API (from repo root)

You can run the API directly, ensuring it uses the correct startup project:

```bash
# Restore and build (optional explicit step)
dotnet restore

# Start the API
dotnet run --project backend/EduTracker.Api
```

The API will start and display the listening URLs. If launchSettings.json is configured for HTTPS, you may need a local dev certificate (run: dotnet dev-certs https --trust).

## Common issues

- Database connection fails: verify host/port, networking, and credentials in ConnectionStrings:Database.
- SSL/TLS to Postgres: if your provider requires SSL Mode, add it to the connection string (e.g., "SSL Mode=Require;Trust Server Certificate=true;").
- Redis unavailable: either provide a valid Redis connection string or leave it unset to disable caching.
- Migrations tool missing: install EF CLI if needed: dotnet tool install --global dotnet-ef (or ensure the SDK workloads include it).

You can now run a clean DB, apply the latest migrations, and start the API from the repository root using the commands above.
