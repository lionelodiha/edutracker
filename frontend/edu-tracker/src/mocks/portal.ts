/**
 * Portal mock store: student, teaching-staff and non-teaching-staff portals.
 *
 * Like faculty.ts, this is the server. Every rule lives here, not in the UI:
 * only an offering's lecturer can mark it, a submitted sheet is locked,
 * marks are checked against the scheme, and students only ever see
 * components the lecturer has published.
 *
 * Offerings, courses and sessions come from the academic store; people come
 * from the faculty store. This file only adds what the portals need on top:
 * timetables, coursework, result sheets, notifications and staff records.
 */
import { readAcademics } from "../features/academics/store";
import type { AcademicOffering, AcademicSession, AcademicTerm, CatalogueCourse } from "../features/academics/types";
import {
  checkScore, gpa, gradeFor, isComplete, rank, schemeFor, sumOf,
  type AssessmentComponent, type Scores,
} from "../features/assessment/scheme";
import { readSchoolSetup } from "../features/cohorts/schoolSetup";
import { getGroupSettings, type SchoolModel } from "../features/cohorts/settings";
import type { StudentProfile } from "../features/cohorts/courses";
import { POST_NAMES, isAppointmentLive } from "../features/staff/appointments";
import type { StaffProfile } from "../features/staff/types";
import type {
  AdminSlot, DepartmentTimetable, LeaveQueueRow, OfferingRoster, StaffOperations,
  Appraisal, DepartmentResultRow, DutyShift, LeaveRequest, LeaveType, NonTeachingPortal,
  NotificationKind, PortalNotification, PortalOrganization, PortalPayload, PortalTerm,
  ResultPeriod, ResultRow, ResultSheet, SheetStatus, StaffSummary, StudentCoursework,
  StudentPortal, TaskStatus, TeacherClass, TeacherPortal, TimetableEntry, Weekday, WorkTask,
} from "../features/portal/types";
import { facultyRecords, type Op, type OpErr, type OpOk } from "./faculty";

const ok = <T>(data: T, status = 200): OpOk<T> => ({ ok: true, data, status });
/** Copy of a row without one field (used to drop server-only keys from responses). */
function omit<T extends object, K extends keyof T>(row: T, key: K): Omit<T, K> {
  const copy = { ...row };
  delete copy[key];
  return copy;
}
const err = (status: number, code: string, message: string): OpErr => ({ ok: false, status, code, message });

// ─── Storage ────────────────────────────────────────────────────────────────

export type Slot = { slotId: string; offeringId: string; day: Weekday; start: string; end: string; venue: string };
export type Sheet = {
  offeringId: string;
  scores: Record<string, Scores>; // studentProfileId → component → mark
  published: Record<string, string>; // componentKey → ISO
  status: "Draft" | "Submitted";
  submittedAt: string | null;
  updatedAt: string | null;
};
export type CourseworkItem = {
  itemId: string; offeringId: string; componentKey: string; title: string;
  instructions: string; dueAt: string | null; postedAt: string;
};
type Submission = { itemId: string; studentProfileId: string; submittedAt: string; note: string; fileName: string | null };
type Notice = PortalNotification & { recipientId: string };
export type StaffRecord = {
  staffProfileId: string; cadre: string; salaryScale: string; gradeLevel: number; step: number;
  confirmedOn: string | null; nextPromotionDue: string | null; supervisorId: string | null;
};

type PortalDB = {
  slots: Slot[];
  /** `dropped` removes a student from one offering, even if they'd be placed automatically. */
  enrolments: { offeringId: string; studentProfileId: string; dropped?: boolean }[];
  /** A student's level when it differs from their entry level (returning students). */
  levels: { studentProfileId: string; level: string }[];
  advisers: { departmentId: string; levelKey: string; staffProfileId: string }[];
  sheets: Sheet[];
  items: CourseworkItem[];
  submissions: Submission[];
  notifications: Notice[];
  remarks: { studentProfileId: string; termId: string; remark: string }[];
  staffRecords: StaffRecord[];
  leave: (LeaveRequest & { staffProfileId: string })[];
  duties: (DutyShift & { staffProfileId: string })[];
  tasks: (WorkTask & { staffProfileId: string })[];
  appraisals: (Appraisal & { staffProfileId: string })[];
};

const emptyDB = (): PortalDB => ({
  slots: [], enrolments: [], levels: [], advisers: [], sheets: [], items: [], submissions: [],
  notifications: [], remarks: [], staffRecords: [], leave: [], duties: [], tasks: [], appraisals: [],
});
const memory = new Map<string, PortalDB>();
const storageKey = (organizationId: string) => `edutracker.portal.${organizationId}`;

function loadDB(organizationId: string): PortalDB {
  const cached = memory.get(organizationId);
  if (cached) return cached;
  let db = emptyDB();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(organizationId)) || "null");
    if (saved && typeof saved === "object") db = { ...emptyDB(), ...saved };
  } catch { /* Tests and restricted browsers use memory. */ }
  memory.set(organizationId, db);
  return db;
}
function saveDB(organizationId: string) {
  const db = memory.get(organizationId);
  if (!db) return;
  try { localStorage.setItem(storageKey(organizationId), JSON.stringify(db)); } catch { /* Memory stays the source of truth. */ }
}

export function resetPortalMocks() {
  memory.clear();
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith("edutracker.portal.")) doomed.push(key);
    }
    doomed.forEach(key => localStorage.removeItem(key));
  } catch { /* Memory is already clear. */ }
}

/** Direct access for the demo seed and tests. */
export function portalSeedUtils(organizationId: string) {
  const db = loadDB(organizationId);
  return { db, persist: () => saveDB(organizationId) };
}

// ─── Context ────────────────────────────────────────────────────────────────

type Ctx = {
  organizationId: string;
  model: SchoolModel;
  scheme: AssessmentComponent[];
  db: PortalDB;
  sessions: AcademicSession[];
  courses: Map<string, CatalogueCourse>;
  offerings: AcademicOffering[];
  departments: ReturnType<typeof readAcademics>["departments"];
  units: { key: string; parent: string | null; name: string }[];
  students: StudentProfile[];
  staff: StaffProfile[];
  people: ReturnType<typeof facultyRecords>;
  now: Date;
};

function context(organizationId: string, now: Date): Ctx {
  const academics = readAcademics(organizationId);
  const setup = readSchoolSetup(organizationId);
  const model = setup?.model ?? getGroupSettings(organizationId).model;
  const people = facultyRecords(organizationId);
  return {
    organizationId, model, scheme: schemeFor(model), db: loadDB(organizationId),
    sessions: academics.sessions, courses: new Map(academics.courses.map(course => [course.courseId, course])),
    offerings: academics.offerings, departments: academics.departments,
    units: setup?.structure.units ?? [], students: people.students, staff: people.staff, people, now,
  };
}

function organizationOf(c: Ctx): PortalOrganization {
  let name = "Your school";
  try { name = localStorage.getItem(`edutracker.organizationName.${c.organizationId}`) || name; } catch { /* Keep the fallback. */ }
  return { organizationId: c.organizationId, name, model: c.model };
}

const unitName = (c: Ctx, key: string | null | undefined) => (key ? c.units.find(unit => unit.key === key)?.name ?? null : null);
const staffName = (c: Ctx, id: string | null | undefined) => {
  const person = id ? c.staff.find(member => member.staffProfileId === id) : undefined;
  return person ? `${person.title ? `${person.title} ` : ""}${person.fullName}` : null;
};

function sessionAndTerm(c: Ctx, offering: AcademicOffering): { session: AcademicSession | undefined; term: AcademicTerm | undefined } {
  const session = c.sessions.find(item => item.sessionId === offering.sessionId);
  return { session, term: session?.terms.find(item => item.termId === offering.termId) };
}

function currentTerm(c: Ctx): PortalTerm | null {
  const session = c.sessions.find(item => item.status === "Current");
  const term = session?.terms.find(item => item.status === "Current") ?? session?.terms[0];
  if (!session || !term) return null;
  return { sessionId: session.sessionId, sessionName: session.name, termId: term.termId, termName: term.name, startsOn: term.startsOn, endsOn: term.endsOn };
}

/** Department and current level of a student. The level comes from the entry stage unless the demo moved them up. */
function placement(c: Ctx, student: StudentProfile): { departmentId: string | null; level: string | null } {
  let department = c.departments.find(item => item.unitKey === student.programmeId);
  if (!department) {
    const parent = c.units.find(unit => unit.key === student.programmeId)?.parent;
    department = c.departments.find(item => item.unitKey === parent);
  }
  if (!department) return { departmentId: null, level: null };
  const moved = c.db.levels.find(item => item.studentProfileId === student.studentProfileId)?.level;
  const index = Number.parseInt(student.entryStageId.replace(/^stage-/, ""), 10);
  return { departmentId: department.unitKey, level: moved ?? department.levels[Number.isInteger(index) ? index : 0] ?? null };
}

