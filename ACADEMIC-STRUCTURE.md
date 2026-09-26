# Academic Structure — Build Plan

> Build instructions. Nothing here is implemented yet.
> Page: `/dashboard/organizations/:id/structure` (`src/pages/organization/AcademicStructurePage.tsx`)

## Where this fits

Academic Structure is the **foundation** for everything that comes after. The roadmap:

```
1. Academic Structure   ← THIS DOCUMENT
   what the school is made of, and what runs in each session
2. Lecturer pages       a lecturer sees the course offerings assigned to them
3. Student pages        a student sees the course offerings they are registered on
4. Assessment           In-course (Tests, Assignments) + Exam → lecturer uploads →
                        student sees result → department/faculty keep the session record
```

Steps 2–4 are **not** built now. But this document designs the structure so they
plug in without rework. The one idea that makes that possible:

> **Every record — attendance, test, assignment, exam score — hangs off a
> _Course Offering_: one course, in one term/semester, of one session, taught by
> one lecturer.**
>
> That is "the lecturer handling the course for that particular ID and time."
> It is also how the department later answers "what did students do in CSC 201
> in 2026/2027, first semester?"

The backend already has this chain, so we extend it rather than invent it:

```
Semester (= a session, e.g. 2026/2027)      Domain/Entities/Academics/Semester.cs
  └─ Term (ordinal 1..n)                     Term.cs
       └─ CourseOffering (Term × Course)     CourseOffering.cs
            └─ Class (section, InstructorId) Class.cs
```

---

## The model: two layers

How real schools (PeopleSoft, Banner, PowerSchool, SIMS/Arbor, Nigerian university
and secondary portals) organise this:

```
PERMANENT LAYER — set up once, rarely changes
  University: Faculty → Department (its own length and levels, e.g. 100L–500L)
  Secondary:  Section (Junior/Senior) → Class (JSS1–SS3) → Arms (A, B, C)
  Course catalogue: every course/subject the school can teach

TIME LAYER — repeats every session, kept forever as history
  Session 2025/2026   closed (read-only history)
  Session 2026/2027   CURRENT
    ├─ First semester / Term 1   closed
    └─ Second semester / Term 2  current
         └─ Course Offerings: which courses run, for which level, taught by whom
  Session 2027/2028   being prepared
```

Rules:
- **The permanent layer is never rebuilt per session.** Creating a session does not
  touch faculties or departments.
- **A session copies its setup from the previous one** ("Prepare next session"), so
  nobody retypes 200 course offerings every year.
- **Closed sessions are read-only.** Their offerings and (later) scores are the
  history that transcripts and report cards come from.
- **Exactly one session is current**, and inside it exactly one term/semester is current.

---

## Scaling: never show the whole school at once

A big Nigerian university has ~15–20 faculties and ~100+ departments (UNILAG: 19
faculties). Nobody has 100 faculties, but the tree can still be large. The page stays
small because:

1. **Drill down, never expand.** Each screen shows **one level only**. Clicking a
   faculty opens a new page with its departments; clicking a department opens its
   own page. Nothing expands in place, so 19 faculties is 19 cards, not a page that
   keeps growing. Breadcrumbs take you back up.
2. **Counts, not lists.** Each card shows a summary:
   `Engineering · 4 departments · 1,240 students`.
3. **Search first.** A search box on the faculties page finds any department or
   course by name or code and jumps straight to its page.
4. **Levels are tabs, not a column.** A department page shows one level at a time
   (`[100L] [200L] [300L] …`), never every level stacked on one screen.
5. **Scope by role (later, with the lecturer/student pages).** A Dean lands on their
   faculty page, an HOD on their department page, a lecturer on their offerings.
   Because every level is its own URL, scoping is just a different landing page.
6. **Paginate lists over 50 items** (course catalogue, offerings).

---

## Page layout

Three tabs, each worded for the school's model (`setup.model`):

```
Academic Structure
[ Structure ]  [ Sessions ]  [ Curriculum ]              Session: 2026/2027 ▾
```

The session picker in the header applies to the **Curriculum** tab. It defaults to
the current session. Structure is session-independent.

