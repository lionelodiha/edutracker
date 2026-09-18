# Adopting a University Structure

How universities are actually organised, what their platforms record, and what
EduTracker would need to change to match.

Date: 2026-09-18
Status: **Structural blueprint. Nothing here is a commitment to build.**

The purpose of this document is to give you one clear picture of the target shape,
and an honest account of the distance between it and the code as it stands today.

---

## The finding first

**EduTracker is currently modelled as a secondary school, not a university.** The
department bug you hit is not an isolated defect. It is the first place the mismatch
became visible.

Four pieces of evidence from the code:

| Evidence | What it tells us |
| --- | --- |
| `AcademicLimits.MaxTermNumber = 3` | Three terms per year is the secondary school calendar. Universities run **two semesters**, occasionally a third for resits. |
| `Course` has no credit units and no department | A university course without credit units cannot produce a GPA. A course not owned by a department has no one responsible for teaching it. |
| `Faculty` has an entity but **zero endpoints** | Somebody knew universities need faculties and stopped there. It is a vestigial layer, which is exactly why Create Department fails. |
| `School_API_Requirements.md` says "classes, rosters, assignments, grades" | That is the K-12 vocabulary. A university says courses, registration, continuous assessment, examinations, senate approval. |

Zero occurrences anywhere in the domain of: **Programme, Level, CreditUnit,
Matriculation, Prerequisite, Exam, Transcript, GPA, Designation, Dean, HOD.**

> ### Correction to my earlier advice
>
> In `FIX-DEPARTMENT-MODAL.md` I recommended **Option A — make `FacultyId`
> optional**, on the basis that the UI copy said "Organize your school into
> departments like Science, Arts".
>
> **For a university that is the wrong call.** Faculty is not optional; it is a
> mandatory tier with a Dean, a faculty board, and real authority over results.
> Take **Option B** instead: build the Faculty slice properly and make the
> department form select one. The rest of that document still stands — the stale
> SDK, the missing validator rule, the constraint handling and the whole modal fix
> are all still correct.

---

# Part 1 — How a university is structured

There are two separate hierarchies, and most systems get into trouble by trying to
force them into one tree. Keep them apart.

## 1.1 The organisational spine — who is responsible

```
University
└── Faculty / College                    e.g. Faculty of Engineering
    │   Dean — a senior academic, appointed for a fixed tenure
    │
    └── Department                       e.g. Computer Engineering
        │   Head of Department (HOD) — fixed tenure, usually 2–4 years
        │   Exam Officer, Level Advisers
        │
        ├── Programme                    e.g. B.Eng Computer Engineering (5 years)
        │                                     M.Sc Computer Engineering
        │                                     Ph.D Computer Engineering
        │
        ├── Academic staff               Professor ... Graduate Assistant
        │
        └── Courses owned                CPE 301, CPE 302, CPE 411 ...
```

Your example maps exactly onto this. **Faculty of Engineering** contains the
departments **Computer Engineering, Civil, Electrical, Chemical, Mechanical,
Biomedical**. Each department has its own staff and its own students.

### The distinction that matters most

**A student is admitted into a _Programme_, not into a Department.** The programme
belongs to a department, but the programme is the thing with a duration, a
curriculum and a degree at the end. A department can run several: a B.Eng, an M.Sc
and a Ph.D in the same subject are three programmes with different rules.

And students sit at a **Level** — 100, 200, 300, 400, 500 — which is not a year of
enrolment. A student who fails enough units repeats the level. Level is *computed*
from units passed, not set by hand.

## 1.2 The academic spine — what is taught, when

```
Session                                  2026/2027
└── Semester                             First, Second   (TWO, not three terms)
    └── Course Offering                  CPE 301 as offered in First Semester 2026/2027
        │   Course coordinator (a lecturer)
        │   Teaching lecturers (can be several)
        │   Venue, timetable slot
        │
        ├── Course Registration          the students who signed up, per student
        │
        └── Teaching Events              individual lectures, labs, tutorials
                                         ← attendance and delivery tracking live HERE
```

