# Faculty System — build instructions

This is the work order for `FACULTY-SYSTEM.md`. That file explains *why*; this one says
*what to build*, in order. Read `FACULTY-SYSTEM.md` first — the reasoning behind every
decision here is in it, and if you skip it you will rebuild something it already rejected.

It also depends on `PEOPLE-AND-COURSES.md` for the four-level academic tree
(Faculty → Department → Programme → Course) and for `CourseAssignment`. Build that first
or at least land §1 of it, because the whole staff model hangs off the unit tree.

Same rules as the other work orders: everything lands in the frontend, the mock backend
lives in `src/mocks/`, state persists to `localStorage`, and **no backend file changes**.

---

## Build order

Do these in order. Each one is usable on its own; do not start the next until the current
one runs.

1. Staff records and ranks (§1, §2)
2. Appointments (§3)
3. The faculty workspace shell and routing (§7)
4. The lecturer directory and tracking page (§8)
5. Invitations, forms, approval and number generation (§4, §5, §9)
6. The student directory and tracking page (§8)
7. Documents and board — **stubs only** (§10)

Steps 4 and 6 are the product. If you run out of time, stop after 6 and leave 7 as an
empty state that says what is coming. Do not leave 4 or 6 half-built.

---

## 1. Staff records

**New file:** `src/features/staff/types.ts`

```ts
export type StaffKind = "Academic" | "Administrative" | "Technical";

export type StaffStatus =
  | "Active"
  | "OnSabbatical"
  | "OnStudyLeave"
  | "Suspended"
  | "Retired"
  | "Resigned";

export type StaffProfile = {
  staffProfileId: string;
  organizationId: string;
  userId: string | null;      // null when this person has no login — see §6
  staffNumber: string;        // unique per organization, case-insensitive
  fullName: string;
  title: string;              // "Dr.", "Prof.", "Mr." — free text, max 20 chars
  kind: StaffKind;
  unitId: string;             // the Department they belong to…
  unitKind: "Department" | "Faculty";  // …or the Faculty, for faculty-office staff only
  rankId: string | null;      // null for Administrative and Technical staff
  schoolEmail: string;
  status: StaffStatus;
  appointedOn: string;        // ISO date they joined the school
};
```

Rules to enforce in the mock, not in a comment:

- `unitKind: "Faculty"` is allowed **only** for `Administrative` staff. An academic
  attached directly to a faculty is a data error; reject with `400 STAFF_UNIT_INVALID`.
- `rankId` must be null unless `kind === "Academic"`. Reject with `400 RANK_NOT_ALLOWED`.
- `staffNumber` is unique per organization and compared case-insensitively. `409`.
- A staff member whose `status` is not `Active` must not be assignable to a course or an
  appointment. Reject with `409 STAFF_NOT_ACTIVE`. This is why the status exists — see
  `FACULTY-SYSTEM.md` §11.3.

**This is the query that matters.** Every faculty staff list is derived:

```
staff of a faculty =
    every StaffProfile whose unitId is a Department under that Faculty
  + every StaffProfile whose unitId IS that Faculty
```

Write it once as `staffOfFaculty(facultyId)` in `src/features/staff/queries.ts` and call
it everywhere. There must be no second place in the codebase that decides who is in a
faculty, and there must be no stored faculty-membership field. If you find yourself
writing one, stop — you have broken the model in `FACULTY-SYSTEM.md` §2.

---

## 2. Ranks

**New file:** `src/features/staff/ranks.ts`

```ts
export type AcademicRank = {
  rankId: string;
  organizationId: string;
  name: string;    // "Senior Lecturer"
  order: number;   // 1 = most junior; used for sorting, never for permissions
};
```

Seed these for a new `University` organization, in this order:

1. Graduate Assistant
2. Assistant Lecturer
3. Lecturer II
4. Lecturer I
5. Senior Lecturer
6. Reader / Associate Professor
7. Professor

For `Secondary` and `Primary`, seed: Assistant Teacher, Teacher, Senior Teacher,
Principal Teacher. A school can rename, reorder and add to these — they are records, not
an enum in code.

`order` sorts a directory. It must never gate a permission. Permissions come from
appointments (§3), because a Lecturer I who is HOD outranks a Professor who is not.

Changing someone's rank writes a `RankHistory` row (`staffProfileId`, `rankId`,
`effectiveFrom`, `effectiveTo`). The tracking page in §8 reads it.

---

## 3. Appointments

**New file:** `src/features/staff/appointments.ts`

