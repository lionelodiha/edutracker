# API Layer Design Document

## Overview
This document specifies the REST API for the EduTracker platform. It defines endpoints, request/response formats, authentication, and implementation requirements for the ASP.NET Core Web API.

## API Architecture

### Technology Stack
- **Framework**: ASP.NET Core 10
- **Style**: RESTful API with minimal APIs
- **Authentication**: Session-based with HTTP-only cookies
- **Authorization**: School-scoped role-based access control
- **Serialization**: System.Text.Json
- **Documentation**: Scalar (OpenAPI/Swagger)

### Base Configuration
- **Base Path**: `/api`
- **Versioning**: Not implemented (single version)
- **CORS**: Configurable origins with credentials
- **HTTPS**: Required in production

## Authentication & Authorization

### Session-Based Authentication
**Requirements**:
- HTTP-only, Secure, SameSite=Lax cookies
- Session ID stored in `educ_session` cookie
- Automatic session validation on protected endpoints
- Sliding expiration with absolute limits

**Implementation**:
```csharp
// Authentication handler
public class SessionAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var sessionId = Request.Cookies["educ_session"];
        if (string.IsNullOrEmpty(sessionId)) return AuthenticateResult.NoResult();

        var sessionData = await _sessionStateService.GetSessionDataAsync(Guid.Parse(sessionId));
        if (sessionData == null || sessionData.IsExpired) return AuthenticateResult.Fail("Invalid session");

        var userAuth = await _userAuthService.GetUserAuthDataAsync(sessionData.UserId);
        if (userAuth == null || userAuth.IsLocked) return AuthenticateResult.Fail("User locked");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, sessionData.UserId.ToString()),
            new Claim(ClaimTypes.Role, userAuth.Role.ToString()),
            new Claim(SessionClaimTypes.SessionId, sessionId)
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name));
    }
}
```

### Authorization Policies
**Policy Definitions**:
- **AdminOnly**: Requires Admin or SuperAdmin role
- **SchoolMemberOnly**: Requires active school membership
- **SchoolOwnerOnly**: Requires school owner role
- **SchoolAdminOnly**: Requires school admin or owner role
- **SchoolTeacherOnly**: Requires school teacher, admin, or owner role
- **SchoolStudentOnly**: Requires school student role

**Implementation**:
```csharp
services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole(UserRole.Admin.ToString(), UserRole.SuperAdmin.ToString()));

    options.AddPolicy("SchoolMemberOnly", policy =>
        policy.RequireAssertion(context => IsSchoolMember(context)));

    options.AddPolicy("SchoolOwnerOnly", policy =>
        policy.RequireAssertion(context => IsSchoolOwner(context)));
});
```

## Endpoint Specifications

### Authentication Endpoints (`/api/auth`)

#### POST `/api/auth/register`
**Purpose**: Register new user account
**Auth Required**: No
**Request Body**:
```json
{
  "userName": "string",
  "email": "string",
  "password": "string",
  "firstName": "string?",
  "middleName": "string?",
  "lastName": "string?"
}
```
**Validation**:
- UserName: 1-30 chars, alphanumeric + underscore, unique
- Email: Valid format, unique
- Password: Min 8 chars, mixed case, numbers, symbols
**Response**: `OperationResult<Guid>` with userId
**Status Codes**: 201 Created, 400 Bad Request

#### POST `/api/auth/login`
**Purpose**: Authenticate user and create session
**Auth Required**: No
**Request Body**:
```json
{
  "identifier": "string", // username or email
  "password": "string",
  "rememberMe": "boolean?"
}
```
**Response**: `OperationResult<SessionResponse>`
**Cookies**: Sets `educ_session` cookie
**Status Codes**: 200 OK, 401 Unauthorized

#### POST `/api/auth/refresh`
**Purpose**: Extend session lifetime
**Auth Required**: Yes
**Request Body**: None
**Response**: `OperationResult<SessionTimestampsResponse>`
**Status Codes**: 200 OK, 401 Unauthorized

