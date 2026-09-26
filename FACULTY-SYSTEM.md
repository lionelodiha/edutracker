# The Faculty System — how it should work

This is the explanation — the model and the reasoning. The step-by-step build order,
types, endpoints and tests are in **FACULTY-BUILD.md**, which assumes you have read this
file first.

It sits between `COHORT-MODEL.md` (which groups students) and `PEOPLE-AND-COURSES.md`
(which says what gets taught to whom). This one is about **the people who work there**.

---

## 1. The word "faculty" means two different things

This has to be settled first, because right now the project uses one word for both and
that is going to cause a bug.

- **Faculty (the place).** "Faculty of Engineering". A container in the academic tree.
  This is what `COHORT-MODEL.md` already calls a `Faculty` unit.
- **Faculty (the people).** "The members of faculty" — the academic staff body. This is
  what you were describing.

In this document I will only ever say **Faculty** for the place and **staff** or
**staff member** for the people. Nothing user-facing should ever say "faculty members",
because in a Nigerian school the word reads as the place, not the people.

---

## 2. The one idea everything else depends on

You said you want to list all the staff in a faculty, but *not* have to maintain that as
a separate thing from the HODs and the departmental lecturers. That instinct is right,
and here is the rule that makes it work:

> **Staff belong to a department. Faculty membership is calculated, never entered.**

A lecturer is recorded once, against the Department of Computer Science. The Faculty of
Computing's staff list is then simply *"every staff member whose department sits under
this faculty"*. Nobody adds a person to a faculty. Nobody keeps the two lists in step.
There is no way for them to disagree, because there is only one list.

This is the same trick already used for cohorts. The structure generates the grouping.

A small number of people work for the faculty itself rather than any department — the
Faculty Officer, the Dean's secretary. Those are recorded directly against the Faculty
unit. That is the only exception, and it is a handful of people.

---

## 3. Rank is not the same as job

This is the distinction the whole system turns on, and it is the one most school systems
get wrong.

**Rank** is what a person *is*. It is theirs, it is permanent until promoted, and it does
not change when they move department. In the Nigerian university system the ladder runs:
Graduate Assistant → Assistant Lecturer → Lecturer II → Lecturer I → Senior Lecturer →
Reader / Associate Professor → Professor. Promotion is slow and rare. A Professor stays
a Professor.

**Appointment** is what a person *does right now*. Dean, Head of Department, Exam
Officer, Level Adviser, Coordinator. These are posts. They attach to a specific unit,
they run for a term (typically two years, renewable), and they end. When Dr. Okafor
stops being HOD, she is still a Senior Lecturer. Nothing about her changes except that
one post.

**Keep these as two separate records.** If rank and job are one field, then the day an
HOD's term ends you have to decide what to demote them to, and there is no right answer.
Splitting them makes that a non-event: close the appointment, the rank is untouched.

It also gives you history for free. "Who was HOD of Computer Science in 2023?" is
answerable, because the old appointment row is still there with its end date. That
question gets asked more than you would think — it comes up every time an old result
sheet or transcript has to be re-signed.

A person can hold more than one appointment at once. An HOD is very often also a Level
Adviser and sits on two committees. Do not assume one post per person.

---

## 4. The posts that actually exist

From how Nigerian universities are actually organised — the structure below matches the
Faculty of Education at UNN and is typical.

**At faculty level**

- **Dean** — head of the faculty. Elected by the faculty board from among the professors,
  two-year term. Chairs the Faculty Board.
- **Sub-Dean** (some schools say Associate Dean or Deputy Dean) — the Dean's deputy,
  usually carrying student affairs and timetabling.
- **Faculty Officer** — *administrative* staff, not academic. Runs the faculty office,
  keeps the records, handles the paperwork flow to Senate. This person is not a lecturer
  and will never have a rank on the academic ladder. The system has to hold them without
  pretending otherwise.
- **Faculty Examination Officer** — collates results from every department for the board.
- **Faculty Board** — the Dean, the Sub-Dean, every HOD, and elected representatives.
  This is the body that approves results and passes them to Senate.

**At department level**

- **Head of Department (HOD)** — runs the department. Usually rotates among the senior
  academics on a two-year term.
- **Departmental Exam Officer** — collates and checks that department's results.
- **Level Adviser** — assigned to one level (100, 200…) and follows that group through.
  This is the person a student actually goes to with a problem, and it maps exactly onto
  a cohort from `COHORT-MODEL.md`.
- **Programme Coordinator** — where a department runs several programmes, one per
  programme.
- **Project / Seminar Coordinator** — final-year supervision allocation.

**In a secondary school** the same shapes exist with different names: Principal, Vice
Principal (Academics), Vice Principal (Administration), Head of Department for a subject
group, Form Teacher (which is the Level Adviser, attached to one class), Exams Officer,
Head of House. Build one system and rename the posts per school model. Do not fork it.

---

## 5. Not everyone is a lecturer

You said the people who really need pages are the lecturers, and that is true — but the
system still has to hold the others or the faculty office cannot use it.