### Tab 1 — Structure (permanent layer)

**Replaces the current Foundation editor.** Do not extend `SchoolStructureEditor`:
it renders everything on one growing page. Build new pages instead (you can reuse its
`schoolSetup.ts` model types while the backend catches up).

The structure is **three screens you click through**, each with its own URL:

```
/structure                                   Screen A — Faculties
/structure/faculties/:facultyId              Screen B — one faculty's departments
/structure/departments/:departmentId         Screen C — one department's page
```

Breadcrumb on B and C: `Academic Structure / Engineering / Computer Engineering`.

#### Screen A — Faculties

```
Academic Structure
[ Search departments or courses… ]                          [ + New faculty ]

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ ENG              │ │ SCI              │ │ SSC              │ │ MED              │
│ Engineering      │ │ Sciences         │ │ Social Sciences  │ │ Clinical Sciences│
│ 4 departments    │ │ 6 departments    │ │ 5 departments    │ │ 2 departments    │
│ 1,240 students   │ │ 2,030 students   │ │ 1,610 students   │ │ 480 students     │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

- A grid of faculty cards only: code, name, department count, student count
  (student count shows `—` until student records exist).
- Clicking a card opens Screen B. There is no dropdown or expanding row.
- **+ New faculty** opens a small modal: name, code (max 6, uppercase), description,
  Dean (optional, pick from staff — can be set later).
- Empty state: "Start by creating your first faculty" with the button.
- Search results show departments and courses as a flat list; clicking one opens
  its page.

#### Screen B — A faculty

```
Academic Structure / Engineering                     [ ⋯ Edit faculty ] [ + New department ]

Engineering · Dean: Prof. A. Bello
4 departments · 38 lecturers · 1,240 students

┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│ CPE                      │ │ CVE                      │ │ EEE                      │
│ Computer Engineering     │ │ Civil Engineering        │ │ Electrical Engineering   │
│ B.Eng · 5 years          │ │ B.Eng · 5 years          │ │ B.Eng · 5 years          │
│ 100L – 500L              │ │ 100L – 500L              │ │ 100L – 500L              │
│ 310 students · 9 lect.   │ │ 280 students · 8 lect.   │ │ 350 students · 11 lect.  │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```

- Header with faculty name, Dean, and totals across its departments.
- Grid of department cards: code, name, award and duration, level range, students,
  lecturers. Clicking opens Screen C.
- **+ New department** opens the department form (below).
- `⋯ Edit faculty`: rename, code, Dean, archive.

#### The "New department" form

A department is a course of study with its own length and entry rules. Durations
differ (4 years, 5 years, medicine 6 years + a house job, a 1-year programme), so the
form asks for them instead of assuming 4 years.

A full page or large side panel (not a small modal), in four sections:

**1. Basics**

| Field | Example | Notes |
|---|---|---|
| Faculty | Engineering | Pre-filled from Screen B, read-only |
| Department name | Computer Engineering | required |
| Code | CPE | max 6, uppercase, unique in the school; used in course codes and matric numbers |
| Award | B.Eng | select: B.Sc, B.Eng, B.A., LL.B, MBBS, B.Ed, HND, ND, Certificate, Other (free text) |
| Description | | optional |
| Head of Department | Dr. K. Eze | optional, pick from staff; can be set later |

**2. Duration and levels**

| Field | Example | Notes |
|---|---|---|
| Programme length (years) | 5 | 1–7 |
| Levels | 100L, 200L, 300L, 400L, 500L | **Generated from the length**, shown as editable chips; school can rename (e.g. `Part 1…Part 5`) |
| Semesters per level | 2 | default 2; 3 for trimester schools |
| Industrial training | 300L, second semester (SIWES) | optional: pick the level + semester it replaces |
| Internship / house job after graduation | 1 year | optional; recorded, not a level |
| Direct Entry allowed | Yes, into 200L | optional: toggle + entry level |

Show a live preview underneath: `B.Eng Computer Engineering · 5 years · 100L → 500L ·
SIWES in 300L second semester · Direct Entry into 200L`.

**3. Admission**

| Field | Example | Notes |
|---|---|---|
| Maximum intake per session | 120 | required; later used to show how full each 100L intake is |
| Minimum UTME score | 200 | optional |
| Required UTME subjects | English, Maths, Physics, Chemistry | multi-select |
| O'Level requirement | 5 credits incl. English, Maths, Physics, Chemistry | free text, or credits count + subject list |
| Other requirements | Post-UTME screening | free text |

**4. Review and create.** Summary of all sections, then **Create department**.
After creating, land on the new department's page (Screen C) with a prompt to add
its courses.

All fields except Basics can be edited later from the department page. Changing
the length **after** the department has students only adds or archives levels at the
top; it never deletes a level that has history.

#### Screen C — A department

```
Academic Structure / Engineering / Computer Engineering            [ Edit department ]