```ts
export type PostCode =
  | "Dean" | "SubDean" | "FacultyOfficer" | "FacultyExamOfficer"
  | "HOD" | "DepartmentExamOfficer" | "LevelAdviser"
  | "ProgrammeCoordinator" | "ProjectCoordinator";

export type Appointment = {
  appointmentId: string;
  organizationId: string;
  staffProfileId: string;
  post: PostCode;
  scopeId: string;           // a Faculty, Department, Programme or Cohort id
  scopeKind: "Faculty" | "Department" | "Programme" | "Cohort";
  startsOn: string;          // ISO
  endsOn: string | null;     // null = open-ended; most posts run two years
};
```

The valid scope for each post is fixed. Put it in one table and validate against it —
do not scatter `if (post === "HOD")` through the code:

| Post | Scope |
|---|---|
| Dean, SubDean, FacultyOfficer, FacultyExamOfficer | Faculty |
| HOD, DepartmentExamOfficer | Department |
| ProgrammeCoordinator, ProjectCoordinator | Programme |
| LevelAdviser | Cohort |

Rules:

- **One live holder per (post, scopeId).** A live appointment is one where `startsOn` is
  past and `endsOn` is null or future. A second one returns `409 POST_OCCUPIED`, naming
  the current holder in the message so the user knows who to end first.
- **A person may hold several appointments at once.** Do not add a one-post-per-person
  check. An HOD is very often also a level adviser.
- **Ending an appointment sets `endsOn`. It never deletes the row.** History is the point
  — see `FACULTY-SYSTEM.md` §3.
- Only `Academic` staff may hold an academic post. `FacultyOfficer` is the exception and
  must be held by `Administrative` staff. Reject the wrong kind with `400`.
- A post whose `endsOn` is in the past is **expired**, not ended. The UI flags it amber.
  Do not auto-close it; somebody has to notice and act.

Expose `currentPostHolder(post, scopeId)` and `postsHeldBy(staffProfileId)` from
`queries.ts`. Everything else in the app asks through those two.

---

## 4. Invitations

**New file:** `src/features/onboarding/invitations.ts`

```ts
export type InviteKind = "Student" | "Staff";

export type Invitation = {
  invitationId: string;
  organizationId: string;
  kind: InviteKind;
  email: string;
  token: string;             // what goes in the link; unguessable
  // Set by the inviter, carried by the link, NEVER asked on the form:
  programmeId: string | null;   // Student only, required
  entryStageId: string | null;  // Student only, required
  departmentId: string | null;  // Staff only, required
  proposedKind: StaffKind | null;
  sessionId: string;
  invitedBy: string;         // staffProfileId
  expiresOn: string;         // ISO; default 14 days out
  status: "Sent" | "Opened" | "Submitted" | "Approved" | "Rejected" | "Expired";
};
```

This is the security boundary of the whole feature. **The placement fields are set by the
inviter and are read-only from the form onward.** The form does not send `programmeId`;
if a request body contains one, ignore it silently rather than trusting it.

Build both entry points:

- **One at a time** — a modal taking email, programme and entry level.
- **Pasted list** — a textarea of one email per line, all sharing the same programme,
  level and session. A department admits its intake in one sitting. Show a per-row result
  so a single bad address does not fail the batch.

A used, expired or rejected token must return `410 INVITATION_UNUSABLE`, not a form.
Resending issues a **new** token and expiry against the same invitation and invalidates
the old one.

---

## 5. The form and approval

**New file:** `src/features/onboarding/PendingRecordPage.tsx` (public, no auth)

Route: `/join/:token`. Unauthenticated — the person has no account yet.

The page loads the invitation, shows the school name, the programme and the level as
**read-only text**, and collects only what the school does not know:

Student — full name, date of birth, sex, phone, home address, next of kin name and phone,
photograph, password.
Staff — the same, plus highest qualification and proposed rank.

On submit it creates a **pending record**, not a person:

```ts
export type PendingRecord = {
  pendingRecordId: string;
  invitationId: string;
  organizationId: string;
  submitted: Record<string, unknown>;  // exactly what the form sent
  submittedAt: string;
  status: "AwaitingReview" | "Approved" | "Rejected";
  reviewedBy: string | null;
  rejectionReason: string | null;
};
```

**Approval queue**, inside the faculty workspace: a list of pending records with the
submitted details, an Approve button and a Reject button that requires a reason. Rejection
emails the reason and reopens the invitation so the person can resubmit.

Who may approve: the Dean of that faculty, or the HOD of the department the invitation
names. Check it through `currentPostHolder` — never against a role string on the user.

Approval, and only approval, runs §9.

---

## 6. Logins

`StaffProfile.userId` is nullable on purpose. Set it when the record is approved **and**
the staff kind is `Academic` or the post is `FacultyOfficer`. `Technical` staff get a
record with no account.