## 1.3 The relationship that breaks naive models

**A course is owned by one department but taken by students from many.** Three cases
you must support, and the current model supports none of them cleanly:

- **Departmental course.** CPE 301 is owned by Computer Engineering and taken
  mostly by its own students.
- **Service course.** MTH 101 is owned by Mathematics but taken by *every*
  engineering student in 100 level. The Maths department teaches it; the Engineering
  faculty depends on it.
- **General Studies.** GST 101 (Use of English) is taken by literally every student
  in the university, across all faculties, in their first year.

So the link from student to course is **not** through the department tree. It is
through **course registration**, which is its own record. That is why registration
has to be a first-class entity and not a join table you bolt on later.

## 1.4 Curriculum — what makes registration possible

Each programme has a curriculum: which courses are required, at which level, in
which semester, and how many units.

```
B.Eng Computer Engineering › 300 Level › First Semester
  CPE 301  Digital Systems Design       3 units   Core
  CPE 303  Data Structures              3 units   Core
  CPE 305  Circuit Theory               2 units   Core
  MTH 301  Engineering Mathematics III  3 units   Core     (owned by Mathematics)
  GST 301  Entrepreneurship             2 units   General
  CPE 307  Elective from list B         3 units   Elective
                                       ─────────
                                       16 units
```

With a curriculum, registration becomes: the system proposes the student's courses,
the student adjusts electives and carry-overs, the level adviser approves. Without
one, every student picks from a flat list of every course in the university, and
nobody can tell whether they are on track to graduate.

**Credit load rules** sit alongside it: a minimum and maximum unit load per semester,
commonly around 15 minimum and 24 maximum. Carry-over courses are registered first
and count toward the maximum, which is why a student with many failures cannot take
a full load of new courses.

---

# Part 2 — What university platforms actually record

You asked about four things specifically. Taking each in turn.

## 2.1 Staff records

The core record holds: **staff number**, appointment type (full-time, part-time,
adjunct, visiting, sabbatical), **designation**, department, faculty, date of first
appointment, date of last promotion, and highest qualification.

The academic rank ladder, in ascending order:

```
Graduate Assistant → Assistant Lecturer → Lecturer II → Lecturer I
  → Senior Lecturer → Reader / Associate Professor → Professor
```

Non-academic staff (technologists, administrative officers, laboratory staff) sit on
a separate ladder entirely and are usually a different record type.

### The modelling point that matters

**Rank and office are two different things, and the current model conflates them.**

- **Rank** (Senior Lecturer) is a property of the person's employment. It changes
  rarely, through promotion, and it persists.
- **Office** (Head of Department, Dean, Exam Officer, Level Adviser for 300L) is a
  *time-bounded appointment*. A person is HOD of Computer Engineering from
  2024-08-01 to 2026-07-31, and then someone else is.

A single person commonly holds several at once: a Professor who is also Dean of
Engineering and also coordinates a postgraduate course.

Today `OrganizationMember` has one flat `Role` enum and one optional `DepartmentId`,
so a person can hold exactly one role with no start or end date. That cannot express
"Dr. Okafor was HOD last session, is now Dean, and still teaches CPE 401."

## 2.2 Staff attendance — and whether lecturers actually teach

This is two different questions that platforms deliberately keep separate.

### (a) Presence at work

Clock-in and clock-out, usually biometric (fingerprint) or card, sometimes
geofenced mobile. It answers "was this person on campus". It is an HR concern and it
feeds payroll and leave.

### (b) Lecture delivery — the one that actually matters

Presence on campus does not tell you whether the 8am lecture happened. Delivery
tracking attaches a record to each **scheduled teaching event**:

| Field | Example |
| --- | --- |
| Scheduled event | CPE 301, Lecture, Mon 08:00–10:00, LT2 |
| Status | Held / Cancelled / Rescheduled / Not held |
| Delivered by | which lecturer actually took it (may differ from the assigned one) |
| Topic covered | "Sequential circuits: flip-flops and latches" |
| Syllabus item | maps to a numbered item in the approved course outline |
| Duration actually taught | 90 of 120 scheduled minutes |
| Confirmed by | students signing attendance doubles as evidence the class happened |