Computer Engineering (CPE) · B.Eng · 5 years · HOD Dr. K. Eze
Session: 2026/2027 ▾

┌ Students ─┐ ┌ Lecturers ┐ ┌ Courses ──┐ ┌ 100L intake ───────┐
│   310     │ │    9      │ │    46     │ │ 112 / 120  ▓▓▓▓▓▓░ │
└───────────┘ └───────────┘ └───────────┘ └────────────────────┘

[ 100L ] [ 200L ] [ 300L ] [ 400L ] [ 500L ]         [ + Add course ]

100 Level · 64 students
  First semester                          Second semester
  CPE 101  Intro to Computing  3u  C       CPE 102  Programming I     3u  C
  MTH 101  Calculus I          3u  C       MTH 102  Calculus II       3u  C
  GST 111  Use of English      2u  C       PHY 102  Physics II        3u  E
  Total: 16 units                          Total: 18 units

[ Overview ]  [ Courses ]  [ Lecturers ]  [ Students ]  [ Admission ]
```

- **Header:** name, code, award, duration, HOD, and the session picker (defaults to
  current). Stats are for the selected session.
- **Stat cards:** students enrolled this session, lecturers in the department, courses
  in the catalogue, 100L intake against the maximum.
- **Level tabs:** one level at a time. Each shows the level's courses split by
  semester, with units, `C`ompulsory/`E`lective, and unit totals per semester.
  The SIWES semester shows as "Industrial training" instead of a course list.
- **+ Add course:** code (pre-filled with the department code, e.g. `CPE `), title,
  units, level, semester, compulsory/elective. This adds it to the department's
  catalogue **and** to that level's plan.
- **Sub-tabs:**
  - *Overview:* the numbers above, plus students per level for the session.
  - *Courses:* the full department catalogue as a searchable table.
  - *Lecturers:* staff attached to this department and their assigned courses.
  - *Students:* students per level (empty until student records exist).
  - *Admission:* the entry requirements from the form, editable.
- Results by level will come here later (see "How the later phases plug in").

#### Secondary and primary schools

Same three-screen pattern, different words:

| University | Secondary | Primary |
|---|---|---|
| Faculty | Section (Junior / Senior) | — (skip Screen A) |
| Department | Class (JSS1 … SS3), with an explicit order | Class (Primary 1–6) |
| Levels tab | Arms (A, B, C) | Arms |
| Course | Subject | Subject |
| Duration / admission form | Class capacity and arms count only | same |

#### Rules for all models

- **Archive, never delete** anything that has ever had offerings or students, or old
  sessions lose their history. Hard delete only when it has none.
- Codes are unique within the school and uppercase.
- Every screen is its own URL, so refresh and the back button work.

### Tab 2 — Sessions (time layer)

```
┌─ Sessions ──────────────────────────────────────── [ Prepare next session ] ┐
│ ● 2026/2027   CURRENT    First semester ✓ closed · Second semester ● current │
│               Sep 2026 – Jul 2027 · 212 course offerings        [ Open → ]   │
│ ○ 2025/2026   Closed     2 semesters · 198 course offerings     [ View → ]   │
│ ○ 2024/2025   Closed     2 semesters · 190 course offerings     [ View → ]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Newest first. Current session highlighted. Closed sessions open read-only.
- Each session lists its terms (secondary: 3 terms) or semesters (university: 2),
  with start/end dates and status: `Upcoming → Current → Closed`.