export type RosterSource = "Registered" | "Automatic";

/**
 * Who is on an offering's roster, and why. Decided per offering:
 * - "Registered": added by hand (a carry-over, an elective, another
 *   department's course);
 * - "Automatic": an active student whose department and level match the
 *   offering, so freshly approved students appear without a separate
 *   registration step.
 * A drop record removes a student from that one offering only.
 */
function rosterWithSource(c: Ctx, offering: AcademicOffering): { student: StudentProfile; source: RosterSource }[] {
  const rows = c.db.enrolments.filter(item => item.offeringId === offering.offeringId);
  const registered = new Set(rows.filter(item => !item.dropped).map(item => item.studentProfileId));
  const dropped = new Set(rows.filter(item => item.dropped).map(item => item.studentProfileId));
  return c.students
    .flatMap<{ student: StudentProfile; source: RosterSource }>(student => {
      if (registered.has(student.studentProfileId)) return [{ student, source: "Registered" }];
      if (dropped.has(student.studentProfileId) || student.status !== "Active") return [];
      const place = placement(c, student);
      return place.departmentId === offering.departmentId && place.level === offering.levelKey ? [{ student, source: "Automatic" }] : [];
    })
    .sort((a, b) => a.student.matriculationNumber.localeCompare(b.student.matriculationNumber));
}

function rosterOf(c: Ctx, offering: AcademicOffering): StudentProfile[] {
  return rosterWithSource(c, offering).map(item => item.student);
}

const sheetOf = (c: Ctx, offeringId: string) => c.db.sheets.find(sheet => sheet.offeringId === offeringId);

function statusOf(sheet: Sheet | undefined): SheetStatus {
  if (!sheet) return "Not started";
  if (sheet.status === "Submitted") return "Submitted";
  const any = Object.values(sheet.scores).some(scores => Object.values(scores).some(value => typeof value === "number"));
  return any || Object.keys(sheet.published).length ? "Partial" : "Not started";
}

function classStats(c: Ctx, sheet: Sheet | undefined, roster: StudentProfile[]) {
  const totals = roster
    .map(student => sheet?.scores[student.studentProfileId] ?? {})
    .filter(scores => isComplete(c.scheme, scores))
    .map(scores => sumOf(c.scheme, scores));
  const average = totals.length ? Math.round((totals.reduce((sum, value) => sum + value, 0) / totals.length) * 10) / 10 : null;
  const passRate = totals.length ? Math.round((totals.filter(total => gradeFor(c.model, total).pass).length / totals.length) * 100) : null;
  const counts = new Map<string, number>();
  for (const total of totals) { const grade = gradeFor(c.model, total).grade; counts.set(grade, (counts.get(grade) ?? 0) + 1); }
  return { totals, average, passRate, distribution: [...counts.entries()].map(([grade, count]) => ({ grade, count })) };
}

function notify(c: Ctx, recipientIds: string[], kind: NotificationKind, title: string, body: string, link: string | null) {
  const createdAt = c.now.toISOString();
  for (const recipientId of new Set(recipientIds)) {
    c.db.notifications.push({ notificationId: crypto.randomUUID(), recipientId, kind, title, body, createdAt, readAt: null, link });
  }
}
const inbox = (c: Ctx, recipientId: string): PortalNotification[] => c.db.notifications
  .filter(item => item.recipientId === recipientId)
  // Reversed first so that, with a stable sort, the later of two same-time notifications leads.
  .reverse()
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, 60)
  .map(item => omit(item, "recipientId"));

function hodOf(c: Ctx, departmentId: string): string | null {
  const detail = c.departments.find(item => item.unitKey === departmentId)?.hodStaffProfileId;
  if (detail) return detail;
  return c.people.appointments.find(item => item.post === "HOD" && item.scopeId === departmentId && isAppointmentLive(item, c.now))?.staffProfileId ?? null;
}

function staffSummary(c: Ctx, member: StaffProfile): StaffSummary {
  return {
    staffProfileId: member.staffProfileId, title: member.title, fullName: member.fullName, staffNumber: member.staffNumber,
    schoolEmail: member.schoolEmail, kind: member.kind,
    rank: member.rankId ? c.people.ranks.find(item => item.rankId === member.rankId)?.name ?? null : null,
    unitName: unitName(c, member.unitId), appointedOn: member.appointedOn,
    posts: c.people.appointments
      .filter(item => item.staffProfileId === member.staffProfileId && isAppointmentLive(item, c.now))
      .map(item => `${POST_NAMES[item.post]}${unitName(c, item.scopeId) ? `, ${unitName(c, item.scopeId)}` : ""}`),
  };
}

// ─── Identity ───────────────────────────────────────────────────────────────

type Actor = { kind: "Student"; student: StudentProfile } | { kind: "Staff"; staff: StaffProfile };

function actorOf(c: Ctx, userId: string): Actor | null {
  const student = c.students.find(item => item.userId === userId);
  if (student) return { kind: "Student", student };
  const staff = c.staff.find(item => item.userId === userId);
  return staff ? { kind: "Staff", staff } : null;
}
const notSignedIn = () => err(401, "PORTAL_SESSION_INVALID", "Your portal session has ended. Sign in again.");

// ─── Public school lookup ───────────────────────────────────────────────────

/** What the portal sign-in page shows before anyone signs in. Unknown schools are 404. */
export function schoolInfo(organizationId: string): Op<PortalOrganization> {
  if (!readSchoolSetup(organizationId)) return err(404, "SCHOOL_NOT_FOUND", "We couldn't find that school's portal. Check the link you were given.");
  return ok(organizationOf(context(organizationId, new Date())));
}

// ─── Payloads ───────────────────────────────────────────────────────────────

export function portalFor(organizationId: string, userId: string, now: Date = new Date()): Op<PortalPayload> {
  const c = context(organizationId, now);
  const actor = actorOf(c, userId);
  if (!actor) return notSignedIn();
  if (actor.kind === "Student") return ok(studentPortal(c, actor.student));
  if (actor.staff.kind === "Academic") return ok(teacherPortal(c, actor.staff));
  return ok(nonTeachingPortal(c, actor.staff));
}

function studentPortal(c: Ctx, student: StudentProfile): StudentPortal {
  const place = placement(c, student);
  const department = place.departmentId;
  const term = currentTerm(c);
  const mine = c.offerings.filter(offering => rosterOf(c, offering).some(person => person.studentProfileId === student.studentProfileId));
  const current = mine.filter(offering => offering.termId === term?.termId);
  const courseOf = (offering: AcademicOffering) => c.courses.get(offering.courseId);

  const courses = current.map(offering => ({
    offeringId: offering.offeringId, code: courseOf(offering)?.code ?? "—", title: courseOf(offering)?.title ?? "Unknown course",
    units: offering.units, isCompulsory: offering.isCompulsory, lecturer: staffName(c, offering.lecturerStaffProfileId),
    termName: sessionAndTerm(c, offering).term?.name ?? "",
  })).sort((a, b) => a.code.localeCompare(b.code));

  const timetable: TimetableEntry[] = c.db.slots
    .filter(slot => current.some(offering => offering.offeringId === slot.offeringId))
    .map(slot => {
      const offering = current.find(item => item.offeringId === slot.offeringId)!;
      return { ...slot, code: courseOf(offering)?.code ?? "—", title: courseOf(offering)?.title ?? "", detail: staffName(c, offering.lecturerStaffProfileId) ?? "Lecturer not assigned" };
    });

  const coursework: StudentCoursework[] = c.db.items
    .filter(item => current.some(offering => offering.offeringId === item.offeringId))
    .map(item => {
      const component = c.scheme.find(entry => entry.key === item.componentKey)!;
      const offering = current.find(entry => entry.offeringId === item.offeringId)!;
      const sheet = sheetOf(c, item.offeringId);
      const published = sheet?.published[item.componentKey];
      const raw = sheet?.scores[student.studentProfileId]?.[item.componentKey];
      const mark = published && typeof raw === "number" ? raw : null;
      const submission = c.db.submissions.find(entry => entry.itemId === item.itemId && entry.studentProfileId === student.studentProfileId) ?? null;
      const acceptsSubmission = component.kind === "Assignment" || component.kind === "Project";
      const past = item.dueAt !== null && Date.parse(item.dueAt) < c.now.getTime();
      const state = mark !== null ? "Marked"
        : !acceptsSubmission ? (past ? "Awaiting marks" : "Scheduled")
        : submission ? "Submitted"
        : past ? "Overdue" : "Open";
      return {
        itemId: item.itemId, offeringId: item.offeringId, code: courseOf(offering)?.code ?? "—", title: item.title,
        kind: component.kind, componentKey: item.componentKey, instructions: item.instructions, dueAt: item.dueAt,
        max: component.max, postedAt: item.postedAt, acceptsSubmission,
        submission: submission ? { submittedAt: submission.submittedAt, note: submission.note, fileName: submission.fileName } : null,
        mark, state,
      } satisfies StudentCoursework;
    })
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));

  const results = resultPeriods(c, student, mine);
  const allRows = results.flatMap(period => period.rows);
  const cgpa = c.model === "University" ? gpa(allRows.map(row => ({ units: row.units, points: row.points }))) : null;
  const adviser = c.db.advisers.find(item => item.departmentId === department && item.levelKey === place.level);
  const entrySession = c.sessions.find(item => item.sessionId === student.entrySessionId)?.name ?? null;

  return {
    role: "Student",
    organization: organizationOf(c),
    profile: {
      studentProfileId: student.studentProfileId, fullName: student.fullName, matriculationNumber: student.matriculationNumber,
      schoolEmail: student.schoolEmail, status: student.status,
      facultyName: unitName(c, c.units.find(unit => unit.key === department)?.parent),
      departmentName: unitName(c, department), level: place.level,
      adviser: staffName(c, adviser?.staffProfileId), entrySession,
    },
    term, scheme: c.scheme, courses, timetable, coursework, results, cgpa,
    notifications: inbox(c, student.studentProfileId),
  };
}

