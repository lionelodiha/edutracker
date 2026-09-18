# School Management API Requirements

This document is the contract between the frontend (edu-tracker/React) and the backend (EduTracker.Api/.NET) for the **School Side** of the product — i.e. the part where teachers, students, and admins interact with real classes, rosters, assignments, grades, and attendance.

Everything under "**✅ Already implemented**" is shipped and does not need changes.
Everything under "**🟡 To build**" is what the backend dev still needs to implement for the frontend to stop showing mock data.

---

## Conventions

### Response envelope
Every endpoint returns the same wrapper (matches `EduTracker.Api.Models.ApiResponse<T>`):

```jsonc
{
  "success": true,
  "messageId": "SOME_CODE",     // e.g. "PORTAL_INVITE_CREATED"
  "message": "Human readable",
  "details": null,               // or array of { field, message }
  "data": { ... }                // the payload, or null on error
}
```

HTTP status codes:
- `200 OK` on success (or `201 Created` for creation endpoints)
- `400 Bad Request` for validation failures (`details` is populated)
- `401 Unauthorized` for missing/expired session
- `403 Forbidden` for authorized-but-not-allowed (wrong org, wrong role)
- `404 Not Found` for missing resources
- `409 Conflict` for duplicates (e.g. duplicate schoolCode, email already taken)

### Authentication
- All endpoints are cookie-session authenticated (`edu_session_id` cookie) **unless explicitly marked `[anonymous]`**.
- Endpoints marked `[admin]` require the caller to be a member of the target organization with role `Owner` or `Admin`.
- Endpoints marked `[teacher]` require `Owner`, `Admin`, or `Teacher` in the target organization.
- Endpoints marked `[enrolled]` require the caller to be enrolled in the specific class (teacher or student).

### Tenant scoping
Every request that operates on a class, roster, assignment, grade, or attendance record MUST be validated against the caller's organization membership. A user from org A must not be able to read/write anything under org B, even with a valid session cookie.

---

## ✅ Already implemented (reference only — do not re-build)

These endpoints already exist and are consumed by the admin dashboard. Listed here so you don't duplicate work.

| Area | Method | Path | Notes |
|---|---|---|---|
| Auth | `POST` | `/api/auth/register` | Creates a User (not bound to any org) |
| Auth | `POST` | `/api/auth/login` | Identifier + password, sets `edu_session_id` cookie |
| Auth | `POST` | `/api/auth/logout` | |
| Auth | `POST` | `/api/auth/refresh` | |
| Users | `GET` | `/api/users/me` | Current authenticated user |
| Users | `PATCH` | `/api/users/me` | Update profile |
| Users | `PATCH` | `/api/users/me/password` | |
| Sessions | `GET` `POST` | `/api/sessions/*` | List / revoke active sessions |
| Organizations | `POST` `GET` `DELETE` | `/api/organizations[/{id}]` | Create, list, get, delete |
| Org members | `GET` `DELETE` `PATCH` | `/api/organizations/{id}/members` | List, remove, update role |
| Org invites | `POST` `GET` | `/api/organizations/{id}/invites` | Invite existing user, list invites |
| Org invites | `POST` | `/api/organizations/{id}/invites/{inviteId}/(accept\|reject\|cancel)` | |
| Semesters | `POST` `GET` `DELETE` | `/api/organizations/{orgId}/semesters[/{id}]` | |
| Terms | `POST` `GET` `DELETE` | `/api/semesters/{semesterId}/terms[/{id}]` | |
| Courses | `POST` `GET` `PUT` `DELETE` | `/api/organizations/{orgId}/courses[/{id}]` | |
| Course offerings | `POST` `GET` `DELETE` | `/api/semesters/{semesterId}/offerings[/{id}]` | |
| Classes | `POST` `GET` `DELETE` | `/api/classes` and `/api/classes/offering/{courseOfferingId}` | |

**Important nuance — the existing `/api/organizations/{id}/invites` flow invites an *existing* user (by userId or userName) to join an org. It does NOT let a brand-new person sign up. That is what the new portal-invite flow below is for.**

---

# 🟡 To build

---

## 1. Prerequisite: `SchoolCode` on Organization

