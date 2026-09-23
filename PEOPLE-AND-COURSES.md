# People and Courses — build instructions

This is a work order, not a discussion. Read it top to bottom and build it in order.
It continues `COHORT-MODEL.md`. Everything there still applies: cohorts are generated
from the school's structure, nobody clicks "create cohort", and the word "cohort" never
appears in the UI.

Scope of this document: fixing the academic hierarchy, giving teachers and students
profiles that are tied to that hierarchy, and letting students register for courses.

Mock-backend rules from `COHORT-MODEL.md` continue to hold: everything lands in
`src/mocks/`, persisted to `localStorage`, with no change to the real backend.

---

## 0. The problem being fixed

The structure editor currently lets someone put "Cybersecurity" in a place where it is
treated as a department. That is wrong, and it is why the rest does not fit together.

The correct chain for a university is four levels, not three:

```
Faculty          Faculty of Computing
  Department       Department of Computer Science
    Programme        B.Sc. Cybersecurity          ← what a student is admitted into
      Course           CYB 301 — Network Security ← what a student registers for
```

- A **Faculty** contains Departments.
- A **Department** contains Programmes.
- A **Programme** is the named degree a student belongs to. It is the leaf of the
  academic-unit tree, and it is what a cohort is generated against
  (`Programme × Level × Session`).
- A **Course** is *not* a unit in the tree and is *not* owned by a Programme. It is
  owned by the Department that teaches it, and it reaches students through
  **offerings** — see §2. That is how two departments share one course.

For a secondary school the same tree exists with fewer levels: the leaf unit is the
Stage's arm (SS2 Science), and "course" is a subject. Build one model, label it
differently per `SchoolModel` — never fork the code.

Nothing in this document introduces a second tree. `AcademicUnit` stays the single
self-referencing tree from `COHORT-MODEL.md`. Programme is a `kind` on that tree, not a
new table.

---

## 1. Extend the academic unit

**File:** `src/features/cohorts/settings.ts`

Add `kind` to the academic unit type:

```ts
export type UnitKind = "Faculty" | "Department" | "Programme";
```

Rules to enforce in the structure editor, not in a comment:

1. A `Faculty` may only have `Department` children.
2. A `Department` may only have `Programme` children.
3. A `Programme` has no children. The "Add child" control is not rendered for it.
4. Only `Programme` units generate cohorts. Faculties and departments are containers
   and must never appear as a student group.

Add a `labels` map keyed by `SchoolModel` so the same three kinds render as
Faculty/Department/Programme for `University` and as Section/Stage/Arm for `Secondary`
and `Primary`. Every string the user reads comes from that map. No `model === "University"`
ternaries scattered through JSX.

**File:** `src/features/cohorts/SchoolStructureEditor.tsx`

Enforce rules 1–3 in the editor itself. A user must not be able to create an invalid
tree and discover it later. Show the depth as a breadcrumb on each row so the person can
see what they are building.

---

## 2. Courses and offerings

**Read this section twice. Getting it wrong makes the whole thing unbuildable.**

A course is **not** owned by a programme. Two facts make that impossible:

1. Students in the same department do not all take the same courses.
2. The same course is taken by students from different departments. A Computer
   Engineering student and an Electrical Engineering student sit in the same
   EEE 201 lecture. MTH 101 is taken by half the university.

So a course is split into two records: a **catalogue entry** that exists once, and an
**offering** that says who may take it and on what terms. This is the whole answer to
your question — one course, many offerings.

**New file:** `src/features/cohorts/courses.ts`

```ts
/** The course itself. Exists once per organization. */
export type Course = {
  courseId: string;
  organizationId: string;
  owningDepartmentId: string; // the Department that TEACHES it, not who takes it
  code: string;               // "EEE 201" — required, unique per organization
  title: string;              // "Circuit Theory"
  creditUnits: number;        // 1–12; University only, default 1 elsewhere
  capacity: number | null;    // null = unlimited; counted across ALL offerings
};

/** Who may take that course, and whether they must. One row per audience. */
export type CourseOffering = {
  offeringId: string;
  courseId: string;
  programmeId: string;                  // which Programme this offering is for
  stageId: string;                      // at which Level
  requirement: "Core" | "Elective";
};
```

