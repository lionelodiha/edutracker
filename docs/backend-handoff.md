# Backend handoff: what the frontend built, and what the API needs next

**Start here if you're building backend features.** This covers every frontend change made
on `Leo's-branch` since it split from `main` (`e6c1508`, 18 Sep 2026):

- **Before `PROD`** (up to `ec89e0b`, 26 Sep): 5 commits, 127 files, +15,275 / −2,698
  lines. The first part of this document.
- **Since `PROD`** (26 Sep onward): the phone layout, fixes, the CI pipeline on `PROD`, and
  the **student and staff portals** with assessment and results. See
  [Since PROD was created](#since-prod-was-created).

The second half is the backend to-do list: **60 endpoints the frontend already calls that
the real API does not have yet** (47 from before `PROD`, 13 for the portals), the data
model they need, and the places where the new screens and the existing backend disagree.

**The mock backend stays.** Every mocked endpoint keeps working until its real version
ships. Replace them one at a time, as described below; don't remove `src/mocks/` wholesale.

---

## The one thing to understand first

Almost all of this work was built **frontend-first, against a mock backend**.

The mock is [MSW](https://mswjs.io/) (Mock Service Worker). It runs inside the browser,
answers the new API calls itself, and saves the data to that browser's `localStorage`.
Requests it doesn't recognise (login, organizations, members, invites) pass through to the
real API as normal.

That means that right now, on the live site:

| Area | Where the data really lives |
| --- | --- |
| Sign up, login, logout, sessions, profile | Real API → Supabase |
| Organizations, members, invites, adding staff accounts | Real API → Supabase |
| Legacy semester, term, course and course-offering pages | Real API → Supabase |
| **Academic structure** (faculties, departments, levels) | **Mock → this browser only** |
| **Sessions tab, curriculum, course catalogue** | **Mock → this browser only** |
| **Student groups (cohorts)** | **Mock → this browser only** |
| **Faculty system** (staff records, ranks, officers, invitations, approvals, tracking) | **Mock → this browser only** |
| **Portal login** (students and staff) | **Mock → this browser only** |
| **Student and staff portals** (timetables, coursework, result sheets, marks, notifications, leave, tasks) and the department **Results** tab | **Mock → this browser only** |

So two people using the same school see different academic data, and clearing browser
data wipes it. The "Demo data" chip in the top bar is there to say so.

The mock is switched on by **demo mode**:

- Locally: `VITE_USE_MOCKS=true` in a dev build.
- Deployed: the API setting `DemoMode__Enabled=true`, which the frontend reads from
  `GET /api/client-config` before it renders. Render has this set to `true`.

Because unmocked requests pass through, **each mock handler can be deleted as soon as its
real endpoint ships**. The screen then talks to the real API with no other change,
provided the response shapes match (see [Response envelope](#response-envelope-mismatch)).

---

## The five commits

| Commit | Date | What it did |
| --- | --- | --- |
| `e8dad88` | 23 Sep | Cohort model: API contract and mock backend (MSW introduced) |
| `73de71f` | 23 Sep | Landing page redesign, shared login/register shell, page updates |
| `2228f76` | 23 Sep | Faculty system: staff, ranks, appointments, invitations, approval, identifiers, faculty workspace, tracking pages; cohort screens |
| `41129b3` | 26 Sep | Academic structure (structure, sessions, curriculum), the organization workspace redesign, and Render + Supabase deployment |
| `ec89e0b` | 26 Sep | Deployment docs: public Render repo and SQL migrations |

---

## 1. Student groups — the cohort model (`e8dad88`, screens in `2228f76`)

**The idea.** A cohort is the group of students who move through the school together,
for example "Computer Engineering, 200 Level, 2026/2027" or "SS 2 Science A". **Nobody
creates cohorts by hand.** They are generated from *structure × stage*: every department
(or stream) times every level. When a new session is created, everyone moves up a stage
into that session's cohorts. Creating the session *is* the promotion.

Decisions in the model:

- **The word "cohort" is internal.** Users see whatever their school calls it: classes,
  levels, sets or forms. It's configurable per school.
- **Arms aren't given a meaning.** Some schools letter arms across a whole stage and
  others restart the letters per stream. The schema stores a name and a link, not a rule.
- **Depth varies by school.** University: Faculty → Department → Programme. Senior
  secondary: Stream. Primary: none, so cohorts attach to the organization. A fixed
  two-level Faculty/Department model forces secondary schools to invent fake faculties.
- **`Class` already means something else.** In the backend, `Class` is a teaching section
  of a course offering ("CPE 301, Section B"). Renaming it `TeachingSection` frees the
  word for what schools actually mean by "class".
- **Cross-organization lookups return `404`, not `403`**, so the API can't be used to
  discover which ids exist.
- **`displayName` is composed on the server**, so every screen shows the same label.

**What was built:**

- The mock backend in `src/mocks/`: seed data for secondary and university shapes
  (`data.ts`), the handlers (`handlers.ts`), a browser worker (`browser.ts`) and a Vitest
  server (`server.ts`). In tests, an unmocked call is an error; in the browser it passes
  through.
- Screens in `src/features/cohorts/`: the group list and group detail, reached as
  organization → session → groups → students
  (`/dashboard/organizations/:id/sessions/:semesterId/groups`).
- Correcting a student's placement (add to or remove from a group).
- A development-only "admit a student" preview.
- The old top-level "Cohorts" sidebar entry and the "create cohort" form were removed.

---

## 2. Landing page and sign-in screens (`73de71f`)

- **Landing page:** rebuilt with a new hero, an interactive product preview with sample
  data, feature sections, a "how it works" band and a closing call to action.
- **Login and register:** now share a new `AuthShell` component for their layout and
  styling.
- **Other pages:** small updates to the profile, organizations, courses, semesters,
  semester-detail and organization-detail pages, plus `AuthContext`, the dashboard data
  layer and the Vite config.
- **Git:** `TestResults/` and `coverage/` are now ignored.

---

## 3. The faculty system (`2228f76`)

This is the largest single piece: about 9,000 lines, most of them in `src/mocks/faculty.ts`
(the rules) and `src/features/faculty/` (the screens).

### Staff records and ranks

- **Staff profiles:** each has a staff number, title, kind (`Academic`, `Administrative` or
  `Technical`), status (`Active`, `OnSabbatical`, `OnStudyLeave`, `Suspended`, `Retired`
  or `Resigned`) and a home unit.
- **Home unit:** a department. Only administrative staff may belong directly to a faculty
  office.
- **Faculty membership is never stored.** "Staff of a faculty" means everyone in its
  departments plus everyone in its faculty office, and it's computed in exactly one place
  (`src/features/staff/queries.ts`).
- **Ranks are records per school, not hard-coded.** They're seeded for a new school
  (Graduate Assistant … Professor for universities; Assistant Teacher … Principal Teacher
  for secondary and primary schools) and can be renamed or reordered. Rank order sorts
  lists; it never grants permissions.
- **Rank history:** every rank change writes a history row.

### Appointments (who holds which post)

- **Posts and their scope:**

  | Post | Scope |
  | --- | --- |
  | Dean, Sub-Dean, Faculty Officer, Faculty Exam Officer | Faculty |
  | HOD, Department Exam Officer | Department |
  | Programme Coordinator, Project Coordinator | Programme |
  | Level Adviser | Cohort |

- **One live holder per post per scope.** A second one is rejected, and the error names
  the current holder.
- **Several posts per person are allowed.** An HOD is often also a level adviser.
- **Ending a post sets an end date; the row is never deleted.**
- **Expired posts are flagged amber, not closed automatically.**
- **Permissions come from posts, never from rank.** For example, who may approve an
  applicant is decided by who holds the Dean or HOD post.

### Invitations, the join form and approval

- **Invitations:**
  - Staff or admins invite by email, one at a time or as a pasted list, with a per-row
    result.
  - The inviter sets the placement: programme and entry level for students, department
    for staff. The person filling in the form can never change it.
  - Resending issues a new token and invalidates the old one.
- **Public join form** at `/join/:token`, no account needed:
  - It shows the school, programme and level as read-only text.
  - It collects personal details, next of kin, a photograph and a password.
  - Submitting creates a **pending record**, not a person.
  - Used, expired or revoked links return `410`.
- **Approval queue:**
  - Only the Dean of that faculty or the HOD of that department may approve or reject.
  - Rejecting requires a reason and reopens the invitation so the person can resubmit.
- **Approval** is the only step that creates the student or staff member, their
  identifiers and (where appropriate) their login.

### Identifier generation

- **Matriculation numbers:** built from a per-school format such as `2025/CPE/0041`.
- **Allocation rules:**
  - Serials are allocated **at approval, never at form submission**, so abandoned forms
    don't use up numbers.
  - A number is **never reused**, even after withdrawal.
  - A department with no unit code blocks approval (`UNIT_CODE_MISSING`); nothing is
    substituted.
- **School emails:** follow a per-school pattern, for example
  `first.last@student.domain`. Name collisions are resolved automatically: middle initial
  first, then `2`, `3`, and so on.
- **Neither identifier is editable in the UI.**
- **Who gets a login:** students always; academic staff and the Faculty Officer do;
  technical staff get a record with no login.

### The faculty workspace

Route: `/dashboard/organizations/:id/faculties/:facultyId/*`

| Tab | Shows |
| --- | --- |
| Overview | Dean, Sub-Dean and Faculty Officer; departments with HOD and staff count; staff by rank; students by programme; pending approvals |
| Lecturers | Directory filterable by rank and status; sorted by outstanding results this session |
| Lecturer page | This session's courses and results state, attendance, posts held, rank and appointment history |
| Students | Directory by programme and level, searchable by name or matric number |
| Student page | Faculty → department → programme → level → session chain, courses, attendance, results, level adviser, one history row per past session |
| Officers | Appointments: assign, end, see history |
| Pending | Invitations and the approval queue |
| Documents, Board | Placeholders only |

### Portal login

The portal login page checks school email and password against the mock and keeps a
**fake session in `sessionStorage`**. It doesn't create a real login session. The
student and teacher portal pages themselves are still "coming soon".

### Known issues recorded in the commit

- Staff invited to a faculty office aren't restricted to `Administrative` staff.
- An applicant-supplied `proposedPost` on the join form can grant a login.
- There's no real course-assignment path yet.

The backend must not copy these; see [Security rules](#security-rules-the-backend-must-enforce).

---

## 4. Academic structure (`41129b3`)

Page: `/dashboard/organizations/:id/structure`, with three tabs. Everything else (lecturer
pages, student pages, assessment) is designed to hang off one record: the **course
offering**, meaning one course, in one term, of one session, for one level, taught by one
lecturer.

The model has two layers:

- **Permanent layer:** set up once. Faculties → departments (each with its own length and
  levels), or sections → classes → arms for secondary schools, plus the course catalogue.
- **Time layer:** repeats every session and is kept as history. Session → terms or
  semesters → course offerings. Exactly one session is current, and inside it exactly one
  term is current. Closed sessions are read-only.

### Structure tab

- **Choose the school type once:** University, Secondary or Primary.
- **Faculty cards:** code, departments, lecturers and students, with a "No Dean yet"
  flag.
- **Faculty page:** its departments, with intake meters and an "HOD missing" flag.
- **"New department" wizard, in four steps:**
  - Basics: name, code, award and HOD.
  - Programme: length, level names, terms per level, industrial training and direct entry.
  - Admission: maximum intake, minimum UTME score, UTME subjects and O'Level requirements.
  - Review.
- **Department page:** levels and admission rules.
- **Search and view options:** search across departments and courses, and switch between
  card and list views.

### Sessions tab

- **Session timeline:** newest first, showing each session's terms and their status
  (`Upcoming → Current → Closed`).
- **Term and session actions:** **Close term** (only the current term) and **Start
  session**. Starting a session makes it current and closes the previous one.
- **"Prepare next session" wizard:**
  - Choose the name and dates.
  - Copy course offerings, lecturer assignments and class arms from the current session.
  - Review, then create. The new session starts as `Upcoming`.
  - Student promotion is shown as a disabled step until student records exist.

### Curriculum tab

- **Grid:** pick a department to see levels × terms. Each cell is a course offering with
  its code, units, compulsory or elective flag, and lecturer (or "unassigned").
- **Unassigned count:** shown at the top as the HOD's to-do list.
- **Course catalogue view:** the permanent list of courses, each owned by a department.

---

## 5. The organization workspace (`41129b3`)

- **Dashboard shell:**
  - The global left sidebar was replaced by a top bar with the logo, search, a "Demo data"
    chip, invites and an account menu.
  - New `AccountMenu`, `Toast` and icon components.
- **School workspace layout:**
  - Opening a school shows its own sidebar with four sections: **Overview, Academic
    Structure, Staff & Teachers, School Settings**.
  - A new design system in `src/styles/workspace.css`, scoped to the workspace so the main
    dashboard is untouched.
- **Overview:** rebuilt as a header, stat strip, "Get your school ready" checklist,
  faculties, recent activity, current session and team.
  - It **mixes sources**: organization, members and semesters come from the real API;
    faculties and setup come from the browser-stored structure.
- **Staff & Teachers:** two views in one page.
  - "School accounts" are real organization members, and adding one calls the real
    `POST /api/organizations/{id}/staff`.
  - "Staff records" are the mock faculty staff profiles.
- **School Settings:**
  - Rename and delete the school using the real API, with a typed confirmation instead of
    the browser's `confirm()`.
  - Also shows the school details, institution type and school ID.
- **Old pages:** the `/sessions` and `/courses` routes still show the old real-API
  semester and course pages, and `/faculties` now redirects into Academic Structure.

---

## 6. Deployment: Render + Supabase (`41129b3`, `ec89e0b`)

- **One container serves both the site and the API.**
  - The API's `Dockerfile` now builds the frontend in a Node stage and copies it into
    `wwwroot`.
  - Unknown `/api/*` paths return `404` instead of the app's HTML.
  - Every other path falls back to `index.html`.
- **Cookies:**
  - Because the site and API share an origin, session cookies are now `SameSite=Lax`.
  - They are marked `Secure` everywhere except local development, even when HTTPS ends at
    Render's proxy.
- **New endpoints:**
  - `GET /health` checks the database connection (Render's health check).
  - `GET /api/client-config` returns `{ demoMode }` and is never cached.
- **Startup fails loudly.** If configuration validation or super-admin seeding fails, the
  app now throws during startup instead of running in the background and stopping later.
  Render then shows a failed deploy with the error in the log.
- **Frontend:** the API base is the page's own origin.
- **`render.yaml`:**
  - One free Docker web service in Frankfurt, with the `/health` check.
  - Demo mode on.
  - Secrets entered in Render, not the repo: the database connection string, the
    encryption and email-hash keys, and the super-admin credentials.
- **`docs/render-supabase.md`:**
  - Use Supabase's Session pooler (Render can't reach the IPv6-only direct connection).
  - Use the .NET/Npgsql connection string format.
  - Apply migrations with `dotnet ef` or as an idempotent SQL script.

---

## 7. Tests

**Frontend:** 71 tests in 5 files, all passing at `ec89e0b`.

| File | Covers |
| --- | --- |
| `src/mocks/faculty.test.ts` | The faculty rules: faculty membership, post occupancy, invitation security, identifier allocation, approval permissions |
| `src/features/cohorts/cohortApi.test.ts` | The cohort contract, including cross-organization `404`s |
| `src/features/cohorts/schoolSetup.test.ts` | Structure setup and unit rules |
| `src/features/academics/store.test.ts` | Sessions, terms, offerings and department rules |
| `src/features/academics/api.test.ts` | The academics API client |

**Local testing:** `qa-school.html` is a local-only page for checking the cohort and
faculty screens with sample data.

---

# Backend work

## Response envelope mismatch

The real API and the mocks format responses differently:

```jsonc
// Real API today
{ "success": true,  "messageId": "ORG_RETRIEVED", "message": "…", "data": { … } }
{ "success": false, "messageId": "AUTH_UNAUTHORIZED", "message": "…", "details": [] }

// Mocks, and the frontend clients written against them
{ "id": "ACADEMIC_OK", "title": "…", "data": { … } }
{ "id": "COHORT_NOT_FOUND", "title": "…", "details": [{ "message": "…" }] }
```

Successful responses work either way, because both put the payload in `data`. Errors do
not: the new clients read `id` and `title`, so a real error would show a generic message
and the code `REQUEST_FAILED`.

**Recommended fix:** keep the real envelope and change the three frontend clients
(`src/features/academics/api.ts`, `src/features/faculty/api.ts` and
`src/features/cohorts/api.ts`) to read `messageId` and `message`. It's a small change.
Make it before swapping out the first mock.

## Endpoints the real API already has

These exist and the frontend uses most of them. All paths start with `/api`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Users | `GET /users`, `GET /users/{id}`, `GET·PATCH /users/me`, `PATCH /users/me/password`, `POST /users/{id}/promote·demote·lock·unlock` |
| Login sessions | `GET /sessions/me`, `POST /sessions/{id}/revoke`, `POST /sessions/revoke-all` |
| Organizations | `GET·POST /organizations`, `GET·PATCH·DELETE /organizations/{id}`, `POST /organizations/{id}/transfer-ownership` |
| Members | `GET /organizations/{id}/members`, `DELETE /organizations/{id}/members/{memberId}`, `PATCH …/members/{memberId}/role`, `POST /organizations/{id}/staff` (add a member account directly) |
| Invites | `POST /organizations/{id}/invite`, `GET /organizations/{id}/invites`, `POST /organizations/{id}/invites/{inviteId}/cancel`, `GET /organizations/invites`, `POST /organizations/invites/{inviteId}/accept·reject` |
| Semesters, terms | `GET·POST /semesters`, `GET·DELETE /semesters/{id}`, `POST /terms`, `GET /terms/semester/{semesterId}`, `GET·DELETE /terms/{id}` |
| Courses | `GET·POST /courses`, `GET·PATCH·DELETE /courses/{id}` |
| Course offerings | `POST /course-offerings`, `GET /course-offerings/semester/{semesterId}`, `DELETE /course-offerings/{id}` |
| Classes (teaching sections) | `POST /classes`, `GET /classes/offering/{courseOfferingId}`, `DELETE /classes/{id}` |
| Departments | `GET·POST /departments`, `DELETE /departments/{id}` (flat list; faculty optional) |
| System | `GET /client-config`, plus `GET /health` (the one route without the `/api` prefix) |

The `Faculty` and `PortalInvite` entities exist in the database, but **no endpoints
expose them**.

## Endpoints to build (60)

All paths start with `/api`. Status codes and error ids below are what the mocks return
today, and the screens already handle them.

### A. Academic structure, sessions and curriculum (15)

Everything is scoped by the organization in the route.

| # | Method | Path | Request → Response | Rules and errors |
| --- | --- | --- | --- | --- |
| 1 | GET | `/organizations/{id}/structure?rootUnitId=&depth=` | → `{ setup, units[], faculties[], departments[] }` | `rootUnitId`/`depth` return one level of the tree so big schools load in parts |
| 2 | POST | `/organizations/{id}/structure/initialize` | `{ model: "University" \| "Secondary" \| "Primary" }` → 201 structure | Once per school. `MODEL_INVALID` |
| 3 | POST | `/organizations/{id}/structure/faculties` | `{ name, code, description, deanStaffProfileId }` → 201 unit | `UNIT_CODE_INVALID` (1–6 letters/digits), `UNIT_CODE_EXISTS` 409, `UNIT_NAME_EXISTS` 409, `STRUCTURE_NOT_INITIALIZED` 409, `UNSUPPORTED_UNIT` (primary schools) |
| 4 | PATCH | `/organizations/{id}/structure/faculties/{key}` | `{ name?, code?, description?, deanStaffProfileId?, archive? }` → unit | `UNIT_NOT_FOUND` 404; archive instead of delete |
| 5 | POST | `/organizations/{id}/structure/departments` | department input (below) → 201 | `FACULTY_NOT_FOUND` 404, `DURATION_INVALID` (1–7 years), `LEVELS_INVALID`, `TERM_COUNT_INVALID` (1–4), `TRAINING_INVALID`, `DIRECT_ENTRY_INVALID`, `INTAKE_INVALID` |
| 6 | PATCH | `/organizations/{id}/structure/departments/{key}` | partial department input → department | `LEVEL_HAS_HISTORY` 409: a level with offerings can't be removed or renamed, only archived |
| 7 | GET | `/organizations/{id}/sessions` | → `{ items: AcademicSession[], currentSessionId }` | Each session includes its terms |
| 8 | POST | `/organizations/{id}/sessions/prepare` | `{ fromSessionId, name, startYear, endYear, startsOn, endsOn, termNames[], copy: { courseOfferings, lecturerAssignments, classArms } }` → 201 `{ session, copiedOfferings, copiedLecturers }` | New session is `Upcoming`. `SESSION_EXISTS` 409, `SESSION_INVALID`, `SESSION_DATES_INVALID`, `TERMS_INVALID` |
| 9 | POST | `/organizations/{id}/sessions/{sessionId}/start` | → session | Makes it current and closes the previous one. `SESSION_CLOSED` 409 |
| 10 | POST | `/organizations/{id}/terms/{termId}/close` | → session | Only the current term. `TERM_NOT_CURRENT` 409 |
| 11 | GET | `/organizations/{id}/sessions/{sessionId}/offerings?departmentId=&level=&termId=` | → `AcademicOffering[]` | |
| 12 | POST | `/organizations/{id}/sessions/{sessionId}/offerings` | `{ termId, courseId, levelKey, units, isCompulsory, lecturerStaffProfileId }` → 201 | Unique on (term, course, level): `OFFERING_EXISTS` 409. `OFFERING_LOCKED` 409 in closed sessions |
| 13 | PATCH | `/organizations/{id}/offerings/{offeringId}` | `{ lecturerStaffProfileId?, units?, isCompulsory? }` → offering | `OFFERING_LOCKED` 409 |
| 14 | GET | `/organizations/{id}/courses?departmentId=&q=&page=` | → `{ items: CatalogueCourse[], total, page }` | Paged |
| 15 | POST | `/organizations/{id}/courses` | `{ departmentId, code, title, units, description, defaultLevel, defaultTermOrdinal, defaultCompulsory }` → 201 | `COURSE_CODE_EXISTS` 409, `COURSE_INVALID` (1–12 units) |

The department input has these fields: `facultyId` (null for a secondary section or none),
`name`, `code`, `award`, `description`, `hodStaffProfileId`, `durationYears`,
`levels[]` (one per year), `semestersPerLevel`, `industrialTraining` (level and term, or
null), `postGraduationInternshipYears`, `directEntryLevel`, `maxIntakePerSession`,
`minUtmeScore`, `utmeSubjects[]`, `oLevelRequirement` and `otherRequirements`.

The full response types are in `src/features/academics/types.ts`, which is the contract.

### B. Student groups (cohorts) and stages (7)

| # | Method | Path | Request → Response | Rules and errors |
| --- | --- | --- | --- | --- |
| 16 | GET | `/stages?organizationId=` | → `Stage[]` ordered by `ordinal` | |
| 17 | GET | `/cohorts?organizationId=&sessionId=&stageId=&academicUnitId=` | → `Cohort[]` | |
| 18 | GET | `/cohorts/{id}` | → `Cohort` | `COHORT_NOT_FOUND` **404 for another organization's cohort too** |
| 19 | GET | `/cohorts/{id}/students` | → `CohortStudent[]` | |
| 20 | POST | `/cohorts/{id}/students` | `{ studentProfileIds: string[] }` → 201 | Correcting a placement only |
| 21 | DELETE | `/cohorts/{id}/students/{studentProfileId}` | → 200 | `STUDENT_NOT_IN_COHORT` |
| 22 | POST | `/cohorts/{id}/admissions` | `{ fullName, admissionNumber }` → 201 `CohortStudent` | **Prototype only**, used in dev. Real admission goes through invitations → approval (section C). `ADMISSION_NUMBER_EXISTS` |

**There is no "create cohort" endpoint.** Cohorts are generated when the structure is
defined and again when a session is prepared.

The types are:

- `Stage { id, organizationId, ordinal, name, shortName }`
- `Cohort { id, organizationId, academicUnitId, academicUnitName, stageId, stageName,
  arm, displayName, sessionId, formTeacherId, formTeacherName, studentCount }`
- `CohortStudent { studentProfileId, userId, admissionNumber, fullName, status }`

### C. Faculty system, onboarding and portal (25)

| # | Method | Path | Request → Response | Rules and errors |
| --- | --- | --- | --- | --- |
| 23 | GET | `/ranks?organizationId=` | → `AcademicRank[]` | Seed defaults per school type |
| 24 | POST | `/ranks` | `{ name, order? }` → 201 | `RANK_EXISTS` |
| 25 | PATCH | `/ranks/{rankId}` | `{ name?, order? }` | |
| 26 | GET | `/staff?organizationId=&facultyId=&departmentId=&kind=&rankId=&q=` | → `{ items: StaffProfile[], total }` | `facultyId` is **computed** (departments under it + faculty office), never a stored field |
| 27 | GET | `/staff/{staffProfileId}` | → `StaffProfile` | `STAFF_NOT_FOUND` |
| 28 | POST | `/staff` | staff profile fields → 201 | `STAFF_NUMBER_EXISTS` 409 (case-insensitive), `STAFF_UNIT_INVALID` (only admin staff in a faculty office), `RANK_NOT_ALLOWED` (rank only for academic staff) |
| 29 | PATCH | `/staff/{staffProfileId}` | partial profile | A rank change writes rank history |
| 30 | GET | `/staff/{staffProfileId}/tracking?sessionId=` | → `StaffTracking` | Everything the lecturer page needs, in one response |
| 31 | GET | `/appointments?organizationId=&scopeId=&post=&live=true` | → `Appointment[]` | |
| 32 | POST | `/appointments` | `{ staffProfileId, post, scopeId, scopeKind, startsOn, endsOn }` → 201 | `POST_OCCUPIED` 409 naming the holder, `APPOINTMENT_SCOPE_INVALID`, `APPOINTMENT_KIND_INVALID`, `STAFF_NOT_ACTIVE` 409 |
| 33 | PATCH | `/appointments/{appointmentId}` | `{ endsOn }` only | Never delete an appointment |
| 34 | GET | `/invitations?organizationId=&status=` | → `Invitation[]` | |
| 35 | POST | `/invitations` | one invitation **or a list** → `{ created[], failed[{ email, code, message }] }` | Per-row results. `EMAIL_EXISTS`, `INVITATION_PLACEMENT_INVALID`, `INVITATION_FORBIDDEN` |
| 36 | POST | `/invitations/{id}/resend` | → invitation | New token and expiry; the old token stops working |
| 37 | DELETE | `/invitations/{id}` | → 200 | Revoke |
| 38 | GET | `/join/{token}` | → `{ invitationId, organizationName, kind, email, programmeName, departmentName, stageName, sessionName, expiresOn }` | **Public.** `INVITATION_UNUSABLE` 410 when used, expired or revoked |
| 39 | POST | `/join/{token}` | form fields → 201 `PendingRecord` | **Public.** Ignore any placement fields in the body |
| 40 | POST | `/auth/portal-login` | `{ organizationId, schoolEmail, password }` → `{ userId, kind, schoolEmail }` | `INVALID_CREDENTIALS` 401. **The real version must set the normal session cookies** |
| 41 | GET | `/pending?organizationId=&facultyId=&status=` | → `PendingRecord[]` | |
| 42 | POST | `/pending/{id}/approve` | → `ApprovalResult` (student with matric number, email, cohort; or staff with staff number, email) | Creates the person, identifiers and login. `APPROVAL_FORBIDDEN`, `PENDING_DECIDED` 409, `UNIT_CODE_MISSING` 409 |
| 43 | POST | `/pending/{id}/reject` | `{ reason }` → `PendingRecord` | Reason required; reopens the invitation |
| 44 | GET | `/students?organizationId=&facultyId=&programmeId=&q=` | → `{ items: StudentProfile[], total }` | Search by name or matric number |
| 45 | GET | `/students/{studentProfileId}` | → `StudentProfile` | `STUDENT_NOT_FOUND` |
| 46 | GET | `/students/{studentProfileId}/tracking?sessionId=` | → `StudentTracking` | Everything the student page needs, in one response |
| 47 | GET | `/faculties/{facultyId}/summary` | → `FacultySummary` | The whole faculty overview in one request |

The response types are in `src/features/staff/`, `src/features/onboarding/`,
`src/features/cohorts/courses.ts` and the exported types at the top of the tracking section
of `src/mocks/faculty.ts` (`StaffTracking`, `StudentTracking`, `FacultySummary`,
`ApprovalResult`).

### D. Student and staff portals, assessment and results (13)

Built after `PROD`. Where to look:

| What | File |
| --- | --- |
| Every request the pages make | `src/features/portal/api.ts` |
| Every response shape (the contract) | `src/features/portal/types.ts` |
| The mock routes | `src/mocks/portalHandlers.ts` |
| Every rule, as working code | `src/mocks/portal.ts` |
| Marking scheme, grading, GPA, positions | `src/features/assessment/scheme.ts` |
| Rules as tests | `src/mocks/portal.test.ts` |

In the mock, portal calls carry `?organizationId=&userId=` because the mock sign-in has no
server session. **The real API must ignore both** and take the user and organization
from the session.

| # | Method | Path | Request → Response | Rules and errors |
| --- | --- | --- | --- | --- |
| 48 | GET | `/portal/schools/{schoolId}` | → `PortalOrganization { organizationId, name, model }` | **Public.** The school's sign-in page shows its name. `SCHOOL_NOT_FOUND` 404 |
| 49 | GET | `/portal/me` | → `StudentPortal` \| `TeacherPortal` \| `NonTeachingPortal` (by the `role` field) | Everything that person's portal shows, in one response. Staff with `kind = Academic` get the teaching portal; Administrative and Technical staff get the non-teaching one. `PORTAL_SESSION_INVALID` 401 |
| 50 | GET | `/portal/sheets/{offeringId}` | → `ResultSheet` | Only the offering's lecturer. `NOT_COURSE_LECTURER` 403, `OFFERING_NOT_FOUND` 404 (also for other schools' offerings) |
| 51 | PUT | `/portal/sheets/{offeringId}/scores` | `{ scores: { [studentProfileId]: { [componentKey]: number \| null } } }` → `ResultSheet` | Draft save; send only changed cells. Each mark 0 ≤ mark ≤ max, whole or half. Student must be on the roster. Published marks can't change. `SCORES_INVALID` 422 (up to 5 messages joined), `SHEET_SUBMITTED` 409, `TERM_CLOSED` 409 |
| 52 | POST | `/portal/sheets/{offeringId}/publish` | `{ components: string[] }` → `ResultSheet` | In-course components only. Every student on the roster needs a mark for each one. Notifies the students. `EXAM_WITH_SUBMISSION` 409, `MARKS_MISSING` 409 |
| 53 | POST | `/portal/sheets/{offeringId}/submit` | → `ResultSheet` | Every student needs every mark. Publishes everything, locks the sheet, notifies the students and the department's HOD. `MARKS_MISSING` 409, `ROSTER_EMPTY` 409 |
| 54 | POST | `/portal/coursework` | `{ offeringId, componentKey, title, instructions, dueAt }` → 201 `{ itemId }` | Lecturer only. Test, assignment or project; not the exam. `dueAt` in the future. Notifies the students. `VALIDATION_FAILED` 400 |
| 55 | POST | `/portal/coursework/{itemId}/submission` | `{ note, fileName }` → 200 | Students on the roster, assignments and projects only, before the deadline, not after marking. A new hand-in replaces the old. `DEADLINE_PASSED` 409, `NOT_SUBMITTABLE` 409, `ALREADY_MARKED` 409, `COURSEWORK_NOT_FOUND` 404. **Real file upload is still to design:** the mock keeps only the file name |
| 56 | POST | `/portal/notifications/{notificationId}/read` | → 200 | `notificationId` may be `all` |
| 57 | POST | `/portal/leave` | `{ type, startsOn, endsOn, reason }` → 201 `LeaveRequest` | Counts working days (Mon–Fri). Not in the past; casual ≤ 7 days; no overlap. Annual leave within the balance: 30 working days a year from grade level 07, 21 below. Notifies the supervisor. `LEAVE_OVERLAPS` 409, `LEAVE_EXCEEDS_BALANCE` 409 |
| 58 | PATCH | `/portal/tasks/{taskId}` | `{ status: "Open" \| "In progress" \| "Done" }` → 200 | Only your own tasks. `TASK_NOT_FOUND` 404 |
| 59 | GET | `/organizations/{id}/departments/{departmentId}/results?sessionId=` | → `DepartmentResultRow[]` | The department's Results tab: every offering's sheet status. Averages only after submission. `DEPARTMENT_NOT_FOUND` 404 |
| 60 | GET | `/organizations/{id}/results/{offeringId}` | → `ResultSheet` (read-only, drafts included) | For the HOD, exam officer and admins |

**The assessment scheme** (`scheme.ts`) should become server-side configuration, but its
current values are the source of truth until then:

- Every school: 30 marks in-course (CA), 70 marks exam.
- **University:** Test 15, Assignment 10, Project 5. Grades on the NUC 5-point scale
  (A ≥ 70 … F < 40), with GPA weighted by credit units and a CGPA with class of degree.
- **Secondary:** 1st Test 10, 2nd Test 10, Assignment 10. WAEC A1–F9.
- **Primary:** as secondary, graded A–F.
- Class position uses competition ranking: ties share a position, and the next skips.

**How a sheet's status is worked out.** It's derived, not stored: *Not started* (no marks),
*Partial* (some marks or something published), *Submitted* (locked).

## Data model changes

**Extend what exists:**

| Entity | Add |
| --- | --- |
| `Semester` (a session) | `Name`, `EndYear`, `StartsOn`, `EndsOn`, `Status` (`Upcoming`/`Current`/`Closed`) |
| `Term` | `Name`, `StartsOn`, `EndsOn`, `Status` |
| `Course` | `DepartmentId` (owning department), `Units`, `Description`, default level, term and compulsory flag, `ArchivedAt` |
| `CourseOffering` | `LevelKey`, `IsCompulsory`, `Units`, lecturer (`StaffProfileId`) |
| `Faculty` | `Code`, Dean, `Description`, `ArchivedAt` |
| `Department` | `Code`, `Award`, `DurationYears`, `SemestersPerLevel`, `Levels[]`, industrial training, internship years, direct entry level, max intake, min UTME score, UTME subjects, O'Level and other requirements, HOD, `ArchivedAt` |
| `Class` | Rename to `TeachingSection` (see section 1) |

**New:**

- **Structure:**
  - `AcademicUnit`: a self-referencing tree (Faculty → Department → Programme, or Stream)
    with `kind` and `code`. This replaces the fixed Faculty/Department pair.
  - `Stage`: ordered per organization.
  - The school type and structure settings, which today live only in `localStorage`.
- **Students:** `Cohort`, `StudentProfile`, `StudentSessionHistory`.
- **Staff:** `StaffProfile`, `AcademicRank`, `RankHistory`, `Appointment`.
- **Onboarding:** `Invitation`, `PendingRecord`, `IdentifierFormat`, and an
  issued-identifiers table so a number can never be reused.
- **Teaching:** `CourseAssignment`, `Registration`, results and attendance summaries.
  These back the tracking pages and can come last.
- **Portals** (all keyed on the course offering, so every record traces back to "this
  course, this session and term, this lecturer"):
  - `Enrolment` (offering, student). Until course registration exists, the mock also puts
    active students on offerings that match their department and level.
  - `TimetableSlot` (offering, weekday, start, end, venue).
  - `CourseworkItem` (offering, component key, title, instructions, due at, posted at) and
    `CourseworkSubmission` (item, student, submitted at, note, file).
  - `ResultSheet` (offering, status `Draft`/`Submitted`, submitted at, updated at),
    `ResultMark` (sheet, student, component key, mark) and `PublishedComponent` (sheet,
    component key, published at).
  - `Notification` (recipient, kind, title, body, link, created at, read at).
  - `LevelAdviser` (department, level, staff), a per-level form teacher or level adviser.
    It may fold into the existing `Appointment` (post `LevelAdviser`).
  - `TermRemark` (student, term, comment) for the report card.
  - **Non-teaching staff:** `StaffEmploymentRecord` (cadre, salary scale, grade level,
    step, confirmed on, next promotion due, supervisor), `LeaveRequest`, `DutyShift`,
    `WorkTask` and `Appraisal`.

**Constraints:**

- One current session per organization, and one current term per session. Enforce this
  in the domain and with a filtered unique index.
- Course offerings are unique on (term, course, level).
- Offerings in a closed term or session are read-only.

## Overlaps to resolve before building

The new screens and the existing backend model the same things twice. Decide these first,
or the work will be done twice:

1. **Sessions.** The real `/semesters` + `/terms` versus the mocked
   `/organizations/{id}/sessions`. The UI currently shows both: the old `/sessions` page
   uses the real API, and the Sessions tab uses the mock. Recommendation: extend
   `Semester`/`Term` as above, serve the new routes, and retire the old pages.
2. **Courses and offerings.** The real `/courses` (name, code) and `/course-offerings`
   versus the mocked catalogue (department, units, defaults) and offerings (level,
   compulsory, lecturer). Same approach: extend, then retire.
3. **Two course models inside the frontend itself.** The Curriculum tab uses
   `CatalogueCourse`/`AcademicOffering` (`src/features/academics/types.ts`). The faculty
   tracking pages use `Course`/`CourseOffering`/`CourseAssignment`
   (`src/features/cohorts/courses.ts`). The backend should have one model, and the
   tracking pages should read the curriculum's offerings.
4. **Departments and faculties.** The real `/departments` is a flat list with no faculty
   endpoints; the mocks use the structure tree with codes and department details.
5. **Staff.** The real `POST /organizations/{id}/staff` creates organization member
   accounts; the mocked `/staff` manages staff records. The Staff & Teachers page shows
   both. A staff record should link to a user and member, not duplicate them.
6. **Portal invites.** The `PortalInvite` entity versus the new invitation, join and
   approval flow. Build one invitation flow; the real one wins where they disagree.

## Security rules the backend must enforce

The mocks are not an authorization layer. They accept any organization id and trust the
browser. The real API must not:

- **Take the organization from the route and the session, never the request body.**
  Return `404` for records in another organization.
- **Take the reviewer from the session.** The approve and reject calls currently send
  `reviewedBy` in the body; ignore it.
- **Check approval rights through appointments.** Only the Dean of that faculty or the HOD
  of that department may approve, never a role string.
- **Treat the invitation's placement as read-only.** Ignore `programmeId`, level,
  department and any proposed post submitted on the join form. This fixes both known
  issues from `2228f76`: faculty-office invitations must be restricted to administrative
  staff, and an applicant's proposed post must never grant a login.
- **Allocate identifiers at approval only, inside a transaction.** Never reuse a number.
- **Hash passwords on the server with BCrypt.** The mock hashes in the browser with PBKDF2
  (`src/features/onboarding/passwords.ts`), which is only acceptable in a demo.
- **Make portal login create a real session** (the same cookies as `/auth/login`) instead
  of the mock's `sessionStorage` entry.
- **Portals: never trust the `organizationId` and `userId` query parameters.** They exist
  only because the mock has no session. The school in `/portal/<school>` must match the
  signed-in person's organization.
- **Marks:** only the offering's assigned lecturer can read or change its sheet. Published
  marks and submitted sheets are immutable. Corrections after submission need a
  separate, audited amendment flow (not built yet; HOD approval is the likely rule).
- **Students see only published components,** and grades only after submission. The
  department can see drafts; students can't.

## Suggested order

Each step can ship on its own. When an endpoint is live, delete its handler from
`src/mocks/` and that screen switches to the real API.

1. Fix the [response envelope](#response-envelope-mismatch) mismatch in the three
   frontend clients.
2. **Structure:** the unit tree, stages and faculty/department details (endpoints 1–6).
   Everything else hangs off it.
3. **Sessions and terms** (7–10), extending `Semester` and `Term`.
4. **Catalogue and offerings** (11–15).
5. **Ranks, staff and appointments** (23–33).
6. **Invitations, join form, approval, identifiers and portal login** (34–43).
7. **Cohorts and students** (16–22, 44–45).
8. **Tracking pages and the faculty summary** (30, 46, 47), once registrations, results
   and attendance exist.
9. **Portal read side:** portal login with a real session (40), the school lookup (48)
   and `GET /portal/me` (49). This needs enrolments and timetable slots on top of steps 2–4.
10. **Marking:** result sheets, publish and submit (50–53), then the department Results
    tab (59–60).
11. **Coursework and notifications** (54–56). Design file storage for hand-ins here.
12. **Non-teaching staff:** leave and tasks (57–58), plus employment records, duty roster
    and appraisals.

---

## Since `PROD` was created

### Already on `PROD` and `main`

- **CI/CD** (`.github/workflows/prod.yml` on `PROD`): on every pull request and push to
  `PROD`, it builds and tests the frontend, builds the backend, and builds the Docker
  image. On push it then applies EF Core migrations to Supabase, using the
  `PROD_DATABASE_CONNECTION` secret in the `production` environment, before Render
  deploys.
- **Phone layout:** a bottom tab bar in the school workspace, a one-row top bar and
  compact stats.
- **Fixes:**
  - Pages open at the top on navigation and reload.
  - Dialogs are no longer cropped to the page height.
  - On phones, the landing page's "Get started" moved into the menu.
- **Merge into `main`:** `Leo's-branch` was merged into `main`, and the planning docs were
  removed.

### New on `Leo's-branch`: student and staff portals (frontend and mock only)

No backend code changed. What the backend needs is in [section D](#d-student-and-staff-portals-assessment-and-results-13).

- **Portals live outside the admin app.** Each school has its own address:
  `/portal/<schoolId>` is its sign-in page, with areas at `/student`, `/teacher` and
  `/staff` under it. Admins never enter the portal; School Settings has a **Portal link**
  card to copy and share it, and approval emails include it. The old `/portal-login` is
  now "find your school's portal", and the old `/student-portal` URLs redirect.
- **Students:** timetable, coursework with hand-in, results (marks as they're published,
  grades after submission; GPA/CGPA at university, a report card with class position at
  secondary level), notifications, and profile.
- **Teaching staff:** today's classes and next-class reminders, classes and coursework
  posting, and the **result sheet**. On the sheet, lecturers type marks or use a CSV
  template (matched by matric number), save drafts, publish in-course marks, and submit
  the final result, which locks the sheet.
- **Non-teaching staff:** duty roster, leave (balance and requests), tasks, notices, and
  service record (cadre, grade level, promotion, appraisals).
- **School side:** a **Results** tab on each department, showing each offering's sheet
  status, averages after submission, and the full sheet.
- **Demo:** `/portal/demo-university` and `/portal/demo-secondary` have demo accounts
  (password `Demo@2026`), built from `src/mocks/portalDemo.ts`.
- **Old stubs removed:** `StudentDashboardPage.tsx` and `TeacherDashboardPage.tsx`.

## Full specifications

The planning documents these features were built from were removed from the repo but
remain in git history:

```bash
git show ec89e0b:COHORT-MODEL.md          # cohort model and API contract
git show ec89e0b:FACULTY-SYSTEM.md        # why the faculty system works this way
git show ec89e0b:FACULTY-BUILD.md         # faculty build instructions and endpoints
git show ec89e0b:PEOPLE-AND-COURSES.md    # unit tree, courses and assignments
git show ec89e0b:BUILD-SPEC.md            # people and roles; §8 is the backend slice conventions
git show 6d586c2:ACADEMIC-STRUCTURE.md    # academic structure plan and data changes
```
