# The Cohort Model

One structure that serves primary, secondary and university — and fixes the reason
you cannot drill down to a class.

Date: 2026-09-18
Status: **Architecture proposal. Nothing here is a commitment to build.**

---

## Yes — and here is your point stated back

You are saying three things, and all three are correct.

**1. The drill-down stops dead.** You create an organization. You create a faculty.
You create a department. Then nothing. The department is not tied to teachers or
students, so the chain ends at exactly the point where it should start being useful.

**2. There is no way to ask about a group.** You cannot ask "who are the 100 Level
Computer Engineering students?" or "who is in SS 2 Science A?" The system knows
*everybody in the organization* and it knows *one person*. It has no concept of the
group in between.

**3. Secondary and university are genuinely different, and both are real customers.**
JSS 1–3 all study the same subjects. At SS 1 it splits into Science, Arts and
Commercial, and only then does subject choice exist. University splits much earlier
and much harder, by faculty and department.

## The missing concept has a name

Every one of those is the same hole: **there is no cohort.**

A cohort is the named group of students who move through the system together and
share a subject set. Every school on earth has one. Yours is called different things
in different places:

- `Primary 4A`
- `JSS 2B`
- `SS 2 Science A`
- `100 Level Computer Engineering`

That is one concept wearing four names.

### Verified: it does not exist anywhere in the code

```
Cohort: 0    Stream: 0    Arm: 0    Section: 0
Grade:  0    Stage:  0    Level:  0    Group:   0
```

And `Student` appears **once** in the whole domain — as a value in
`OrganizationMemberRole`. A student is a person with a label. They belong to nothing.

---

## The trap: `Class` already exists and means something else

This is why the gap has been easy to miss.

```csharp
// backend/EduTracker.Domain/Entities/Academics/Class.cs
public Class(Guid courseOfferingId, string code, Guid? instructorId, int maxCapacity)
```

That `Class` hangs off a **CourseOffering**. It is a *teaching section of one
course* — "CPE 301, Section B, taught by Dr. Okafor, capacity 60".

That is **not** what a secondary school means by a class. A school means "SS 2
Science A" — a group of students, not a slice of one subject.

So the codebase has the university-style teaching section and calls it `Class`, while
having no word at all for the group of students. Two different ideas, one name, and
the important one is missing.

| | What it is | Exists today? |
| --- | --- | --- |
| **Cohort** | The group of students. "SS 2 Science A", "100L Comp Eng" | **No** |
| **Teaching section** | A slice of one subject being taught. "CPE 301 Section B" | Yes, misnamed `Class` |

Rename the existing one to `TeachingSection` or `CourseSection`, and free the word
for what everyone actually means by it.

---

## The unified structure

Two ideas make one model serve all institution types.

### Idea 1 — Academic units are a tree of variable depth

Stop hardcoding Faculty and Department as fixed tiers. Make one self-referencing
entity whose depth differs by institution.

```csharp
AcademicUnit
{
    Guid Id
    Guid OrganizationId
    Guid? ParentId              // self-reference. null = top level
    AcademicUnitKind Kind       // Faculty | Department | Programme | Stream
    string Name
    string Code                 // ENG, CPE, SCI
}
```

The same table, three institutions:

```
UNIVERSITY                          SENIOR SECONDARY        PRIMARY / JUNIOR
Faculty of Engineering              Science                 (none)
└── Computer Engineering            Arts
    └── B.Eng Computer Eng          Commercial
```

A university is three levels deep. A senior secondary school is one. A primary
school has none at all and cohorts attach straight to the organization.

**This is why the current model fights you.** It fixed the depth at exactly two
(Faculty → Department) and made both mandatory, so a secondary school has to invent
fake faculties and a primary school cannot be represented at all.

### Idea 2 — A cohort is (unit + stage + arm)

```csharp
Cohort
{
    Guid Id
    Guid OrganizationId
    Guid? AcademicUnitId        // null for primary/junior — the whole school
    Guid StageId                // JSS 2, SS 2, 100 Level
    string? Arm                 // "A", "B" — null when there is only one
    Guid SessionId              // cohorts are per academic session
    Guid? FormTeacherId         // form teacher / level adviser
}
```

That one shape covers every case you described:

