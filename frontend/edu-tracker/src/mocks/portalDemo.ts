/**
 * One-click demo schools for the portals.
 *
 * Builds a university and a secondary school through the same store
 * functions the admin screens use, then adds a closed session with final
 * results and a live term with coursework in progress. Every demo account
 * signs straight in; no invitation or password is involved.
 */
import {
  addCourse, addOffering, createDepartment, createFaculty, initializeStructure,
  prepareSession, startSession, updateDepartment,
} from "../features/academics/store";
import type { AcademicOffering, AcademicSession } from "../features/academics/types";
import { schemeFor, type Scores } from "../features/assessment/scheme";
import { readSchoolSetup } from "../features/cohorts/schoolSetup";
import { saveGroupSettings, type SchoolModel } from "../features/cohorts/settings";
import type { StudentProfile } from "../features/cohorts/courses";
import type { StaffKind } from "../features/staff/types";
import type { Weekday } from "../features/portal/types";
import { createAppointment, createStaff, facultyRecords, facultyTestUtils, listRanks } from "./faculty";
import { portalSeedUtils, type Sheet } from "./portal";
import { makeCredential } from "../features/onboarding/passwords";

export type DemoSchool = "university" | "secondary";
export type DemoRole = "Student" | "Teaching" | "NonTeaching";

export const DEMO_ORGS: Record<DemoSchool, { organizationId: string; name: string }> = {
  university: { organizationId: "demo-university", name: "Demo University" },
  secondary: { organizationId: "demo-secondary", name: "Demo Secondary School" },
};

/** Email domains of the demo schools, so a sign-in page can point demo emails to the right portal. */
export const DEMO_DOMAINS: Record<DemoSchool, string> = { university: "demouni.edu.ng", secondary: "demosec.sch.ng" };

const DEMO_USERS: Record<DemoSchool, Record<DemoRole, string>> = {
  university: { Student: "demo-uni-student", Teaching: "demo-uni-lecturer", NonTeaching: "demo-uni-staff" },
  secondary: { Student: "demo-sec-student", Teaching: "demo-sec-teacher", NonTeaching: "demo-sec-staff" },
};

/** Who each demo button signs in as, for the button labels. */
export const DEMO_PEOPLE: Record<DemoSchool, Record<DemoRole, string>> = {
  university: { Student: "Chiamaka Obi · 200L Computer Science", Teaching: "Dr. Adebayo Ogunleye · Senior Lecturer", NonTeaching: "Mrs. Ngozi Eze · Registry" },
  secondary: { Student: "Tobi Adeyemi · SS 2A", Teaching: "Mr. Chinedu Okeke · Mathematics", NonTeaching: "Mrs. Halima Sani · Bursary" },
};

const STORAGE_PREFIXES = ["edutracker.structure.", "edutracker.academics.", "edutracker.faculty.", "edutracker.portal.", "edutracker.groups.", "edutracker.organizationName."];

/** Seeds the school if needed and returns the user id to sign in as. */
export function ensureDemo(school: DemoSchool, role: DemoRole, now: Date = new Date()): { organizationId: string; userId: string } {
  const { organizationId } = DEMO_ORGS[school];
  const userId = DEMO_USERS[school][role];
  // The faculty store seeds university or school ranks the first time it loads, so the model must be known first.
  if (!readSchoolSetup(organizationId)) saveGroupSettings(organizationId, school === "university"
    ? { model: "University", singular: "Level", plural: "Levels" }
    : { model: "Secondary", singular: "Class", plural: "Classes" });
  const people = facultyRecords(organizationId);
  const seeded = people.students.some(item => item.userId === userId) || people.staff.some(item => item.userId === userId);
  if (!seeded) seedDemoSchool(school, organizationId, now);
  return { organizationId, userId };
}

/** Build a demo school under any organization id. Tests use fresh ids. */
export function seedDemoSchool(school: DemoSchool, organizationId: string, now: Date = new Date()) {
  if (school === "university") seedUniversity(organizationId, now);
  else seedSecondary(organizationId, now);
  return { users: DEMO_USERS[school] };
}

/** One shared password for every demo login. Demo data only. */
export const DEMO_PASSWORD = "Demo@2026";

export type DemoLogin = { role: DemoRole; name: string; schoolEmail: string; password: string };

/**
 * Builds the demo school if needed and gives its three demo people a real
 * email-and-password login, so the sign-in form works as well as the
 * one-click buttons. Returns the credentials to show on the sign-in page.
 */
