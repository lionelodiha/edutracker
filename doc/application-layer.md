# Application Layer Design Document

## Overview
This document specifies the application layer for the EduTracker platform using CQRS (Command Query Responsibility Segregation) pattern. It defines use cases, commands, queries, business rules, and application services, aligned with the strict bounded contexts: User, School, and Academic.

## CQRS Architecture Design

### Core Interfaces
- `IMessage<TResult>`: Base interface for all CQRS messages
- `ICommand`: Marker for commands (state-changing operations)
- `IQuery<TResponse>`: Marker for queries (read operations)
- `IHandler<TMessage, TResult>`: Processes messages
- `IMediator`: Routes messages to appropriate handlers

### Pipeline Behaviors (Execution Order)
1. **RateLimitingBehavior**: Context-based rate limiting check
2. **ValidationBehavior**: FluentValidation integration
3. **AuthorizationBehavior**: School-scoped permission checks
4. **LoggingBehavior**: Request/response logging
5. **RetryBehavior**: Transient failure handling
6. **Handler**: Core business logic execution

### Message Structure
```csharp
// Commands
public record RegisterUserCommand(string UserName, string Email, string Password) : ICommand;

// Queries
public record GetUsersQuery(string? Cursor, int PageSize) : IQuery<CursorPage<UserResponse>>;
```

### Rate Limiting in CQRS Pipeline

**RateLimitingBehavior** executes as the first behavior to prevent resource exhaustion before validation or authorization:

```csharp
public class RateLimitingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IMessage<TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var context = DetermineContext(request); // Auth, User, School, Academic
        var subject = ExtractSubject(request);    // UserId, IP, SchoolId, etc.

        var rateLimitResult = context switch
        {
            RateLimitContext.Auth => await _authLimiter.CheckAsync(subject),
            RateLimitContext.User => await _userLimiter.CheckAsync(subject),
            RateLimitContext.School => await _schoolLimiter.CheckAsync(subject),
            RateLimitContext.Academic => await _academicLimiter.CheckAsync(subject),
            _ => RateLimitResult.Allowed
        };

        if (!rateLimitResult.IsAllowed)
            throw new RateLimitExceededException(rateLimitResult);

        return await next();
    }
}
```

**Context Detection**:
- Commands/Queries attributed with `[AuthContext]` → Auth context
- Commands/Queries attributed with `[UserContext]` → User context
- Commands/Queries attributed with `[SchoolContext]` → School context
- Commands/Queries attributed with `[AcademicContext]` → Academic context

### Command/Query Context Attribution

All commands and queries must be attributed with their bounded context to enable automatic rate limiting enforcement:

```csharp
// Auth Context - IP-based rate limiting
[AuthContext]
public record RegisterUserCommand(string UserName, string Email, string Password) : ICommand;

[AuthContext]
public record LoginUserCommand(string Identifier, string Password) : ICommand;

// User Context - User-based rate limiting
[UserContext]
public record UpdateCurrentUserCommand(string FirstName, string LastName) : ICommand;

[UserContext]
public record GetCurrentUserQuery : IQuery<UserResponse>;

// School Context - School-scoped user-based rate limiting
[SchoolContext]
public record CreateSchoolCommand(string Name) : ICommand;

[SchoolContext]
public record ApplyToSchoolCommand(Guid SchoolId, ApplicationType Type) : ICommand;

// Academic Context - Academic-scoped user-based rate limiting
[AcademicContext]
public record CreateCourseCommand(Guid SchoolId, string Code, string Name) : ICommand;

[AcademicContext]
public record EnrollInCourseCommand(Guid CourseOfferingId) : ICommand;

[AcademicContext]
public record SubmitAssessmentCommand(Guid AssessmentInstanceId, decimal Score) : ICommand;
```

## Use Case Specifications

### 1. User Registration
**Actor**: Anonymous user
**Goal**: Create new user account
**Preconditions**: Valid username, email, password
**Postconditions**: User created, account active