Three kinds of staff:

- **Academic** — lecturers. They have a rank, they teach courses, they supervise
  projects. These get the full tracking page.
- **Administrative** — Faculty Officer, secretaries, clerks. No rank, no courses. They
  need a record and a role, nothing more.
- **Technical** — laboratory technologists, workshop staff, ICT support. Tied to a
  department and often to specific labs, and they matter for practicals.

The mistake to avoid is forcing all three into the academic shape. A lab technologist
with a blank "rank" field and an empty course list looks like a broken record, and
somebody will eventually "fix" it by inventing a rank for them.

---

## 6. The faculty system is its own workspace, not a tab

This is the correction. A faculty is not a page you look at. It is a **place you go to
work**, and it deserves its own screen the way the dashboard does.

When the school owner creates a Faculty of Engineering, that faculty opens as a workspace
of its own. The Dean — or the school owner acting for them — goes in there and sets the
whole faculty up: its officers, its departments and their HODs, its lecturers, its
students, its documents. Everything about that faculty is done from inside it. The
organization page shows the faculties as cards that take you *into* them, and does not
try to hold the contents of each one.

The reason is not visual. It is about who does the work. The school owner does not know
who should be exam officer in Mechanical Engineering. The Dean does. Giving the faculty
its own workspace is what lets the school owner hand that job over and stop being the
bottleneck for every department in the school.

### What is inside the workspace

- **Overview** — Dean, Sub-Dean and Faculty Officer by name at the top, because these are
  the people everyone is looking for. Then the departments, each with its HOD and staff
  count. Then the totals: staff by rank, students by programme.
- **Officers** — who holds every post, with the term end date visible. A post whose term
  has expired should be flagged; in practice these run over constantly and nobody notices
  until a document needs signing.
- **Departments** — each opening to its own section: HOD, programmes, lecturers, students.
- **Lecturers** — the calculated directory from §2, grouped by department, filterable by
  rank, searchable by name and staff number. Each row opens that lecturer's tracking page.
- **Students** — every student in the faculty, by programme and level. Each row opens
  that student's tracking page.
- **Documents** — the part you mentioned, and the part most school systems lack. The
  faculty office runs on paper: board minutes, memos, result sheets awaiting approval,
  course allocation for the session, accreditation files. Attach them to the faculty and
  the session, with a visible owner and date. Start simple — a titled file, a category,
  an uploader, a session — and resist building a document management system.
- **Board** — membership, meeting dates, minutes. It is a real body making real decisions
  and it should not be a PDF in somebody's email.

### Narrow the first build

Everything above is the eventual shape. For the first build, do **two** of them properly:
lecturers and students. Officers, documents and the board can be stubs that say what is
coming. Those two are what the product is for; the rest is decoration until they work.

---

## 7. The two tracking pages

The product is called EduTracker. So the question each of these pages answers is not
"who is this person" but **"what are they doing in school, right now?"**. A page showing
only a name, a department and a photograph has not tracked anything.

### The student tracking page

The top of the page places the student in the structure without anyone having to click.
Reading down: *Faculty of Engineering → Computer Engineering → B.Eng. Computer
Engineering → 200 Level → 2025/2026 session*. That whole chain is derived from the
student's programme and current cohort — never typed, and it cannot go stale, because it
is read from the structure rather than copied into the student's record.

Beneath that, what they are actually doing:

- The courses they registered for this session, with credit units and the lecturer on
  each.
- Attendance, per course and overall.
- Results as they come in, and the standing that follows from them.
- Their level adviser, by name — the person they go to with a problem.
- Their history: which level they were at in each past session, and whether they moved
  up, repeated or carried a course over.

That last one is what turns a profile into a tracker. A student is a line moving through
the school over years, not a row in a table.

### The lecturer tracking page

The same question, asked of a member of staff:

- The courses they lead or assist this session, with the enrolment count on each.
- Which of those courses still have results outstanding. This is the single most useful
  thing on the page for a Dean, and it is the reason the page exists.
- Attendance they have taken, and attendance they have not.
- Posts they hold — HOD, level adviser, exam officer — with term dates.
- Their department, their rank, and the history of both.

A Dean opening the lecturer directory should see at a glance who has not submitted
results. Design for that fact to be visible, not buried three clicks down.

---

## 8. How people get into the system

Nobody types a hundred students into a form. This is the flow, and the order of the steps
matters.

### The invitation

Someone holding the right post — the Dean, the HOD, or the faculty officer — creates an
invitation. They choose the programme and the entry level, and they enter an email
address. The system sends that person a link.

The important part: **the link already knows who it is for.** The programme, the level and
the session are carried in the invitation, not asked on the form. A student cannot put
themselves in Computer Engineering by typing it, because they are never asked. That is
what keeps the structure trustworthy.

Invitations should be creatable one at a time and by pasted list, because a department
admits its intake in one sitting, not one person per afternoon. Each invitation expires —
fourteen days is reasonable — and can be resent.