function resultPeriods(c: Ctx, student: StudentProfile, mine: AcademicOffering[]): ResultPeriod[] {
  const byTerm = new Map<string, AcademicOffering[]>();
  for (const offering of mine) byTerm.set(offering.termId, [...(byTerm.get(offering.termId) ?? []), offering]);

  const periods: (ResultPeriod & { order: number })[] = [];
  for (const [termId, runs] of byTerm) {
    const { session, term } = sessionAndTerm(c, runs[0]);
    if (!session || !term) continue;
    const rows = runs.map(offering => resultRow(c, student, offering)).sort((a, b) => a.code.localeCompare(b.code));
    const final = rows.filter(row => row.status === "Submitted" && row.total !== null);
    const allFinal = rows.length > 0 && final.length === rows.length;
    const average = allFinal ? Math.round((final.reduce((sum, row) => sum + row.total!, 0) / final.length) * 10) / 10 : null;

    // Class position: classmates are everyone on these offerings' rosters in the same department and level.
    let position: number | null = null;
    let classSize = 0;
    if (c.model !== "University") {
      const termRuns = c.offerings.filter(offering => offering.termId === termId && offering.departmentId === runs[0].departmentId && offering.levelKey === runs[0].levelKey);
      const classmates = new Map<string, number[]>();
      for (const offering of termRuns) {
        const sheet = sheetOf(c, offering.offeringId);
        for (const person of rosterOf(c, offering)) {
          const scores = sheet?.status === "Submitted" ? sheet.scores[person.studentProfileId] ?? {} : {};
          const list = classmates.get(person.studentProfileId) ?? [];
          if (isComplete(c.scheme, scores)) list.push(sumOf(c.scheme, scores));
          else list.push(Number.NaN);
          classmates.set(person.studentProfileId, list);
        }
      }
      classSize = classmates.size;
      const averages = [...classmates.entries()]
        .filter(([, totals]) => totals.length > 0 && totals.every(Number.isFinite))
        .map(([id, totals]) => ({ id, average: totals.reduce((sum, value) => sum + value, 0) / totals.length }));
      const ranked = rank(averages, entry => Math.round(entry.average * 10));
      const self = averages.find(entry => entry.id === student.studentProfileId);
      position = allFinal && self ? ranked.get(self) ?? null : null;
    }

    periods.push({
      order: session.startYear * 10 + term.ordinal,
      sessionId: session.sessionId, sessionName: session.name, termId, termName: term.name,
      level: runs[0].levelKey, closed: term.status === "Closed", rows,
      gpa: c.model === "University" ? gpa(final.map(row => ({ units: row.units, points: row.points }))) : null,
      unitsTaken: rows.reduce((sum, row) => sum + row.units, 0),
      unitsPassed: final.filter(row => row.grade !== null && gradeFor(c.model, row.total!).pass).reduce((sum, row) => sum + row.units, 0),
      average, position, classSize,
      remark: c.db.remarks.find(item => item.studentProfileId === student.studentProfileId && item.termId === termId)?.remark ?? null,
    });
  }
  return periods.sort((a, b) => b.order - a.order).map(period => omit(period, "order"));
}

function resultRow(c: Ctx, student: StudentProfile, offering: AcademicOffering): ResultRow {
  const course = c.courses.get(offering.courseId);
  const sheet = sheetOf(c, offering.offeringId);
  const raw = sheet?.scores[student.studentProfileId] ?? {};
  const published = sheet?.published ?? {};
  const scores: Scores = {};
  for (const component of c.scheme) if (published[component.key] && typeof raw[component.key] === "number") scores[component.key] = raw[component.key];
  const caPublished = c.scheme.some(component => component.part === "CA" && component.key in scores);
  const final = sheet?.status === "Submitted" && isComplete(c.scheme, raw);
  const total = final ? sumOf(c.scheme, raw) : null;
  const band = total !== null ? gradeFor(c.model, total) : null;
  const roster = rosterOf(c, offering);
  const stats = final ? classStats(c, sheet, roster) : null;
  let position: number | null = null;
  if (final && total !== null) {
    const entries = roster.map(person => ({ id: person.studentProfileId, scores: sheet!.scores[person.studentProfileId] ?? {} }))
      .filter(entry => isComplete(c.scheme, entry.scores))
      .map(entry => ({ id: entry.id, total: sumOf(c.scheme, entry.scores) }));
    const ranked = rank(entries, entry => entry.total);
    const self = entries.find(entry => entry.id === student.studentProfileId);
    position = self ? ranked.get(self) ?? null : null;
  }
  return {
    offeringId: offering.offeringId, code: course?.code ?? "—", title: course?.title ?? "Unknown course", units: offering.units,
    scores, published, ca: caPublished ? sumOf(c.scheme, scores, "CA") : null, total,
    grade: band?.grade ?? null, points: band && c.model === "University" ? band.points : null, remark: band?.remark ?? null,
    status: statusOf(sheet), classAverage: stats?.average ?? null, position, classSize: roster.length,
  };
}

function teacherPortal(c: Ctx, member: StaffProfile): TeacherPortal {
  const term = currentTerm(c);
  const mine = c.offerings.filter(offering => offering.lecturerStaffProfileId === member.staffProfileId && offering.sessionId === term?.sessionId);
  const classes: TeacherClass[] = mine.map(offering => {
    const course = c.courses.get(offering.courseId);
    const sheet = sheetOf(c, offering.offeringId);
    const roster = rosterOf(c, offering);
    const stats = classStats(c, sheet, roster);
    const entered = roster.reduce((sum, person) => sum + c.scheme.filter(component => typeof sheet?.scores[person.studentProfileId]?.[component.key] === "number").length, 0);
    const { term: runTerm } = sessionAndTerm(c, offering);
    return {
      offeringId: offering.offeringId, code: course?.code ?? "—", title: course?.title ?? "Unknown course", units: offering.units,
      levelKey: offering.levelKey, departmentName: unitName(c, offering.departmentId) ?? "—",
      termName: runTerm?.name ?? "", termClosed: runTerm?.status === "Closed",
      enrolled: roster.length, status: statusOf(sheet), entered, expected: roster.length * c.scheme.length,
      published: sheet?.published ?? {}, submittedAt: sheet?.submittedAt ?? null,
      average: stats.average, passRate: stats.passRate, distribution: stats.distribution,
    };
  }).sort((a, b) => a.code.localeCompare(b.code));
  const currentRuns = mine.filter(offering => offering.termId === term?.termId);
  const timetable: TimetableEntry[] = c.db.slots
    .filter(slot => currentRuns.some(offering => offering.offeringId === slot.offeringId))
    .map(slot => {
      const offering = currentRuns.find(item => item.offeringId === slot.offeringId)!;
      const course = c.courses.get(offering.courseId);
      return { ...slot, code: course?.code ?? "—", title: course?.title ?? "", detail: `${offering.levelKey} · ${unitName(c, offering.departmentId) ?? ""}` };
    });
  const coursework = c.db.items
    .filter(item => mine.some(offering => offering.offeringId === item.offeringId))
    .map(item => {
      const offering = mine.find(entry => entry.offeringId === item.offeringId)!;
      const component = c.scheme.find(entry => entry.key === item.componentKey)!;
      return {
        itemId: item.itemId, offeringId: item.offeringId, code: c.courses.get(offering.courseId)?.code ?? "—",
        kind: component.kind, componentKey: item.componentKey, title: item.title, instructions: item.instructions,
        dueAt: item.dueAt, max: component.max, postedAt: item.postedAt,
        submissions: c.db.submissions.filter(entry => entry.itemId === item.itemId).length,
        enrolled: rosterOf(c, offering).length,
      };
    })
    .sort((a, b) => (b.dueAt ?? "").localeCompare(a.dueAt ?? ""));
  return {
    role: "Teaching", organization: organizationOf(c), profile: staffSummary(c, member), term, scheme: c.scheme,
    classes, timetable, coursework, notifications: inbox(c, member.staffProfileId),
  };
}