`owningDepartmentId` answers "whose lecturer teaches this and whose budget pays for it".
It has nothing to do with who takes it. EEE 201 is owned by Electrical Engineering and
offered to both the Electrical and the Computer Engineering programmes.

### What this buys you

Everything you described falls out of it without a special case:

| Situation | How it is represented |
|---|---|
| A service course the whole university takes | One `Course`, one `CourseOffering` per programme |
| Computer Eng. and Electrical Eng. share EEE 201 | One `Course`, two offerings, owner = Electrical Eng. |
| Core for one programme, elective for another | Two offerings, different `requirement` |
| Taken at 200 level here, 300 level there | Two offerings, different `stageId` |
| Two students, same department, different courses | Different programmes, or different elective picks |

That last row is the one you asked about. Two students in the same department differ for
exactly two reasons, and no others: they are on **different programmes**, so different
offerings apply to them; or they are on the same programme and **chose different
electives**. Nothing else is allowed to make their course lists differ. If you find
yourself needing a third reason, stop and raise it — the model is wrong, not the case.

### Rules

- `capacity` lives on the `Course`, never on the offering. A lecture hall holds 200
  people regardless of which programme they came from. Count registrations across all
  offerings of that course when checking it.
- A course with no offerings is legal — a draft nobody can register for yet. Show it in
  the Courses tab with a "Not offered" chip.
- The same (courseId, programmeId, stageId) may not appear twice. Reject with `409`
  `OFFERING_EXISTS`.
- Deleting an offering is allowed only if no student registered through it this session.
  Otherwise `409`.
- **Never duplicate a `Course` row to reach a second audience.** If you see two rows with
  the same `code`, the model has been broken. Enforce the unique code and let it fail
  loudly.

### Secondary and primary schools

Same model, different words. A "course" is a subject, the owning department is the
subject department, and the offering's programme is the arm. Maths offered to every arm
at JSS1 as `Core`; Technical Drawing offered only to the Technology arms at SS2. The
core-subject list you described — Maths, English, Chemistry, Physics, Biology — is just
five courses with `Core` offerings against every arm. Do not write a separate code path
for it.

---

## 3. Profiles

This is the part that is missing, and it is why nothing ties together.

**New file:** `src/features/people/types.ts`

```ts
export type PersonStatus = "Active" | "Suspended" | "Graduated" | "Withdrawn";

export type StudentProfile = {
  studentProfileId: string;
  organizationId: string;
  userId: string;
  fullName: string;
  admissionNumber: string;   // unique per organization, case-insensitive
  programmeId: string;       // the Programme they were admitted into
  entryStageId: string;      // the Level they entered at — direct entry starts at 200
  currentCohortId: string;   // derived; the group they sit in this session
  status: PersonStatus;
};

export type TeacherProfile = {
  teacherProfileId: string;
  organizationId: string;
  userId: string;
  fullName: string;
  staffNumber: string;       // unique per organization
  departmentId: string;      // the Department they are staff of — NOT a programme
  title: string;             // "Dr.", "Prof.", "Mr." — free text, max 20 chars
  status: PersonStatus;
};
```

Note the asymmetry, and keep it: **a student belongs to a Programme, a teacher belongs to
a Department.** A lecturer in Computer Science teaches on several programmes. Tying a
teacher to a programme is the mistake that makes timetabling impossible later.

A teacher's link to what they actually teach is `CourseAssignment`, not their profile:

```ts
export type CourseAssignment = {
  assignmentId: string;
  courseId: string;
  sessionId: string;
  teacherProfileId: string;
  role: "Lead" | "Assistant";
};
```

Exactly one `Lead` per (course, session). Reject a second one with `409`.

---

## 4. Registration

**New file:** `src/features/people/registration.ts`

