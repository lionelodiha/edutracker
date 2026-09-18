# Build Specification — People, Roles and Tracking

The authoritative build document. Written for the developer who implements this,
not for the person who commissioned it.

Date: 2026-09-18
Status: **Specification. Review before building.**

Read `COHORT-MODEL.md` first if any decision here looks arbitrary — it explains why
one structure can serve primary, secondary and university, and why the missing
"cohort" concept is the root of most of what follows. `DELIVERY-PLAYBOOK.md` covers
the testing and CI work that Phase 5 depends on.

This document is self-contained: everything needed to build is here.

---

## Contents

1. [The problem this solves](#1-the-problem-this-solves)
2. [The person model](#2-the-person-model)
3. [Offices and appointments](#3-offices-and-appointments)
4. [Who tracks whom](#4-who-tracks-whom)
5. [Permissions by scope](#5-permissions-by-scope)
6. [Complete entity catalogue](#6-complete-entity-catalogue)
7. [Build phases](#7-build-phases)
8. [Conventions every slice follows](#8-conventions-every-slice-follows)
9. [Open decisions](#9-open-decisions)

---

## 1. The problem this solves

Today a person in EduTracker is an `OrganizationMember` with one value from a flat
enum: `Owner, Moderator, Member, Admin, Teacher, Student`.

That cannot express any of the following, all of which are ordinary:

- Mrs. Adeyemi is a **Teacher**, and also **Form Teacher of SS 2 Science A**, and
  also **HOD of the Science department**. Three facts, one row, one enum slot.
- Dr. Okafor was **HOD of Computer Engineering** until July, and is **Dean of
  Engineering** from August. The system has no dates, so the history is lost the
  moment it changes.
- The **Principal** needs to see every teacher's delivery record. The **HOD** needs
  to see only their own department's. Both are "staff with authority", and the enum
  has one word for that.
- A **student** has an admission number, a cohort, a guardian and an entry mode.
  A **teacher** has a staff number, a rank and a date of appointment. Neither set of
  fields exists.

The fix is three separate ideas that are currently collapsed into one:

| Idea | Question it answers | Changes |
| --- | --- | --- |
| **Membership** | Does this person belong to this institution? | Rarely |
| **Profile** | What kind of member — staff or student — and what are their details? | Rarely |
| **Appointment** | What office do they hold, over what, and between which dates? | Often |

---

## 2. The person model

```
User                        the person. Global identity, one login.
  │                         EXISTS — no change
  │
OrganizationMember          membership of one institution
  │                         EXISTS — simplify the Role enum (see 2.1)
  │
  ├── StaffProfile          NEW — one per member who works here
  └── StudentProfile        NEW — one per member who studies here

Appointment                 NEW — time-bounded office, scoped
```

A member has **at most one** of `StaffProfile` / `StudentProfile`. Not both.

> **Why not put everything on `OrganizationMember`?** A staff profile carries about
> twelve fields a student never has, and a student profile about ten a staff member
> never has. One table means half the columns are always null, no column can be made
> required, and the validation rules have to branch on the role. Two tables let the
> database enforce what is actually required for each.

### 2.1 Change `OrganizationMemberRole`

Reduce it to what it actually decides: **what this person is here for.**

```csharp
public enum OrganizationMemberRole
{
    Staff   = 0,   // has a StaffProfile
    Student = 1,   // has a StudentProfile
    Guardian = 2,  // linked to students, no profile of their own
}
```

Authority — Owner, Admin, Moderator, HOD, Principal — moves entirely to
`Appointment`. That is the change that unlocks everything else.

> **Migration note.** Existing rows map: `Teacher` → `Staff`, `Student` → `Student`,
> `Owner`/`Moderator`/`Admin`/`Member` → `Staff` plus an `Appointment` with the
> matching office scoped to the organization. Write this as a data migration, not by
> hand.

### 2.2 `StaffProfile`

```csharp
public sealed class StaffProfile : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private StaffProfile() { }

    public StaffProfile(
        Guid organizationMemberId,
        string staffNumber,
        EmploymentType employmentType,
        Guid? academicUnitId)
    {
        OrganizationMemberId = organizationMemberId;
        StaffNumber = ValidateStaffNumber(staffNumber);
        EmploymentType = employmentType;
        AcademicUnitId = academicUnitId;
        Status = StaffStatus.Active;
        AppointedOn = DateOnly.FromDateTime(DateTime.UtcNow);

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationMemberId { get; private set; }
    public OrganizationMember OrganizationMember { get; private set; } = null!;

    public string StaffNumber { get; private set; } = string.Empty;

    // Home unit: the department a teacher belongs to. Null for staff who
    // serve the whole institution (bursar, registrar, principal).
    public Guid? AcademicUnitId { get; private set; }
    public AcademicUnit? AcademicUnit { get; private set; }

    public EmploymentType EmploymentType { get; private set; }

    // Rank is nullable because non-academic staff do not sit on the academic
    // ladder at all. Do not force a technologist to be a "Lecturer II".
    public AcademicRank? Rank { get; private set; }

    public StaffStatus Status { get; private set; }
    public DateOnly AppointedOn { get; private set; }
    public string? Qualification { get; private set; }

    public void Promote(AcademicRank rank) { /* sets Rank, UpdateAudit */ }
    public void TransferTo(Guid? academicUnitId) { /* ... */ }
    public void UpdateStatus(StaffStatus status) { /* ... */ }
}

public enum EmploymentType { FullTime = 0, PartTime = 1, Adjunct = 2, Visiting = 3, Contract = 4 }

public enum StaffStatus { Active = 0, OnLeave = 1, Suspended = 2, Retired = 3, Resigned = 4 }

// University ladder. A secondary school simply leaves Rank null.
public enum AcademicRank
{
    GraduateAssistant = 0, AssistantLecturer = 1, LecturerII = 2, LecturerI = 3,
    SeniorLecturer = 4, AssociateProfessor = 5, Professor = 6,
}
```

### 2.3 `StudentProfile`

```csharp
public sealed class StudentProfile : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private StudentProfile() { }

    public StudentProfile(
        Guid organizationMemberId,
        string admissionNumber,
        Guid cohortId,
        Guid entrySessionId,
        EntryMode entryMode)
    {
        OrganizationMemberId = organizationMemberId;
        AdmissionNumber = ValidateAdmissionNumber(admissionNumber);
        CohortId = cohortId;
        EntrySessionId = entrySessionId;
        EntryMode = entryMode;
        Status = StudentStatus.Active;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationMemberId { get; private set; }
    public OrganizationMember OrganizationMember { get; private set; } = null!;

    // Matriculation number at university, admission number at school.
    // One name, because it is one thing: the student's public identifier.
    public string AdmissionNumber { get; private set; } = string.Empty;

    // Current cohort. Changes once a year on progression.
    public Guid CohortId { get; private set; }
    public Cohort Cohort { get; private set; } = null!;

    public Guid EntrySessionId { get; private set; }
    public EntryMode EntryMode { get; private set; }
    public StudentStatus Status { get; private set; }

    // Progression is an explicit, audited act, not a field somebody edits.
    public void PromoteTo(Guid cohortId)
    {
        if (CohortId == cohortId) return;
        CohortId = cohortId;
        AuditState.UpdateAudit();
    }
}

public enum EntryMode { Standard = 0, DirectEntry = 1, Transfer = 2 }

public enum StudentStatus
{
    Active = 0, Deferred = 1, Suspended = 2,
    Withdrawn = 3, Graduated = 4, OnPlacement = 5,
}
```

### 2.4 `GuardianLink`

Parents are not members of the school in the way staff and students are. Link them
explicitly.

```csharp
GuardianLink
{
    Guid Id
    Guid OrganizationId
    Guid GuardianMemberId      // OrganizationMember with Role = Guardian
    Guid StudentProfileId
    GuardianRelationship Relationship   // Parent, Guardian, Sponsor
    bool IsPrimaryContact
    bool CanViewResults        // a sponsor may pay fees but not see grades
}
```

---

## 3. Offices and appointments

This is the piece that replaces the old role enum, and the one to get right.

```csharp
public sealed class Appointment : IEntity, IAuditable
{
    public AuditState AuditState { get; private set; } = new();

    private Appointment() { }

    public Appointment(
        Guid organizationId,
        Guid staffProfileId,
        Office office,
        ScopeType scopeType,
        Guid? scopeId,
        DateOnly startDate)
    {
        OrganizationId = organizationId;
        StaffProfileId = staffProfileId;
        Office = office;
        ScopeType = scopeType;
        ScopeId = scopeId;
        StartDate = startDate;

        AuditState.UpdateAudit();
    }

    public Guid Id { get; private set; } = Guid.CreateVersion7();

    public DateTime CreatedAt => AuditState.CreatedAt;
    public DateTime UpdatedAt => AuditState.UpdatedAt;

    public Guid OrganizationId { get; private set; }
    public Guid StaffProfileId { get; private set; }
    public StaffProfile StaffProfile { get; private set; } = null!;

    public Office Office { get; private set; }

    // What the office is over. Organization scope has a null ScopeId.
    public ScopeType ScopeType { get; private set; }
    public Guid? ScopeId { get; private set; }

    public DateOnly StartDate { get; private set; }
    public DateOnly? EndDate { get; private set; }     // null = currently held

    public bool IsActiveOn(DateOnly date) =>
        date >= StartDate && (EndDate is null || date <= EndDate);

    // Ending an appointment never deletes it. "Who was HOD in 2025?" must
    // stay answerable, and a result approved by a past HOD stays valid.
    public void End(DateOnly endDate)
    {
        if (endDate < StartDate)
            throw new ArgumentException("End date cannot precede start date.", nameof(endDate));

        EndDate = endDate;
        AuditState.UpdateAudit();
    }
}

public enum ScopeType
{
    Organization = 0,   // whole institution
    AcademicUnit = 1,   // a faculty, department, programme or stream
    Cohort       = 2,   // one class or level group
    CourseOffering = 3, // one course in one semester
}

public enum Office
{
    // Institution-wide
    Proprietor      = 0,   // the account owner
    Principal       = 1,   // secondary
    ViceChancellor  = 2,   // university
    VicePrincipal   = 3,
    Registrar       = 4,
    Bursar          = 5,
    Administrator   = 6,   // general admin rights

    // Unit-scoped
    Dean            = 10,
    HeadOfDepartment = 11,
    ExamOfficer     = 12,

    // Cohort-scoped
    FormTeacher     = 20,  // secondary
    LevelAdviser    = 21,  // university

    // Course-scoped
    CourseCoordinator = 30,
    SubjectTeacher    = 31,
}
```

### Rules

- A staff member may hold **any number** of concurrent appointments.
- Ending an appointment sets `EndDate`. Never delete the row.
- An office that must be unique at a time — one HOD per department — is enforced in
  the handler, not by a unique index, because the constraint is "no two *overlapping*
  active appointments for the same office and scope". SQL cannot express that as a
  plain unique index.

```csharp
// In AppointStaffCommandHandler, before inserting:
bool alreadyHeld = await db.Appointments
    .AsNoTracking()
    .AnyAsync(a => a.Office == message.Office
                && a.ScopeType == message.ScopeType
                && a.ScopeId == message.ScopeId
                && a.StartDate <= effectiveEnd
                && (a.EndDate == null || a.EndDate >= message.StartDate),
        cancellationToken);

if (alreadyHeld && OfficeRules.IsSingleHolder(message.Office))
    throw ResponseCatalog.Appointment.OfficeAlreadyHeld.ToException();
```

---

## 4. Who tracks whom

Two directions, and they are different systems. Keep them separate.

```
         TEACHERS  ──────record──────▶  STUDENTS
    attendance, scores, conduct, comments

      MANAGEMENT  ──────record──────▶  TEACHERS
    lesson delivery, syllabus coverage, submission timeliness, presence
```

### 4.1 Teachers recording students

| Record | Entity | Written by | Notes |
| --- | --- | --- | --- |
| Presence in a lesson | `AttendanceRecord` | Subject teacher | Per teaching event, not per day. Feeds the exam-eligibility gate. |
| Assessment scores | `ScoreEntry` | Subject teacher | Per assessment component. Raw marks only. |
| Conduct and behaviour | `ConductNote` | Any teacher | Has a visibility flag — some notes are staff-only. |
| End-of-term comment | `ReportComment` | Form teacher | One per student per term. |

```csharp
AttendanceRecord
{
    Guid Id, OrganizationId
    Guid TeachingEventId      // the specific lesson
    Guid StudentProfileId
    AttendanceStatus Status   // Present | Absent | Late | Excused
    Guid RecordedBy           // StaffProfileId
    string? Note
}
// Unique index: (TeachingEventId, StudentProfileId)
```

```csharp
ConductNote
{
    Guid Id, OrganizationId
    Guid StudentProfileId
    Guid RecordedBy
    ConductCategory Category      // Commendation | Concern | Disciplinary
    string Note
    ConductVisibility Visibility  // StaffOnly | IncludeGuardian | IncludeStudent
    DateOnly OccurredOn
}
```

> **Conduct notes are permanent records about a child.** Require the author, make
> them immutable after 24 hours (amend by adding a correcting note, never by
> editing), and make `Visibility` an explicit required choice rather than a default.
> This is the table that will one day be read out in a meeting with a parent.

### 4.2 Management recording teachers

| Record | Entity | Written by | Answers |
| --- | --- | --- | --- |
| Was the lesson held | `LessonRecord` | The teacher who took it | Delivery rate, syllabus coverage |
| Presence at work | `StaffAttendance` | Clock-in device or admin | HR, payroll, leave |
| Scores submitted on time | derived from `ScoreEntry` timestamps | — | Submission timeliness |

```csharp
LessonRecord
{
    Guid Id, OrganizationId
    Guid TeachingEventId
    LessonStatus Status          // Held | Cancelled | Rescheduled | NotHeld
    Guid? DeliveredBy            // may differ from the assigned teacher
    string? TopicCovered
    Guid? SyllabusItemId         // maps to the approved scheme of work
    DateTime? StartedAt, EndedAt // actual, not scheduled
    Guid RecordedBy
}
// Unique index: (TeachingEventId)
```

This one table answers everything management asks about teaching:

- **Delivery rate** — held ÷ scheduled, per teacher, per subject, per term.
- **Syllabus coverage** — distinct `SyllabusItemId` covered ÷ total in the scheme of
  work. This is what inspectors and accreditation bodies request.
- **Punctuality** — `StartedAt` against the scheduled slot.
- **Contact time** — actual minutes taught.

> **Frame this as coverage, not surveillance.** Teachers fill in what they taught so
> the department can prove the syllabus was delivered and students are not examined
> on untaught material. Make the teacher the first consumer of their own coverage
> chart. A system teachers experience as monitoring gets filled with false data
> within one term, and then it is worse than having nothing.

### 4.3 The one screen that makes this real

For any person, one profile page assembled from the above:

```
Mrs. F. Adeyemi                              STF/2019/0043 · Full-time · Active
Science Department                           Appointed 12 Sep 2019

OFFICES HELD
  Head of Department · Science          since Aug 2025          current
  Form Teacher · SS 2 Science A         Sep 2025 – Jul 2026     current
  Form Teacher · SS 1 Science B         Sep 2024 – Jul 2025     ended

TEACHING THIS TERM
  Mathematics · SS 2 Science A          4 periods/week
  Further Maths · SS 3 Science A        3 periods/week

DELIVERY                                                     this term
  Lessons held             46 / 52                               88%
  Syllabus coverage        11 / 14 items                         79%
  Scores submitted         on time, 2 of 3 assessments
```

And for a student:

```
Chidera Okeke                                JMS/2023/0219 · SS 2 Science A
Active · Entered Sep 2023 · Standard entry

GUARDIANS
  Mrs. N. Okeke          Parent · primary contact · may view results

ATTENDANCE                                                   this term
  Present 71 · Late 4 · Absent 6 · Excused 2          88%  ✓ above 75%

ASSESSMENT                                                   this term
  Mathematics    CA 26/30   Exam 58/70    84   A
  Physics        CA 22/30   Exam pending  —    —

CONDUCT
  2 commendations · 0 concerns
```

Neither screen is possible today. Both fall straight out of the model above.

---

## 5. Permissions by scope

One rule replaces every hardcoded role check.

> **An actor may act on a target if they hold an active appointment whose scope
> contains that target.**

Scope containment, widest to narrowest:

```
Organization  ⊃  AcademicUnit (and all its descendants)  ⊃  Cohort  ⊃  Student
```

```csharp
// EduTracker.Application/Services/Authorization/ScopeResolver.cs

internal sealed class ScopeResolver(AppDbContext db)
{
    // Returns true when the actor holds any active appointment covering the target.
    public async Task<bool> CanAccessStudentAsync(
        Guid actorUserId, Guid organizationId, Guid studentProfileId,
        CancellationToken cancellationToken = default)
    {
        // A student always reaches themselves.
        // A guardian reaches their linked wards — checked separately.

        var student = await db.StudentProfiles
            .AsNoTracking()
            .Where(s => s.Id == studentProfileId)
            .Select(s => new { s.CohortId, s.Cohort.AcademicUnitId })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw ResponseCatalog.Student.NotFound.ToException();

        DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

        // All academic units on the path from the student's unit to the root.
        // Cached per request — this is hot.
        IReadOnlyList<Guid> unitPath = student.AcademicUnitId is null
            ? []
            : await GetAncestorUnitIdsAsync(student.AcademicUnitId.Value, cancellationToken);

        return await db.Appointments
            .AsNoTracking()
            .Where(a => a.OrganizationId == organizationId
                     && a.StaffProfile.OrganizationMember.UserId == actorUserId
                     && a.StartDate <= today
                     && (a.EndDate == null || a.EndDate >= today))
            .AnyAsync(a =>
                   a.ScopeType == ScopeType.Organization
                || (a.ScopeType == ScopeType.Cohort && a.ScopeId == student.CohortId)
                || (a.ScopeType == ScopeType.AcademicUnit
                    && a.ScopeId != null
                    && unitPath.Contains(a.ScopeId.Value)),
                cancellationToken);
    }
}
```

What that single method gives you, with no special cases:

| Actor | Appointment | Sees |
| --- | --- | --- |
| Principal | Organization | every student |
| Dean | AcademicUnit = Engineering | all students in all its departments |
| HOD | AcademicUnit = Computer Engineering | students in that department only |
| Form teacher | Cohort = SS 2 Science A | that class only |
| Subject teacher | CourseOffering | students registered for that course |
| Student | — | themselves |
| Guardian | — | their linked wards |

> **Cache the ancestor path.** `GetAncestorUnitIdsAsync` walks the `AcademicUnit`
> tree and runs on nearly every authenticated request. Cache it in Redis keyed by
> unit id and invalidate on any unit move. The tree changes perhaps twice a year.
> Without this you add a recursive query to every request in the system.

---

## 6. Complete entity catalogue

Everything, in dependency order. **Bold** = new.

### Already built, unchanged
`User` · `UserSession` · `Organization` · `OrganizationMember` · `OrganizationInvite` · `PortalInvite`

### Structure
| Entity | Status | Notes |
| --- | --- | --- |
| **`AcademicUnit`** | New | Replaces `Faculty` + `Department`. Self-referencing tree. |
| **`Stage`** | New | JSS 1…SS 3, or 100…500 Level. Per organization. |
| **`Cohort`** | New | (AcademicUnit?, Stage, Arm, Session). The missing concept. |
| `Session` | Rename | Currently `Semester`. |
| `Semester` | Rename | Currently `Term`. Fix `MaxTermNumber = 3` → 2. |

### People
| Entity | Status |
| --- | --- |
| **`StaffProfile`** | New |
| **`StudentProfile`** | New |
| **`GuardianLink`** | New |
| **`Appointment`** | New |

### Curriculum and teaching
| Entity | Status | Notes |
| --- | --- | --- |
| `Subject` | Rework `Course` | Add `AcademicUnitId`, `CreditUnits`, `Type`. |
| **`CurriculumEntry`** | New | (AcademicUnit?, Stage, Subject, compulsory). |
| `SubjectOffering` | Rename | Currently `CourseOffering`. |
| `TeachingSection` | Rename | Currently `Class`. Frees the word "class". |
| **`TeachingAssignment`** | New | Which staff teach which offering, in what role. |
| **`TeachingEvent`** | New | One timetabled lesson. Attendance attaches here. |
| **`Enrollment`** | New | With `Source`: Cohort \| SelfRegistered \| AdminAssigned. |

### Records
| Entity | Status |
| --- | --- |
| **`AttendanceRecord`** | New |
| **`LessonRecord`** | New |
| **`StaffAttendance`** | New |
| **`ConductNote`** | New |
| **`AssessmentComponent`** | New |
| **`ScoreEntry`** | New |
| **`GradingScheme`** | New — per organization, never hardcoded |
| **`ResultSheet`** | New — with the approval state machine |

---

## 7. Build phases

Each phase ends somewhere usable. Do not start a phase before the one above it
works.

### Phase 0 — Unblock (2–3 days)

Create Department currently returns "We encountered an unexpected error". The cause
is a chain, and each link is worth closing:

- The backend requires `Guid FacultyId`; the frontend never sends it.
- TypeScript did not catch it because the generated SDK is stale — `types.gen.ts`
  still has the three-field version of `CreateDepartmentRequest`.
- The missing field binds to `Guid.Empty`, and no validator rule rejects it.
- The insert violates the faculty foreign key, which surfaces as an unhandled 500.

1. **Regenerate the SDK**, then add a CI drift check: regenerate and
   `git diff --exit-code src/api`. That makes a breaking API change fail the build
   instead of reaching the frontend silently.
2. **Add `NotEmpty` validator rules** for every foreign-key `Guid`, and translate
   `DbUpdateException` in the middleware (see §8).
3. **Fix the modal overlay.** `rgba(0,0,0,0.25)` over a `#0a0b0f` ground barely
   darkens anything, and `.modal-overlay` and `.modal-content` both set
   `overflow-y: auto`, which is what clips the form. Use `rgba(3,5,10,0.72)`, one
   scroll container, `align-items: flex-start` with `margin: auto`, and `100dvh`
   rather than `100vh`. Extract a `Modal` component with `role="dialog"`, Escape to
   close, body scroll lock and focus-in while you are there.

**Done when:** creating a department returns a real error instead of a 500.

### Phase 1 — Structure (1 week)

4. `AcademicUnit` slice; migrate `Faculty` and `Department` rows into it.
5. `Stage` slice, seeded by organization type.
6. Add `OrganizationType` to `Organization` — Primary, Secondary, University.
7. Rename `Class` → `TeachingSection`. Pure rename, do it while the table is small.
8. Calendar rename: `Semester` → `Session`, `Term` → `Semester`, limit 3 → 2.

**Done when:** you can build Faculty of Engineering → Computer Engineering, and a
secondary school can exist without inventing a fake faculty.

### Phase 2 — Cohorts (1 week)

9. `Cohort` slice.
10. `Subject` rework: add `AcademicUnitId`, `CreditUnits`, `Type`.
11. `CurriculumEntry` slice.

**Done when:** "SS 2 Science A" and "100L Computer Engineering" both exist and list
their subjects.

### Phase 3 — People (1.5 weeks)

12. Change `OrganizationMemberRole` + data migration.
13. `StaffProfile` and `StudentProfile` slices.
14. `Appointment` slice with the overlap rule.
15. `GuardianLink` slice.
16. `ScopeResolver` + Redis caching of the ancestor path.
17. Replace every hardcoded role check in existing handlers with `ScopeResolver`.

**Done when:** the staff profile screen in §4.3 renders, and an HOD sees their
department while a form teacher sees their class.

### Phase 4 — Teaching and tracking (2 weeks)

18. `TeachingAssignment`, `TeachingEvent`, `Enrollment` (with `Source`).
19. `AttendanceRecord` + the bulk register endpoint.
20. `LessonRecord` + the delivery and coverage queries.
21. `ConductNote`.
22. `StaffAttendance`.

**Done when:** both screens in §4.3 render with real data.

### Phase 5 — Assessment (3+ weeks)

23. `GradingScheme` configuration.
24. `AssessmentComponent`, `ScoreEntry`.
25. Attendance eligibility gate.
26. `ResultSheet` with the approval workflow.
27. GPA/CGPA where credit units apply; report cards where they do not.

**Done when:** a term's results can be entered, approved and released.

> **Phase 5 carries real risk.** A wrong grade on a report card is a complaint; a
> wrong CGPA on a transcript is a wrong degree. Do not start it without the test
> coverage from `DELIVERY-PLAYBOOK.md` Stage 01 in place.

---

## 8. Conventions every slice follows

Read off the existing Departments slice, which is the most complete example in the
repo. Follow these eleven steps and a new feature is indistinguishable from the
existing ones in review.

1. **Domain entity** — `EduTracker.Domain/Entities/<Area>/`. Sealed class
   implementing `IEntity, IAuditable`, private parameterless constructor for EF,
   `Guid.CreateVersion7()` for the id, an owned `AuditState`, private setters
   throughout, static `Validate*` helpers that throw, and `Update*` methods that
   return early when nothing changed.

2. **Limits and regexes** — constants in a `*Limits` static partial class, regexes
   via `[GeneratedRegex]`. The entity, the validator and the EF configuration all
   read the same constants, which is what stops them drifting apart.

3. **DbSet** — expression-bodied property on `AppDbContext`, grouped with its area.

4. **EF configuration** — `Persistence/Configurations/<X>Configuration.cs`.
   `OwnsOne(AuditState)` with `.ToSnakeCase()` column names, max lengths from the
   limits class, the unique indexes that carry business rules, and an explicit
   `OnDelete` on every relationship.

5. **Migration**

   ```powershell
   dotnet ef migrations add <Name> `
     --project backend/EduTracker.Persistence `
     --startup-project backend/EduTracker.Api
   ```

   Read the generated file before applying it, especially any `HasFilter`, which
   emits raw SQL that EF does not validate.

6. **Response catalog** — a `ResponseCatalog.<Area>.cs` partial with
   `OperationOutcomeResponse` for successes and `OperationFailureResponse` (carrying
   an `HttpStatusCodes` value) for failures. Screaming-snake ids.

7. **Command, handler, validator** — one folder per action under
   `Features/<Area>/<Action>/`. The command is a `sealed record` implementing
   `IMessage<OperationResult<T>>` whose first parameter is always `Guid? ActorId`.
   The handler is `internal sealed` with a primary constructor taking
   `AppDbContext db`.

8. **Guard order — always this sequence:** null actor → organization exists → not
   locked → **scope check via `ScopeResolver`** → domain rule → mutate →
   `SaveChangesAsync` → catalog response. Deviating makes a handler hard to review,
   because the reviewer has to re-derive the security model each time.

9. **Routes** — an `ApiRoutes.<Area>.cs` partial with a `Base` const and one const
   per shape.

10. **Endpoint module** — `IEndpointModule` plus one static handler class and one
    request record per action. Fill in the full `WithDescription` block; this repo
    documents every response code on every endpoint and Scalar renders it.

11. **Regenerate the frontend SDK** — `npm run openapi-ts` from
    `frontend/edu-tracker` with the API running. Never hand-edit `sdk.gen.ts` or
    `types.gen.ts`; the next run discards the changes.

### The three that are most often missed

**Tenant isolation on every id in the request.** Resolve the organization *from* the
resource; never trust `OrganizationId` in the body. Note that `TeachingSection` (and
`Class` before it) has **no** `OrganizationId` column — it is four hops away:

```csharp
// Correct. Class/TeachingSection has no OrganizationId of its own.
bool belongs = await db.TeachingSections
    .AsNoTracking()
    .AnyAsync(s => s.Id == message.SectionId
                && s.SubjectOffering.Semester.Session.OrganizationId == message.OrganizationId,
        cancellationToken);
```

Only after that check may a handler stamp `message.OrganizationId` onto new rows.
Stamping it first lets a caller pair their own organization id with someone else's
section id and write into another institution's data.

**Every `Guid` used as a foreign key gets a `NotEmpty` validator rule.** A missing
JSON field binds to `Guid.Empty`, which passes validation and then fails at the
database as an unhandled 500. This is exactly how the Create Department bug
presented.

**Translate constraint violations.** Catch `DbUpdateException` with a
`PostgresException` inner in `ExceptionHandlingMiddleware` — `23503` is a foreign key
violation and `23505` a unique violation. Both are client errors and should return
409 or 404 with an actionable message, not "unexpected error". Log the constraint
name; never return it.

---

## 9. Open decisions

Five things a developer cannot decide alone. Settle them before Phase 1.

**1. Organization type — fixed at creation, or changeable?** Recommend fixed. A
school that becomes a university is a new organization, not an edited one.

**2. Can one `User` be staff at one institution and a student at another?** The
model allows it — profiles hang off `OrganizationMember`, not `User`. Confirm this
is wanted; it is genuinely useful for a postgraduate who also lectures.

**3. Do arms matter?** Is "SS 2 Science" one cohort or three (A, B, C) with
different form teachers? Affects the default screens, not the schema.

**4. What happens to a repeating student's cohort?** A university student repeating
200 Level but carrying 100 Level courses — does their cohort change? The
`Enrollment` record handles the courses; the cohort question needs an explicit
answer.

**5. Is `StaffAttendance` in scope at all?** Clock-in usually means hardware. It is
the one item here that is not purely software, and it can be deferred indefinitely
without blocking anything else.

---

## What I would cut if time is short

Phases 0 through 3 are the spine. They fix the bug, give you the structure, and make
every person in the system trackable with correct permissions. That is a coherent
product.

Phase 4 makes it valuable daily. Phase 5 makes it the system of record, and it is
the one that deserves the most caution.

Nothing in Phases 0–2 is wasted regardless of what you later decide about the
secondary-versus-university question, because the model is deliberately shared.