From that you get the numbers institutions are actually judged on:

- **Syllabus coverage** — what percentage of the approved course outline was
  delivered by end of semester. Accreditation bodies ask for this.
- **Delivery rate per lecturer** — scheduled versus held.
- **Contact hours delivered** — required for credit-unit justification.

> **Design it carefully or it becomes a surveillance tool.** Lecturers will resist a
> system that exists to catch them, and resisted systems get filled with garbage
> data. The framing that works is course coverage: the department needs to know the
> syllabus was taught so students are not examined on material never delivered. Make
> the lecturer the primary consumer of their own data, not the subject of it.

## 2.3 Student records

The identity record holds:

- **Matriculation number**, usually structured and meaningful. A common pattern is
  `20/ENG/CPE/001` — entry year / faculty / department / serial. It is the primary
  human-facing key for the student's entire life in the institution.
- **Programme** and **current level**
- **Entry session** and **mode of entry** — UTME, Direct Entry (starts at 200 level),
  Transfer, Inter-university
- **Status** — Active, Deferred, Suspended, Rusticated, Withdrawn, Graduated, or on
  industrial attachment (SIWES, typically a full semester in 400 level for
  engineering)
- **Level adviser**, next of kin, sponsor

Then per semester: registration, results, GPA, and fee payment status. Most
institutions gate registration on fees being cleared, which is why the bursary
integration is not optional in practice.

**Progression is computed.** A student advances 100→200 by passing a threshold of
units. Fail too many and they repeat the level, carrying failed courses forward.

## 2.4 Tests and examinations

This is where the university model differs most sharply from the K-12 "assignments
and grades" shape currently in the codebase.

### The assessment split

A course mark is split, with the ratio fixed by the institution:

```
Continuous Assessment (CA)     30% or 40%
  ├── Tests (usually 2 per semester)
  ├── Assignments
  ├── Laboratory / practical work
  └── sometimes attendance itself

Examination                    70% or 60%
  └── One paper, in an exam hall, at the end of the semester
```

### The attendance gate

**Commonly 75% attendance is required to be eligible to sit the examination.** This
is a hard rule, it is enforced, and it is the single strongest reason a university
cares about accurate attendance data. A student below the threshold is barred, and
the result is recorded as absent rather than failed.

This makes attendance a *blocking prerequisite* in the assessment flow, not a
reporting nicety.

### Grading and GPA

Marks convert to letter grades with grade points. The common five-point scale:

| Mark | Grade | Points |
| --- | --- | --- |
| 70–100 | A | 5 |
| 60–69 | B | 4 |
| 50–59 | C | 3 |
| 45–49 | D | 2 |
| 40–44 | E | 1 |
| 0–39 | F | 0 |

GPA is **credit-weighted**, which is why credit units are not optional:

```
GPA  = Σ(grade point × credit units) / Σ(credit units)     for one semester
CGPA = the same, accumulated across all semesters
```

Degree classification comes from the final CGPA — First Class, Second Class Upper
(2:1), Second Class Lower (2:2), Third Class, Pass.

> **Do not hardcode any of these numbers.** Scales vary between institutions and
> countries: some use a four-point scale, the mark boundaries differ, the CA/exam
> split differs, the attendance threshold differs, and the class-of-degree cutoffs
> differ. Make the whole grading scheme a **per-organization configuration** that an
> administrator sets once. This is both correct and, commercially, what lets you
> sell to the second university without a code change.

### Carry-over

Fail a course and you retake it in a later session. The failure stays on the
transcript and both attempts appear. Whether the original grade still counts toward
CGPA varies by institution — another thing to make configurable.

### Result approval is a workflow, not a boolean

This is the part most systems underestimate. Results move through stages:

```
Lecturer enters scores
    ↓  submits
Departmental Board reviews          HOD and department academic staff
    ↓  approves
Faculty Board reviews               Dean and faculty representatives
    ↓  approves
Senate approves                     the university's final academic authority
    ↓  releases
Students can see results
```

**Students see nothing until Senate approval.** At each stage results can be sent
back for correction, and after release a change requires a formal amendment with a
reason recorded.

In the feature roadmap I described a simple `IsPublished` boolean on assignments.
For a university that is not enough — it needs to be a state machine with an
approval record at each stage, naming who approved and when. The audit trail here is
not optional; it is the mechanism that makes a degree certificate defensible.

---

# Part 3 — Gap analysis

What exists today, against what a university needs.

| Concept | University needs | EduTracker today | Gap |
| --- | --- | --- | --- |
| Faculty | Mandatory tier, has a Dean and a board | Entity + DbSet only, **no endpoints** | Build the slice |
| Department | Belongs to faculty, has HOD | Exists, creation **broken** | Fix + require faculty |
| Programme | Student is admitted into one | **Does not exist** | New |
| Level (100–500) | Computed from units passed | **Does not exist** | New |
| Curriculum | Courses per programme per level | **Does not exist** | New |
| Course | Owned by a department, carries **credit units** | Flat under organization, **no units, no department** | Rework |
| Course type | Core / Elective / General Studies | **Does not exist** | New |
| Prerequisites | Gate registration | **Does not exist** | New |
| Session / Semester | Two semesters per session | Semester → Term, **max 3 terms** | Rework the calendar |
| Course registration | Per student per semester, with unit limits | **Empty folder** | New |
| Student record | Matric number, programme, level, status, mode of entry | Only `OrganizationMember` with `Role = Student` | New |
| Staff record | Staff number, rank, appointment type | Only `OrganizationMember` with `Role = Teacher` | New |
| Office / appointment | HOD, Dean, Exam Officer — **time-bounded** | One flat role, no dates | Rework |
| Teaching event | Individual lecture/lab, timetabled | `Class` has a code and capacity only | Rework |
| Lecture delivery | Held? Topic? Coverage? | **Does not exist** | New |
| Student attendance | Feeds the 75% exam gate | **Empty folder** | New |
| CA / Exam split | Configurable ratio | **Empty folder** | New |
| Grading scale | Per-organization configuration | **Does not exist** | New |
| GPA / CGPA | Credit-weighted | **Does not exist** | New |
| Result approval | Multi-stage to Senate | **Does not exist** | New |
| Transcript | Official, versioned | **Does not exist** | New |

Be clear-eyed about what that table says: **this is not an extension of the current
model, it is a different model.** The organisation, membership, invite, session and
auth layers are sound and carry over unchanged. The academic layer is built for a
different institution type.

---

# Part 4 — How to adopt it

The order below is chosen so that each stage is usable on its own, and so that
nothing gets built twice.

## Stage 1 — Fix the spine (this is the cheap, high-value part)

Everything else depends on these four. None is individually large.

**1. Build the Faculty slice.** Follow the eleven steps in `FEATURE-ROADMAP.md`.
The entity, configuration and DbSet already exist, so this is steps 6 through 11
only. This alone unblocks Create Department.

**2. Make Department require a Faculty,** and fix the unique index to
`(FacultyId, Name)` — which is the *correct* scope for a university, because two
faculties can legitimately each have a "Department of Computer Science".

**3. Give Course what it needs.**

```csharp
// Course gains:
Guid DepartmentId          // owned by a department — service courses work fine,
                           // because ownership is separate from who registers
int CreditUnits            // without this there is no GPA
int Level                  // 100, 200, 300... the level it is normally taken at
CourseType Type            // Core, Elective, GeneralStudies
```

**4. Fix the calendar.** `MaxTermNumber = 3` is a secondary school year. A
university session has two semesters. Either rename `Term` to `Semester` and
`Semester` to `Session`, or keep the names and change the limit to 2 with a comment
explaining the mapping. **Renaming is cleaner and the vocabulary mismatch will
otherwise confuse every developer who joins.**