```ts
export type Registration = {
  registrationId: string;
  sessionId: string;
  offeringId: string;        // the offering they came in through
  courseId: string;          // denormalised from the offering, for roster queries
  studentProfileId: string;
  registeredAt: string;      // ISO
  status: "Registered" | "Dropped";
};
```

How registration works, and this is the behaviour to build:

1. A student opens their registration page for the **current session**.
2. The system finds their `programmeId` and the stage of their `currentCohortId`.
3. It lists every **`CourseOffering`** matching that programme and that stage, joined to
   its `Course` for the code, title and credit units. The student never sees a course
   that was not offered to them, and two students on different programmes see different
   lists even when they sit in the same department.
4. Every offering with `requirement: "Core"` is **pre-selected and cannot be unticked**.
   Core-ness is a property of the offering, not the course — the same course can arrive
   compulsory for one student and optional for another.
5. `Elective` offerings are free to tick, subject to the credit cap.
6. The student submits once. The submission is all-or-nothing.

Validation, all server-side in the mock, all returning the repo's failure envelope:

| Condition | Code | Status |
|---|---|---|
| Student already has a submitted registration this session | `ALREADY_REGISTERED` | 409 |
| No offering matches their programme and stage | `COURSE_NOT_OFFERED` | 400 |
| Course is full — `capacity` reached **across every offering** | `COURSE_FULL` | 409 |
| Total credit units outside `minCredits`..`maxCredits` | `CREDIT_LIMIT` | 400 |
| Registration window for the session is closed | `REGISTRATION_CLOSED` | 403 |

`minCredits`, `maxCredits` and the registration window are per-session settings. Add them
to the session record; default to 15/24 for `University` and skip the credit checks
entirely for `Primary`/`Secondary`, where every core subject is compulsory and there are
no electives unless the school defined arms.

Dropping a course before the window closes sets `status: "Dropped"` — it does not delete
the row. After the window closes, dropping is refused with `REGISTRATION_CLOSED`.

---

## 5. Endpoints to add to the mock

Add these to `src/mocks/handlers.ts`, in the same style as the existing cohort handlers:
the `ok`/`fail` envelopes, a `delay`, `orgGuard` where an `organizationId` is involved,
and a `persistSchool`-style write to `localStorage` after every mutation.

**Directory lookups** — these close the gap `COHORT-MODEL.md` flagged and were never built:

```
GET    /api/academic-units?organizationId=&kind=&parentId=
GET    /api/sessions?organizationId=
GET    /api/teachers?organizationId=&departmentId=
GET    /api/students?organizationId=&programmeId=&stageId=&q=
```

`q` is a case-insensitive substring match on name or admission number. Cap every list
response at 100 items and include a `total`.

**Courses and offerings:**

```
GET    /api/courses?organizationId=&owningDepartmentId=&q=
POST   /api/courses                       201, Location header; 409 on duplicate code
PATCH  /api/courses/{courseId}
DELETE /api/courses/{courseId}            409 if it has offerings or registrations

GET    /api/offerings?organizationId=&programmeId=&stageId=&courseId=
POST   /api/offerings                     201; 409 OFFERING_EXISTS on a duplicate
PATCH  /api/offerings/{offeringId}        requirement only
DELETE /api/offerings/{offeringId}        409 if registered through this session
```

`GET /api/offerings?programmeId=&stageId=` is the single call the registration page
makes. Return each offering with its `Course` embedded, so the page needs one request,
not N+1.

**Profiles:**

```
GET    /api/students/{studentProfileId}
POST   /api/students                      201 — admission; see below
PATCH  /api/students/{studentProfileId}
GET    /api/teachers/{teacherProfileId}
POST   /api/teachers                      201
PATCH  /api/teachers/{teacherProfileId}
```

`POST /api/students` replaces the ad-hoc `POST /api/cohorts/:id/admissions` handler that
is currently in `handlers.ts`. Admission takes `programmeId` and `entryStageId`; the
system resolves the cohort from those plus the active session and writes
`currentCohortId`. **Do not accept a cohort id from the client.** Delete the old handler
and repoint `CohortDetailPage.tsx` at the new one.