/** Working days (Monday–Friday) between two ISO dates, inclusive. */
export function workingDays(startsOn: string, endsOn: string): number {
  const start = Date.parse(`${startsOn}T00:00:00Z`);
  const end = Date.parse(`${endsOn}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  let days = 0;
  for (let time = start; time <= end; time += 86_400_000) {
    const day = new Date(time).getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return days;
}

/** Public Service Rules: officers on grade level 07 and above get 30 working days; below that, 21. */
export const annualEntitlement = (gradeLevel: number) => (gradeLevel >= 7 ? 30 : 21);

function nonTeachingPortal(c: Ctx, member: StaffProfile): NonTeachingPortal {
  const record = c.db.staffRecords.find(item => item.staffProfileId === member.staffProfileId);
  const year = c.now.getUTCFullYear();
  const requests = c.db.leave
    .filter(item => item.staffProfileId === member.staffProfileId)
    .sort((a, b) => b.startsOn.localeCompare(a.startsOn))
    .map(item => omit(item, "staffProfileId"));
  const annualThisYear = requests.filter(item => item.type === "Annual" && item.startsOn.startsWith(String(year)));
  const entitlement = annualEntitlement(record?.gradeLevel ?? 7);
  const used = annualThisYear.filter(item => item.status === "Approved").reduce((sum, item) => sum + item.days, 0);
  const pending = annualThisYear.filter(item => item.status === "Pending").reduce((sum, item) => sum + item.days, 0);
  return {
    role: "NonTeaching",
    organization: organizationOf(c),
    profile: {
      ...staffSummary(c, member),
      cadre: record?.cadre ?? (member.kind === "Technical" ? "Technical" : "Administrative"),
      salaryScale: record?.salaryScale ?? "CONTISS",
      gradeLevel: record?.gradeLevel ?? 7,
      step: record?.step ?? 1,
      confirmedOn: record?.confirmedOn ?? null,
      nextPromotionDue: record?.nextPromotionDue ?? null,
      supervisor: staffName(c, record?.supervisorId),
    },
    leave: { annualEntitlement: entitlement, used, pending, remaining: Math.max(0, entitlement - used - pending), requests },
    duties: c.db.duties.filter(item => item.staffProfileId === member.staffProfileId).map(item => omit(item, "staffProfileId")),
    tasks: c.db.tasks
      .filter(item => item.staffProfileId === member.staffProfileId)
      .map(item => omit(item, "staffProfileId"))
      .sort((a, b) => (a.status === "Done" ? 1 : 0) - (b.status === "Done" ? 1 : 0) || (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999")),
    appraisals: c.db.appraisals
      .filter(item => item.staffProfileId === member.staffProfileId)
      .map(item => omit(item, "staffProfileId"))
      .sort((a, b) => b.year - a.year),
    notifications: inbox(c, member.staffProfileId),
  };
}

// ─── Result sheets ──────────────────────────────────────────────────────────

function sheetView(c: Ctx, offering: AcademicOffering): ResultSheet {
  const course = c.courses.get(offering.courseId);
  const { session, term } = sessionAndTerm(c, offering);
  const sheet = sheetOf(c, offering.offeringId);
  const status = statusOf(sheet);
  return {
    offeringId: offering.offeringId, code: course?.code ?? "—", title: course?.title ?? "Unknown course", units: offering.units,
    levelKey: offering.levelKey, departmentName: unitName(c, offering.departmentId) ?? "—",
    sessionName: session?.name ?? "", termName: term?.name ?? "", lecturer: staffName(c, offering.lecturerStaffProfileId),
    model: c.model, scheme: c.scheme, status, published: sheet?.published ?? {},
    submittedAt: sheet?.submittedAt ?? null, updatedAt: sheet?.updatedAt ?? null,
    locked: status === "Submitted" || term?.status === "Closed",
    students: rosterOf(c, offering).map(person => ({
      studentProfileId: person.studentProfileId, fullName: person.fullName, matriculationNumber: person.matriculationNumber,
      scores: { ...(sheet?.scores[person.studentProfileId] ?? {}) },
    })),
  };
}

/** Resolve the offering and check the actor is its lecturer. */
function lecturerGuard(c: Ctx, userId: string, offeringId: string): OpErr | { offering: AcademicOffering; member: StaffProfile } {
  const actor = actorOf(c, userId);
  if (!actor) return notSignedIn();
  const offering = c.offerings.find(item => item.offeringId === offeringId);
  // Cross-organization or unknown ids are 404, so ids can't be probed.
  if (!offering) return err(404, "OFFERING_NOT_FOUND", "That course isn't in this school.");
  if (actor.kind !== "Staff" || offering.lecturerStaffProfileId !== actor.staff.staffProfileId) {
    return err(403, "NOT_COURSE_LECTURER", "Only the lecturer assigned to this course can change its marks.");
  }
  return { offering, member: actor.staff };
}

function editableSheet(c: Ctx, offering: AcademicOffering): OpErr | Sheet {
  const { term } = sessionAndTerm(c, offering);
  if (term?.status === "Closed") return err(409, "TERM_CLOSED", "This term is closed. Its results are read-only.");
  let sheet = sheetOf(c, offering.offeringId);
  if (sheet?.status === "Submitted") return err(409, "SHEET_SUBMITTED", "These results were submitted to the department and are locked.");
  if (!sheet) {
    sheet = { offeringId: offering.offeringId, scores: {}, published: {}, status: "Draft", submittedAt: null, updatedAt: null };
    c.db.sheets.push(sheet);
  }
  return sheet;
}

export function getSheet(organizationId: string, userId: string, offeringId: string, now: Date = new Date()): Op<ResultSheet> {
  const c = context(organizationId, now);
  const guard = lecturerGuard(c, userId, offeringId);
  if ("ok" in guard) return guard;
  return ok(sheetView(c, guard.offering));
}

/** Save marks as a draft. `null` clears a mark. Nothing reaches students until it is published. */
export function saveScores(organizationId: string, userId: string, offeringId: string, input: unknown, now: Date = new Date()): Op<ResultSheet> {
  const c = context(organizationId, now);
  const guard = lecturerGuard(c, userId, offeringId);
  if ("ok" in guard) return guard;
  if (!input || typeof input !== "object" || Array.isArray(input)) return err(400, "VALIDATION_FAILED", "Send marks as { studentProfileId: { component: mark } }.");
  const sheet = editableSheet(c, guard.offering);
  if ("ok" in sheet) return sheet;
  const roster = new Map(rosterOf(c, guard.offering).map(person => [person.studentProfileId, person]));
  const problems: string[] = [];
  const next = structuredClone(sheet.scores);
  for (const [studentId, marks] of Object.entries(input as Record<string, unknown>)) {
    const person = roster.get(studentId);
    if (!person) { problems.push("A student in the upload isn't on this course's roster."); continue; }
    if (!marks || typeof marks !== "object") continue;
    for (const [key, value] of Object.entries(marks as Record<string, unknown>)) {
      const component = c.scheme.find(item => item.key === key);
      if (!component) { problems.push(`"${key}" isn't part of this assessment.`); continue; }
      if (sheet.published[key]) {
        const existing = next[studentId]?.[key];
        const unchanged = value === null || value === "" ? typeof existing !== "number" : Number(value) === existing;
        if (!unchanged) problems.push(`${component.label} marks are already published and can't be changed.`);
        continue;
      }
      if (value === null || value === "") { if (next[studentId]) delete next[studentId][key]; continue; }
      const mark = typeof value === "number" ? value : Number(value);
      const problem = checkScore(component, mark);
      if (problem) { problems.push(`${person.fullName}: ${problem}`); continue; }
      next[studentId] = { ...(next[studentId] ?? {}), [key]: mark };
    }
  }
  if (problems.length) return err(422, "SCORES_INVALID", [...new Set(problems)].slice(0, 5).join(" "));
  sheet.scores = next;
  sheet.updatedAt = c.now.toISOString();
  saveDB(organizationId);
  return ok(sheetView(c, guard.offering));
}

