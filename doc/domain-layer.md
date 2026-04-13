# Domain Layer Design Document

## Overview

This document defines the domain model for the EduTracker platform using strict **bounded context separation**.

The system is divided into three isolated domains:

* **User Context** → Identity & authentication only
* **School Context** → Membership & institution management
* **Academic Context** → Courses, teaching, and assessments

Each context communicates strictly through **IDs only**, ensuring loose coupling, scalability, and clear ownership boundaries.

---

# 1. USER CONTEXT (Isolated)

## Purpose

Handles authentication, identity, and user profile data. This context is completely independent and does NOT know about schools or academic structures.

---

## Entities

### User

* `Id`: Guid (PK)
* `UserName`: string (unique)
* `EmailHash`: string (SHA-256)
* `PasswordHash`: string (bcrypt)
* `Role`: UserRole (User, Admin, SuperAdmin)
* `IsLocked`: bool
* `FirstName`: string (encrypted)
* `MiddleName`: string (encrypted)
* `LastName`: string (encrypted)
* `CreatedAt`: DateTime
* `UpdatedAt`: DateTime

---

### UserSession

* `Id`: Guid (PK)
* `UserId`: Guid
* `ExpiresAt`: DateTime
* `AbsoluteExpiresAt`: DateTime
* `IsRevoked`: bool
* `RevokedAt`: DateTime?

---

## Rules

* Users do NOT know Schools or Academic entities
* Only `UserId` is exposed externally
* Sensitive fields must be encrypted

---

# 2. SCHOOL CONTEXT

## Purpose

Manages schools, membership, invitations, and applications.

## Key Rule

> School context only references users via `UserId` (no user objects or profile data).

---

## Entities

### School

* `Id`: Guid (PK)
* `OwnerUserId`: Guid
* `Name`: string
* `IsLocked`: bool
* `CreatedAt`: DateTime
* `UpdatedAt`: DateTime

---

### SchoolMember

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `UserId`: Guid
* `Role`: SchoolMemberRole (Student, Teacher, Admin, Owner)
* `Status`: SchoolMemberStatus (Active, Suspended, Banned)

---

### SchoolApplication

> Used when a user applies to join a school

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `ApplicantUserId`: Guid
* `ApplicationType`: ApplicationType (Teacher, Student)
* `Status`: ApplicationStatus (Pending, Approved, Rejected)
* `ReviewNotes`: string (encrypted)
* `AppliedAt`: DateTime
* `ReviewedAt`: DateTime?
* `ReviewedByUserId`: Guid?

---

### SchoolInvite

> Used as an onboarding hub for bringing external users into the School context without entering Academic context.

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `InvitedUserId`: Guid
* `InvitedByUserId`: Guid
* `RoleOffered`: SchoolMemberRole (Member, Moderator, Owner)
* `Status`: InviteStatus (Pending, Accepted, Declined, Expired)
* `Message`: string? (encrypted)
* `ExpiresAt`: DateTime
* `RespondedAt`: DateTime?
* `CreatedAt`: DateTime
* `UpdatedAt`: DateTime

### Behavior

* Invite is ONLY a gateway into School Context
* Accepting an invite creates a **SchoolMember** record
* Default role on acceptance is typically `Member` unless explicitly elevated by school admins
* Invites do NOT create Teacher or Student records
* Academic role assignment happens later via separate Academic flows (applications or promotions)

---

## Rules

* A user can only have one active membership per school
* Applications create `SchoolMember` upon approval
* Invites allow schools to onboard users before membership assignment
* School does NOT know Academic entities
* Role hierarchy enforced within SchoolContext only

---

# 3. ACADEMIC CONTEXT

## Purpose

Handles teaching, learning, and assessment workflows.

## Key Rule

> Academic context ONLY knows:

* `SchoolId`
* `SchoolMemberId`

❌ Never references `UserId`

---

## Entities

### Teacher

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `SchoolMemberId`: Guid
* `EmployeeId`: string?
* `Department`: string?
* `Specialization`: string?
* `CreatedAt`: DateTime
* `UpdatedAt`: DateTime

---

### Student

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `SchoolMemberId`: Guid
* `StudentId`: string?
* `GradeLevel`: string?
* `EnrollmentDate`: DateTime
* `CreatedAt`: DateTime
* `UpdatedAt`: DateTime

---

### Course

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `Name`: string
* `Code`: string (unique per school)
* `Description`: string?
* `Credits`: int?

---

### Semester

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `Name`: string
* `StartYear`: int

---

### Term

* `Id`: Guid (PK)
* `SemesterId`: Guid
* `Name`: string
* `Ordinal`: int (1–6)

---

### CourseOffering

* `Id`: Guid (PK)
* `CourseId`: Guid
* `TermId`: Guid
* `TeacherId`: Guid
* `MaxEnrollment`: int?

---

### StudentEnrollment

* `Id`: Guid (PK)
* `StudentId`: Guid
* `CourseOfferingId`: Guid
* `EnrollmentDate`: DateTime
* `Status`: EnrollmentStatus (Enrolled, Withdrawn, Completed)
* `FinalGrade`: string?

---

# 4. ASSESSMENT SYSTEM

## Entities

### Assessment

* `Id`: Guid (PK)
* `SchoolId`: Guid
* `Name`: string
* `Type`: AssessmentType (Quiz, Exam, Assignment, Project)
* `MaxScore`: decimal
* `Weight`: decimal
* `IsRequired`: bool
* `DueDate`: DateTime?

---

### AssessmentInstance

* `Id`: Guid (PK)
* `AssessmentId`: Guid
* `CourseOfferingId`: Guid
* `ScheduledDate`: DateTime?
* `DueDate`: DateTime?
* `Instructions`: string?

---

### StudentAssessment

* `Id`: Guid (PK)
* `StudentId`: Guid
* `AssessmentInstanceId`: Guid
* `Score`: decimal?
* `MaxScore`: decimal
* `Percentage`: decimal?
* `Grade`: string?
* `GradedByTeacherId`: Guid?
* `Feedback`: string (encrypted)
* `Status`: AssessmentStatus (NotStarted, Submitted, Graded)

---

## Rules

* Assessments are fully school-specific
* No direct User references anywhere in Academic Context
* Teachers grade via `TeacherId`
* Students tracked via `StudentId`

---

# 5. RELATIONSHIP FLOW (STRICT BOUNDARIES)

```
User Context
   ↓ (UserId)

School Context
   SchoolMember (UserId)

   ↓ (SchoolMemberId)

Academic Context
   Teacher / Student

   ↓

CourseOffering → Enrollment → Assessment
```

---

# 6. DOMAIN RULES SUMMARY

## User Context

* Globally unique username
* Secure password storage (bcrypt)
* Email stored as hash

## School Context

* Owns all academic data
* Membership managed via SchoolMember
* Invitations and applications handled internally

## Academic Context

* Fully scoped to School
* No knowledge of User
* Uses SchoolMember as identity bridge

---

# 7. SECURITY & PRIVACY

* AES-256-GCM encryption for sensitive fields
* SHA-256 for email hashing
* Bcrypt for password hashing
* Strict context isolation prevents data leakage

---

# 8. CORE DESIGN PRINCIPLE (RULE 9 ENFORCED)

> Strict bounded context rules:

* User → knows only itself
* School → knows UserId only
* Academic → knows SchoolId + SchoolMemberId only

❌ No cross-context entity references allowed

---

# 9. FUTURE IMPROVEMENTS

* Domain Events for decoupled workflows
* Specification Pattern for complex queries
* Value Objects for stronger typing
* CQRS separation for scalability