**Command**: `RegisterUserCommand`
- **Parameters**: UserName, Email, Password, FirstName?, MiddleName?, LastName?
- **Validation**:
  - UserName: 1-30 chars, alphanumeric + underscore, unique
  - Email: Valid format, unique (hash check)
  - Password: Minimum complexity requirements
- **Business Rules**:
  - Email stored as SHA-256 hash
  - Password hashed with bcrypt
  - Personal names encrypted with AES-256-GCM
- **Response**: UserId

### 2. User Authentication
**Actor**: Registered user
**Goal**: Authenticate and create session
**Preconditions**: Valid credentials
**Postconditions**: Session created, cookie set

**Command**: `LoginUserCommand`
- **Parameters**: Identifier (username/email), Password, RememberMe?
- **Validation**:
  - Identifier format validation
  - Password presence
- **Business Rules**:
  - Support both username and email login
  - Account lockout check
  - Session lifetime: 8h default, 7d with RememberMe
  - HTTP-only secure cookie
- **Response**: Session info

### 3. School Creation
**Actor**: Authenticated user
**Goal**: Create new school
**Preconditions**: User authenticated
**Postconditions**: School created, user is owner

**Command**: `CreateSchoolCommand`
- **Parameters**: Name
- **Validation**:
  - Name: 1-50 chars, unique per school
- **Business Rules**:
  - Creator becomes owner
  - Owner automatically becomes member with Owner role
- **Response**: SchoolId

### 4. School Application
**Actor**: Authenticated user (not school member)
**Goal**: Apply to join school as teacher or student
**Preconditions**: User authenticated, not already member
**Postconditions**: Application submitted for review

**Command**: `ApplyToSchoolCommand`
- **Parameters**: SchoolId, ApplicationType (Teacher/Student)
- **Validation**:
  - User not already member of school
  - Application type valid
- **Business Rules**:
  - Creates SchoolApplication with Pending status
  - Application reviewed by school admins/owners
- **Response**: ApplicationId

### 5. Application Review
**Actor**: School admin/owner
**Goal**: Approve or reject school application
**Preconditions**: User is school admin/owner, application exists
**Postconditions**: Application status updated, membership created if approved

**Command**: `ReviewSchoolApplicationCommand`
- **Parameters**: ApplicationId, Status (Approved/Rejected), ReviewNotes?
- **Validation**:
  - User has permission to review applications
  - Application in Pending status
- **Business Rules**:
  - Approval creates SchoolMember with appropriate role
  - Rejection updates status with notes
  - Review notes encrypted
- **Response**: Success status

### 6. Course Management
**Actor**: School member (Teacher/Admin/Owner)
**Goal**: Create academic course
**Preconditions**: User is school member
**Postconditions**: Course created

**Command**: `CreateCourseCommand`
- **Parameters**: SchoolId, Name, Code, Description?, Credits?
- **Validation**:
  - Code unique within school
  - Name required
- **Business Rules**:
  - Courses scoped to schools
  - Codes must be unique per school
- **Response**: CourseId

### 7. Assessment Management
**Actor**: School teacher/admin/owner
**Goal**: Create custom assessment
**Preconditions**: User has permission in school
**Postconditions**: Assessment created

**Command**: `CreateAssessmentCommand`
- **Parameters**: SchoolId, Name, Description?, Type, MaxScore, Weight, IsRequired?, DueDate?
- **Validation**:
  - School membership check
  - Weight between 0-1
  - MaxScore > 0
- **Business Rules**:
  - Assessments are school-specific and custom
  - No two schools have identical assessments
  - Weight contributes to course grade calculation
- **Response**: AssessmentId

### 8. Student Enrollment
**Actor**: Student
**Goal**: Enroll in course offering
**Preconditions**: User is student in school, offering exists
**Postconditions**: Enrollment created

**Command**: `EnrollInCourseCommand`
- **Parameters**: CourseOfferingId
- **Validation**:
  - User is student in school
  - Offering belongs to same school
  - Not already enrolled
- **Business Rules**:
  - Students can enroll in multiple offerings
  - Enrollment status starts as Enrolled
- **Response**: EnrollmentId