/** Release components to students. Every student on the roster needs a mark first. */
export function publishComponents(organizationId: string, userId: string, offeringId: string, keys: unknown, now: Date = new Date()): Op<ResultSheet> {
  const c = context(organizationId, now);
  const guard = lecturerGuard(c, userId, offeringId);
  if ("ok" in guard) return guard;
  if (!Array.isArray(keys) || !keys.length) return err(400, "VALIDATION_FAILED", "Choose at least one assessment to publish.");
  const sheet = editableSheet(c, guard.offering);
  if ("ok" in sheet) return sheet;
  const roster = rosterOf(c, guard.offering);
  const labels: string[] = [];
  for (const key of keys) {
    const component = c.scheme.find(item => item.key === key);
    if (!component) return err(400, "VALIDATION_FAILED", `"${String(key)}" isn't part of this assessment.`);
    if (component.part === "Exam") return err(409, "EXAM_WITH_SUBMISSION", "Exam marks are released when you submit the final result.");
    const missing = roster.filter(person => typeof sheet.scores[person.studentProfileId]?.[component.key] !== "number").length;
    if (missing) return err(409, "MARKS_MISSING", `${missing} student${missing === 1 ? " has" : "s have"} no ${component.label} mark yet.`);
    if (!sheet.published[component.key]) { sheet.published[component.key] = c.now.toISOString(); labels.push(component.label); }
  }
  sheet.updatedAt = c.now.toISOString();
  const course = c.courses.get(guard.offering.courseId);
  if (labels.length) notify(c, roster.map(person => person.studentProfileId), "Marks",
    `${course?.code}: ${labels.join(" and ")} marks are out`, `Your ${labels.join(" and ").toLowerCase()} marks for ${course?.title} have been published.`, "results");
  saveDB(organizationId);
  return ok(sheetView(c, guard.offering));
}

/** Submit the final result to the department. Locks the sheet and releases every mark. */
export function submitSheet(organizationId: string, userId: string, offeringId: string, now: Date = new Date()): Op<ResultSheet> {
  const c = context(organizationId, now);
  const guard = lecturerGuard(c, userId, offeringId);
  if ("ok" in guard) return guard;
  const sheet = editableSheet(c, guard.offering);
  if ("ok" in sheet) return sheet;
  const roster = rosterOf(c, guard.offering);
  if (!roster.length) return err(409, "ROSTER_EMPTY", "No students are registered for this course.");
  const incomplete = roster.filter(person => !isComplete(c.scheme, sheet.scores[person.studentProfileId] ?? {})).length;
  if (incomplete) return err(409, "MARKS_MISSING", `${incomplete} student${incomplete === 1 ? " is" : "s are"} missing marks. Every student needs every mark before you submit.`);
  const stamp = c.now.toISOString();
  for (const component of c.scheme) sheet.published[component.key] ??= stamp;
  sheet.status = "Submitted";
  sheet.submittedAt = stamp;
  sheet.updatedAt = stamp;
  const course = c.courses.get(guard.offering.courseId);
  notify(c, roster.map(person => person.studentProfileId), "Result",
    `${course?.code} result released`, `Your final result for ${course?.title} is ready.`, "results");
  const hod = hodOf(c, guard.offering.departmentId);
  if (hod && hod !== guard.member.staffProfileId) notify(c, [hod], "Result",
    `${course?.code} results submitted`, `${staffName(c, guard.member.staffProfileId)} submitted ${course?.code} results for ${roster.length} students.`, null);
  saveDB(organizationId);
  return ok(sheetView(c, guard.offering));
}

// ─── Coursework ─────────────────────────────────────────────────────────────

export function postCoursework(organizationId: string, userId: string, input: Record<string, unknown>, now: Date = new Date()): Op<{ itemId: string }> {
  const c = context(organizationId, now);
  const guard = lecturerGuard(c, userId, String(input.offeringId ?? ""));
  if ("ok" in guard) return guard;
  const component = c.scheme.find(item => item.key === input.componentKey);
  if (!component || component.part === "Exam") return err(400, "VALIDATION_FAILED", "Choose a test, assignment or project.");
  const title = String(input.title ?? "").trim();
  if (!title) return err(400, "VALIDATION_FAILED", "Give it a title.");
  if (title.length > 120) return err(400, "VALIDATION_FAILED", "Keep the title under 120 characters.");
  const dueAt = typeof input.dueAt === "string" && input.dueAt ? input.dueAt : null;
  if (!dueAt || Number.isNaN(Date.parse(dueAt))) return err(400, "VALIDATION_FAILED", component.kind === "Test" ? "Choose when the test holds." : "Choose a due date.");
  if (Date.parse(dueAt) < c.now.getTime()) return err(400, "VALIDATION_FAILED", "The date must be in the future.");
  const { term } = sessionAndTerm(c, guard.offering);
  if (term?.status === "Closed") return err(409, "TERM_CLOSED", "This term is closed.");
  const item: CourseworkItem = {
    itemId: crypto.randomUUID(), offeringId: guard.offering.offeringId, componentKey: component.key, title,
    instructions: String(input.instructions ?? "").trim().slice(0, 2000), dueAt, postedAt: c.now.toISOString(),
  };
  c.db.items.push(item);
  const course = c.courses.get(guard.offering.courseId);
  const when = new Date(dueAt).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  notify(c, rosterOf(c, guard.offering).map(person => person.studentProfileId), "Coursework",
    `New ${component.kind.toLowerCase()} in ${course?.code}`,
    `${title} — ${component.kind === "Test" ? "holds" : "due"} ${when}.`, "coursework");
  saveDB(organizationId);
  return ok({ itemId: item.itemId }, 201);
}

export function submitCoursework(organizationId: string, userId: string, itemId: string, input: Record<string, unknown>, now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  const actor = actorOf(c, userId);
  if (!actor) return notSignedIn();
  if (actor.kind !== "Student") return err(403, "STUDENTS_ONLY", "Only students hand in coursework.");
  const item = c.db.items.find(entry => entry.itemId === itemId);
  const offering = item && c.offerings.find(entry => entry.offeringId === item.offeringId);
  if (!item || !offering || !rosterOf(c, offering).some(person => person.studentProfileId === actor.student.studentProfileId)) {
    return err(404, "COURSEWORK_NOT_FOUND", "That coursework isn't on any of your courses.");
  }
  const component = c.scheme.find(entry => entry.key === item.componentKey)!;
  if (component.kind !== "Assignment" && component.kind !== "Project") return err(409, "NOT_SUBMITTABLE", "Tests are written in class, not handed in here.");
  if (item.dueAt && Date.parse(item.dueAt) < c.now.getTime()) return err(409, "DEADLINE_PASSED", "The deadline has passed. Speak to your lecturer.");
  if (sheetOf(c, offering.offeringId)?.published[item.componentKey]) return err(409, "ALREADY_MARKED", "This has already been marked.");
  const note = String(input.note ?? "").trim();
  const fileName = typeof input.fileName === "string" && input.fileName.trim() ? input.fileName.trim().slice(0, 200) : null;
  if (!note && !fileName) return err(400, "VALIDATION_FAILED", "Attach a file or write your answer.");
  c.db.submissions = c.db.submissions.filter(entry => !(entry.itemId === itemId && entry.studentProfileId === actor.student.studentProfileId));
  c.db.submissions.push({ itemId, studentProfileId: actor.student.studentProfileId, submittedAt: c.now.toISOString(), note: note.slice(0, 4000), fileName });
  saveDB(organizationId);
  return ok(null);
}

// ─── Notifications ──────────────────────────────────────────────────────────

export function markRead(organizationId: string, userId: string, notificationId: string | "all", now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  const actor = actorOf(c, userId);
  if (!actor) return notSignedIn();
  const recipient = actor.kind === "Student" ? actor.student.studentProfileId : actor.staff.staffProfileId;
  for (const item of c.db.notifications) {
    if (item.recipientId === recipient && !item.readAt && (notificationId === "all" || item.notificationId === notificationId)) item.readAt = c.now.toISOString();
  }
  saveDB(organizationId);
  return ok(null);
}

// ─── Non-teaching staff ─────────────────────────────────────────────────────

const LEAVE_TYPES: LeaveType[] = ["Annual", "Casual", "Sick", "Study", "Maternity", "Compassionate"];

function nonTeachingGuard(c: Ctx, userId: string): OpErr | StaffProfile {
  const actor = actorOf(c, userId);
  if (!actor) return notSignedIn();
  if (actor.kind !== "Staff") return err(403, "STAFF_ONLY", "Only staff can do this.");
  return actor.staff;
}