#### POST `/api/auth/logout`
**Purpose**: Revoke current session
**Auth Required**: Yes
**Request Body**: None
**Response**: `OperationResult<bool>`
**Cookies**: Clears `educ_session` cookie
**Status Codes**: 200 OK

### User Management Endpoints (`/api/users`)

#### GET `/api/users`
**Purpose**: List all users (admin only)
**Auth Required**: Yes (Admin/SuperAdmin)
**Query Parameters**:
- `cursor`: string? (for pagination)
- `pageSize`: int? (default 50, max 100)
**Response**: `CursorPage<UserResponse>`
**Status Codes**: 200 OK, 403 Forbidden

#### GET `/api/users/me`
**Purpose**: Get current user profile
**Auth Required**: Yes
**Response**: `UserResponse`
**Status Codes**: 200 OK

#### GET `/api/users/{id:guid}`
**Purpose**: Get user details by ID
**Auth Required**: Yes
**Path Parameters**: `id` (User GUID)
**Response**: `UserResponse`
**Status Codes**: 200 OK, 404 Not Found

#### PUT `/api/users/update`
**Purpose**: Update current user profile
**Auth Required**: Yes
**Request Body**:
```json
{
  "firstName": "string?",
  "middleName": "string?",
  "lastName": "string?"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 400 Bad Request

#### POST `/api/users/password`
**Purpose**: Change password
**Auth Required**: Yes
**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 400 Bad Request

#### PUT `/api/users/promote`
**Purpose**: Promote user role
**Auth Required**: Yes (SuperAdmin)
**Request Body**:
```json
{
  "userId": "guid",
  "newRole": "UserRole" // Admin or SuperAdmin
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden, 404 Not Found

#### PUT `/api/users/demote`
**Purpose**: Demote user to User role
**Auth Required**: Yes (SuperAdmin)
**Request Body**:
```json
{
  "userId": "guid"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

#### PATCH `/api/users/lock`
**Purpose**: Lock user account
**Auth Required**: Yes (Admin/SuperAdmin)
**Request Body**:
```json
{
  "userId": "guid"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

#### PATCH `/api/users/unlock`
**Purpose**: Unlock user account
**Auth Required**: Yes (Admin/SuperAdmin)
**Request Body**:
```json
{
  "userId": "guid"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

### School Endpoints (`/api/schools`)

#### GET `/api/schools`
**Purpose**: List user's schools
**Auth Required**: Yes
**Response**: `SchoolResponse[]`
**Status Codes**: 200 OK

#### GET `/api/schools/{id:guid}`
**Purpose**: Get school details
**Auth Required**: Yes (Member)
**Path Parameters**: `id` (School GUID)
**Response**: `SchoolResponse`
**Status Codes**: 200 OK, 403 Forbidden, 404 Not Found

#### POST `/api/schools`
**Purpose**: Create new school
**Auth Required**: Yes
**Request Body**:
```json
{
  "name": "string"
}
```
**Validation**: Name 1-50 chars, unique per school
**Response**: `OperationResult<Guid>` with schoolId
**Status Codes**: 201 Created, 400 Bad Request

#### PUT `/api/schools/{id:guid}`
**Purpose**: Update school
**Auth Required**: Yes (Owner)
**Path Parameters**: `id` (School GUID)
**Request Body**:
```json
{
  "name": "string"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

#### DELETE `/api/schools/{id:guid}`
**Purpose**: Delete school
**Auth Required**: Yes (Owner)
**Path Parameters**: `id` (School GUID)
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

### School Member Endpoints (`/api/school-members`)

#### GET `/api/school-members/{schoolId}`
**Purpose**: List school members
**Auth Required**: Yes (Member)
**Path Parameters**: `schoolId` (School GUID)
**Response**: `SchoolMemberResponse[]`
**Status Codes**: 200 OK, 403 Forbidden

#### PUT `/api/school-members/{schoolId}/{userId}/role`
**Purpose**: Update member role
**Auth Required**: Yes (Admin/Owner)
**Path Parameters**: `schoolId`, `userId`
**Request Body**:
```json
{
  "role": "SchoolMemberRole"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

#### DELETE `/api/school-members/{schoolId}/{userId}`
**Purpose**: Remove member
**Auth Required**: Yes (Admin/Owner)
**Path Parameters**: `schoolId`, `userId`
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

### School Application Endpoints (`/api/school-applications`)

#### GET `/api/school-applications/my`
**Purpose**: List user's pending applications
**Auth Required**: Yes
**Response**: `SchoolApplicationResponse[]`
**Status Codes**: 200 OK

#### GET `/api/school-applications/{schoolId}`
**Purpose**: List school applications
**Auth Required**: Yes (Admin/Owner)
**Path Parameters**: `schoolId`
**Response**: `SchoolApplicationResponse[]`
**Status Codes**: 200 OK, 403 Forbidden

#### POST `/api/school-applications/{schoolId}`
**Purpose**: Apply to join school
**Auth Required**: Yes
**Path Parameters**: `schoolId`
**Request Body**:
```json
{
  "applicationType": "ApplicationType" // Teacher or Student
}
```
**Response**: `OperationResult<Guid>` with applicationId
**Status Codes**: 201 Created, 400 Bad Request

#### PATCH `/api/school-applications/{id}/review`
**Purpose**: Review application
**Auth Required**: Yes (Admin/Owner)
**Path Parameters**: `id` (Application GUID)
**Request Body**:
```json
{
  "status": "ApplicationStatus", // Approved or Rejected
  "reviewNotes": "string?"
}
```
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

#### DELETE `/api/school-applications/{id}`
**Purpose**: Cancel application
**Auth Required**: Yes (Applicant)
**Path Parameters**: `id` (Application GUID)
**Response**: `OperationResult<bool>`
**Status Codes**: 200 OK, 403 Forbidden

### Academic Endpoints

#### Course Endpoints (`/api/courses`)
- **GET** `/{schoolId}`: List courses (School Member)
- **GET** `/{schoolId}/{id}`: Get course (School Member)
- **POST** `/{schoolId}`: Create course (School Admin/Owner)
- **PUT** `/{schoolId}/{id}`: Update course (School Admin/Owner)
- **DELETE** `/{schoolId}/{id}`: Delete course (School Admin/Owner)

#### Semester Endpoints (`/api/semesters`)
- **GET** `/{schoolId}`: List semesters (School Member)
- **GET** `/{schoolId}/{id}`: Get semester (School Member)
- **POST** `/{schoolId}`: Create semester (School Admin/Owner)
- **DELETE** `/{schoolId}/{id}`: Delete semester (School Admin/Owner)

#### Term Endpoints (`/api/terms`)
- **GET** `/{semesterId}`: List terms (School Member)
- **GET** `/{semesterId}/{id}`: Get term (School Member)
- **POST** `/{semesterId}`: Create term (School Admin/Owner)
- **DELETE** `/{semesterId}/{id}`: Delete term (School Admin/Owner)

#### Course Offering Endpoints (`/api/course-offerings`)
- **GET** `/by-semester/{semesterId}`: List offerings (School Member)
- **GET** `/{id}`: Get offering (School Member)
- **POST** `/`: Create offering (School Admin/Owner)
- **PUT** `/{id}`: Update offering (School Admin/Owner)
- **DELETE** `/{id}`: Delete offering (School Admin/Owner)

#### Teacher Endpoints (`/api/teachers`)
- **GET** `/{schoolId}`: List teachers (School Member)
- **GET** `/{schoolId}/{id}`: Get teacher (School Member)
- **POST** `/{schoolId}`: Create teacher (School Admin/Owner)
- **PUT** `/{schoolId}/{id}`: Update teacher (School Admin/Owner)
- **DELETE** `/{schoolId}/{id}`: Remove teacher (School Admin/Owner)

#### Student Endpoints (`/api/students`)
- **GET** `/{schoolId}`: List students (School Admin/Owner)
- **GET** `/{schoolId}/{id}`: Get student (School Admin/Owner)
- **POST** `/{schoolId}`: Create student (School Admin/Owner)
- **PUT** `/{schoolId}/{id}`: Update student (School Admin/Owner)
- **DELETE** `/{schoolId}/{id}`: Remove student (School Admin/Owner)

#### Enrollment Endpoints (`/api/enrollments`)
- **GET** `/student/{studentId}`: List student enrollments (Student/School Admin)
- **GET** `/offering/{offeringId}`: List offering enrollments (School Teacher/Admin)
- **POST** `/`: Enroll in course (Student)
- **PATCH** `/{id}/withdraw`: Withdraw from course (Student)
- **PATCH** `/{id}/status`: Update enrollment status (School Teacher/Admin)

#### Assessment Endpoints (`/api/assessments`)
- **GET** `/{schoolId}`: List assessments (School Member)
- **GET** `/{schoolId}/{id}`: Get assessment (School Member)
- **POST** `/{schoolId}`: Create assessment (School Teacher/Admin)
- **PUT** `/{schoolId}/{id}`: Update assessment (School Teacher/Admin)
- **DELETE** `/{schoolId}/{id}`: Delete assessment (School Admin/Owner)

#### Assessment Instance Endpoints (`/api/assessment-instances`)
- **GET** `/by-offering/{offeringId}`: List instances (School Member)
- **GET** `/{id}`: Get instance (School Member)
- **POST** `/`: Create instance (School Teacher)
- **PUT** `/{id}`: Update instance (School Teacher)
- **DELETE** `/{id}`: Delete instance (School Teacher)

#### Student Assessment Endpoints (`/api/student-assessments`)
- **GET** `/student/{studentId}`: List student assessments (Student/School Admin)
- **GET** `/instance/{instanceId}`: List assessments for instance (School Teacher)
- **PATCH** `/{id}/submit`: Submit assessment (Student)
- **PATCH** `/{id}/grade`: Grade assessment (School Teacher)

## Request/Response Formats

### Standard Response Wrapper
```json
{
  "messageId": "string",
  "message": "string",
  "details": [
    {
      "message": "string",
      "severity": "Error|Warning|Info"
    }
  ],
  "data": "T?",
  "traceId": "string"
}
```

### Authorization Headers
All protected endpoints require:
- `Cookie: educ_session=<session_id>`
- School-scoped endpoints validate school membership and role permissions

### Error Responses
```json
{
  "messageId": "auth_failed",
  "message": "Authentication required",
  "details": [
    {
      "message": "Session expired or invalid",
      "severity": "Error"
    }
  ],
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Pagination
Cursor-based pagination for large result sets:
```json
{
  "data": [...],
  "hasNextPage": true,
  "nextCursor": "eyJpZCI6IjEyMzQ1Njc4OTAiLCJjcmVhdGVkQXQiOiIyMDI0LTEyLTAxVDEwOjMwOjAwWiJ9"
}
```

## Security Considerations

### Authentication Security
- Session IDs are cryptographically secure GUIDs
- HTTP-only cookies prevent XSS attacks
- Secure flag required in production
- Session sliding expiration prevents indefinite sessions

### Authorization Security
- School-scoped access prevents data leakage between schools
- Role-based permissions with hierarchical access
- Application review process for new members
- Audit logging for sensitive operations

### Data Protection
- Sensitive data encrypted at rest (AES-256-GCM)
- Email hashes for privacy compliance
- Encrypted assessment feedback
- Secure password hashing (bcrypt)

### API Security
- Input validation on all endpoints
- SQL injection prevention via EF Core
- XSS protection via content encoding
- CSRF protection via SameSite cookies
- Context-based rate limiting to prevent abuse

### Context-Based Rate Limiting Strategy

#### 1. Auth Context Rate Limiting
**Purpose**: Protect authentication endpoints from brute force and credential stuffing
**Protected Endpoints**: `/api/auth/register`, `/api/auth/login`

- **Method**: IP-based rate limiting
- **Limits**:
  - Login: 5 failed attempts per 15 minutes per IP
  - Register: 3 registrations per hour per IP
  - Refresh: 30 requests per minute per user
- **Storage**: Redis with automatic expiration
- **Response**: 429 Too Many Requests with `Retry-After` header
- **Bypass**: CAPTCHA verification for legitimate high-volume IPs

#### 2. User Context Rate Limiting
**Purpose**: Prevent abuse of user profile endpoints
**Protected Endpoints**: `/api/users/*` (excluding public profiles)

- **Method**: User-based rate limiting using authenticated UserId
- **Limits**:
  - GET operations: 100 requests per minute per user
  - Mutation operations (PUT/PATCH): 30 requests per minute per user
  - Password changes: 5 per hour per user
- **Storage**: Redis with user session binding
- **Enforcement**: Applied after authentication

#### 3. School Context Rate Limiting
**Purpose**: Protect school membership and invitation workflows
**Protected Endpoints**: `/api/schools/*`, `/api/school-members/*`, `/api/school-applications/*`, `/api/school-invites/*`

- **Method**: User-based limiting scoped by school context
- **Limits**:
  - School creation: 5 per hour per user
  - School applications: 2 per school per user
  - Invitations: 20 per day per school
  - Member management: 50 per hour per school
- **Storage**: Redis with school-context key prefix
- **Tracking**: Track by (UserId, SchoolId) tuple for fine-grained control

#### 4. Academic Context Rate Limiting
**Purpose**: Manage academic resource access and submission workflows
**Protected Endpoints**: `/api/courses/*`, `/api/semesters/*`, `/api/terms/*`, `/api/course-offerings/*`, `/api/students/*`, `/api/teachers/*`, `/api/enrollments/*`, `/api/assessments/*`

- **Method**: User-based limiting scoped by school and operation type
- **Limits by Operation**:
  - Read operations (GET): 200 per minute per user
  - Course/Assessment creation (POST): 50 per hour per user per school
  - Enrollment operations: 10 per hour per user
  - Assessment submissions: 20 per day per student per course
  - Grading operations: 100 per hour per teacher per course
- **Storage**: Redis with school and context binding
- **Tracking**: Track by (UserId, SchoolId, ResourceType) for precise control

#### Implementation Architecture

**Rate Limiting Middleware Pipeline**:
```
1. RateLimitingMiddleware
   ├─ Check context (Auth/User/School/Academic)
   ├─ Identify subject (IP or UserId)
   ├─ Apply context-specific limits
   ├─ Increment counter in Redis
   └─ Return 429 if exceeded

2. Context-Specific Policy Engine
   ├─ AuthRateLimitPolicy
   ├─ UserRateLimitPolicy
   ├─ SchoolRateLimitPolicy
   └─ AcademicRateLimitPolicy
```

**Storage Strategy**:
- Primary: Redis for performance
- Fallback: In-memory cache with eventual Redis sync
- Key format: `ratelimit:{context}:{subject}:{resource}`
- TTL: Context-specific expiration windows

**Response Headers**:
- `X-RateLimit-Limit`: Max requests for this window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: UTC timestamp when limit resets
- `Retry-After`: Seconds to wait (on 429)

**Configuration** (appsettings.json):
```json
{
  "RateLimiting": {
    "Auth": {
      "LoginAttempts": 5,
      "LoginWindowMinutes": 15,
      "RegisterPerHour": 3
    },
    "User": {
      "GetPerMinute": 100,
      "MutationPerMinute": 30,
      "PasswordChangePerHour": 5
    },
    "School": {
      "CreationPerHour": 5,
      "ApplicationsPerSchool": 2,
      "InvitationsPerDay": 20,
      "MemberManagementPerHour": 50
    },
    "Academic": {
      "GetPerMinute": 200,
      "CreationPerHour": 50,
      "EnrollmentPerHour": 10,
      "SubmissionPerDay": 20,
      "GradingPerHour": 100
    }
  }
}
```

### Cursor-Based Pagination
```json
{
  "items": "T[]",
  "nextCursor": "string?",
  "hasMore": "boolean"
}
```

### Common DTOs
```csharp
public record UserResponse(
    Guid Id,
    string UserName,
    UserRole Role,
    bool IsLocked,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record SchoolResponse(
    Guid Id,
    string Name,
    Guid OwnerUserId,
    bool IsLocked,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
```

## Middleware Pipeline

### Request Processing Order
1. **TraceIdMiddleware**: Adds X-Trace-Id header
2. **ExceptionHandlingMiddleware**: Catches and formats exceptions
3. **AuthenticationMiddleware**: Validates session
4. **AuthorizationMiddleware**: Checks permissions
5. **Endpoint Handler**: Processes request

### Error Handling
**AppException Hierarchy**:
```csharp
public class AppException : Exception
{
    public string Id { get; }
    public int StatusCode { get; }
    public string Title { get; }
}

public static class ResponseCatalog
{
    public static AppException UserNotFound =>
        new("USER_NOT_FOUND", 404, "User not found");

    public static AppException SchoolCreated =>
        new("SCHOOL_CREATED", 201, "School created successfully");
}
```

## Implementation Requirements

### Endpoint Module Pattern
```csharp
public interface IEndpointModule
{
    void RegisterEndpoints(IEndpointRouteBuilder app);
}

public static class EndpointModuleExtensions
{
    public static void AddEndpointModules(this IServiceCollection services)
    {
        // Scan and register all IEndpointModule implementations
    }
}
```

### Endpoint Implementation Example
```csharp
public class AuthEndpoints : IEndpointModule
{
    public void RegisterEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/register", async (RegisterUserCommand command, IMediator mediator) =>
        {
            var result = await mediator.Send(command);
            return result.ToApiResponse(HttpStatusCode.Created);
        })
        .AllowAnonymous();
    }
}
```

## Security Requirements

### Input Validation
- All inputs validated via FluentValidation
- SQL injection prevention via parameterized queries
- XSS protection via output encoding
- File upload restrictions (future)

### Rate Limiting
- Not implemented (Phase 2)
- Should limit: Auth attempts, API calls per user
- Implementation: Sliding window or token bucket

### CORS Configuration
```json
{
  "Cors": {
    "AllowedOrigins": ["https://localhost:3000", "https://app.edutracker.com"],
    "AllowCredentials": true
  }
}
```

## Configuration

### appsettings.json
```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  },
  "SessionLifetime": {
    "DefaultLifetime": "08:00:00",
    "RememberMeLifetime": "7.00:00:00",
    "RefreshThreshold": 0.75
  }
}
```

### Launch Settings
```json
{
  "profiles": {
    "https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "https://localhost:5001;http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

## Implementation Checklist

### Phase 1: Core Setup
- [ ] Configure ASP.NET Core project
- [ ] Set up authentication handler
- [ ] Implement middleware pipeline
- [ ] Create endpoint module pattern
- [ ] Set up CORS and HTTPS

### Phase 2: Authentication Endpoints
- [ ] Implement AuthEndpoints module
- [ ] Add session cookie handling
- [ ] Create request/response DTOs
- [ ] Add input validation

### Phase 3: User Management
- [ ] Implement UserEndpoints
- [ ] Add role-based authorization
- [ ] Create pagination support
- [ ] Add admin-only endpoints

### Phase 4: School Features
- [ ] Implement school CRUD
- [ ] Add member management
- [ ] Create invitation system
- [ ] Add permission checks

### Phase 5: Academic Features
- [ ] Implement course endpoints
- [ ] Add semester/term management
- [ ] Create course offerings
- [ ] Add school scoping

### Phase 6: Documentation & Testing
- [ ] Set up Scalar documentation
- [ ] Add comprehensive error handling
- [ ] Create API tests
- [ ] Performance testing

## Design Decisions

### Minimal APIs vs Controllers
- **Chosen**: Minimal APIs for simplicity and performance
- **Rationale**: Less boilerplate, better performance, modern approach

### Session vs JWT
- **Chosen**: Session-based authentication
- **Rationale**: Better security, automatic expiration, server-side control

### Cookie vs Bearer Token
- **Chosen**: HTTP-only cookies
- **Rationale**: CSRF protection, automatic transmission, XSS prevention

### Error Response Format
- **Chosen**: Structured error responses with message IDs
- **Rationale**: Consistent error handling, internationalization support

## Future Enhancements
- API versioning (URL-based)
- Rate limiting implementation
- API analytics and monitoring
- GraphQL support (alternative to REST)
- WebSocket support for real-time features