## Stage 2 — Split the person from the role

This is the most important structural change, and it is what the current
`OrganizationMember` cannot express.

```
User                      the person. Global. One login. Unchanged.
  │
  ├── StaffRecord         staff number, rank, appointment type, department,
  │                       date of first appointment
  │
  └── StudentRecord       matric number, programme, level, entry session,
                          mode of entry, status

Appointment               a time-bounded office held by a staff member:
                          { StaffId, Office, ScopeType, ScopeId, StartDate, EndDate }

                          Office:     HOD | Dean | ExamOfficer | LevelAdviser |
                                      CourseCoordinator
                          ScopeType:  Faculty | Department | Programme | Level
```

Then "who is the Dean of Engineering today" is a query with a date filter, the
history is preserved automatically, and a person can hold three offices at once
without the model fighting you.

Authorisation then asks: *does this user hold an active appointment as HOD scoped to
this department?* That is a cleaner and more auditable question than the current flat
role check, and it is the one a university actually needs.

Keep `OrganizationMember` as the membership and login-role record. Add
`StaffRecord` and `StudentRecord` beside it rather than replacing it.

## Stage 3 — Programme, curriculum, registration

- `Programme` under a department, with a duration and a degree awarded
- `CurriculumEntry` — programme + level + semester + course + compulsory flag
- `CourseRegistration` — student + course offering + session, with unit-load
  validation and prerequisite checking

Registration is the point at which the system becomes genuinely useful to students,
and it is not achievable before Stage 1 and 2 are done.

## Stage 4 — Delivery and attendance

- `TeachingEvent` — a timetabled lecture, lab or tutorial belonging to a course
  offering, with a venue and a slot
- `DeliveryRecord` — held/cancelled, topic covered, actual duration, delivering
  lecturer
- `AttendanceRecord` — student presence at a teaching event, which then feeds the
  eligibility gate

Note this changes the design in `FEATURE-ROADMAP.md` Build 02. Attendance attaches
to a **teaching event**, not to a class on a date, because a university course has
several contact sessions per week of different types.

## Stage 5 — Assessment and results

- Per-organization `GradingScheme` configuration: mark boundaries, grade points,
  CA/exam ratio, attendance threshold, class-of-degree cutoffs
- `AssessmentComponent` — the CA items and the exam, with weights
- `ScoreEntry` — raw marks per student per component
- `ResultSheet` with the approval state machine through to Senate
- GPA and CGPA computed from credit units and grade points
- Transcript generation, snapshotted so a reissue matches what was originally issued

---

## What this costs, honestly

Stage 1 is days. Stages 2 through 5 are months, not weeks, and Stage 5 in particular
carries real institutional risk because a wrong CGPA is a wrong degree.

Two things follow from that.

**Do Stage 1 now regardless.** Faculty endpoints, department under faculty, credit
units on courses, and the calendar fix are cheap, they fix the bug you hit, and
every path forward needs them. Nothing in Stage 1 is wasted even if you later decide
to stay with secondary schools.

**Decide the market before Stage 2.** A secondary school and a university are
genuinely different products. Trying to serve both from one model produces something
that fits neither — a school does not want credit units and a university cannot work
without them. The current codebase is halfway between the two, and the department
bug is what that looks like from the outside.

If the answer is universities, the vocabulary should change with it: `School_API_Requirements.md`,
the "School Administration Dashboard" heading, and the K-12 language throughout the
UI all need to follow, or the product will keep pulling back toward the wrong shape.

## One thing to verify before building

The specifics in Part 2 — grading scales, the 75% attendance threshold, the CA/exam
ratio, degree classification boundaries, and the Senate approval chain — follow the
common Commonwealth and Nigerian university pattern. They are broadly standard, but
**every institution varies**, and some vary a lot.

Before committing any of it to a schema, sit with one real university's academic
regulations, or one registrar, and confirm. Then build the parts that vary as
configuration rather than as code. That single decision is what determines whether
your second customer is a two-week integration or a six-month rewrite.