export function requestLeave(organizationId: string, userId: string, input: Record<string, unknown>, now: Date = new Date()): Op<LeaveRequest> {
  const c = context(organizationId, now);
  const member = nonTeachingGuard(c, userId);
  if ("ok" in member) return member;
  const type = input.type as LeaveType;
  if (!LEAVE_TYPES.includes(type)) return err(400, "VALIDATION_FAILED", "Choose a type of leave.");
  const startsOn = String(input.startsOn ?? "");
  const endsOn = String(input.endsOn ?? "");
  const days = workingDays(startsOn, endsOn);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || Date.parse(endsOn) < Date.parse(startsOn)) {
    return err(400, "VALIDATION_FAILED", "Choose a start date and an end date on or after it.");
  }
  if (startsOn < c.now.toISOString().slice(0, 10)) return err(400, "VALIDATION_FAILED", "Leave can't start in the past.");
  if (!days) return err(400, "VALIDATION_FAILED", "Those dates fall on a weekend. Choose at least one working day.");
  const reason = String(input.reason ?? "").trim();
  if (!reason) return err(400, "VALIDATION_FAILED", "Add a short reason.");
  if (type === "Casual" && days > 7) return err(400, "VALIDATION_FAILED", "Casual leave is at most 7 working days.");
  const mine = c.db.leave.filter(item => item.staffProfileId === member.staffProfileId && item.status !== "Declined");
  if (mine.some(item => item.startsOn <= endsOn && item.endsOn >= startsOn)) return err(409, "LEAVE_OVERLAPS", "You already have leave on some of those days.");
  if (type === "Annual") {
    const record = c.db.staffRecords.find(item => item.staffProfileId === member.staffProfileId);
    const year = startsOn.slice(0, 4);
    const taken = mine.filter(item => item.type === "Annual" && item.startsOn.startsWith(year)).reduce((sum, item) => sum + item.days, 0);
    const left = annualEntitlement(record?.gradeLevel ?? 7) - taken;
    if (days > left) return err(409, "LEAVE_EXCEEDS_BALANCE", `You have ${left} working day${left === 1 ? "" : "s"} of annual leave left for ${year}.`);
  }
  const request: LeaveRequest & { staffProfileId: string } = {
    requestId: crypto.randomUUID(), staffProfileId: member.staffProfileId, type, startsOn, endsOn, days,
    reason: reason.slice(0, 500), status: "Pending", createdAt: c.now.toISOString(), decidedBy: null,
  };
  c.db.leave.push(request);
  const supervisor = c.db.staffRecords.find(item => item.staffProfileId === member.staffProfileId)?.supervisorId;
  if (supervisor) notify(c, [supervisor], "Leave", `Leave request from ${member.fullName}`, `${type} leave, ${days} working day${days === 1 ? "" : "s"} from ${startsOn}.`, null);
  saveDB(organizationId);
  return ok(omit(request, "staffProfileId"), 201);
}

const TASK_STATUSES: TaskStatus[] = ["Open", "In progress", "Done"];

export function updateTask(organizationId: string, userId: string, taskId: string, status: unknown, now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  const member = nonTeachingGuard(c, userId);
  if ("ok" in member) return member;
  if (!TASK_STATUSES.includes(status as TaskStatus)) return err(400, "VALIDATION_FAILED", "Choose Open, In progress or Done.");
  const task = c.db.tasks.find(item => item.taskId === taskId && item.staffProfileId === member.staffProfileId);
  if (!task) return err(404, "TASK_NOT_FOUND", "That task isn't assigned to you.");
  task.status = status as TaskStatus;
  task.updatedAt = c.now.toISOString();
  saveDB(organizationId);
  return ok(null);
}

// ─── Department (school side) ───────────────────────────────────────────────

export function departmentResults(organizationId: string, departmentId: string, sessionId: string, now: Date = new Date()): Op<DepartmentResultRow[]> {
  const c = context(organizationId, now);
  if (!c.departments.some(item => item.unitKey === departmentId)) return err(404, "DEPARTMENT_NOT_FOUND", "Department not found.");
  const rows = c.offerings
    .filter(offering => offering.departmentId === departmentId && offering.sessionId === sessionId)
    .map(offering => {
      const course = c.courses.get(offering.courseId);
      const sheet = sheetOf(c, offering.offeringId);
      const roster = rosterOf(c, offering);
      const stats = classStats(c, sheet, roster);
      const { term } = sessionAndTerm(c, offering);
      return {
        offeringId: offering.offeringId, code: course?.code ?? "—", title: course?.title ?? "Unknown course",
        levelKey: offering.levelKey, termName: term?.name ?? "", lecturer: staffName(c, offering.lecturerStaffProfileId),
        enrolled: roster.length, status: statusOf(sheet),
        published: c.scheme.filter(component => sheet?.published[component.key]).map(component => component.label),
        submittedAt: sheet?.submittedAt ?? null,
        average: sheet?.status === "Submitted" ? stats.average : null,
        passRate: sheet?.status === "Submitted" ? stats.passRate : null,
      };
    });
  return ok(rows.sort((a, b) => a.levelKey.localeCompare(b.levelKey) || a.termName.localeCompare(b.termName) || a.code.localeCompare(b.code)));
}

/** The department sees the whole sheet, read-only, including unpublished drafts. */
export function departmentSheet(organizationId: string, offeringId: string, now: Date = new Date()): Op<ResultSheet> {
  const c = context(organizationId, now);
  const offering = c.offerings.find(item => item.offeringId === offeringId);
  if (!offering) return err(404, "OFFERING_NOT_FOUND", "That course isn't in this school.");
  return ok({ ...sheetView(c, offering), locked: true });
}

// ─── School admin: timetables ───────────────────────────────────────────────
// The admin app sits behind the real admin login; the real API must also
// check the caller is an owner or admin of this organization.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start < b.end && b.start < a.end;
const dayName = (day: number) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];

function adminSlot(c: Ctx, slot: Slot): AdminSlot | null {
  const offering = c.offerings.find(item => item.offeringId === slot.offeringId);
  if (!offering) return null;
  const course = c.courses.get(offering.courseId);
  return { ...slot, code: course?.code ?? "—", title: course?.title ?? "", levelKey: offering.levelKey, lecturer: staffName(c, offering.lecturerStaffProfileId) };
}

export function departmentTimetable(organizationId: string, departmentId: string, termId: string, now: Date = new Date()): Op<DepartmentTimetable> {
  const c = context(organizationId, now);
  if (!c.departments.some(item => item.unitKey === departmentId)) return err(404, "DEPARTMENT_NOT_FOUND", "Department not found.");
  const session = c.sessions.find(item => item.terms.some(term => term.termId === termId));
  const term = session?.terms.find(item => item.termId === termId);
  if (!term) return err(404, "TERM_NOT_FOUND", "Term not found.");
  const runs = c.offerings.filter(item => item.departmentId === departmentId && item.termId === termId);
  const ids = new Set(runs.map(item => item.offeringId));
  const slots = c.db.slots
    .filter(slot => ids.has(slot.offeringId))
    .map(slot => adminSlot(c, slot))
    .filter((slot): slot is AdminSlot => slot !== null)
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  return ok({
    termId, termName: term.name, termClosed: term.status === "Closed",
    offerings: runs.map(offering => ({
      offeringId: offering.offeringId, code: c.courses.get(offering.courseId)?.code ?? "—", title: c.courses.get(offering.courseId)?.title ?? "",
      levelKey: offering.levelKey, lecturer: staffName(c, offering.lecturerStaffProfileId),
    })).sort((a, b) => a.levelKey.localeCompare(b.levelKey) || a.code.localeCompare(b.code)),
    slots,
  });
}

/**
 * Add a period. Refuses the three clashes a timetable officer checks by hand:
 * the same class in two places, a lecturer in two places, a room booked twice.
 */