Before any portal flow can work, each `Organization` needs a **unique public identifier** that a teacher/student types into the portal login page. A name alone is not enough (two orgs can have the same name, and names can contain characters that shouldn't be in a URL/form field).

### 1.1. Domain changes
- Add property `SchoolCode : string` to `Organization` entity.
- **Rules:**
  - 4–20 characters
  - Uppercase letters, digits, and hyphen only (`^[A-Z0-9-]{4,20}$`)
  - Unique across the entire `organizations` table (case-insensitive)
  - Immutable after creation (or only changeable by `SuperAdmin`)
- Auto-generated on `Organization` creation if the request does not supply one: uppercase-slugify the name, truncate to 16 chars, append `-` + 4 random base36 chars to guarantee uniqueness. Retry up to 5 times on collision.

### 1.2. Migration
- EF Core migration adding `school_code` column (`text`, `not null`, unique index).
- Backfill existing rows with auto-generated codes based on current `name`.

### 1.3. Endpoint changes
- `POST /api/organizations` — request body gains optional `schoolCode` field. Validate uniqueness, return `409` on conflict.
- `GET /api/organizations` / `GET /api/organizations/{id}` — include `schoolCode` in the response.
- New query endpoint so the portal signup/login page can look up a school by code without being authenticated:

#### `GET /api/organizations/lookup?schoolCode=SPRINGFIELD` `[anonymous]`
Used by the portal login/signup UI to show the school name after the user types a code.

**Response 200:**
```jsonc
{
  "success": true,
  "data": {
    "organizationId": "guid",
    "name": "Springfield Academy",
    "schoolCode": "SPRINGFIELD"
  }
}
```
**Response 404:** `messageId: "ORG_SCHOOL_CODE_NOT_FOUND"` — do not leak any other data.

**Rate limiting:** this endpoint is anonymous and enumerable. Apply a strict rate limit (e.g. 20 req/min/IP) to prevent code scraping.

---

## 2. Portal invite flow (sign up a new teacher/student via email token)

This is how a person who does **not** yet have an account joins a school. The admin enters their email and role; the backend emails them a one-time link; they click it and finish registration. After that, they log in via the portal login page.

### 2.1. Data model
New table `portal_invites`:

| Column | Type | Notes |
|---|---|---|
| `id` | `guid` | PK |
| `organization_id` | `guid` | FK → organizations |
| `email` | `text` | Lowercased, indexed |
| `email_hash` | `bytea` | For lookup without storing plain email in index (match existing `users.email_hash` pattern) |
| `role` | `text` | `Teacher` or `Student` |
| `token_hash` | `bytea` | SHA-256 of the raw token (never store raw) |
| `invited_by_user_id` | `guid` | FK → users |
| `expires_at` | `timestamptz` | Default: now + 7 days |
| `consumed_at` | `timestamptz` | Null until used |
| `created_at`, `updated_at` | `timestamptz` | Auditable |

Unique constraint: `(organization_id, email_hash)` **where `consumed_at is null`** — one active invite per email per org.

### 2.2. `POST /api/organizations/{orgId}/portal-invites` `[admin]`
Admin creates a portal invite. Backend generates a cryptographically random 32-byte token, stores its SHA-256 hash in `token_hash`, and sends an email containing the raw token in the link:
`{FRONTEND_ORIGIN}/portal-signup?token={rawToken}`

**Request body:**
```jsonc
{
  "email": "j.smith@school.edu",
  "role": "Teacher"        // "Teacher" | "Student"
}
```

**Validation:**
- `email` — valid email, max 254 chars
- `role` — must be `Teacher` or `Student` (not `Admin`/`Owner` — those use the existing member-invite flow)
- Caller must be Owner/Admin of the org
- Email must not already belong to a user who is a member of this org → `409 PORTAL_INVITE_ALREADY_MEMBER`
- No non-consumed invite may exist for this `(orgId, email)` → `409 PORTAL_INVITE_ALREADY_PENDING`

**Response 201:**
```jsonc
{
  "success": true,
  "messageId": "PORTAL_INVITE_CREATED",
  "data": {
    "inviteId": "guid",
    "email": "j.smith@school.edu",
    "role": "Teacher",
    "expiresAt": "2026-04-17T12:00:00Z"
  }
}
```

**Note:** the raw token is NEVER returned in the API response. It only exists in the email body. This way, even if a browser extension/log captures the API call, the token isn't leaked.

### 2.3. `GET /api/organizations/{orgId}/portal-invites` `[admin]`
List pending portal invites for an org (for the admin UI to show "waiting to accept").

**Response 200:**
```jsonc
{
  "success": true,
  "data": [
    {
      "inviteId": "guid",
      "email": "j.smith@school.edu",
      "role": "Teacher",
      "invitedByUserName": "admin_user",
      "expiresAt": "2026-04-17T12:00:00Z",
      "createdAt": "2026-04-10T12:00:00Z"
    }
  ]
}
```

### 2.4. `DELETE /api/organizations/{orgId}/portal-invites/{inviteId}` `[admin]`
Cancel a pending invite. Sets `consumed_at = now()` and `messageId = "PORTAL_INVITE_CANCELLED"` internally — so the same token can no longer be redeemed.

### 2.5. `GET /api/auth/portal-invite/{token}` `[anonymous]`
Called by the portal signup page (see frontend flow below) to display the locked school name, role, and pre-filled email so the user sees what they're joining before submitting the form.

**Lookup logic:** hash the incoming token, find the matching `portal_invites` row where `consumed_at is null` and `expires_at > now()`.

**Response 200:**
```jsonc
{
  "success": true,
  "data": {
    "organizationName": "Springfield Academy",
    "schoolCode": "SPRINGFIELD",
    "role": "Teacher",
    "email": "j.smith@school.edu",
    "expiresAt": "2026-04-17T12:00:00Z"
  }
}
```
**Response 404:** `messageId: "PORTAL_INVITE_INVALID_OR_EXPIRED"` (same message for not-found, expired, and already-consumed — don't leak which).

**Rate limiting:** 10 req/min/IP.

### 2.6. `POST /api/auth/portal-signup` `[anonymous]`
Consumes a portal-invite token and creates the user account, bound to the invite's organization and role in a single atomic transaction.

**Request body:**
```jsonc
{
  "token": "raw-token-from-url",
  "firstName": "Jane",
  "lastName": "Smith",
  "userName": "jsmith",        // optional; backend auto-generates if null (e.g. "jsmith" → "jsmith-2" on collision)
  "password": "string"          // must meet existing password policy
}
```

**Validation:**
- Token lookup: same as 2.5. If invalid/expired → `400 PORTAL_INVITE_INVALID_OR_EXPIRED`.
- Email (from the invite, NOT the request) must not already be a registered user → `409 AUTH_EMAIL_TAKEN`.
- `firstName`, `lastName`, `password` — existing user-creation validation rules.

**Transactional logic (all-or-nothing):**
1. Create `User` with email from invite, marked as `EmailConfirmed = true` (clicking the email link is the confirmation)
2. Create `OrganizationMember` row linking the new user to `invite.OrganizationId` with `Role = invite.Role` and `Status = Active`
3. Mark `portal_invites.consumed_at = now()`
4. Create a session and set the `edu_session_id` cookie (user is logged in immediately after signup)

**Response 201:** same shape as `POST /api/auth/login` (data = SessionTimestampsResponse), plus `messageId = "PORTAL_SIGNUP_SUCCESS"`.

---

## 3. Portal login (existing teachers/students)

Once a user has signed up via the portal-signup flow, they log in on subsequent days through the portal login page — which differs from the admin `/login` in that it also requires a **school code**, scoping authentication to a single organization.

### 3.1. `POST /api/auth/portal-login` `[anonymous]`

**Request body:**
```jsonc
{
  "schoolCode": "SPRINGFIELD",
  "identifier": "j.smith@school.edu",   // email or userName
  "password": "string",
  "rememberMe": false
}
```

**Logic:**
1. Look up `Organization` by `schoolCode` (case-insensitive). If not found → `404 ORG_SCHOOL_CODE_NOT_FOUND`.
2. Find user by `email_hash` or `user_name` (same as regular login).
3. Verify that user is an active member of that org via `OrganizationMember`. If not → `401 AUTH_INVALID_CREDENTIALS` (do NOT leak that the user exists but isn't in that org).
4. Verify password (same logic as regular login).
5. Block the login if the org member role is `Owner` or `Admin` → `403 AUTH_PORTAL_NOT_ALLOWED` ("Admins must use the main sign-in page."). Portal login is for Teacher/Student only.
6. Create a session and set `edu_session_id` cookie.

**Response 200:** same shape as `POST /api/auth/login`.

### 3.2. Session payload must expose active org + role
When a portal-session user calls `GET /api/users/me`, the response must include enough info for the frontend to render the right dashboard. The user belongs to multiple orgs is possible, but portal-login pins them to one at login time. Store the chosen `OrganizationId` on the session and include it:

```jsonc
{
  "success": true,
  "data": {
    "id": "guid",
    "userName": "jsmith",
    "email": "j.smith@school.edu",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "User",                  // the global role (existing field)
    // NEW fields:
    "activeOrganization": {
      "organizationId": "guid",
      "name": "Springfield Academy",
      "schoolCode": "SPRINGFIELD",
      "role": "Teacher"              // role WITHIN this org
    }
  }
}
```

The admin `/login` flow should leave `activeOrganization = null` (the admin dashboard lets the user pick an org). Only portal-login sets it.

---

## 4. Class roster (enrollments)

### 4.1. `GET /api/classes/{classId}/roster` `[enrolled]`
Returns all teachers + students in a class.

**Response 200:**
```jsonc
{
  "success": true,
  "data": [
    {
      "enrollmentId": "guid",
      "userId": "guid",
      "userName": "jsmith",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "Teacher",             // "Teacher" | "Student"
      "enrolledAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

### 4.2. `POST /api/classes/{classId}/roster` `[admin|teacher]`
Enroll a user (by userId) in the class.

**Request body:**
```jsonc
{
  "userId": "guid",
  "role": "Student"                  // "Teacher" | "Student"
}
```
**Validation:**
- `userId` must be a member of the class's organization
- That user's `OrganizationMember.Role` must match the requested enrollment role (can't enroll an Admin as a Student)
- No existing non-revoked enrollment for this `(classId, userId)` → `409 CLASS_ALREADY_ENROLLED`

**Response 201:** `{ enrollmentId, userId, role, enrolledAt }`

### 4.3. `DELETE /api/classes/{classId}/roster/{enrollmentId}` `[admin|teacher]`
Remove a user from the class. Soft-delete (set `revoked_at`) so historical grades/attendance remain attributable.

---

## 5. Assignments

### 5.1. `GET /api/classes/{classId}/assignments` `[enrolled]`
**Response 200:**
```jsonc
{
  "success": true,
  "data": [
    {
      "id": "guid",
      "title": "Midterm Exam",
      "description": "Chapters 1–6",
      "dueDate": "2026-05-01T23:59:00Z",
      "maxScore": 100,
      "createdAt": "2026-04-10T12:00:00Z"
    }
  ]
}
```

### 5.2. `POST /api/classes/{classId}/assignments` `[teacher]`
**Request body:**
```jsonc
{
  "title": "string",                 // 1–200 chars, required
  "description": "string",           // max 2000 chars, optional
  "dueDate": "2026-05-01T23:59:00Z", // must be in the future
  "maxScore": 100                    // int, 1–1000
}
```
**Response 201:** the created assignment.

### 5.3. `PUT /api/classes/{classId}/assignments/{assignmentId}` `[teacher]`
Same body as create. All fields are updatable before any grades have been entered; after grades exist, `maxScore` becomes immutable (`409 ASSIGNMENT_IMMUTABLE_WHEN_GRADED`).

### 5.4. `DELETE /api/classes/{classId}/assignments/{assignmentId}` `[teacher]`
Hard-delete only if no grades have been entered; otherwise soft-delete (`is_archived = true`) so historical grades survive.

---

## 6. Grades

### 6.1. `GET /api/classes/{classId}/assignments/{assignmentId}/grades` `[teacher]`
Returns a row per enrolled student, with `score = null` for students who haven't been graded yet.

**Response 200:**
```jsonc
{
  "success": true,
  "data": [
    {
      "id": "guid",                  // null if never graded
      "studentId": "guid",
      "studentName": "Alice Johnson",
      "score": 95,                   // null if not yet graded
      "feedback": "Great work",      // null if not yet graded
      "gradedAt": "2026-05-03T10:00:00Z",
      "gradedByUserName": "jsmith"
    }
  ]
}
```

### 6.2. `GET /api/classes/{classId}/assignments/{assignmentId}/grades/me` `[enrolled:student]`
Student-facing: returns only the calling student's own grade for the assignment. Prevents students from seeing each other's grades. Role must be `Student` in this class.

### 6.3. `PUT /api/classes/{classId}/assignments/{assignmentId}/grades` `[teacher]`
Upsert a grade (creates if missing, updates if present).

**Request body:**
```jsonc
{
  "studentId": "guid",
  "score": 95,                       // 0..maxScore
  "feedback": "string"               // optional, max 2000 chars
}
```
**Validation:**
- Student must be enrolled in the class as `Student`
- `score` must be in `[0, maxScore]` → `400 GRADE_SCORE_OUT_OF_RANGE`

---

## 7. Attendance

### 7.1. `GET /api/classes/{classId}/attendance?date=YYYY-MM-DD` `[enrolled]`
Returns the attendance roster for a specific date. If no records exist for the date, return one row per currently-enrolled student with `status: "NotRecorded"` so the frontend can render a blank sheet.

**Response 200:**
```jsonc
{
  "success": true,
  "data": {
    "date": "2026-04-10",
    "records": [
      {
        "studentId": "guid",
        "studentName": "Alice Johnson",
        "status": "Present"          // Present | Absent | Tardy | Excused | NotRecorded
      }
    ]
  }
}
```

### 7.2. `PUT /api/classes/{classId}/attendance` `[teacher]`
Upsert all attendance records for a given date in one request.

**Request body:**
```jsonc
{
  "date": "2026-04-10",
  "records": [
    { "studentId": "guid", "status": "Present" },
    { "studentId": "guid", "status": "Absent" }
  ]
}
```
**Validation:**
- `date` cannot be in the future → `400 ATTENDANCE_FUTURE_DATE`
- All `studentId`s must currently be enrolled in the class
- Any student not in the request whose record already exists is left untouched (partial updates allowed)

---

## 8. Email delivery (blocker for §2)

Section 2 assumes the backend can send transactional email (the portal-invite link). For local dev, this can be a console logger that prints the signup URL; for production, hook up a provider (SendGrid / Mailgun / Amazon SES — pick whatever fits the hosting plan). The frontend does NOT need to know which provider is used; it just calls `POST /api/organizations/{orgId}/portal-invites` and trusts the backend to deliver.

**For local dev:** please log the signup URL to stdout with a clearly-searchable prefix (e.g. `PORTAL_INVITE_EMAIL: http://localhost:3000/portal-signup?token=...`) so I can copy-paste it from the backend terminal while testing without real SMTP.

---

## 9. Frontend flow summary (for context)

1. **Admin opens `/dashboard/organizations/{id}` → "Invite Teacher/Student"**
   → `POST /api/organizations/{orgId}/portal-invites` → success toast → email sent.
2. **Teacher receives email, clicks link → `/portal-signup?token=abc`**
   → page calls `GET /api/auth/portal-invite/abc` to fetch school name + role + email (locked in UI)
   → user fills name + password
   → `POST /api/auth/portal-signup` → session cookie set → redirect to `/teacher-portal`.
3. **Teacher returns next day → `/portal-login`**
   → types school code + email + password
   → `POST /api/auth/portal-login` → session cookie set → redirect to `/teacher-portal`.
4. **Teacher dashboard loads** → calls `GET /api/users/me` to read `activeOrganization.role`, then fetches their classes, rosters, assignments, grades, attendance from the endpoints in §4–7.

---

## 10. Build order recommendation

To unblock the frontend as fast as possible:

1. **§1 SchoolCode** (1–2 hours, no dependencies) — once this is in, the portal login form at least has something to look up.
2. **§3 portal-login** (depends on §1) — lets existing seeded users test login without having to build the invite flow first.
3. **§4 class roster** — lets the teacher dashboard show real students.
4. **§5 assignments** + **§6 grades** — the meat of the teacher workflow.
5. **§7 attendance** — less critical, parallelizable.
6. **§2 portal-invite + §8 email** (biggest scope) — real signup flow. Until this is done, the frontend can work around it by having the admin create users directly via a dev-only endpoint.

Ping me (frontend) after §1+§3 ship; I'll wire the portal login page to real endpoints and we can test end-to-end with manually-inserted users while the invite flow is still being built.
