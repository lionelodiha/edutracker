# The Cohort Model

How student groups come into existence, and why the admin never creates one.

Date: 2026-09-23
Status: **Model. Supersedes the earlier version, which got three things wrong.**

---

## The one-line version

> **A cohort is the named group of students who move through the school
> together. The system creates them from the structure the school defines.
> Nobody clicks "create cohort".**

---

## The lifecycle

This is the whole model. Everything else follows from it.

### 1. Someone creates an organization

A school or a university. This is the only thing that exists at the start.

### 2. They define the structure

```
UNIVERSITY                          SECONDARY
Faculty of Engineering              (streams, if the school uses them)
├── Computer Engineering            Science
├── Electrical Engineering          Arts
└── Civil Engineering               Commercial
```

Plus the stages the institution runs:

```
100 Level … 500 Level        or        JSS 1 … SS 3
```

### 3. The system creates every cohort, automatically

This is the step that matters. **Structure × stage = cohorts**, generated the
moment the structure is defined:

```
Computer Engineering    ×  100 Level   →  cohort
Computer Engineering    ×  200 Level   →  cohort
Computer Engineering    ×  300 Level   →  cohort
Computer Engineering    ×  400 Level   →  cohort
Computer Engineering    ×  500 Level   →  cohort
Electrical Engineering  ×  100 Level   →  cohort
...
```

Every department, every level. All of them, at once.

**After this, the admin never creates a cohort again.** No create button, no
create form, no create endpoint the UI calls.

### 4. Students are admitted into cohorts that already exist

The cohort is already there. Admission puts the student in it, at whatever
stage they are entering:

```
fresh intake     →  100 Level  or  JSS 1
direct entry     →  200 Level              (A-level, ND, HND)
transfer         →  SS 2                   (moved from another school)
```

### 5. The only thing the admin creates afterwards is a new session

And creating it **moves everybody up**:

```
Admin creates session 2027/2028
    → system builds that session's cohorts
    → every student advances one stage into them
         100 Level student  →  200 Level
         SS 1 student       →  SS 2
```

Not a separate "promote" button. Creating the session *is* the promotion.

---

## Three things this model does NOT do

These are the mistakes in the earlier version of this document.

### It does not put cohorts in the sidebar

A cohort has no meaning outside an organization, so it cannot be a sibling of
one. The current route is wrong:

```
/dashboard/cohorts               ✗  top-level, outside any school
```

It belongs inside the school, reached by opening it:

```
organization  →  session  →  the groups  →  the students
```

### It does not use the word "cohort" in the UI

"Cohort" is our internal word for the concept. The user sees whatever their
school calls it — classes, levels, sets, forms. Never "cohort".

### It does not decide what an arm means

Two real schools, both valid:

```
School A     SS 2:  A B C D = Arts, E F = Social Sciences,
                    G = Technology, H I J = Science
                    (letters run across the whole stage)

School B     SS 2 Science A, SS 2 Science B
                    (letters restart within each stream)
```

Encode either one and the other school cannot use the product. **The schema
holds a name and a link to the structure. It does not hold a rule about how
the two relate.** The school decides that at setup.

Same for naming, display format, and how many groups a stage has.

---

## The trap: `Class` already means something else

```csharp
// backend/EduTracker.Domain/Entities/Academics/Class.cs
public Class(Guid courseOfferingId, string code, Guid? instructorId, int maxCapacity)
```

That hangs off a **CourseOffering**. It is a teaching section of one subject —
"CPE 301, Section B, Dr. Okafor, capacity 60".

A school means something completely different by "class": a group of students.

| | What it is | In the code |
| --- | --- | --- |
| **Cohort** | The group of students | Does not exist |
| **Teaching section** | A slice of one subject | Exists, misnamed `Class` |

Rename the existing one to `TeachingSection` and the word is free for what
everyone actually means.

---

## Shape

```csharp
Cohort
{
    Guid Id
    Guid OrganizationId
    Guid? AcademicUnitId    // department, or stream. null when the school
                            // does not divide at this stage (JSS, primary)
    Guid StageId            // 100 Level, SS 2
    string? Arm             // whatever the school calls it. No rule attached.
    Guid SessionId          // cohorts are per session
    Guid? FormTeacherId     // form teacher / level adviser
}
```

`AcademicUnit` is a self-referencing tree, so depth varies by institution:

```
UNIVERSITY                    SENIOR SECONDARY      PRIMARY / JUNIOR
Faculty                       Stream                (none)
└── Department                                      cohorts attach to the
    └── Programme                                   organization directly
```