export function addSlot(organizationId: string, input: Record<string, unknown>, now: Date = new Date()): Op<AdminSlot> {
  const c = context(organizationId, now);
  const offering = c.offerings.find(item => item.offeringId === input.offeringId);
  if (!offering) return err(404, "OFFERING_NOT_FOUND", "Choose a course running this term.");
  if (sessionAndTerm(c, offering).term?.status === "Closed") return err(409, "TERM_CLOSED", "This term is closed. Its timetable is read-only.");
  const day = Number(input.day);
  const start = String(input.start ?? "");
  const end = String(input.end ?? "");
  const venue = String(input.venue ?? "").trim();
  if (!Number.isInteger(day) || day < 1 || day > 6) return err(400, "VALIDATION_FAILED", "Choose a day from Monday to Saturday.");
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) return err(400, "VALIDATION_FAILED", "Use times like 08:00.");
  if (end <= start) return err(400, "VALIDATION_FAILED", "The period must end after it starts.");
  if (start < "07:00" || end > "19:00") return err(400, "VALIDATION_FAILED", "Periods run between 07:00 and 19:00.");
  if (!venue) return err(400, "VALIDATION_FAILED", "Enter a venue.");
  const candidate = { start, end };
  for (const slot of c.db.slots) {
    if (slot.day !== day || !overlaps(slot, candidate)) continue;
    const other = c.offerings.find(item => item.offeringId === slot.offeringId);
    if (!other || other.termId !== offering.termId) continue;
    const code = c.courses.get(other.courseId)?.code ?? "another course";
    const when = `${dayName(day)} ${slot.start}–${slot.end}`;
    if (other.departmentId === offering.departmentId && other.levelKey === offering.levelKey) {
      return err(409, "LEVEL_CLASH", `${offering.levelKey} already has ${code} on ${when}.`);
    }
    if (offering.lecturerStaffProfileId && other.lecturerStaffProfileId === offering.lecturerStaffProfileId) {
      return err(409, "LECTURER_CLASH", `${staffName(c, offering.lecturerStaffProfileId)} is teaching ${code} on ${when}.`);
    }
    if (slot.venue.trim().toLowerCase() === venue.toLowerCase()) {
      return err(409, "VENUE_CLASH", `${slot.venue} is booked for ${code} on ${when}.`);
    }
  }
  const slot: Slot = { slotId: crypto.randomUUID(), offeringId: offering.offeringId, day: day as Weekday, start, end, venue: venue.slice(0, 80) };
  c.db.slots.push(slot);
  saveDB(organizationId);
  return ok(adminSlot(c, slot) as AdminSlot, 201);
}

export function removeSlot(organizationId: string, slotId: string, now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  const slot = c.db.slots.find(item => item.slotId === slotId);
  const offering = slot && c.offerings.find(item => item.offeringId === slot.offeringId);
  if (!slot || !offering) return err(404, "SLOT_NOT_FOUND", "That period isn't on the timetable.");
  if (sessionAndTerm(c, offering).term?.status === "Closed") return err(409, "TERM_CLOSED", "This term is closed. Its timetable is read-only.");
  c.db.slots = c.db.slots.filter(item => item.slotId !== slotId);
  saveDB(organizationId);
  return ok(null);
}

// ─── School admin: course registration ──────────────────────────────────────

export function offeringRoster(organizationId: string, offeringId: string, now: Date = new Date()): Op<OfferingRoster> {
  const c = context(organizationId, now);
  const offering = c.offerings.find(item => item.offeringId === offeringId);
  if (!offering) return err(404, "OFFERING_NOT_FOUND", "That course isn't in this school.");
  const roster = rosterWithSource(c, offering);
  const on = new Set(roster.map(item => item.student.studentProfileId));
  const sheet = sheetOf(c, offeringId);
  const hasMarks = (id: string) => Object.values(sheet?.scores[id] ?? {}).some(value => typeof value === "number");
  const course = c.courses.get(offering.courseId);
  return ok({
    offeringId, code: course?.code ?? "—", title: course?.title ?? "", levelKey: offering.levelKey,
    locked: sessionAndTerm(c, offering).term?.status === "Closed" || sheet?.status === "Submitted",
    students: roster.map(({ student, source }) => ({
      studentProfileId: student.studentProfileId, fullName: student.fullName, matriculationNumber: student.matriculationNumber,
      source, hasMarks: hasMarks(student.studentProfileId),
    })),
    candidates: c.students.filter(student => student.status === "Active" && !on.has(student.studentProfileId)).map(student => {
      const place = placement(c, student);
      return {
        studentProfileId: student.studentProfileId, fullName: student.fullName, matriculationNumber: student.matriculationNumber,
        placement: [unitName(c, place.departmentId), place.level].filter(Boolean).join(" ") || "—",
      };
    }).sort((a, b) => a.fullName.localeCompare(b.fullName)),
  });
}

function rosterGuard(c: Ctx, offeringId: string): OpErr | AcademicOffering {
  const offering = c.offerings.find(item => item.offeringId === offeringId);
  if (!offering) return err(404, "OFFERING_NOT_FOUND", "That course isn't in this school.");
  if (sessionAndTerm(c, offering).term?.status === "Closed") return err(409, "TERM_CLOSED", "This term is closed. Its registration is read-only.");
  if (sheetOf(c, offeringId)?.status === "Submitted") return err(409, "SHEET_SUBMITTED", "Results for this course are submitted, so its roster is locked.");
  return offering;
}

export function enrolStudent(organizationId: string, offeringId: string, studentProfileId: string, now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  const offering = rosterGuard(c, offeringId);
  if ("ok" in offering) return offering;
  const student = c.students.find(item => item.studentProfileId === studentProfileId);
  if (!student) return err(404, "STUDENT_NOT_FOUND", "Student record not found.");
  if (student.status !== "Active") return err(409, "STUDENT_NOT_ACTIVE", `${student.fullName} is ${student.status.toLowerCase()} and can't be registered.`);
  if (rosterOf(c, offering).some(item => item.studentProfileId === studentProfileId)) return err(409, "ALREADY_ON_ROSTER", `${student.fullName} is already on this course.`);
  c.db.enrolments = c.db.enrolments.filter(item => !(item.offeringId === offeringId && item.studentProfileId === studentProfileId));
  c.db.enrolments.push({ offeringId, studentProfileId });
  saveDB(organizationId);
  return ok(null, 201);
}

/** Take a student off one course. Refused once they have marks, so no marks are orphaned. */
export function dropStudent(organizationId: string, offeringId: string, studentProfileId: string, now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  const offering = rosterGuard(c, offeringId);
  if ("ok" in offering) return offering;
  const entry = rosterWithSource(c, offering).find(item => item.student.studentProfileId === studentProfileId);
  if (!entry) return err(404, "NOT_ON_ROSTER", "That student isn't on this course.");
  const marks = sheetOf(c, offeringId)?.scores[studentProfileId] ?? {};
  if (Object.values(marks).some(value => typeof value === "number")) {
    return err(409, "DROP_HAS_MARKS", `${entry.student.fullName} already has marks on this course. Ask the lecturer to clear them first.`);
  }
  // Always record the drop: anyone whose department and level match would
  // otherwise be placed straight back on automatically.
  c.db.enrolments = c.db.enrolments.filter(item => !(item.offeringId === offeringId && item.studentProfileId === studentProfileId));
  c.db.enrolments.push({ offeringId, studentProfileId, dropped: true });
  saveDB(organizationId);
  return ok(null);
}

// ─── School admin: staff operations ─────────────────────────────────────────

const ratingFor = (score: number): Appraisal["rating"] =>
  score >= 85 ? "Outstanding" : score >= 70 ? "Very good" : score >= 55 ? "Good" : score >= 40 ? "Fair" : "Poor";

function staffGuard(c: Ctx, staffProfileId: string): OpErr | StaffProfile {
  return c.staff.find(item => item.staffProfileId === staffProfileId) ?? err(404, "STAFF_NOT_FOUND", "Staff record not found.");
}
const strip = <T extends { staffProfileId: string }>(row: T) => omit(row, "staffProfileId");
const isoDate = (value: unknown) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

export function staffOperations(organizationId: string, staffProfileId: string, now: Date = new Date()): Op<StaffOperations> {
  const c = context(organizationId, now);
  const member = staffGuard(c, staffProfileId);
  if ("ok" in member) return member;
  const record = c.db.staffRecords.find(item => item.staffProfileId === staffProfileId);
  return ok({
    staffProfileId, fullName: member.fullName, kind: member.kind,
    record: record ? strip(record) : null,
    duties: c.db.duties.filter(item => item.staffProfileId === staffProfileId).map(strip)
      .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)),
    tasks: c.db.tasks.filter(item => item.staffProfileId === staffProfileId).map(strip)
      .sort((a, b) => (a.status === "Done" ? 1 : 0) - (b.status === "Done" ? 1 : 0) || (a.dueOn ?? "9").localeCompare(b.dueOn ?? "9")),
    appraisals: c.db.appraisals.filter(item => item.staffProfileId === staffProfileId).map(strip).sort((a, b) => b.year - a.year),
    leave: c.db.leave.filter(item => item.staffProfileId === staffProfileId).map(strip).sort((a, b) => b.startsOn.localeCompare(a.startsOn)),
    supervisors: c.staff.filter(item => item.staffProfileId !== staffProfileId && item.status === "Active")
      .map(item => ({ staffProfileId: item.staffProfileId, name: staffName(c, item.staffProfileId) ?? item.fullName }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });
}