### The form

The person opens the link and fills in only what the school does not already know: full
name, date of birth, sex, phone number, home address, next of kin, photograph. For a
lecturer, add qualifications and proposed rank.

They set a password at the end. They do **not** choose their programme, their level, their
matriculation number or their school email. Those are the school's to decide.

### Approval

A completed form does not become a student. It becomes a **pending record** in the faculty
workspace, waiting for someone to look at it. The Dean or the HOD reviews it and either
approves it or sends it back with a reason.

Do not skip this step. Without it, anyone who forwards the link to a friend has created a
student, and there is no way to tell afterwards which records are real.

### Generation

Only on approval does the system create the two things the person has been waiting for.

**The matriculation number.** Nigerian schools each have their own format, but they are
all the same three parts: the session of entry, a code for the faculty or department, and
a serial within that group — `2025/CPE/0041`, or `20251234EE`. Make the format a
per-school setting built from those parts, so a school can match the numbers it already
issues on paper. Two rules: the number is issued once and never reused, even if the
student withdraws; and the serial is allocated **at approval, never at form submission**,
or the sequence fills with gaps belonging to people who abandoned a form halfway.

Secondary schools use an admission number with the same shape and the same two rules.

**The school email.** Generated from the name against a pattern the school sets —
`firstname.lastname@student.school.edu.ng` is the common one. Collisions are guaranteed in
any Nigerian intake, so the pattern needs a defined tie-break: append a number, or use the
middle initial. Decide it once and apply it silently. Never ask a seventeen-year-old to
pick a username.

The person is then told both by email and can sign in. Their record is live, they appear
in their cohort, and the course registration in `PEOPLE-AND-COURSES.md` opens to them.

### Why this order

Invite → form → approve → generate. Each step is the school confirming something before
committing to it. Generating the matric number at form submission instead would leave the
number sequence full of holes belonging to people who never enrolled, and those holes are
permanent.

---

## 9. What connects to what

Three links matter, and none of them duplicate anything:

- **Staff → Department.** Where they work. One department. This generates the faculty
  list.
- **Staff → Course.** What they teach this session. Already described as
  `CourseAssignment` in `PEOPLE-AND-COURSES.md` — that stays as it is. Note it points at
  the course, so a lecturer from Electrical Engineering can lead a course being taken by
  Computer Engineering students, which is exactly what happens in real life.
- **Staff → Appointment → Unit.** What post they hold and where. A Level Adviser's
  appointment points at a cohort, an HOD's at a department, a Dean's at a faculty.

Everything else — "who teaches in this faculty", "which lecturers have no courses this
session", "which departments have no exam officer" — is a question answered from those
three, not another table.

---

## 10. Where this should be built

Inside the organization, like everything else. The organization's navigation lists its
faculties; opening one enters the workspace from §6. Not in the top-level sidebar, and not
a separate application.

A lecturer's tracking page should be reachable from three places, because those are the
three ways people actually arrive: the faculty lecturer directory, the department, and the
course they teach. A student's should be reachable from the faculty student directory,
their cohort, and any course roster they appear on.

---

## 11. Open questions worth settling before anyone builds

1. **Joint appointments.** A few academics genuinely belong to two departments. Rare
   enough to ignore for now, but decide deliberately rather than by accident.
2. **Visiting and adjunct staff.** They teach but are not on the payroll and have no
   rank. Probably a flag on the staff record, not a fourth staff kind.
3. **Sabbatical and study leave.** Someone who is away still holds their post but must
   not be assignable to courses. This is a status, and it needs to exist from the start —
   retrofitting it means auditing every list.
4. **Does a staff member log in?** A lecturer needs an account for results and attendance.
   The Faculty Officer probably does too. A lab technologist probably does not. Decide
   which staff records carry a user account, because it changes the portal invite and
   provisioning flow that already exists.
5. **What is your matriculation number format?** §8 can only be built against a real one.
   Write down the exact format your school uses, including where the serial resets — per
   session, per faculty, or per department.
6. **Who may approve a pending record?** The Dean only, or the HOD of the relevant
   department too? This decides whether a Dean becomes the bottleneck for an intake of two
   thousand.
7. **Direct entry.** A direct-entry student is invited at 200 level, not 100, so their
   matriculation number carries an entry session that is not the one their set graduated
   from. Confirm that is what your school does before it is built in.

Answer these and the build instructions can be written.

---

**Sources for the structure in §4:**
[Key Officers — Faculty of Education, UNN](https://education.unn.edu.ng/about/key-officers/) ·
[Leadership, Officers and Deans — University of Lagos](https://unilag.edu.ng/leadership-officers-and-dean/) ·
[Organizational Structure — Nnamdi Azikiwe University](https://unizik.edu.ng/administration/organizational-structure/) ·
[University of Ibadan Staff Information Handbook](https://ui.edu.ng/sites/default/files/STAFF%20INFORMATION%20HANDBOOK,%2023%20Feb.%202017.pdf)