Students always get an account.

Wire this into the portal invite flow that already exists rather than inventing a second
one. If the two disagree about how an account is created, the existing one wins.

---

## 7. Identifier generation

**New file:** `src/features/onboarding/identifiers.ts`

```ts
export type IdentifierFormat = {
  organizationId: string;
  parts: Array<
    | { type: "entrySession"; style: "full" | "short" }  // 2025/2026 → "2025" or "25"
    | { type: "unitCode" }                                // "CPE" — see below
    | { type: "serial"; width: number }                   // 0041
    | { type: "literal"; value: string }                  // "/" or "U"
  >;
  serialResetsPer: "Session" | "SessionAndUnit";
};
```

`2025/CPE/0041` is `[entrySession full, literal /, unitCode, literal /, serial 4]`.

Add a `code` field to the academic unit (`AcademicUnit.code`, max 6 characters, uppercase,
unique among siblings). `unitCode` reads it from the student's department. A unit with no
code blocks approval with `409 UNIT_CODE_MISSING` — do not silently substitute anything.

Two rules, both non-negotiable:

- **Allocate the serial at approval, never at form submission.** Abandoned forms must not
  consume numbers. This is the whole reason approval is a separate step.
- **Never reuse a number.** Withdrawal, rejection after approval, death — the number stays
  retired. Keep an `issuedIdentifiers` set and check it, so a bug in the counter cannot
  produce a collision silently.

**School email:** a pattern per organization, default
`{first}.{last}@student.{domain}` for students and `{first}.{last}@{domain}` for staff.
Collisions are guaranteed in a Nigerian intake, so the tie-break is defined once and
applied silently: append the middle initial, then `2`, `3`, and so on. Never surface a
username choice to the person.

Both identifiers are generated, stored, and emailed. Neither is ever editable in the UI.

---

## 8. The faculty workspace

Route: `/dashboard/organizations/:id/faculties/:facultyId`, with tab routes beneath it so
a Dean can bookmark and share a direct link:

```
/faculties/:facultyId                      → Overview
/faculties/:facultyId/lecturers            → directory
/faculties/:facultyId/lecturers/:staffId   → tracking page
/faculties/:facultyId/students             → directory
/faculties/:facultyId/students/:studentId  → tracking page
/faculties/:facultyId/officers             → appointments
/faculties/:facultyId/pending              → approval queue
/faculties/:facultyId/documents            → stub
/faculties/:facultyId/board                → stub
```

The organization page lists faculties as cards that navigate **into** the workspace. It
must not try to render their contents inline.

**Overview** — Dean, Sub-Dean and Faculty Officer by name at the top. Then departments,
each with HOD and staff count. Then totals: staff by rank, students by programme. Then a
count of pending approvals, linked, because that is the thing needing action.

**Lecturer directory** — `staffOfFaculty()` filtered to `Academic`, grouped by department,
filterable by rank and status, searchable by name and staff number. Add one column the
other systems do not have: **outstanding results this session**, with a count. Sort by it
descending by default. A Dean opens this page to find who has not submitted.

**Student directory** — every student in the faculty, by programme and level, searchable
by name and matriculation number.

---

## 9. The tracking pages

### Lecturer

Header: name, title, rank, department, staff number, status. Then:

- **This session's courses** — code, title, enrolment count, and a results state of
  `Not started` / `Partial` / `Submitted`. This block goes first. It is why the page
  exists.
- **Attendance** — sessions taken against sessions scheduled, per course.
- **Posts held** — from `postsHeldBy()`, with term dates, expired ones flagged amber.
- **History** — rank changes and past appointments, newest first.

### Student

Header: the derived chain, read from the structure and never stored on the student —

```
Faculty of Engineering → Computer Engineering → B.Eng. Computer Engineering
→ 200 Level → 2025/2026
```

Build this from `programmeId` plus the current cohort, walking the unit tree upward. If
you find yourself adding a `facultyId` to `StudentProfile`, stop: that is a copy that will
go stale, and `FACULTY-SYSTEM.md` §7 rejects it.

Then:

- **Registered courses this session** — code, title, credit units, lecturer, requirement.
- **Attendance** — per course and overall.
- **Results** — as they arrive, with the standing that follows.
- **Level adviser** — by name, from `currentPostHolder("LevelAdviser", cohortId)`.
- **History** — one row per past session: the level they were at, and whether they moved
  up, repeated, or carried a course over.

That history row is what makes it a tracker rather than a profile. Build it even if it is
empty for every fixture student, and seed at least one student with three years of history
so the layout is exercised.

---

## 10. Stubs