export function saveEmploymentRecord(organizationId: string, staffProfileId: string, input: Record<string, unknown>, now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  const member = staffGuard(c, staffProfileId);
  if ("ok" in member) return member;
  const cadre = String(input.cadre ?? "").trim();
  const salaryScale = String(input.salaryScale ?? "").trim();
  const gradeLevel = Number(input.gradeLevel);
  const step = Number(input.step);
  const supervisorId = typeof input.supervisorId === "string" && input.supervisorId ? input.supervisorId : null;
  if (!cadre) return err(400, "VALIDATION_FAILED", "Enter the cadre, for example \"Registry · Executive Officer\".");
  if (!salaryScale) return err(400, "VALIDATION_FAILED", "Enter the salary scale, for example CONTISS.");
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 17) return err(400, "VALIDATION_FAILED", "Grade level runs from 1 to 17.");
  if (!Number.isInteger(step) || step < 1 || step > 15) return err(400, "VALIDATION_FAILED", "Step runs from 1 to 15.");
  if (supervisorId === staffProfileId) return err(400, "VALIDATION_FAILED", "Someone can't supervise themselves.");
  if (supervisorId && !c.staff.some(item => item.staffProfileId === supervisorId)) return err(404, "STAFF_NOT_FOUND", "Choose an existing staff member as supervisor.");
  const record: StaffRecord = {
    staffProfileId, cadre: cadre.slice(0, 80), salaryScale: salaryScale.slice(0, 20), gradeLevel, step,
    confirmedOn: isoDate(input.confirmedOn), nextPromotionDue: isoDate(input.nextPromotionDue), supervisorId,
  };
  c.db.staffRecords = [...c.db.staffRecords.filter(item => item.staffProfileId !== staffProfileId), record];
  saveDB(organizationId);
  return ok(null);
}

export function addDuty(organizationId: string, staffProfileId: string, input: Record<string, unknown>, now: Date = new Date()): Op<DutyShift> {
  const c = context(organizationId, now);
  const member = staffGuard(c, staffProfileId);
  if ("ok" in member) return member;
  const day = Number(input.day);
  const start = String(input.start ?? "");
  const end = String(input.end ?? "");
  const location = String(input.location ?? "").trim();
  const role = String(input.role ?? "").trim();
  if (!Number.isInteger(day) || day < 1 || day > 6) return err(400, "VALIDATION_FAILED", "Choose a day from Monday to Saturday.");
  if (!TIME_RE.test(start) || !TIME_RE.test(end) || end <= start) return err(400, "VALIDATION_FAILED", "Enter a start and a later end time, like 08:00 and 16:00.");
  if (!location || !role) return err(400, "VALIDATION_FAILED", "Enter where the duty is and what it involves.");
  const clash = c.db.duties.find(item => item.staffProfileId === staffProfileId && item.day === day && overlaps(item, { start, end }));
  if (clash) return err(409, "DUTY_OVERLAP", `${member.fullName} is already on duty ${dayName(day)} ${clash.start}–${clash.end}.`);
  const duty = { dutyId: crypto.randomUUID(), staffProfileId, day: day as Weekday, start, end, location: location.slice(0, 80), role: role.slice(0, 80) };
  c.db.duties.push(duty);
  notify(c, [staffProfileId], "Task", "Duty roster updated", `${dayName(day)} ${start}–${end} · ${duty.location}`, "roster");
  saveDB(organizationId);
  return ok(strip(duty), 201);
}

export function removeDuty(organizationId: string, dutyId: string, now: Date = new Date()): Op<null> {
  const c = context(organizationId, now);
  if (!c.db.duties.some(item => item.dutyId === dutyId)) return err(404, "DUTY_NOT_FOUND", "That shift isn't on the roster.");
  c.db.duties = c.db.duties.filter(item => item.dutyId !== dutyId);
  saveDB(organizationId);
  return ok(null);
}

export function assignTask(organizationId: string, staffProfileId: string, input: Record<string, unknown>, now: Date = new Date()): Op<WorkTask> {
  const c = context(organizationId, now);
  const member = staffGuard(c, staffProfileId);
  if ("ok" in member) return member;
  const title = String(input.title ?? "").trim();
  const detail = String(input.detail ?? "").trim();
  const priority = input.priority as WorkTask["priority"];
  const dueOn = isoDate(input.dueOn);
  const requestedBy = String(input.requestedBy ?? "").trim() || "School admin";
  if (!title) return err(400, "VALIDATION_FAILED", "Give the task a title.");
  if (!["Low", "Normal", "Urgent"].includes(priority)) return err(400, "VALIDATION_FAILED", "Choose a priority.");
  if (dueOn && dueOn < c.now.toISOString().slice(0, 10)) return err(400, "VALIDATION_FAILED", "The due date can't be in the past.");
  const task = {
    taskId: crypto.randomUUID(), staffProfileId, title: title.slice(0, 120), detail: detail.slice(0, 1000),
    requestedBy: requestedBy.slice(0, 80), priority, status: "Open" as const, dueOn, updatedAt: c.now.toISOString(),
  };
  c.db.tasks.push(task);
  notify(c, [staffProfileId], "Task", priority === "Urgent" ? "Urgent task assigned" : "New task assigned", title, "tasks");
  saveDB(organizationId);
  return ok(strip(task), 201);
}

export function addAppraisal(organizationId: string, staffProfileId: string, input: Record<string, unknown>, now: Date = new Date()): Op<Appraisal> {
  const c = context(organizationId, now);
  const member = staffGuard(c, staffProfileId);
  if ("ok" in member) return member;
  const year = Number(input.year);
  const score = Number(input.score);
  const appraiser = String(input.appraiser ?? "").trim();
  const comment = String(input.comment ?? "").trim();
  if (!Number.isInteger(year) || year < 2000 || year > c.now.getUTCFullYear()) return err(400, "VALIDATION_FAILED", `Choose a year up to ${c.now.getUTCFullYear()}.`);
  if (!Number.isInteger(score) || score < 0 || score > 100) return err(400, "VALIDATION_FAILED", "Score is a whole number from 0 to 100.");
  if (!appraiser) return err(400, "VALIDATION_FAILED", "Enter who carried out the appraisal.");
  if (c.db.appraisals.some(item => item.staffProfileId === staffProfileId && item.year === year)) {
    return err(409, "APPRAISAL_EXISTS", `${member.fullName} already has an appraisal for ${year}.`);
  }
  const appraisal = { staffProfileId, year, score, rating: ratingFor(score), appraiser: appraiser.slice(0, 80), comment: comment.slice(0, 1000) };
  c.db.appraisals.push(appraisal);
  saveDB(organizationId);
  return ok(strip(appraisal), 201);
}

// ─── School admin: leave approvals ──────────────────────────────────────────

export function leaveQueue(organizationId: string, now: Date = new Date()): Op<LeaveQueueRow[]> {
  const c = context(organizationId, now);
  const year = String(c.now.getUTCFullYear());
  const rows: LeaveQueueRow[] = [];
  for (const item of c.db.leave) {
    const member = c.staff.find(person => person.staffProfileId === item.staffProfileId);
    if (!member) continue;
    const record = c.db.staffRecords.find(row => row.staffProfileId === item.staffProfileId);
    const used = c.db.leave
      .filter(row => row.staffProfileId === item.staffProfileId && row.type === "Annual" && row.status === "Approved" && row.startsOn.startsWith(year))
      .reduce((sum, row) => sum + row.days, 0);
    rows.push({ ...item, staffName: staffName(c, member.staffProfileId) ?? member.fullName, unitName: unitName(c, member.unitId), remaining: annualEntitlement(record?.gradeLevel ?? 7) - used });
  }
  return ok(rows.sort((a, b) => (a.status === "Pending" ? 0 : 1) - (b.status === "Pending" ? 0 : 1) || a.startsOn.localeCompare(b.startsOn)));
}

export function decideLeave(organizationId: string, requestId: string, input: Record<string, unknown>, now: Date = new Date()): Op<LeaveRequest> {
  const c = context(organizationId, now);
  const request = c.db.leave.find(item => item.requestId === requestId);
  if (!request) return err(404, "LEAVE_NOT_FOUND", "Leave request not found.");
  if (request.status !== "Pending") return err(409, "LEAVE_DECIDED", `This request was already ${request.status.toLowerCase()}.`);
  const decision = input.decision;
  if (decision !== "Approved" && decision !== "Declined") return err(400, "VALIDATION_FAILED", "Approve or decline the request.");
  const note = String(input.note ?? "").trim();
  if (decision === "Declined" && !note) return err(400, "VALIDATION_FAILED", "Say why the request is declined.");
  request.status = decision;
  request.decidedBy = String(input.decidedBy ?? "").trim() || "School admin";
  notify(c, [request.staffProfileId], "Leave", `${request.type} leave ${decision.toLowerCase()}`,
    `${request.startsOn} to ${request.endsOn} (${request.days} working day${request.days === 1 ? "" : "s"}).${note ? ` ${note}` : ""}`, "leave");
  saveDB(organizationId);
  return ok(omit(request, "staffProfileId"));
}