**Course assignment:**

```
GET    /api/courses/{courseId}/teachers?sessionId=
POST   /api/courses/{courseId}/teachers   201, 409 on a second Lead
DELETE /api/courses/{courseId}/teachers/{assignmentId}
```

**Registration:**

```
GET    /api/registrations?sessionId=&studentProfileId=
GET    /api/registrations?sessionId=&courseId=     → the full roster, all programmes
GET    /api/registrations?sessionId=&offeringId=   → the roster for one programme only
POST   /api/registrations                          201, all-or-nothing
DELETE /api/registrations/{registrationId}         → sets status Dropped
```

`POST /api/registrations` takes `{ sessionId, studentProfileId, offeringIds: string[] }`
and either writes every row or writes none. It takes offering ids, never course ids —
a course id alone is ambiguous once two programmes share the course. If it fails, nothing is persisted.

---

## 6. UI to build

Keep all of it inside an organization. None of it goes in the top-level sidebar.

**Organization → Academic structure tab** (exists): add the four-level tree with the
kind rules from §1.

**Organization → Courses tab** (new): a table of the catalogue, filtered by owning
department, with create/edit. Each row expands to show its offerings — which programmes
take it, at which level, and whether it is core for them — with add/remove there. That
expander is where a lecturer puts EEE 201 in front of the Computer Engineering students
without creating a second EEE 201. Empty state explains that a course must be offered to
a programme before anyone can register for it.

**Organization → People tab** (new): two sub-tabs, Students and Teachers. Search, filter
by programme (students) or department (teachers), and an "Admit student" / "Add staff"
action. The admit form asks for name, admission number, programme and entry level —
nothing else, and never a cohort.

**Student profile page** (new): identity block, current group, and a registration
section showing this session's registered courses with their status.

**Teacher profile page** (new): identity block, department, and the courses they lead or
assist this session.

**Course registration page** (new): the flow in §4. Core courses render ticked and
disabled with a "Required" chip. A running credit total sits beside the submit button
and turns red outside the limits. One submit, one confirmation.

---

## 7. Tests

Extend the existing Vitest setup (`src/mocks/testSetup.ts`, `vitest.config.ts`). These
must all be present and passing:

1. A Programme cannot be given a child.
2. A Faculty cannot be given a Programme child directly.
3. Only Programme units produce cohorts.
4. Admitting a student resolves the cohort from programme + entry stage + active session.
5. A duplicate admission number in the same organization returns 409.
6. The same admission number in a *different* organization succeeds.
7. Registration pre-selects every Core offering and rejects an attempt to omit one.
7b. One course offered to two programmes appears for a student on each, and the course
    roster returns both of them while each offering roster returns only its own.
7c. The same course offered `Core` to one programme and `Elective` to another is locked
    for the first student and optional for the second.
8. Registering past `maxCredits` returns `CREDIT_LIMIT` and persists nothing.
9. A second registration for the same session returns `ALREADY_REGISTERED`.
10. A second `Lead` on one course/session returns 409.
11. Deleting a course that still has offerings returns 409.
11b. A duplicate (courseId, programmeId, stageId) offering returns `OFFERING_EXISTS`.
11c. `COURSE_FULL` triggers on capacity counted across both offerings, not per offering.
12. `resetCohortMocks()` clears profiles, courses and registrations too — extend it.

Test 8 is the one that catches a partial write. Do not skip it.

---

## 8. Definition of done

- `npx tsc -b --noEmit` exits 0.
- `npm run build` succeeds.
- `npm test` passes, including all twelve above.
- The old `POST /api/cohorts/:id/admissions` handler is gone, not left alongside.
- Walk the flow in a browser once, end to end, and say so explicitly:
  create org → build Faculty/Department/Programme → add a course and offer it to **two**
  programmes → admit a student on each → register both → see both on the course roster
  and only one on each offering roster.

Report what you did **not** build and why. Do not report a step as done if you did not
run it.
