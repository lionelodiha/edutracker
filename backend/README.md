# EduTracker Backend

EduTracker backend is a .NET 8 Web API that powers the EduTracker application. It provides authentication, user management, and core school management features (schools, students, teachers, classes, assessments, billing, etc.).

## Tech Stack
- Runtime: .NET 8 (ASP.NET Core Minimal API style)
- Data Access: Entity Framework Core
- Database: (configure via connection string; defaults depend on your environment)
- Caching: Redis (optional; configurable)
- Cryptography: AES for data-at-rest encryption, PBKDF2/Argon2-like hashing (configurable via options)

## Project Structure
```
backend/
  EduTracker/
    Common/                # Shared entity abstractions and response models
    Configurations/        # EF Core entity type configurations and options
    Constants/             # Route and response catalogs
    Data/                  # AppDbContext
    Endpoints/             # Minimal API endpoint handlers and DTOs
    Entities/              # Domain models
    Enums/                 # Enums used across the domain
    Exceptions/            # Custom exception types
    Extensions/            # Extensions (configs, responses, validations, entities)
    Interfaces/            # Abstractions for services
    Middleware/            # Global exception handling middleware
    Models/                # API-facing models (OperationResult, ApiResponse, etc.)
    Services/              # Concrete service implementations (hashing, encryption)
    Properties/            # Launch profiles
    Program.cs             # App bootstrap and pipeline
    appsettings*.json      # Configuration files
    EduTracker.csproj
```

## Requirements
- .NET SDK 8.x
- A SQL database (e.g., SQL Server, PostgreSQL) and connection string
- Node.js (only if you plan to run the frontend locally as well)
- Redis (optional; only if you enable it in configuration)

## Getting Started
1. Install .NET 8 SDK: https://dotnet.microsoft.com/download
2. Configure environment variables or appsettings (see below)
3. Restore and build:
   - From repository root: `dotnet restore edutracker.slnx`
   - Or inside backend: `dotnet restore ./backend/EduTracker/EduTracker.csproj`
4. Apply EF Core migrations (if migrations are present in your environment) and ensure the database exists.
5. Run the API:
   - Debug profile: `dotnet run --project ./backend/EduTracker`
   - Or using launch settings via IDE (Visual Studio / Rider / VS Code)

The API will start on the port(s) specified by ASPNETCORE_URLS or launchSettings.json.

## Configuration
Configuration is loaded from appsettings.json, appsettings.{Environment}.json, environment variables, and command-line args.

Key sections:
- ConnectionStrings:DefaultConnection
- Security:HashingOptions
- Security:DataEncryptionOptions
- Settings:RedisOptions

Example (appsettings.Development.json):
```
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EduTracker;User Id=...;Password=...;TrustServerCertificate=true"
  },
  "Security": {
    "HashingOptions": {
      "IterationCount": 600000,
      "SaltSize": 16,
      "KeySize": 32
    },
    "DataEncryptionOptions": {
      "Key": "<base64-encoded-32-bytes>",
      "IV": "<base64-encoded-16-bytes>"
    }
  },
  "Settings": {
    "Redis": {
      "Enabled": false,
      "ConnectionString": "localhost:6379",
      "InstanceName": "edutracker:"
    }
  }
}
```

Notes:
- DataEncryptionOptions: Key must be 32 bytes (256-bit) and IV 16 bytes (128-bit), provided as base64.
- If Redis is disabled (Enabled=false), the app should function without it.

Environment variable overrides:
- ASPNETCORE_ENVIRONMENT: Development, Staging, Production
- ConnectionStrings__DefaultConnection
- Security__HashingOptions__IterationCount, Security__HashingOptions__SaltSize, Security__HashingOptions__KeySize
- Security__DataEncryptionOptions__Key, Security__DataEncryptionOptions__IV
- Settings__Redis__Enabled, Settings__Redis__ConnectionString, Settings__Redis__InstanceName

## Migrations
If you maintain migrations in your environment, typical commands:
- Add: `dotnet ef migrations add InitialCreate --project ./backend/EduTracker --startup-project ./backend/EduTracker`
- Update: `dotnet ef database update --project ./backend/EduTracker --startup-project ./backend/EduTracker`

Ensure you have the EF Core tools installed: `dotnet tool install --global dotnet-ef`

## Running
- Development: `dotnet run --project ./backend/EduTracker`
- With URLs: `dotnet run --project ./backend/EduTracker -- --urls "http://localhost:5200"`
- Using Visual Studio/VS Code: Launch the EduTracker profile from Properties/launchSettings.json

## API Overview
The API currently includes user endpoints and a standardized response model.

- Base route prefix: see Constants/Routes/ApiRoutes.cs
- Users:
  - POST {prefix}/users/register
    - Request body: Endpoints/Users/RegisterUser/RegisterUserRequest.cs
    - Validation: RegisterUserRequestValidator.cs and Extensions/Validations
    - Response: Endpoints/Users/UserResponse.cs wrapped in ApiResponse / OperationResult
  - GET {prefix}/users/{id}
    - Handler: Endpoints/Users/GetUser/GetUserHandler.cs

Response conventions:
- OperationOutcomeResponse / OperationFailureResponse drive ApiResponse
- ResponseCatalog.* contain consistent error codes/messages
- ExceptionHandlingMiddleware produces consistent error responses

## Security & Sensitive Data
- Sensitive user fields (e.g., password hashes, encryption keys) are modeled via Common/Entities/ISensitiveEntity and handled by Services/AesDataEncryptionService and HashingService.
- HashingOptions and DataEncryptionOptions control algorithms and parameters.
- Do not log secrets. ExceptionExtensions ensure sanitized outputs.

## Development Notes
- Minimal API: Endpoints are defined with handlers in Endpoints/* and wired in Program.cs via endpoint registration classes (e.g., UserEndpoints.cs).
- Validation: FluentValidation-like pattern via RegisterUserRequestValidator and custom extensions in Extensions/Validations.
- Error handling: Centralized via Middleware/ExceptionHandlingMiddleware and response helpers in Extensions/Responses/*.
- EF Core: Entity configurations live under Configurations/Entities.

## Testing
You can test endpoints using:
- cURL or HTTPie
- VS Code REST Client (.http files)
- Postman or Insomnia

Example cURL (register user):
```
curl -X POST "http://localhost:5200/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com",
    "password": "Passw0rd!",
    "phoneNumber": "+15551234567"
  }'
```
Adjust the base URL to match your configured routes and ports.

## Logging
- Configure logging in appsettings.json via "Logging" section or Serilog if added later.
- Exceptions are normalized by ExceptionHandlingMiddleware.

## Build & Publish
- Build: `dotnet build ./backend/EduTracker -c Release`
- Publish self-contained (win-x64 as example):
  `dotnet publish ./backend/EduTracker -c Release -r win-x64 --self-contained true /p:PublishTrimmed=true`

## Troubleshooting
- Database connection errors: verify ConnectionStrings:DefaultConnection and that the DB server is reachable.
- 500 errors: check logs; ensure encryption keys and IV are valid base64 and correct sizes.
- 400 validation errors: see ValidationExtensions and RegisterUserRequestValidator for rules.
- Redis connection issues: disable Redis or fix connection string.

## License
TBD

## Maintainers
- Core team: add names/emails here