### 9. Assessment Submission
**Actor**: Student
**Goal**: Submit completed assessment
**Preconditions**: Student enrolled in course, assessment assigned
**Postconditions**: Assessment submitted for grading

**Command**: `SubmitAssessmentCommand`
- **Parameters**: AssessmentInstanceId, Score?, SubmissionNotes?
- **Validation**:
  - Student enrolled in course offering
  - Assessment instance exists and is active
- **Business Rules**:
  - Updates StudentAssessment status to Submitted
  - Score optional for self-assessment types
- **Response**: Success status

### 10. Assessment Grading
**Actor**: Teacher
**Goal**: Grade submitted assessment
**Preconditions**: Teacher assigned to course, assessment submitted
**Postconditions**: Assessment graded with feedback

**Command**: `GradeAssessmentCommand`
- **Parameters**: StudentAssessmentId, Score, Grade?, Feedback?
- **Validation**:
  - Teacher assigned to course offering
  - Assessment submitted by student
  - Score within valid range
- **Business Rules**:
  - Feedback encrypted for privacy
  - Grade calculated based on school scale
  - Status updated to Graded
- **Response**: Success status

### 6. Course Management
**Actor**: School member (Teacher/Admin/Owner)
**Goal**: Create academic course
**Preconditions**: User is school member
**Postconditions**: Course created

**Command**: `CreateCourseCommand`
- **Parameters**: SchoolId, Name, Code, Description?, Credits?
- **Validation**:
  - Code unique within school
  - Name required
- **Business Rules**:
  - Courses scoped to schools
  - Codes must be unique per school
- **Response**: CourseId

## Command & Query Specifications

### Authentication Commands
| Command               | Parameters                       | Validation                 | Business Rules             |
| --------------------- | -------------------------------- | -------------------------- | -------------------------- |
| RegisterUser          | UserName, Email, Password, Names | Format, uniqueness         | Hash email, encrypt names  |
| LoginUser             | Identifier, Password, RememberMe | Format                     | Create session, set cookie |
| LogoutUser            | -                                | Authenticated              | Revoke session             |
| RefreshSession        | -                                | Authenticated, not expired | Extend session             |
| RevokeUserSession     | SessionId                        | Admin/SuperAdmin           | Revoke specific session    |
| RevokeAllUserSessions | UserId                           | Admin/SuperAdmin           | Revoke all user sessions   |

### User Management Commands
| Command            | Parameters                         | Validation       | Business Rules    |
| ------------------ | ---------------------------------- | ---------------- | ----------------- |
| UpdateUser         | FirstName?, MiddleName?, LastName? | Authenticated    | Encrypt names     |
| UpdateUserPassword | CurrentPassword, NewPassword       | Authenticated    | Hash new password |
| PromoteUser        | UserId, NewRole                    | SuperAdmin       | Role hierarchy    |
| DemoteUser         | UserId                             | SuperAdmin       | Role hierarchy    |
| LockUser           | UserId                             | Admin/SuperAdmin | Prevent login     |
| UnlockUser         | UserId                             | Admin/SuperAdmin | Allow login       |

### School Commands
| Command      | Parameters     | Validation    | Business Rules                       |
| ------------ | -------------- | ------------- | ------------------------------------ |
| CreateSchool | Name           | Authenticated | Creator becomes owner                |
| UpdateSchool | SchoolId, Name | Owner         | Unique name                          |
| DeleteSchool | SchoolId       | Owner         | Soft delete school and mark inactive |

### Membership Commands
| Command                 | Parameters                                     | Validation         | Business Rules                   |
| ----------------------- | ---------------------------------------------- | ------------------ | -------------------------------- |
| ApplyToSchool           | SchoolId, ApplicationType                      | Authenticated      | Create pending application       |
| ReviewSchoolApplication | ApplicationId, Status, ReviewNotes?            | School Admin/Owner | Create membership if approved    |
| CancelSchoolApplication | ApplicationId                                  | Applicant          | Update status to cancelled       |
| InviteToSchool          | SchoolId, InvitedUserId, RoleOffered, Message? | School Admin/Owner | Create pending invite            |
| AcceptSchoolInvite      | InviteId                                       | Invited User       | Create membership, update status |
| DeclineSchoolInvite     | InviteId                                       | Invited User       | Update status to declined        |
| CancelSchoolInvite      | InviteId                                       | Inviter            | Update status to cancelled       |