export async function prepareDemoLogins(school: DemoSchool): Promise<DemoLogin[]> {
  const { organizationId } = ensureDemo(school, "Student");
  const faculty = facultyTestUtils(organizationId);
  const logins: DemoLogin[] = [];
  for (const role of ["Student", "Teaching", "NonTeaching"] as DemoRole[]) {
    const userId = DEMO_USERS[school][role];
    const person = role === "Student"
      ? faculty.db.students.find(item => item.userId === userId)
      : faculty.db.staff.find(item => item.userId === userId);
    if (!person) continue;
    if (!faculty.db.accounts.some(account => account.userId === userId)) {
      faculty.db.accounts.push({ userId, schoolEmail: person.schoolEmail, kind: role === "Student" ? "Student" : "Staff", credential: await makeCredential(DEMO_PASSWORD) });
      faculty.persist();
    }
    logins.push({ role, name: DEMO_PEOPLE[school][role], schoolEmail: person.schoolEmail, password: DEMO_PASSWORD });
  }
  return logins;
}

/** Wipe a demo school from this browser. Reload the page afterwards to drop in-memory copies. */
export function clearDemo(school: DemoSchool) {
  const { organizationId } = DEMO_ORGS[school];
  try { for (const prefix of STORAGE_PREFIXES) localStorage.removeItem(`${prefix}${organizationId}`); } catch { /* Nothing stored. */ }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Small seeded generator so every browser gets the same demo marks. */
function randomFrom(seed: string) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function marksFor(model: SchoolModel, studentId: string, offeringId: string, ability: number, keys?: string[]): Scores {
  const random = randomFrom(`${studentId}:${offeringId}`);
  const scores: Scores = {};
  for (const component of schemeFor(model)) {
    if (keys && !keys.includes(component.key)) continue;
    const ratio = Math.min(0.98, Math.max(0.2, ability + (random() - 0.5) * 0.3));
    scores[component.key] = Math.round(component.max * ratio * 2) / 2;
  }
  return scores;
}

const iso = (date: Date) => date.toISOString();
const addDays = (date: Date, days: number, hour = 9) => { const next = new Date(date); next.setDate(next.getDate() + days); next.setHours(hour, 0, 0, 0); return next; };

type Person = { userId?: string; title: string; fullName: string; staffNumber: string; kind: StaffKind; unitId: string; unitKind: "Department" | "Faculty"; rank?: string };

function makeStaff(organizationId: string, domain: string, person: Person): string {
  const ranks = listRanks(organizationId);
  const rankId = person.rank && ranks.ok ? ranks.data.find(item => item.name === person.rank)?.rankId ?? null : null;
  const email = `${person.fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@${domain}`;
  const result = createStaff(organizationId, {
    userId: person.userId ?? null, title: person.title, fullName: person.fullName, staffNumber: person.staffNumber,
    kind: person.kind, unitId: person.unitId, unitKind: person.unitKind, rankId, schoolEmail: email,
    status: "Active", appointedOn: "2016-10-03",
  });
  if (!result.ok) throw new Error(`Demo seed: ${result.message}`);
  return result.data.staffProfileId;
}

function makeStudents(organizationId: string, domain: string, prefix: string, names: string[], programmeId: string, entrySessionId: string, firstUserId?: string): StudentProfile[] {
  const faculty = facultyTestUtils(organizationId);
  const students = names.map((fullName, index): StudentProfile => ({
    studentProfileId: crypto.randomUUID(), organizationId, userId: index === 0 && firstUserId ? firstUserId : crypto.randomUUID(),
    fullName, matriculationNumber: `${prefix}${String(index + 1).padStart(3, "0")}`, programmeId,
    entryStageId: "stage-0", entrySessionId, currentCohortId: "",
    schoolEmail: `${fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@${domain}`, status: "Active",
  }));
  faculty.db.students.push(...students);
  faculty.persist();
  return students;
}

function prepareAndStart(organizationId: string, name: string, startYear: number, startsOn: string, endsOn: string, termNames: string[]): AcademicSession {
  const { session } = prepareSession(organizationId, {
    fromSessionId: null, name, startYear, endYear: startYear + 1, startsOn, endsOn, termNames,
    copy: { courseOfferings: false, lecturerAssignments: false, classArms: false },
  });
  return startSession(organizationId, session.sessionId);
}

function fullSheet(model: SchoolModel, offering: AcademicOffering, students: StudentProfile[], ability: Map<string, number>, publishedAt: string): Sheet {
  return {
    offeringId: offering.offeringId, status: "Submitted", submittedAt: publishedAt, updatedAt: publishedAt,
    published: Object.fromEntries(schemeFor(model).map(component => [component.key, publishedAt])),
    scores: Object.fromEntries(students.map(student => [student.studentProfileId, marksFor(model, student.studentProfileId, offering.offeringId, ability.get(student.studentProfileId) ?? 0.6)])),
  };
}

/** A draft sheet with some components marked and some of those published. */
function partialSheet(model: SchoolModel, offering: AcademicOffering, students: StudentProfile[], ability: Map<string, number>, marked: string[], published: string[], publishedAt: string): Sheet {
  return {
    offeringId: offering.offeringId, status: "Draft", submittedAt: null, updatedAt: publishedAt,
    published: Object.fromEntries(published.map(key => [key, publishedAt])),
    scores: Object.fromEntries(students.map(student => [student.studentProfileId, marksFor(model, student.studentProfileId, offering.offeringId, ability.get(student.studentProfileId) ?? 0.6, marked)])),
  };
}

function slot(offeringId: string, day: Weekday, start: string, end: string, venue: string) {
  return { slotId: crypto.randomUUID(), offeringId, day, start, end, venue };
}

function notice(recipientId: string, kind: "Coursework" | "Marks" | "Result" | "Memo" | "Leave" | "Task", title: string, body: string, createdAt: Date, link: string | null = null, read = false) {
  return { notificationId: crypto.randomUUID(), recipientId, kind, title, body, createdAt: iso(createdAt), readAt: read ? iso(createdAt) : null, link };
}

function departmentInput(name: string, code: string, facultyId: string, extra: { award: string; durationYears: number; semestersPerLevel: number; levels?: string[] }) {
  return {
    name, code, facultyId, award: extra.award, description: "", hodStaffProfileId: null,
    durationYears: extra.durationYears, semestersPerLevel: extra.semestersPerLevel, levels: extra.levels,
    industrialTraining: null, postGraduationInternshipYears: null, directEntryLevel: null,
    maxIntakePerSession: 120, minUtmeScore: null, utmeSubjects: [], oLevelRequirement: "", otherRequirements: "",
  };
}

// ─── University ─────────────────────────────────────────────────────────────

function seedUniversity(org: string, now: Date) {
  const { name } = DEMO_ORGS.university;
  const domain = DEMO_DOMAINS.university;
  try { localStorage.setItem(`edutracker.organizationName.${org}`, name); } catch { /* Node tests have no storage. */ }
  initializeStructure(org, "University");
  const science = createFaculty(org, { name: "Faculty of Science", code: "SCI" });
  const csc = createDepartment(org, departmentInput("Computer Science", "CSC", science.key, { award: "B.Sc.", durationYears: 4, semestersPerLevel: 2 }));
  const mth = createDepartment(org, departmentInput("Mathematics", "MTH", science.key, { award: "B.Sc.", durationYears: 4, semestersPerLevel: 2 }));
  const programme = readSchoolSetup(org)!.structure.units.find(unit => unit.parent === csc.key)!.key;

  const lecturer = makeStaff(org, domain, { userId: "demo-uni-lecturer", title: "Dr.", fullName: "Adebayo Ogunleye", staffNumber: "SP-1042", kind: "Academic", unitId: csc.key, unitKind: "Department", rank: "Senior Lecturer" });
  const hod = makeStaff(org, domain, { title: "Prof.", fullName: "Grace Nwachukwu", staffNumber: "SP-0311", kind: "Academic", unitId: csc.key, unitKind: "Department", rank: "Professor" });
  const adviser = makeStaff(org, domain, { title: "Dr.", fullName: "Musa Abdullahi", staffNumber: "SP-1210", kind: "Academic", unitId: csc.key, unitKind: "Department", rank: "Lecturer I" });
  const maths = makeStaff(org, domain, { title: "Dr.", fullName: "Funke Adeyemi", staffNumber: "SP-0987", kind: "Academic", unitId: mth.key, unitKind: "Department", rank: "Lecturer I" });
  const officer = makeStaff(org, domain, { title: "Mr.", fullName: "Samuel Okon", staffNumber: "NT-0204", kind: "Administrative", unitId: science.key, unitKind: "Faculty" });
  const clerk = makeStaff(org, domain, { userId: "demo-uni-staff", title: "Mrs.", fullName: "Ngozi Eze", staffNumber: "NT-0588", kind: "Administrative", unitId: science.key, unitKind: "Faculty" });
  const technologist = makeStaff(org, domain, { title: "Mr.", fullName: "Ibrahim Musa", staffNumber: "NT-0731", kind: "Technical", unitId: csc.key, unitKind: "Department" });
  createAppointment(org, { staffProfileId: hod, post: "HOD", scopeId: csc.key, scopeKind: "Department", startsOn: "2025-08-01T00:00:00.000Z" });
  updateDepartment(org, csc.key, { hodStaffProfileId: hod });

  const past = prepareAndStart(org, "2025/2026", 2025, "2025-09-15", "2026-08-28", ["First Semester", "Second Semester"]);
  const course = (code: string, title: string, departmentId: string, units = 3) =>
    addCourse(org, { departmentId, code, title, units, description: "", defaultLevel: code.includes(" 1") ? "100L" : "200L", defaultTermOrdinal: Number(code.at(-1)) % 2 ? 1 : 2, defaultCompulsory: true });
  const run = (session: AcademicSession, ordinal: number, courseId: string, levelKey: string, units: number, lecturerStaffProfileId: string) =>
    addOffering(org, { sessionId: session.sessionId, termId: session.terms[ordinal - 1].termId, courseId, levelKey, units, isCompulsory: true, lecturerStaffProfileId });

  const past100 = [
    run(past, 1, course("CSC 101", "Introduction to Computer Science", csc.key).courseId, "100L", 3, lecturer),
    run(past, 1, course("CSC 103", "Introduction to Digital Logic", csc.key, 2).courseId, "100L", 2, hod),
    run(past, 1, course("MTH 101", "Elementary Mathematics I", mth.key).courseId, "100L", 3, maths),
    run(past, 2, course("CSC 102", "Introduction to Problem Solving", csc.key).courseId, "100L", 3, lecturer),
    run(past, 2, course("CSC 104", "Computer Applications", csc.key, 2).courseId, "100L", 2, adviser),
    run(past, 2, course("MTH 102", "Elementary Mathematics II", mth.key).courseId, "100L", 3, maths),
  ];

  const current = prepareAndStart(org, "2026/2027", 2026, "2026-09-14", "2027-08-27", ["First Semester", "Second Semester"]);
  const csc201 = run(current, 1, course("CSC 201", "Computer Programming I", csc.key).courseId, "200L", 3, lecturer);
  const csc203 = run(current, 1, course("CSC 203", "Discrete Structures", csc.key).courseId, "200L", 3, hod);
  const csc205 = run(current, 1, course("CSC 205", "Operating Systems I", csc.key).courseId, "200L", 3, lecturer);
  const csc207 = run(current, 1, course("CSC 207", "Computer Architecture", csc.key, 2).courseId, "200L", 2, adviser);
  const mth201 = run(current, 1, course("MTH 201", "Mathematical Methods I", mth.key).courseId, "200L", 3, maths);

  const students = makeStudents(org, domain, "CSC/2025/", [
    "Chiamaka Obi", "Abdulrahman Yusuf", "Blessing Okoro", "David Olatunji", "Esther Bassey", "Farouk Lawal",
    "Gift Ekanem", "Henry Nnamdi", "Ifeoma Uche", "Joshua Akpan", "Kemi Balogun", "Lucky Oghene",
  ], programme, past.sessionId, "demo-uni-student");
  const ability = new Map(students.map((student, index) => [student.studentProfileId, index === 0 ? 0.74 : 0.42 + ((index * 37) % 45) / 100]));

  const { db, persist } = portalSeedUtils(org);
  for (const student of students) {
    db.levels.push({ studentProfileId: student.studentProfileId, level: "200L" });
    // This session's 200L CSC courses place them automatically. Register by hand only where that
    // can't: last session's 100L courses (they've moved up) and MTH 201 (another department's course).
    for (const offering of [...past100, mth201]) db.enrolments.push({ offeringId: offering.offeringId, studentProfileId: student.studentProfileId });
  }
  db.advisers.push({ departmentId: csc.key, levelKey: "200L", staffProfileId: adviser });
  past100.forEach((offering, index) => db.sheets.push(fullSheet("University", offering, students, ability, index < 3 ? "2026-02-20T10:00:00.000Z" : "2026-07-24T10:00:00.000Z")));
  const lastWeek = iso(addDays(now, -4, 15));
  db.sheets.push(partialSheet("University", csc201, students, ability, ["test", "assignment"], ["test"], lastWeek));
  db.sheets.push(partialSheet("University", csc203, students, ability, ["test"], ["test"], iso(addDays(now, -2, 11))));

  db.slots.push(
    slot(csc201.offeringId, 1, "08:00", "10:00", "LT 1"), slot(csc201.offeringId, 3, "10:00", "11:00", "Computer Lab 2"),
    slot(csc203.offeringId, 2, "10:00", "12:00", "LT 2"),
    slot(csc205.offeringId, 3, "12:00", "14:00", "LT 1"), slot(csc205.offeringId, 5, "08:00", "09:00", "LT 3"),
    slot(csc207.offeringId, 4, "08:00", "10:00", "LT 3"),
    slot(mth201.offeringId, 1, "12:00", "14:00", "Maths Hall"), slot(mth201.offeringId, 4, "14:00", "15:00", "Maths Hall"),
  );

  const item = (offeringId: string, componentKey: string, title: string, instructions: string, dueAt: Date, postedAt: Date) => {
    const entry = { itemId: crypto.randomUUID(), offeringId, componentKey, title, instructions, dueAt: iso(dueAt), postedAt: iso(postedAt) };
    db.items.push(entry);
    return entry;
  };
  item(csc201.offeringId, "test", "Test 1: variables and control flow", "Written test in LT 1. Bring a pen and your ID card.", addDays(now, -6, 8), addDays(now, -13));
  const calculator = item(csc201.offeringId, "assignment", "Assignment 1: a command-line calculator", "Write a Python program that reads two numbers and an operator and prints the result. Handle division by zero. Submit the .py file.", addDays(now, 3, 23), addDays(now, -3));
  item(csc201.offeringId, "project", "Mini project: student grade book", "In pairs, build a grade book that stores scores and prints each student's grade. Submit a zip of your code and a one-page write-up.", addDays(now, 24, 23), addDays(now, -1));
  item(csc203.offeringId, "test", "Test 1: sets, relations and functions", "Closed book, 45 minutes.", addDays(now, -5, 10), addDays(now, -12));
  item(csc205.offeringId, "test", "Test 1: processes and scheduling", "Covers lectures 1–5.", addDays(now, 10, 12), addDays(now, -1));
  const methods = item(mth201.offeringId, "assignment", "Problem set 1: ordinary differential equations", "Solve questions 1–10 from chapter 2. Show all working.", addDays(now, -1, 17), addDays(now, -9));
  for (const student of students.slice(3, 9)) db.submissions.push({ itemId: calculator.itemId, studentProfileId: student.studentProfileId, submittedAt: iso(addDays(now, -1, 20)), note: "", fileName: `${student.matriculationNumber.replace(/\//g, "_")}_calculator.py` });
  for (const student of students.slice(1)) db.submissions.push({ itemId: methods.itemId, studentProfileId: student.studentProfileId, submittedAt: iso(addDays(now, -2, 18)), note: "Scanned answers attached.", fileName: "problem-set-1.pdf" });

  const me = students[0].studentProfileId;
  db.remarks.push(
    { studentProfileId: me, termId: past.terms[0].termId, remark: "Good start. Keep attending tutorials." },
    { studentProfileId: me, termId: past.terms[1].termId, remark: "Strong second semester. Well done." },
  );
  db.notifications.push(
    notice(me, "Memo", "Course registration closes on Friday", "Register your first-semester courses before the portal closes at 11:59 pm on Friday. Late registration attracts a fine.", addDays(now, -7), null, true),
    notice(me, "Marks", "CSC 201: Test marks are out", "Your test marks for Computer Programming I have been published.", addDays(now, -4, 15), "results"),
    notice(me, "Coursework", "New assignment in CSC 201", "Assignment 1: a command-line calculator. Due in 3 days.", addDays(now, -3), "coursework"),
    notice(me, "Marks", "CSC 203: Test marks are out", "Your test marks for Discrete Structures have been published.", addDays(now, -2, 11), "results"),
    notice(me, "Coursework", "New project in CSC 201", "Mini project: student grade book.", addDays(now, -1), "coursework"),
  );
  db.notifications.push(
    notice(lecturer, "Memo", "First-semester CA deadline", "All in-course assessment marks for the first semester should be published before the examination timetable is released.", addDays(now, -6), null, true),
    notice(lecturer, "Coursework", "6 hand-ins for Assignment 1", "Six CSC 201 students have handed in the calculator assignment.", addDays(now, -1, 20), "classes"),
    notice(hod, "Result", "CSC 201 test marks published", "Dr. Adebayo Ogunleye published test marks for CSC 201.", addDays(now, -4, 15), null),
  );

  db.staffRecords.push(
    { staffProfileId: clerk, cadre: "Registry · Senior Executive Officer", salaryScale: "CONTISS", gradeLevel: 8, step: 3, confirmedOn: "2019-03-01", nextPromotionDue: "2027-01-01", supervisorId: officer },
    { staffProfileId: officer, cadre: "Registry · Principal Assistant Registrar", salaryScale: "CONTISS", gradeLevel: 12, step: 2, confirmedOn: "2012-06-01", nextPromotionDue: null, supervisorId: null },
    { staffProfileId: technologist, cadre: "Technical · Laboratory Technologist", salaryScale: "CONTISS", gradeLevel: 9, step: 4, confirmedOn: "2018-01-15", nextPromotionDue: "2026-10-01", supervisorId: hod },
  );
  seedNonTeaching(db, clerk, now, {
    duties: [
      { day: 1, start: "08:00", end: "16:00", location: "Faculty Office, Room 12", role: "Student records desk" },
      { day: 2, start: "08:00", end: "16:00", location: "Faculty Office, Room 12", role: "Student records desk" },
      { day: 3, start: "08:00", end: "16:00", location: "Exams & Records Unit", role: "Result collation" },
      { day: 4, start: "08:00", end: "16:00", location: "Faculty Office, Room 12", role: "Student records desk" },
      { day: 5, start: "08:00", end: "14:00", location: "Faculty Office, Room 12", role: "Correspondence" },
    ],
    tasks: [
      { title: "Collate 200L course registration forms", detail: "Check every Computer Science 200L form is signed by the level adviser, then file them.", requestedBy: "Mr. Samuel Okon", priority: "Urgent", status: "In progress", dueOn: addDays(now, 2) },
      { title: "Prepare faculty board agenda", detail: "Draft the agenda for the next faculty board meeting and circulate it to heads of department.", requestedBy: "Mr. Samuel Okon", priority: "Normal", status: "Open", dueOn: addDays(now, 9) },
      { title: "Update transcript request log", detail: "Record the 14 transcript requests received last week.", requestedBy: "Registry", priority: "Low", status: "Done", dueOn: addDays(now, -3) },
    ],
    leave: [
      { type: "Annual", startsOn: "2026-04-06", endsOn: "2026-04-17", reason: "Family visit", status: "Approved" },
      { type: "Casual", startsOn: "2026-07-09", endsOn: "2026-07-10", reason: "Personal errand", status: "Approved" },
    ],
    appraisals: [
      { year: 2025, rating: "Very good", score: 78, appraiser: "Mr. Samuel Okon", comment: "Reliable and accurate with student records. Should lead the next registration exercise." },
      { year: 2024, rating: "Good", score: 69, appraiser: "Mr. Samuel Okon", comment: "Steady improvement. Work on turnaround time for correspondence." },
    ],
    memos: [
      ["Staff durbar on Thursday", "All staff of the Faculty of Science are invited to a durbar at 10 am on Thursday in the Faculty Board Room."],
      ["New leave request process", "Leave requests now go through the staff portal. Paper forms will no longer be accepted from next month."],
    ],
  });
  persist();
}

// ─── Secondary ──────────────────────────────────────────────────────────────

function seedSecondary(org: string, now: Date) {
  const { name } = DEMO_ORGS.secondary;
  const domain = DEMO_DOMAINS.secondary;
  try { localStorage.setItem(`edutracker.organizationName.${org}`, name); } catch { /* Node tests have no storage. */ }
  initializeStructure(org, "Secondary");
  const senior = createFaculty(org, { name: "Senior Secondary", code: "SSS" });
  const ss1 = createDepartment(org, departmentInput("SS 1", "SS1", senior.key, { award: "", durationYears: 2, semestersPerLevel: 3, levels: ["A", "B"] }));
  const ss2 = createDepartment(org, departmentInput("SS 2", "SS2", senior.key, { award: "", durationYears: 2, semestersPerLevel: 3, levels: ["A", "B"] }));

  const teacher = (fullName: string, title: string, staffNumber: string, userId?: string) =>
    makeStaff(org, domain, { userId, title, fullName, staffNumber, kind: "Academic", unitId: ss2.key, unitKind: "Department", rank: "Teacher" });
  const okeke = teacher("Chinedu Okeke", "Mr.", "T-014", "demo-sec-teacher");
  const ajayi = teacher("Bola Ajayi", "Mrs.", "T-006");
  const bello = teacher("Yusuf Bello", "Mr.", "T-021");
  const ibe = teacher("Amaka Ibe", "Mrs.", "T-009");
  const salami = teacher("Tunde Salami", "Mr.", "T-017");
  const danjuma = teacher("Ruth Danjuma", "Miss", "T-025");
  const principal = makeStaff(org, domain, { title: "Mrs.", fullName: "Folake Adewale", staffNumber: "A-001", kind: "Administrative", unitId: senior.key, unitKind: "Faculty" });
  const bursar = makeStaff(org, domain, { userId: "demo-sec-staff", title: "Mrs.", fullName: "Halima Sani", staffNumber: "A-012", kind: "Administrative", unitId: senior.key, unitKind: "Faculty" });

  const subjects: [string, string, string][] = [
    ["MTH", "Mathematics", okeke], ["ENG", "English Language", ajayi], ["PHY", "Physics", bello],
    ["CHM", "Chemistry", ibe], ["BIO", "Biology", salami], ["CIV", "Civic Education", danjuma],
  ];
  const terms = ["First Term", "Second Term", "Third Term"];
  const past = prepareAndStart(org, "2025/2026", 2025, "2025-09-15", "2026-07-24", terms);
  const pastCourses = subjects.map(([code, title]) => addCourse(org, { departmentId: ss1.key, code: `SS1-${code}`, title, units: 1, description: "", defaultLevel: "A", defaultTermOrdinal: 1, defaultCompulsory: true }));
  const pastRuns = past.terms.flatMap((_, index) => pastCourses.map((course, subject) =>
    addOffering(org, { sessionId: past.sessionId, termId: past.terms[index].termId, courseId: course.courseId, levelKey: "A", units: 1, isCompulsory: true, lecturerStaffProfileId: subjects[subject][2] })));

  const current = prepareAndStart(org, "2026/2027", 2026, "2026-09-14", "2027-07-23", terms);
  const currentCourses = subjects.map(([code, title]) => addCourse(org, { departmentId: ss2.key, code: `SS2-${code}`, title, units: 1, description: "", defaultLevel: "A", defaultTermOrdinal: 1, defaultCompulsory: true }));
  const runsFor = (arm: string) => currentCourses.map((course, subject) =>
    addOffering(org, { sessionId: current.sessionId, termId: current.terms[0].termId, courseId: course.courseId, levelKey: arm, units: 1, isCompulsory: true, lecturerStaffProfileId: subjects[subject][2] }));
  const armA = runsFor("A");
  const armB = runsFor("B");

  const studentsA = makeStudents(org, domain, "DSS/2021/", [
    "Tobi Adeyemi", "Aisha Mohammed", "Bright Eze", "Chioma Nwosu", "Daniel Etim", "Esther Adebayo",
    "Femi Oladipo", "Grace Okafor", "Hauwa Garba", "Isaac Uzor",
  ], ss2.key, past.sessionId, "demo-sec-student");
  const studentsB = makeStudents(org, domain, "DSS/2021/B", [
    "Joy Emeka", "Kunle Ajala", "Linda Ofor", "Mustapha Idris", "Nneka Obi", "Olumide Shittu", "Precious Udo", "Quadri Bakare",
  ], ss2.key, past.sessionId);
  const all = [...studentsA, ...studentsB];
  const ability = new Map(all.map((student, index) => [student.studentProfileId, index === 0 ? 0.78 : 0.4 + ((index * 41) % 48) / 100]));

  const { db, persist } = portalSeedUtils(org);
  for (const student of studentsA) {
    db.levels.push({ studentProfileId: student.studentProfileId, level: "A" });
    // SS 2A subjects place them automatically; last session's SS 1A subjects need registering.
    for (const offering of pastRuns) db.enrolments.push({ offeringId: offering.offeringId, studentProfileId: student.studentProfileId });
  }
  for (const student of studentsB) {
    db.levels.push({ studentProfileId: student.studentProfileId, level: "B" });
  }
  db.advisers.push({ departmentId: ss2.key, levelKey: "A", staffProfileId: ibe }, { departmentId: ss2.key, levelKey: "B", staffProfileId: bello });
  const termEnds = ["2025-12-12T12:00:00.000Z", "2026-04-02T12:00:00.000Z", "2026-07-22T12:00:00.000Z"];
  pastRuns.forEach((offering, index) => db.sheets.push(fullSheet("Secondary", offering, studentsA, ability, termEnds[Math.floor(index / subjects.length)])));
  db.sheets.push(partialSheet("Secondary", armA[0], studentsA, ability, ["test1"], ["test1"], iso(addDays(now, -3, 14))));
  db.sheets.push(partialSheet("Secondary", armB[0], studentsB, ability, ["test1"], [], iso(addDays(now, -2, 16))));
  db.sheets.push(partialSheet("Secondary", armA[3], studentsA, ability, ["test1"], ["test1"], iso(addDays(now, -1, 13))));

  // Five periods a day, Monday to Friday; each arm's week is laid out from the subject list.
  const periods: [string, string][] = [["08:00", "08:40"], ["08:40", "09:20"], ["09:20", "10:00"], ["10:30", "11:10"], ["11:10", "11:50"]];
  for (const [arm, runs, room] of [["A", armA, "SS 2A classroom"], ["B", armB, "SS 2B classroom"]] as const) {
    for (let day = 1 as Weekday; day <= 5; day = (day + 1) as Weekday) {
      periods.forEach(([start, end], period) => {
        const subject = (day * 2 + period + (arm === "B" ? 3 : 0)) % runs.length;
        const venue = subjects[subject][0] === "CHM" || subjects[subject][0] === "PHY" || subjects[subject][0] === "BIO" ? "Science laboratory" : room;
        db.slots.push(slot(runs[subject].offeringId, day, start, end, venue));
      });
    }
  }

  const item = (offeringId: string, componentKey: string, title: string, instructions: string, dueAt: Date, postedAt: Date) =>
    db.items.push({ itemId: crypto.randomUUID(), offeringId, componentKey, title, instructions, dueAt: iso(dueAt), postedAt: iso(postedAt) });
  item(armA[0].offeringId, "test1", "1st CA test: indices and logarithms", "30 minutes, in class.", addDays(now, -5, 9), addDays(now, -12));
  item(armA[0].offeringId, "assignment", "Assignment: quadratic equations", "Exercise 3.2, questions 1–15 in your textbook. Submit a photo of your notebook.", addDays(now, 4, 16), addDays(now, -2));
  item(armA[0].offeringId, "test2", "2nd CA test", "Covers weeks 5–8.", addDays(now, 28, 9), addDays(now, -1));
  item(armB[0].offeringId, "test1", "1st CA test: indices and logarithms", "30 minutes, in class.", addDays(now, -4, 9), addDays(now, -12));
  item(armA[1].offeringId, "assignment", "Essay: my most memorable day", "Write 350–450 words. Pay attention to paragraphing.", addDays(now, 2, 16), addDays(now, -4));
  item(armA[3].offeringId, "test1", "1st CA test: atomic structure", "In the laboratory.", addDays(now, -2, 10), addDays(now, -10));

  const me = studentsA[0].studentProfileId;
  const remarks = ["A promising start. Tobi should read more in Physics.", "Good effort this term. Keep it up.", "An excellent result. Promoted to SS 2."];
  past.terms.forEach((term, index) => db.remarks.push({ studentProfileId: me, termId: term.termId, remark: remarks[index] }));
  db.notifications.push(
    notice(me, "Memo", "PTA meeting on Saturday", "Parents and guardians are invited to the first PTA meeting of the session at 10 am on Saturday in the school hall.", addDays(now, -6), null, true),
    notice(me, "Marks", "Mathematics: 1st Test marks are out", "Your 1st test marks for Mathematics have been published.", addDays(now, -3, 14), "results"),
    notice(me, "Coursework", "New assignment in Mathematics", "Assignment: quadratic equations. Due in 4 days.", addDays(now, -2), "coursework"),
    notice(me, "Marks", "Chemistry: 1st Test marks are out", "Your 1st test marks for Chemistry have been published.", addDays(now, -1, 13), "results"),
  );
  db.notifications.push(
    notice(okeke, "Memo", "CA records due in week 6", "Heads of department will collect first-term CA records in week 6. Please have 1st test marks published by then.", addDays(now, -5), null, true),
  );

  db.staffRecords.push(
    { staffProfileId: bursar, cadre: "Bursary · Accountant II", salaryScale: "CONPSS", gradeLevel: 8, step: 2, confirmedOn: "2020-02-01", nextPromotionDue: "2027-01-01", supervisorId: principal },
    { staffProfileId: principal, cadre: "Administration · Principal", salaryScale: "CONPSS", gradeLevel: 15, step: 4, confirmedOn: "2008-09-01", nextPromotionDue: null, supervisorId: null },
  );
  seedNonTeaching(db, bursar, now, {
    duties: [1, 2, 3, 4, 5].map(day => ({ day: day as Weekday, start: "07:30", end: "15:30", location: "Bursary office", role: day === 1 ? "Fee collection & receipts" : "Accounts" })),
    tasks: [
      { title: "Reconcile first-term fee payments", detail: "Match bank statements against receipts issued since resumption and list any unpaid balances by class.", requestedBy: "Mrs. Folake Adewale", priority: "Urgent", status: "In progress", dueOn: addDays(now, 3) },
      { title: "Prepare September imprest retirement", detail: "Retire the September imprest with receipts attached.", requestedBy: "Mrs. Folake Adewale", priority: "Normal", status: "Open", dueOn: addDays(now, 6) },
      { title: "Send fee reminders to SS 3 parents", detail: "Send reminders for WAEC registration fees.", requestedBy: "Mrs. Folake Adewale", priority: "Normal", status: "Done", dueOn: addDays(now, -4) },
    ],
    leave: [{ type: "Annual", startsOn: "2026-08-03", endsOn: "2026-08-21", reason: "Annual vacation", status: "Approved" }],
    appraisals: [{ year: 2025, rating: "Very good", score: 81, appraiser: "Mrs. Folake Adewale", comment: "Accurate records and prompt reporting." }],
    memos: [["Resumption staff meeting", "All staff are to attend the resumption meeting on Monday at 7:30 am in the staff room."]],
  });
  persist();
}

// ─── Shared non-teaching records ────────────────────────────────────────────

type NonTeachingSeed = {
  duties: { day: Weekday; start: string; end: string; location: string; role: string }[];
  tasks: { title: string; detail: string; requestedBy: string; priority: "Low" | "Normal" | "Urgent"; status: "Open" | "In progress" | "Done"; dueOn: Date }[];
  leave: { type: "Annual" | "Casual"; startsOn: string; endsOn: string; reason: string; status: "Approved" }[];
  appraisals: { year: number; rating: "Outstanding" | "Very good" | "Good" | "Fair" | "Poor"; score: number; appraiser: string; comment: string }[];
  memos: [string, string][];
};

function seedNonTeaching(db: ReturnType<typeof portalSeedUtils>["db"], staffProfileId: string, now: Date, seed: NonTeachingSeed) {
  for (const duty of seed.duties) db.duties.push({ dutyId: crypto.randomUUID(), staffProfileId, ...duty });
  for (const task of seed.tasks) db.tasks.push({ taskId: crypto.randomUUID(), staffProfileId, ...task, dueOn: task.dueOn.toISOString().slice(0, 10), updatedAt: iso(addDays(now, -1)) });
  for (const request of seed.leave) {
    const start = Date.parse(`${request.startsOn}T00:00:00Z`);
    const end = Date.parse(`${request.endsOn}T00:00:00Z`);
    let days = 0;
    for (let time = start; time <= end; time += 86_400_000) if (![0, 6].includes(new Date(time).getUTCDay())) days += 1;
    db.leave.push({ requestId: crypto.randomUUID(), staffProfileId, ...request, days, createdAt: `${request.startsOn}T08:00:00.000Z`, decidedBy: "Supervisor" });
  }
  for (const appraisal of seed.appraisals) db.appraisals.push({ staffProfileId, ...appraisal });
  seed.memos.forEach(([title, body], index) => db.notifications.push(notice(staffProfileId, "Memo", title, body, addDays(now, -2 - index * 3), null, index > 0)));
  db.notifications.push(notice(staffProfileId, "Task", "New task assigned", seed.tasks[0].title, addDays(now, -1), "tasks"));
}