A university is three levels deep, a senior secondary school one, a primary
school none. Fixing the depth at two — as the current Faculty/Department code
does — is why a secondary school has to invent fake faculties.

`Stage` is per-organization and ordered, so nothing hardcodes "JSS before SS":

```csharp
Stage { Guid Id, Guid OrganizationId, int Ordinal, string Name, string ShortName }
```

---

## Progression — specified, not yet built

Rollover happens when the next session is created. Who advances differs, and
secondary is the hard case.

**University:** everyone advances. Carried courses follow the student; they do
not hold the level back.

**Secondary:** a student advances only if they passed the core subjects.

```
fail a core subject   →  resit that exam
fail the resit        →  repeat the class, same stage next session
```

Core subjects are typically Maths and English plus the stream's own —
Chemistry, Physics and Biology for Science.

**Which subjects are core, and the pass rule, are school-configured.** Same
reasoning as arms: hardcode one school's rule and the next school cannot use
the product. The school sets core subjects per stage and stream, the pass mark,
whether resits are offered, and what a failed resit means.

**Why this is deferred:** "did they pass the core subjects" is a question about
grades. Assessment has to exist first.

```
build order:  cohorts → admission → subjects → assessment → rollover
```

Until then, moving a student between cohorts stays manual. That is honest for
now.

---

## What this fixes

| The complaint | How the model answers it |
| --- | --- |
| "You can't track students of just a class" | A cohort has students. One query, one screen. |
| "It shows generally for everybody" | Everything filters by cohort. |
| "It doesn't know 100 level Computer Engineering" | That is a cohort: department × stage. |
| "After creating a department, what next?" | The system creates that department's cohorts immediately. |
| "JSS do the same subjects, SS splits" | JSS cohorts have no academic unit. SS cohorts point at a stream. Same table. |
| "Cohort shouldn't even show" | It does not. It lives inside the organization, and the user never reads the word. |

---

## API contract

Conventions from the rest of the repo: standard response envelope, uuid ids,
everything scoped by organization.

```jsonc
{ "id": "...", "title": "...", "data": <payload> }              // success
{ "id": "COHORT_NOT_FOUND", "title": "...", "details": [] }     // failure
```

### Types

```ts
type Stage = {
  id: string;
  organizationId: string;
  ordinal: number;        // sort order. 100L=1…500L=5, JSS1=1…SS3=6
  name: string;           // "SS 2" | "100 Level"
  shortName: string;      // "SS2"  | "100L"
};

type Cohort = {
  id: string;
  organizationId: string;
  academicUnitId: string | null;
  academicUnitName: string | null;   // "Science" | "Computer Engineering"
  stageId: string;
  stageName: string;
  arm: string | null;
  displayName: string;               // the school's own label
  sessionId: string;
  formTeacherId: string | null;
  formTeacherName: string | null;
  studentCount: number;
};

type CohortStudent = {
  studentProfileId: string;
  userId: string;
  admissionNumber: string;   // "JMS/2023/0219" | "20/ENG/CPE/001"
  fullName: string;
  status: "Active" | "Deferred" | "Suspended" | "Withdrawn" | "Graduated";
};
```

### Endpoints

Read-only, plus membership. **There is no create-cohort endpoint for the UI** —
cohorts are generated when the structure is defined, and again at session
rollover.

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/stages?organizationId=` | `Stage[]`, ordered by `ordinal` |
| GET | `/api/cohorts?organizationId=&sessionId=&stageId=&academicUnitId=` | `Cohort[]` |
| GET | `/api/cohorts/{id}` | `Cohort` |
| GET | `/api/cohorts/{id}/students` | `CohortStudent[]` |
| POST | `/api/cohorts/{id}/students` | `201`, body `{ studentProfileIds: string[] }` |
| DELETE | `/api/cohorts/{id}/students/{studentProfileId}` | `200` |

The two writes are for correcting placement — moving a student who was admitted
into the wrong group. They are not how cohorts get populated normally.

### Status codes

### Frontend-only admission preview

While the real admission service is deferred, MSW also supports
`POST /api/cohorts/{id}/admissions` with `{ fullName, admissionNumber }`.
It returns the existing `CohortStudent` shape in the standard envelope (201),
validates names and unique admission numbers, and stores the mock record in
this browser. The admission control is enabled only in development mock mode.
This is a prototype contract, not an implemented real-backend endpoint.

### Status codes

| Code | When |
| --- | --- |
| 400 | Validation failed |
| 401 | No session |
| 403 | Not a member of that organization |
| 404 | Cohort not found **in this organization** |

> 404 rather than 403 for a cohort in another organization, so the API cannot
> be used to discover which ids exist. Resolve the organization from the
> cohort; never trust an id in the request body.

---

## Current state of the code

**Built:** the mock backend (`src/mocks/`) and the UI (`src/features/cohorts/`).

**Implemented in the frontend:**
- Navigation follows organization → session → school-named groups → students.
- The create form and create API client/handler have been removed.
- Development fixtures generate placements from configured structure × stage,
  scoped to the organization and session supplied by the caller.
- Display names are stored school setup labels, independent of stage, unit and arm.
- School terminology is configurable per organization in this browser.
- Sample primary, secondary and university structures are selectable in mock mode.
- Membership corrections retain student identities and update roster counts.

**Mock boundaries:** The sample structure is a local preset, not a copy of the
real school's configured departments. Authentication and organization/session
management still use the existing API. The student API mock accepts any caller
organization ID; it is not an authorization simulator. Membership changes reset
on refresh. Each session is seeded independently; admission, grade-based
progression and rollover remain deferred as specified above.

---

# Handover — read before touching anything

## What exists today

```
src/mocks/                    mock backend (MSW). Not the real API.
  data.ts                     seed data
  handlers.ts                 the endpoints
  browser.ts                  dev worker
  server.ts                   Vitest server