### Academic Commands
| Command              | Parameters                                     | Validation         | Business Rules                    |
| -------------------- | ---------------------------------------------- | ------------------ | --------------------------------- |
| CreateCourse         | SchoolId, Name, Code, Description?, Credits?   | School Member      | Unique code per school            |
| UpdateCourse         | CourseId, Name?, Code?, Description?, Credits? | School Member      | Unique code per school            |
| DeleteCourse         | CourseId                                       | School Admin/Owner | Soft delete course                |
| CreateSemester       | SchoolId, Name, StartYear                      | School Member      | Year bounds                       |
| DeleteSemester       | SemesterId                                     | School Admin/Owner | Soft delete semester              |
| CreateTerm           | SemesterId, Name, Ordinal                      | School Member      | Ordinal 1-6                       |
| DeleteTerm           | TermId                                         | School Admin/Owner | Soft delete term                  |
| CreateCourseOffering | CourseId, TermId, TeacherId, MaxEnrollment?    | School Admin/Owner | Unique per term, teacher assigned |
| DeleteCourseOffering | OfferingId                                     | School Admin/Owner | Soft delete offering              |

### Teacher/Student Commands
| Command            | Parameters                                                          | Validation         | Business Rules           |
| ------------------ | ------------------------------------------------------------------- | ------------------ | ------------------------ |
| CreateTeacher      | SchoolId, SchoolMemberId, EmployeeId?, Department?, Specialization? | School Admin/Owner | Unique employee ID       |
| UpdateTeacher      | TeacherId, EmployeeId?, Department?, Specialization?                | School Admin/Owner | Unique employee ID       |
| CreateStudent      | SchoolId, SchoolMemberId, StudentId?, GradeLevel?                   | School Admin/Owner | Unique student ID        |
| UpdateStudent      | StudentId, StudentId?, GradeLevel?                                  | School Admin/Owner | Unique student ID        |
| EnrollInCourse     | CourseOfferingId                                                    | Student            | Not already enrolled     |
| WithdrawFromCourse | EnrollmentId                                                        | Student            | Update enrollment status |

### Assessment Commands
| Command                  | Parameters                                                                   | Validation           | Business Rules                    |
| ------------------------ | ---------------------------------------------------------------------------- | -------------------- | --------------------------------- |
| CreateAssessment         | SchoolId, Name, Description?, Type, MaxScore, Weight, IsRequired?, DueDate?  | School Teacher/Admin | School-specific custom assessment |
| UpdateAssessment         | AssessmentId, Name?, Description?, MaxScore?, Weight?, IsRequired?, DueDate? | School Teacher/Admin | Maintain assessment integrity     |
| DeleteAssessment         | AssessmentId                                                                 | School Admin/Owner   | Soft delete assessment            |
| CreateAssessmentInstance | AssessmentId, CourseOfferingId, ScheduledDate?, DueDate?, Instructions?      | School Teacher       | Link to course offering           |
| UpdateAssessmentInstance | InstanceId, ScheduledDate?, DueDate?, Instructions?                          | School Teacher       | Update scheduling                 |
| SubmitAssessment         | AssessmentInstanceId, Score?, SubmissionNotes?                               | Student              | Update submission status          |
| GradeAssessment          | StudentAssessmentId, Score, Grade?, Feedback?                                | Teacher              | Encrypt feedback, calculate grade |