- Actions on the current term: **Close term** (confirm dialog; later this also
  locks scores) and **Make next term current**.

**"Prepare next session" wizard** (the rollover):
1. **Name and dates.** Defaults to next year (`2027/2028`) and the same term pattern.
2. **Copy setup.** Checkboxes: course offerings ✓, lecturer assignments ✓,
   class arms ✓. Everything is copied from the current session.
3. **Review.** "212 offerings will be created, 180 with a lecturer already assigned."
4. **Create.** The new session starts as **Upcoming**. It becomes current only
   when an admin clicks **Start session** (which closes the old one).
5. Student promotion is **not** part of this phase. Add a disabled step
   "Promote students — available once student records exist" so the flow is visible.

### Tab 3 — Curriculum (what runs in the selected session)

This is where a session gets its content, and the screen the lecturer and student
pages will later read from.

**University:** pick a department, then see a grid:

```
Computer Science · 2026/2027                      [ + Add course offering ]
            │ First semester                 │ Second semester
────────────┼────────────────────────────────┼───────────────────────────────
100 Level   │ CSC 101  3u  C  Dr. Ade        │ CSC 102  3u  C  Dr. Ade
            │ GST 111  2u  C  — unassigned   │ MTH 102  3u  E  Mrs. Obi
200 Level   │ CSC 201  3u  C  Mr. Kay        │ …
```

**Secondary:** rows are classes (JSS1…SS3), columns are Term 1–3, cells list
subjects with the teacher per arm.

- Each cell item is a **Course Offering**: course code, units, `C`ompulsory or
  `E`lective, and the assigned lecturer (or "unassigned" in `var(--warn)`).
- Clicking an item opens a side panel: assign/change lecturer, units, compulsory
  or elective, and (later) enrolment count.
- **Unassigned offerings are the HOD's to-do list.** Show a count at the top:
  "6 offerings have no lecturer."
- Closed sessions: grid is read-only.

**Course catalogue** is a sub-view of this tab (`Catalogue` toggle): the permanent
list of courses with code, title, units and **owning department**. Offerings are
created from catalogue entries. The existing `CoursesList` becomes this view.

---

## Data changes

### Backend (extend what exists)

| Entity | Change | Why |
|---|---|---|
| `Semester` (session) | add `EndYear`, `StartsOn`, `EndsOn`, `Status` (`Upcoming/Current/Closed`) | timeline, one current session |
| `Term` | add `Name` ("First semester"/"Term 1"), `StartsOn`, `EndsOn`, `Status` | current term, closing a term |
| `Course` | add `DepartmentId?` (owning unit), `Units` (int), `Description?` | catalogue belongs to a department; credit units |
| `CourseOffering` | add `LevelKey` (e.g. `100L`, `JSS1`), `IsCompulsory`, `LecturerUserId?` | the grid, and the anchor for all later records |
| `Class` | keep as sections of an offering (arms / lecture groups); `InstructorId` stays for per-section teachers | secondary arms, split lecture groups |
| `Faculty` | add `Code`, `DeanUserId?`, `ArchivedAt?` | faculty cards, Dean |
| `Department` | add `Code`, `Award`, `DurationYears`, `SemestersPerLevel`, `Levels[]` (ordered names), `IndustrialTraining?` (level + semester), `PostGraduationInternshipYears?`, `DirectEntryLevel?`, `MaxIntakePerSession`, `MinUtmeScore?`, `UtmeSubjects[]`, `OLevelRequirement?`, `OtherRequirements?`, `HodUserId?`, `ArchivedAt?` | the New department form; one department = one course of study for now |
| **later** `Programme` | split out of `Department` only if a school needs several awards in one department | not needed for the first build |
| **structure persistence** | move `SchoolSetup` from browser `localStorage` into the DB (units tree + stages) | today it only exists in one browser |

Constraints:
- One `Current` session per organization, one `Current` term per session
  (enforce in the domain method, plus a filtered unique index).