src/features/cohorts/         the UI
  CohortListPage.tsx
  CohortDetailPage.tsx
  CohortWorkspacePage.tsx
  ReferencePicker.tsx
  settings.ts                 browser-local school terminology / sample model
  api.ts
  cohortApi.test.ts
  cohorts.css
```

**Running it:** set `VITE_USE_MOCKS=true` in `.env.local`, then `npm run dev`.
Off without the flag, so it can never reach production by accident.

> **If dependencies look missing, check `NODE_ENV` first.** With
> `NODE_ENV=production`, npm silently omits every devDependency — `@types/react`,
> `msw`, `vitest`, and the types behind `"types": ["vite/client"]`. Nothing
> errors. Fix: `NODE_ENV=development npm install --include=dev`.

## Rules for both halves

1. **Do not change the response shapes.** They are the contract above, and the
   real backend will return them. Change the doc first, then tell the other
   half.
2. **Do not reintroduce a create-cohort flow.** Cohorts come from structure and
   rollover. If a screen needs one, the model is wrong — raise it.
3. **Do not use the word "cohort" in anything a user reads.** Internal only.
4. **Stay inside your half's files.** Both halves compile independently.

## Half A — Navigation and removing the create flow

**Owns:** `src/App.tsx`, `src/layouts/DashboardLayout.tsx`,
`src/features/cohorts/CohortWorkspacePage.tsx`,
`src/features/cohorts/CohortListPage.tsx`, detail/workspace presentation,
and organization/session navigation links

- [x] Remove the `Cohorts` entry from the sidebar in `DashboardLayout.tsx`
- [x] Remove the top-level `cohorts` routes from `App.tsx`
- [x] Re-route under the organization and its session, for example
      `organizations/:id/semesters/:semesterId/groups/*`. Note: **not**
      `/classes`, which already means a teaching section.
- [x] Delete `CreateCohortModal.tsx` and every reference to it
- [x] Replace user-facing "Cohort" labels with the school's own word

## Half B — Mock data and display

**Owns:** `src/mocks/data.ts`, `src/mocks/handlers.ts`,
`src/features/cohorts/api.ts`, `src/features/cohorts/cohortApi.test.ts`

- [x] Drop the `POST /api/cohorts` handler
- [x] Stop inventing organizations. Serve cohorts for whatever
      `organizationId` the caller passes, so the mock works against the
      organization the signed-in user actually created.
- [x] Stop composing `displayName` as `stage + unit + arm`. That encodes one
      school's convention. Treat it as a stored string the school controls.
- [x] Seed data should show cohorts generated from structure × stage, not a
      hand-written list
- [x] Update `cohortApi.test.ts` to match

### Verification
- 21 API/fixture tests cover generated placements, stored labels, arbitrary
  organizations, session/stage/unit filters, membership changes, resets and errors.
- Production build passes; mock modules are excluded from the production bundle.
- No real backend files or endpoints were changed.

## Deleting the mock, when the real backend ships

1. `npm run openapi-ts` against the real API
2. Check the generated types match the contract above
3. Delete `src/mocks/` and the MSW block in `main.tsx`
4. Remove `msw` from `package.json`

No component should need changing. If one does, the contract drifted, and that
is the thing to fix.