### Query Specifications
| Query                        | Parameters                 | Response                 | Authorization        |
| ---------------------------- | -------------------------- | ------------------------ | -------------------- |
| GetUsers                     | Cursor?, PageSize?         | CursorPage<UserResponse> | Admin/SuperAdmin     |
| GetCurrentUser               | -                          | UserResponse             | Authenticated        |
| GetUserById                  | UserId                     | UserResponse             | Any                  |
| GetSchools                   | -                          | SchoolResponse[]         | Authenticated        |
| GetSchoolById                | SchoolId                   | SchoolResponse           | School Member        |
| GetSchoolMembers             | SchoolId                   | MemberResponse[]         | School Member        |
| GetSchoolApplications        | SchoolId                   | ApplicationResponse[]    | School Admin/Owner   |
| GetMyApplications            | -                          | ApplicationResponse[]    | Authenticated        |
| GetSchoolInvites             | SchoolId                   | InviteResponse[]         | School Admin/Owner   |
| GetMyInvites                 | -                          | InviteResponse[]         | Authenticated        |
| GetCourses                   | SchoolId                   | CourseResponse[]         | School Member        |
| GetCourseById                | CourseId                   | CourseResponse           | School Member        |
| GetSemesters                 | SchoolId                   | SemesterResponse[]       | School Member        |
| GetSemesterById              | SemesterId                 | SemesterResponse         | School Member        |
| GetTerms                     | SemesterId                 | TermResponse[]           | School Member        |
| GetCourseOfferingsBySemester | SemesterId                 | OfferingResponse[]       | School Member        |
| GetTeachers                  | SchoolId                   | TeacherResponse[]        | School Member        |
| GetStudents                  | SchoolId                   | StudentResponse[]        | School Admin/Owner   |
| GetStudentEnrollments        | StudentId                  | EnrollmentResponse[]     | Student/School Admin |
| GetAssessments               | SchoolId                   | AssessmentResponse[]     | School Member        |
| GetAssessmentInstances       | CourseOfferingId           | InstanceResponse[]       | School Member        |
| GetStudentAssessments        | StudentId/CourseOfferingId | AssessmentResponse[]     | Student/Teacher      |

## Application Services

### SessionStateService
**Purpose**: Manages session data retrieval and caching

**Interface**:
```csharp
Task<SessionData?> GetSessionDataAsync(Guid sessionId);
Task InvalidateSessionAsync(Guid sessionId);
```

**Implementation Requirements**:
- Cache-first lookup (Redis)
- Database fallback
- TTL management based on session lifetime

### UserAuthenticationStateService
**Purpose**: Provides cached user authentication state

**Interface**:
```csharp
Task<UserAuthData?> GetUserAuthDataAsync(Guid userId);
Task InvalidateUserAuthDataAsync(Guid userId);
```

**Implementation Requirements**:
- 1-hour cache TTL
- Role and lock status caching
- Cache invalidation on changes

### CacheService
**Purpose**: Generic caching abstraction

**Interface**:
```csharp
Task<T?> GetAsync<T>(string key);
Task SetAsync<T>(string key, T value, TimeSpan? ttl = null);
Task RemoveAsync(string key);
```

**Implementation**: Redis-based with JSON serialization

### Context-Based Rate Limiting Services

#### IAuthContextRateLimiter
**Purpose**: Rate limiting for authentication endpoints (login, register)

**Interface**:
```csharp
Task<RateLimitResult> CheckLoginAttemptAsync(string ipAddress);
Task<RateLimitResult> CheckRegistrationAsync(string ipAddress);
Task<RateLimitResult> CheckRefreshAsync(Guid userId);
Task RecordFailedLoginAsync(string ipAddress);
Task ResetLoginAttemptsAsync(string ipAddress);
```

**Configuration**:
- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per hour per IP
- Session refresh: 30 per minute per user

#### IUserContextRateLimiter
**Purpose**: Rate limiting for user management endpoints

**Interface**:
```csharp
Task<RateLimitResult> CheckGetOperationAsync(Guid userId);
Task<RateLimitResult> CheckMutationAsync(Guid userId);
Task<RateLimitResult> CheckPasswordChangeAsync(Guid userId);
```

**Configuration**:
- GET operations: 100 per minute per user
- Mutations (PUT/PATCH): 30 per minute per user
- Password changes: 5 per hour per user

#### ISchoolContextRateLimiter
**Purpose**: Rate limiting for school management endpoints