`documents` and `board` render an empty state naming what will go there and nothing else.
Do not build a document store. Do not build meeting minutes. Both are in
`FACULTY-SYSTEM.md` §6 for when they are wanted; neither is wanted now.

---

## 11. Endpoints for the mock

Same conventions as the existing handlers in `src/mocks/handlers.ts`: the `ok`/`fail`
envelopes, a `delay`, `orgGuard`, and a `localStorage` write after every mutation. Extend
`resetCohortMocks()` to clear everything added here, or the tests will leak into each
other.

```
GET    /api/ranks?organizationId=
POST   /api/ranks
PATCH  /api/ranks/{rankId}

GET    /api/staff?organizationId=&facultyId=&departmentId=&kind=&rankId=&q=
GET    /api/staff/{staffProfileId}
POST   /api/staff                              201
PATCH  /api/staff/{staffProfileId}
GET    /api/staff/{staffProfileId}/tracking?sessionId=

GET    /api/appointments?organizationId=&scopeId=&post=&live=true
POST   /api/appointments                       201; 409 POST_OCCUPIED
PATCH  /api/appointments/{appointmentId}       endsOn only

GET    /api/invitations?organizationId=&status=
POST   /api/invitations                        201; accepts one or a list
POST   /api/invitations/{id}/resend
DELETE /api/invitations/{id}                   revoke

GET    /api/join/{token}                       public; 410 when unusable
POST   /api/join/{token}                       public; creates a PendingRecord

GET    /api/pending?organizationId=&facultyId=&status=
POST   /api/pending/{id}/approve               → generates identifiers, creates the person
POST   /api/pending/{id}/reject                requires a reason

GET    /api/students/{studentProfileId}/tracking?sessionId=
GET    /api/faculties/{facultyId}/summary      overview counts in one call
```

`facultyId` on `GET /api/staff` runs `staffOfFaculty()`. It does not read a stored field.

`/api/faculties/{facultyId}/summary` exists so the overview is one request, not eleven.

Both tracking endpoints return everything their page needs in one response. Do not make
the page assemble it from six calls.

---

## 12. Tests

Extend the existing Vitest setup. All of these must pass:

**Derivation**
1. `staffOfFaculty()` returns staff from every department under the faculty.
2. It also returns faculty-office administrative staff.
3. It returns nobody from a sibling faculty.
4. Moving a department to another faculty moves its staff with it, with no staff record
   edited.

**Staff rules**
5. An `Academic` with `unitKind: "Faculty"` is rejected.
6. A non-academic with a `rankId` is rejected.
7. A duplicate `staffNumber` in the same organization returns 409; the same number in a
   different organization succeeds.
8. A staff member on sabbatical cannot be assigned to a course or an appointment.

**Appointments**
9. A second live HOD for one department returns `POST_OCCUPIED` naming the holder.
10. Ending an appointment sets `endsOn` and leaves the row queryable.
11. One person holding HOD and LevelAdviser at once succeeds.
12. `FacultyOfficer` held by `Academic` staff is rejected.
13. An appointment ended last year does not appear in `live=true`.

**Onboarding — the important ones**
14. A form submission containing `programmeId` cannot change the invitation's programme.
15. Submitting a form creates a pending record and **allocates no serial**.
16. Approving allocates the next serial; the number matches the configured format.
17. Two forms submitted, one approved and one abandoned, consume exactly one number.
18. Rejecting then resubmitting and approving still consumes exactly one number.
19. A retired number is never reissued after the student withdraws.
20. An expired token returns 410 and no form.
21. A department with no `code` blocks approval with `UNIT_CODE_MISSING`.
22. Two students with the same name get distinct school emails, with the documented
    tie-break.

**Tracking**
23. The student header chain is correct after the student's programme is moved to a
    different department — proving it is derived, not stored.
24. The lecturer's outstanding-results count reflects a course with no results submitted.

Tests 15, 17 and 18 are the ones that catch the serial being allocated too early. Do not
skip them.

---

## 13. Definition of done

- `npx tsc -b --noEmit` exits 0.
- `npm run build` succeeds.
- `npm test` passes, including all twenty-four above.
- `staffOfFaculty()` is the only code that decides faculty membership; `grep` for a stored
  `facultyId` on a staff or student record returns nothing.
- Walk this in a browser once, end to end, and say explicitly that you did:
  create a faculty → add two departments with HODs → invite a lecturer and two students
  → fill both forms → approve one and reject one → confirm the approved one has a
  matriculation number, a school email and a cohort, and the rejected one has neither
  → open both tracking pages.

Report what you did **not** build and why. Do not report a step as done if you did not run
it.