| Institution | AcademicUnit | Stage | Arm | Displays as |
| --- | --- | --- | --- | --- |
| Primary | — | Primary 4 | A | **Primary 4A** |
| Junior secondary | — | JSS 2 | B | **JSS 2B** |
| Senior secondary | Science | SS 2 | A | **SS 2 Science A** |
| University | Computer Engineering | 100 Level | — | **100L Computer Engineering** |

The JSS/SS split you described falls out naturally. JSS cohorts have no academic
unit because there is no streaming yet. SS cohorts point at Science, Arts or
Commercial because that is exactly when streaming begins.

### The `Stage` entity

Stages are per-organization, ordered, and named by the institution:

```csharp
Stage { Guid Id, Guid OrganizationId, int Ordinal, string Name, string ShortName }
```

```
A secondary school seeds:   JSS 1, JSS 2, JSS 3, SS 1, SS 2, SS 3
A university seeds:         100, 200, 300, 400, 500 Level
A primary school seeds:     Primary 1 ... Primary 6
```

No enum, no hardcoding, no assumption about how many years an institution runs.

---

## The chain you have been asking for

This is the drill-down that does not exist today and that this model gives you:

```
Jewel Model Schools                                    [organization]
└── Faculty of Engineering                    12 staff · 480 students
    └── Computer Engineering                   8 staff · 210 students
        └── B.Eng Computer Engineering                      5 years
            └── 100 Level                                52 students   ← clickable
                ├── Students            52, with matric numbers and status
                ├── Level adviser       Dr. Okafor
                ├── Courses             6 this semester, 16 units
                └── Timetable           the week
```

And the same chain for a secondary school:

```
Jewel Model Schools
└── Science                                    6 staff · 84 students
    └── SS 2 Science A                                  31 students   ← clickable
        ├── Students            31
        ├── Form teacher        Mrs. Adeyemi
        ├── Subjects            9
        └── Timetable           the week
```

Every node answers "how many staff, how many students", and the leaf is where people
finally attach. Today the tree has two nodes and no leaf.

---

## Where the two institution types genuinely differ

Only one place, and it is manageable.

### Secondary: the cohort takes subjects together

Mrs. Adeyemi teaches Mathematics to **SS 2 Science A**. All 31 students, same room,
same time. Nobody chooses individually.

> Enrollment is **derived**. Attach the subject to the cohort and every student in it
> is enrolled automatically. Add a student to the cohort mid-term and they are
> enrolled in all nine subjects at once.

### University: students register individually

CPE 301 is offered. Students from 100L Computer Engineering register for it, but so
might a repeating 200L student, and a student on transfer. GST 101 is registered by
students from every faculty in the university.

> Enrollment is **explicit**. The student registers, subject to unit limits and
> prerequisites, and the level adviser approves.

### Both produce the same record

```csharp
Enrollment
{
    Guid StudentId
    Guid CourseOfferingId
    Guid? CohortId            // set when derived from a cohort, null when individual
    EnrollmentSource Source   // Cohort | SelfRegistered | AdminAssigned
}
```

One table, one set of queries, one attendance model, one grading model downstream.
The difference is only in *how the row got created*, and that is a single flag.

**This is the whole trick.** Serve both institution types by varying how enrollment
is produced, not by building two separate systems.

---

## What the curriculum attaches to

A curriculum says which subjects a group takes. It attaches to
**(AcademicUnit, Stage)** — which works identically for both:

```
(Science, SS 2)                         → 9 subjects
(B.Eng Computer Engineering, 100 Level) → 6 courses, 16 credit units
(null, JSS 2)                           → 12 subjects, common to all
```

Then creating next year's cohort is one action: the curriculum already knows what
"SS 2 Science" studies, so the subjects come with it.

---

## What this fixes, point by point

| Your complaint | How the model answers it |
| --- | --- |
| "You can't track students of just a class" | `Cohort` has students. One query, one screen. |
| "It shows generally for everybody, not for this particular class" | Every list filters by cohort. The dashboard opens on your cohort, not on the whole school. |
| "It doesn't know 100 level of Computer Engineering" | That is a `Cohort`: unit = Computer Engineering, stage = 100 Level. |
| "After creating a department, what next? Not tied to teachers and students" | Department → Programme → Cohort → students and form teacher. The chain reaches people. |
| "JSS 1–3 do similar subjects, SS 1–3 split into art/science/commercial" | JSS cohorts have no academic unit. SS cohorts point at a stream. Same table. |
| "Secondary and university are different" | They differ in one place only: derived vs individual enrollment. |