**Interface**:
```csharp
Task<RateLimitResult> CheckSchoolCreationAsync(Guid userId);
Task<RateLimitResult> CheckSchoolApplicationAsync(Guid userId, Guid schoolId);
Task<RateLimitResult> CheckInvitationAsync(Guid schoolId);
Task<RateLimitResult> CheckMemberManagementAsync(Guid schoolId);
```

**Configuration**:
- School creation: 5 per hour per user
- Applications: 2 per school per user
- Invitations: 20 per day per school
- Member management: 50 per hour per school

#### IAcademicContextRateLimiter
**Purpose**: Rate limiting for academic endpoints (courses, assessments, enrollments)

**Interface**:
```csharp
Task<RateLimitResult> CheckReadOperationAsync(Guid userId);
Task<RateLimitResult> CheckCreationAsync(Guid userId, Guid schoolId, string resourceType);
Task<RateLimitResult> CheckEnrollmentAsync(Guid studentId);
Task<RateLimitResult> CheckAssessmentSubmissionAsync(Guid studentId, Guid courseOfferingId);
Task<RateLimitResult> CheckGradingOperationAsync(Guid teacherId, Guid courseOfferingId);
```

**Configuration**:
- Read operations: 200 per minute per user
- Creation: 50 per hour per user per school
- Enrollments: 10 per hour per user
- Assessment submissions: 20 per day per student per course
- Grading: 100 per hour per teacher per course

#### RateLimitResult Model
```csharp
public record RateLimitResult(
    bool IsAllowed,
    int Limit,
    int Remaining,
    DateTime ResetTime,
    string? Message
);
```

## Business Rules Engine

### Authentication Rules
- **Password Complexity**: Minimum 8 chars, mixed case, numbers, symbols
- **Session Management**: Sliding expiration with absolute limits
- **Account Lockout**: Configurable after failed attempts (future)
- **Remember Me**: Extended 7-day sessions

### Authorization Rules
- **Role Hierarchy**: User < Admin < SuperAdmin (system-wide)
- **School Permissions**:
  - Owner: Full control over school
  - Admin: Member management, academic management
  - Teacher: Course management, assessment grading
  - Student: Enrollment, assessment submission
- **System Admin**: User management across system

### School Rules
- **Membership**: Users can join multiple schools with different roles
- **Ownership**: Single owner, transferable
- **Soft Deletes**: Schools and related data are soft-deleted, not physically removed
- **No Cascading Deletes**: Related data remains for audit, marked inactive
- **Application System**: Direct joining for teachers/students without invitation

### Application Rules
- **Direct Access**: Teachers and students can apply without invitation
- **Review Process**: Applications reviewed by school admins/owners
- **Approval Workflow**: Approved applications create school membership
- **Expiration**: Pending applications expire after configurable time

### Academic Rules
- **Scoping**: All academic entities belong to schools
- **Teacher Assignment**: Course offerings have assigned teachers
- **Student Enrollment**: Students enroll in specific course offerings
- **Term Structure**: Semesters contain 1-6 terms
- **Course Codes**: Unique within schools

### Assessment Rules
- **School-Specific**: Assessments are custom per school
- **No Duplication**: Each school defines unique assessment structures
- **Instance-Based**: Assessments instantiated per course offering
- **Grading Authority**: Only assigned teachers can grade assessments
- **Privacy**: Assessment feedback encrypted

### Enrollment Rules
- **Student Control**: Students manage their own enrollments
- **Capacity Limits**: Optional enrollment caps per course offering
- **Status Tracking**: Enrollment status changes tracked
- **Grade Calculation**: Final grades computed from assessment weights

## Validation Specifications

### FluentValidation Validators
Each command requires corresponding validator:

```csharp
public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty()
            .Length(1, 30)
            .Matches("^[a-zA-Z0-9_]+$")
            .MustAsync(BeUniqueUserName);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]")
            .Matches("[a-z]")
            .Matches("[0-9]");
    }
}
```