- Offerings in a `Closed` term/session cannot be edited.
- `CourseOffering` unique on `(TermId, CourseId, LevelKey)`.

### Endpoints

```
GET    /api/organizations/{id}/structure              units tree (supports ?rootUnitId=&depth=1)
PUT    /api/organizations/{id}/structure/units/{key}  rename / code / archive
GET    /api/organizations/{id}/sessions               with terms + offering counts
POST   /api/organizations/{id}/sessions/prepare       rollover: { fromSessionId, name, dates, copy: {...} }
POST   /api/sessions/{id}/start                       make current, close previous
POST   /api/terms/{id}/close
GET    /api/sessions/{id}/offerings?departmentId=&level=&termId=
POST   /api/sessions/{id}/offerings
PATCH  /api/offerings/{id}                            lecturer, units, compulsory
GET    /api/organizations/{id}/courses?departmentId=&q=&page=
```

Follow `BUILD-SPEC.md` §8 conventions (error ids, status codes, org scoping from
the route, never from the body).

### Frontend first, against the mock

Same approach as the cohort work: build the UI against MSW mocks in `src/mocks/`
with the response shapes above, so the frontend doesn't wait on the backend.
Put the types in `src/features/academics/types.ts` and treat them as the contract.
When the backend ships, regenerate with `npm run openapi-ts` and delete the mocks.

---

## How the later phases plug in (for reference, not to build now)

| Phase | Reads | Adds |
|---|---|---|
| Lecturer pages | offerings where `LecturerUserId = me`, current session | attendance per offering |
| Student pages | offerings the student is registered on | `Registration (StudentId, OfferingId)` |
| Assessment | offering | `AssessmentComponent` per offering or school default: **In-course** → Tests, Assignments; **Exam**. Weights set by the school (e.g. in-course 30 / exam 70). `Score (StudentId, ComponentId, Mark)` |
| Results flow | offering + scores | Lecturer uploads → HOD approves → (university: faculty board → Senate) → **published** → student sees it |
| Department record | all offerings in a department for a session | read-only views and exports per session/course |

Because all of these key on `CourseOffering`, **nothing in the structure needs to change
when they arrive**. That is the test of whether this phase is designed right.

---

## Build order

1. **Contract + mocks:** types, MSW handlers and fixture data for structure, sessions,
   offerings, catalogue. Tests like `cohortApi.test.ts`.
2. **Page shell:** three tabs, session picker, per-model wording. Keep `?tab=`
   deep-linkable (`/structure?tab=curriculum&session=…`).
3. **Structure screens:** A (faculty cards + New faculty modal), B (department cards),
   the New department form, then C (department page with level tabs and Add course).
   Retire `SchoolStructureEditor` from this page once A–C work.
4. **Sessions tab:** timeline, term status, close term, start session.
5. **Prepare-next-session wizard.**
6. **Curriculum tab:** grid, offering side panel, unassigned count, catalogue view.
7. **Backend:** entity changes + migration, endpoints, then swap the mocks out.

## Verification

- [ ] A new school with no structure sees a guided empty state on Structure, not a blank tree.
- [ ] 20 faculties show as 20 cards on Screen A; no departments render until a faculty is opened.
- [ ] Faculty → department → back via breadcrumb works, and refresh keeps you on the same screen.
- [ ] New department with length 5 generates 100L–500L; length 6 generates 100L–600L; SIWES and Direct Entry show in the preview.
- [ ] Department page shows one level tab at a time with semester unit totals.
- [ ] Search for a course code opens its department page.
- [ ] Only one session can be Current. Starting a new one closes the old one.
- [ ] Prepare next session copies offerings and lecturers; counts match the review step.
- [ ] Closed session: curriculum grid is read-only, no edit controls render.
- [ ] Curriculum grid shows unassigned offerings in warn colour and counts them.
- [ ] Secondary school sees Classes/Arms/Terms wording; university sees Faculties/Levels/Semesters.
- [ ] Refresh keeps the selected tab and session (URL, not local state).
- [ ] `npm run build` and the mock API tests pass.

Delete this file once the checklist passes.