---

## Migration path

The good news is that this is additive. Sessions, auth, organizations, members and
invites are untouched.

**Step 1 — Free the name.** Rename `Class` → `TeachingSection`. Pure rename, no
behaviour change, and it stops the confusion permanently. Do it before anything else
while the table is still nearly empty.

**Step 2 — `Stage`.** Small entity, seeded per organization at setup. A secondary
school gets JSS 1–SS 3; a university gets 100–500 Level. This is also the moment to
fix `MaxTermNumber = 3`, which assumes a secondary school calendar.

**Step 3 — `AcademicUnit`, replacing `Faculty` and `Department`.** Both become rows
with a `Kind`. Migrate the existing tables in, keep `Faculty`/`Department` as views
or query helpers if it eases the transition. This also fixes the Create Department
bug at the root rather than patching it.

**Step 4 — `Cohort`, and put students in it.** This is the payoff step. The moment
cohorts exist, every screen you said was missing becomes possible.

**Step 5 — Enrollment with a `Source` flag.** Derived for cohort-based subjects,
explicit for university registration.

**Step 6 — Curriculum on (unit, stage).** Makes cohort creation one click instead of
nine.

Steps 1 and 2 are days. Step 3 is the one that needs care because it touches
existing data. Step 4 is where the product visibly changes.

---

## One decision to make first

Before Step 3, decide whether **organization type** is a field on `Organization`.

I think it should be, and that it should be set once at creation: Primary,
Secondary, University. Not to fork the model — the model above is genuinely shared —
but to drive the defaults:

- which stages get seeded
- how deep the academic unit tree is allowed to go
- whether enrollment defaults to derived or individual
- what the UI calls things: "subject" or "course", "class" or "level", "form
  teacher" or "level adviser"

That last one matters more than it sounds. A secondary school administrator who sees
"credit units" and "faculty" assumes the product is not for them, and a university
registrar who sees "form teacher" assumes the same. Same model, different vocabulary,
chosen by one field.

## What I would confirm before building

The structure above reflects the common Nigerian pattern — JSS/SS with Science, Arts
and Commercial streaming at senior level, and Faculty/Department/Programme with
100–500 levels at university. That matches what you described.

Two things worth checking against a real school before the schema is fixed:

1. **Do arms matter to your customers?** Some schools run SS 2 Science A, B and C as
   genuinely separate classes with different teachers. Others have one group per
   stream. The model supports both, but it changes what the default screens show.

2. **Can a student belong to two cohorts at once?** Usually no at secondary, but a
   university student repeating a year sits in an awkward position — registered at
   200 Level but carrying 100 Level courses. The `Enrollment` record handles the
   courses; the question is whether their *cohort* changes. Decide it explicitly
   rather than discovering it during a term.

---

# API Contract — Cohorts

**Agreed before anyone writes code.** Frontend builds against a mock of these
shapes; backend implements the same shapes. When both are done the mock is
deleted and nothing on the frontend changes.

If either side needs to change a shape, change it *here first* and tell the
other. A contract that drifts silently is worse than no contract, because the
swap at the end is what breaks.

## Conventions

Existing repo conventions apply: every response is wrapped in the standard
envelope, ids are uuids, and every request is scoped by `organizationId`.

```jsonc
// success
{ "id": "...", "title": "...", "data": <payload> }
// failure
{ "id": "COHORT_NOT_FOUND", "title": "...", "details": [] }
```

## Types

```ts
type Stage = {
  id: string;
  organizationId: string;
  ordinal: number;        // sort order: JSS1=1 ... SS3=6, or 100L=1 ... 500L=5
  name: string;           // "SS 2"  |  "100 Level"
  shortName: string;      // "SS2"   |  "100L"
};

type Cohort = {
  id: string;
  organizationId: string;
  academicUnitId: string | null;   // null when the school does not stream
  academicUnitName: string | null; // "Science" | "Computer Engineering"
  stageId: string;
  stageName: string;               // "SS 2"
  arm: string | null;              // "A" | null when there is only one
  displayName: string;             // "SS 2 Science A" — server-composed
  sessionId: string;
  formTeacherId: string | null;
  formTeacherName: string | null;
  studentCount: number;
};

type CohortStudent = {
  studentProfileId: string;
  userId: string;
  admissionNumber: string;   // "JMS/2023/0219"
  fullName: string;
  status: "Active" | "Deferred" | "Suspended" | "Withdrawn" | "Graduated";
};
```