### Authorization Validation
```csharp
public class SchoolScopedValidator<TCommand> : AbstractValidator<TCommand>
    where TCommand : ISchoolScopedCommand
{
    public SchoolScopedValidator(ISchoolAuthorizationService authService)
    {
        RuleFor(x => x.SchoolId)
            .MustAsync(async (schoolId, _) => await authService.HasAccess(schoolId))
            .WithMessage("User does not have access to this school");
    }
}
```

### Cross-Field Validation
- School applications: Check user not already member
- Course offerings: Validate course/term/teacher belong to same school
- Assessment grading: Validate teacher assigned to course offering
- Student enrollment: Check enrollment capacity and prerequisites

## Response Models

### OperationResult<T>
Standard response wrapper:
```csharp
public record OperationResult<T>(
    string MessageId,
    string Message,
    ResponseDetail[]? Details = null,
    T? Data = null
);
```

### CursorPage<T>
Pagination for large datasets:
```csharp
public record CursorPage<T>(
    T[] Items,
    string? NextCursor,
    bool HasMore
);
```

### Specialized DTOs
- `UserResponse`: Safe user data for clients
- `SchoolResponse`: School details with membership info
- `SessionTimestampsResponse`: Session expiration times

## Configuration Options

### CacheTimeToLiveOptions
```csharp
public class CacheTimeToLiveOptions
{
    public TimeSpan UserAuthDataTtl { get; set; } = TimeSpan.FromHours(1);
    public TimeSpan QueryResultTtl { get; set; } = TimeSpan.FromMinutes(5);
}
```

### SessionLifetimeOptions
```csharp
public class SessionLifetimeOptions
{
    public TimeSpan DefaultLifetime { get; set; } = TimeSpan.FromHours(8);
    public TimeSpan RememberMeLifetime { get; set; } = TimeSpan.FromDays(7);
    public double RefreshThreshold { get; set; } = 0.75;
}
```

### SchoolInviteOptions
```csharp
public class SchoolInviteOptions
{
    public TimeSpan DefaultExpiration { get; set; } = TimeSpan.FromDays(7);
}
```

## Implementation Checklist

### Phase 1: Core CQRS Setup
- [ ] Define IMessage, ICommand, IQuery interfaces
- [ ] Implement IMediator with reflection-based dispatch
- [ ] Create pipeline behaviors (Validation, Logging, Retry)
- [ ] Set up dependency injection

### Phase 2: Authentication Features
- [ ] Implement RegisterUser command/handler/validator
- [ ] Implement LoginUser command/handler/validator
- [ ] Create SessionStateService
- [ ] Add UserAuthenticationStateService

### Phase 3: User Management
- [ ] Implement user CRUD operations
- [ ] Add role management (promote/demote)
- [ ] Implement account lockout
- [ ] Create user queries

### Phase 4: School Features
- [ ] Implement school CRUD
- [ ] Add member management
- [ ] Create invitation system
- [ ] Implement permission checks

### Phase 5: Academic Features
- [ ] Implement course management
- [ ] Add semester/term structure
- [ ] Create course offerings
- [ ] Add academic queries

### Phase 6: Testing & Validation
- [ ] Unit tests for handlers
- [ ] Integration tests for workflows
- [ ] Validation rule tests
- [ ] Performance testing

## Design Decisions

### CQRS Pattern
- **Commands vs Queries**: Clear separation of concerns
- **Pipeline Behaviors**: Cross-cutting concerns handling
- **Mediator Pattern**: Loose coupling between layers

### Validation Strategy
- **FluentValidation**: Declarative, testable validation rules
- **Command Validation**: Validate before business logic
- **Domain Validation**: Additional checks in handlers

### Caching Strategy
- **Application-Level Caching**: Session and auth state
- **TTL-Based Expiration**: Automatic cleanup
- **Cache-Aside Pattern**: Database fallback

### Error Handling
- **Typed Errors**: Specific exception types
- **Response Catalogs**: Consistent error messages
- **Logging**: Comprehensive audit trail

## Future Enhancements
- Event sourcing for audit trails
- Saga pattern for complex workflows
- Advanced caching strategies
- API rate limiting
- Background job processing