> `displayName` is composed on the server, not the client. Otherwise every
> screen reinvents the "unit + stage + arm" formatting rule and they drift.

## Endpoints

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/stages?organizationId=` | `Stage[]`, ordered by `ordinal` |
| GET | `/api/cohorts?organizationId=&stageId=&academicUnitId=` | `Cohort[]`, filters optional |
| GET | `/api/cohorts/{id}` | `Cohort` |
| POST | `/api/cohorts` | `201` + new id |
| GET | `/api/cohorts/{id}/students` | `CohortStudent[]` |
| POST | `/api/cohorts/{id}/students` | `201`, body `{ studentProfileIds: string[] }` |
| DELETE | `/api/cohorts/{id}/students/{studentProfileId}` | `200` |

**POST /api/cohorts** body:

```jsonc
{
  "organizationId": "uuid",
  "academicUnitId": "uuid | null",
  "stageId": "uuid",
  "arm": "A | null",
  "sessionId": "uuid",
  "formTeacherId": "uuid | null"
}
```

## Status codes

| Code | When |
| --- | --- |
| 400 | Validation failed |
| 401 | No session |
| 403 | Not a member of that organization, or lacks the role |
| 404 | Cohort not found **in this organization** |
| 409 | A cohort with the same (unit, stage, arm, session) already exists |

> 404 rather than 403 for a cohort belonging to another organization would leak
> whether an id exists. Resolve the organization from the cohort and compare,
> never trust `organizationId` from the request body.

---

# Work split

Two halves, divided along the contract. Neither blocks the other.

## ~~Half 1 — Mock backend and contract~~ ✅ COMPLETED

~~Everything needed for the frontend to be built without a real backend.~~

- ~~Define the API contract above~~
- ~~Install and configure MSW~~
- ~~Request handlers for all seven endpoints~~
- ~~Seed data covering both institution shapes: a secondary school with
  streamed SS cohorts, and a university with levels~~
- ~~Wire MSW into dev mode and into Vitest, behind a flag so it is off by
  default and deletable in one commit~~

**Verified:** `tsc -b --noEmit` and `eslint` both pass with zero errors.

> **If dependencies appear to be missing, check `NODE_ENV` first.** With
> `NODE_ENV=production` set, npm omits every devDependency — `@types/react`,
> `msw`, `vitest`, and the types behind `"types": ["vite/client"]` in
> tsconfig.app.json. Nothing errors; npm reports success having installed half
> of what you asked for, and the symptoms look like a broken tsconfig or a
> corrupted node_modules.
>
> Fix: clear `NODE_ENV`, or `NODE_ENV=development npm install --include=dev`.

## Half 2 — Cohort UI — **for the other AI**

Screens consuming the contract. Built against the mock, works unchanged
against the real backend.

- [ ] Cohort list page — grouped by stage, showing `displayName`, form
      teacher and `studentCount`
- [ ] Cohort detail page — the drill-down: students with admission numbers
      and status, form teacher, and the academic unit path
- [ ] Create-cohort modal — stage picker, optional unit, optional arm.
      Reuse the existing `Modal` component; do not build a second one
- [ ] Add and remove students from a cohort
- [ ] Vitest tests against the MSW handlers
- [ ] Route registration and a nav entry

**Where the mock lives:** `src/mocks/` — `handlers.ts` has the seven
endpoints, `data.ts` has the seed data. Change the seed data freely; leave
the response *shapes* alone, because those are the contract.

**Enabling it:** set `VITE_USE_MOCKS=true` in `.env.local`, then `npm run dev`.
It is off without that flag, so it can never reach production by accident.

## Deleting the mock

When the backend ships:

1. `npm run openapi-ts` against the real API
2. Confirm the generated types match the contract above
3. Delete `src/mocks/` and the MSW block in `main.tsx`
4. Remove `msw` from `package.json`

No component changes. If any are needed, the contract drifted and that is the
thing to fix.
