/**
 * Faculty mock store — FACULTY-BUILD §§1–7, 11.
 *
 * Every business rule in the spec is enforced here (the mock is the server),
 * not in comments and not in the UI. Handlers in facultyHandlers.ts stay thin.
 * State persists to localStorage per organization; tests reset via
 * resetFacultyMocks(), which resetCohortMocks() also calls.
 */
import type { AcademicRank } from "../features/staff/ranks";
import { buildSeedRanks } from "../features/staff/ranks";
import type { Appointment, PostCode } from "../features/staff/appointments";
import { POST_SCOPE, isAppointmentLive } from "../features/staff/appointments";
import type { RankHistory, StaffKind, StaffProfile } from "../features/staff/types";
import { currentPostHolder, postsHeldBy, staffOfFaculty, studentUnitChain } from "../features/staff/queries";
import type { Invitation, PendingRecord } from "../features/onboarding/invitations";
import { isTokenUsable } from "../features/onboarding/invitations";
import type { IdentifierFormat } from "../features/onboarding/identifiers";
import { verifyPassword, type PasswordCredential } from "../features/onboarding/passwords";
import {
  DEFAULT_SCHOOL_DOMAIN,
  DEFAULT_SESSION_NAME,
  allocateSerial,
  defaultIdentifierFormat,
  generateSchoolEmail,
  serialScopeKey,
} from "../features/onboarding/identifiers";
import type {
  AttendanceSummary,
  Course,
  CourseAssignment,
  CourseOffering,
  CourseResults,
  Registration,
  StudentProfile,
  StudentSessionHistory,
  StudentResult,
} from "../features/cohorts/courses";
import { readSchoolSetup, unitKindOf } from "../features/cohorts/schoolSetup";
import { getGroupSettings } from "../features/cohorts/settings";
import { fixtureId } from "../features/cohorts/fixtureId";

export type OpOk<T> = { ok: true; data: T; status: number };
export type OpErr = { ok: false; status: number; code: string; message: string };
export type Op<T> = OpOk<T> | OpErr;

const ok = <T>(data: T, status = 200): OpOk<T> => ({ ok: true, data, status });
const err = (status: number, code: string, message: string): OpErr => ({ ok: false, status, code, message });

type AttendanceRow = AttendanceSummary & { ownerKind: "staff" | "student"; ownerId: string };
export type MockEmail = { to: string; subject: string; body: string; createdAt: string };

type OrgDB = {
  ranks: AcademicRank[];
  staff: StaffProfile[];
  rankHistory: RankHistory[];
  appointments: Appointment[];
  invitations: Invitation[];
  pending: PendingRecord[];
  pendingCredentials: Record<string, PasswordCredential>;
  accounts: { userId: string; schoolEmail: string; kind: "Student" | "Staff"; credential: PasswordCredential }[];
  outbox: MockEmail[];
  students: StudentProfile[];
  studentHistory: StudentSessionHistory[];
  courses: Course[];
  assignments: CourseAssignment[];
  registrations: Registration[];
  offerings: CourseOffering[];
  results: CourseResults[];
  studentResults: StudentResult[];
  attendance: AttendanceRow[];
  identifierFormat: IdentifierFormat | null;
  issuedIdentifiers: string[];
  usedSerials: Record<string, number[]>;
  emails: string[];
  staffSeq: number;
  domain: string;
  sessionNames: Record<string, string>;
};

function emptyDB(): OrgDB {
  return {
    ranks: [], staff: [], rankHistory: [], appointments: [], invitations: [], pending: [],
    pendingCredentials: {}, accounts: [], outbox: [],
    students: [], studentHistory: [], courses: [], assignments: [], registrations: [], offerings: [],
    results: [], studentResults: [], attendance: [], identifierFormat: null, issuedIdentifiers: [],
    usedSerials: {}, emails: [], staffSeq: 0, domain: DEFAULT_SCHOOL_DOMAIN, sessionNames: {},
  };
}

const memory = new Map<string, OrgDB>();

function storageKey(organizationId: string) {
  return `edutracker.faculty.${organizationId}`;
}

function loadDB(organizationId: string): OrgDB {
  const cached = memory.get(organizationId);
  if (cached) return cached;
  let db = emptyDB();
  try {
    if (typeof localStorage !== "undefined") {
      const saved = JSON.parse(localStorage.getItem(storageKey(organizationId)) || "null");
      if (saved && typeof saved === "object") db = { ...emptyDB(), ...saved };
    }
  } catch { /* Tests and restricted browsers use memory. */ }
  memory.set(organizationId, db);
  // Seed ranks for a new organization (FACULTY-BUILD §2).
  if (!db.ranks.length) {
    const model = readSchoolSetup(organizationId)?.model ?? getGroupSettings(organizationId).model;
    db.ranks = buildSeedRanks(organizationId, model, name => fixtureId(organizationId, "rank", name));
    saveDB(organizationId);
  }
  return db;
}

function saveDB(organizationId: string) {
  const db = memory.get(organizationId);
  if (!db) return;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(storageKey(organizationId), JSON.stringify(db));
  } catch { /* Memory remains the source of truth. */ }
}

/** Reset between tests, so one test's writes cannot leak into the next. */
export function resetFacultyMocks() {
  memory.clear();
  if (typeof localStorage !== "undefined") {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith("edutracker.faculty.")) doomed.push(key);
      }
      doomed.forEach(key => localStorage.removeItem(key));
    } catch { /* Memory is already clear. */ }
  }
}

/** Simulates opening the app in another tab without erasing persisted mock data. */
export function clearFacultyMemoryForTest() {
  memory.clear();
}

function nowISO() {
  return new Date().toISOString();
}

function findOrgOfStaff(staffProfileId: string): { organizationId: string; db: OrgDB } | null {
  for (const [organizationId, db] of memory.entries()) {
    if (db.staff.some(s => s.staffProfileId === staffProfileId)) return { organizationId, db };
  }
  return null;
}

// ─── Ranks ────────────────────────────────────────────────────────────────

export function listRanks(organizationId: string): Op<AcademicRank[]> {
  const db = loadDB(organizationId);
  return ok([...db.ranks].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
}

export function createRank(organizationId: string, input: { name?: unknown; order?: unknown }): Op<AcademicRank> {
  const db = loadDB(organizationId);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return err(400, "VALIDATION_FAILED", "Enter a rank name.");
  if (db.ranks.some(r => r.name.toLowerCase() === name.toLowerCase())) {
    return err(409, "RANK_EXISTS", "That rank already exists in this school.");
  }
  const order = typeof input.order === "number" && Number.isFinite(input.order)
    ? Math.trunc(input.order)
    : db.ranks.reduce((max, r) => Math.max(max, r.order), 0) + 1;
  const rank: AcademicRank = { rankId: crypto.randomUUID(), organizationId, name, order };
  db.ranks.push(rank);
  saveDB(organizationId);
  return ok(rank, 201);
}

export function patchRank(organizationId: string, rankId: string, input: { name?: unknown; order?: unknown }): Op<AcademicRank> {
  const db = loadDB(organizationId);
  const rank = db.ranks.find(r => r.rankId === rankId && r.organizationId === organizationId);
  if (!rank) return err(404, "RANK_NOT_FOUND", "Rank not found.");
  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) return err(400, "VALIDATION_FAILED", "Enter a rank name.");
    if (db.ranks.some(r => r.rankId !== rankId && r.name.toLowerCase() === name.toLowerCase())) {
      return err(409, "RANK_EXISTS", "That rank already exists in this school.");
    }
    rank.name = name;
  }
  if (input.order !== undefined) {
    if (typeof input.order !== "number" || !Number.isFinite(input.order)) {
      return err(400, "VALIDATION_FAILED", "Order must be a number.");
    }
    rank.order = Math.trunc(input.order);
  }
  saveDB(organizationId);
  return ok(rank);
}

// ─── Staff ────────────────────────────────────────────────────────────────

function validateStaffInput(
  db: OrgDB,
  input: Record<string, unknown>,
  selfId: string | null,
): OpErr | { kind: StaffKind; unitKind: "Department" | "Faculty"; rankId: string | null } {
  const kind = input.kind as StaffKind;
  if (kind !== "Academic" && kind !== "Administrative" && kind !== "Technical") {
    return err(400, "VALIDATION_FAILED", "Choose a staff kind: Academic, Administrative or Technical.");
  }
  const unitKind = input.unitKind as "Department" | "Faculty";
  if (unitKind !== "Department" && unitKind !== "Faculty") {
    return err(400, "VALIDATION_FAILED", "Choose the unit kind: Department or Faculty.");
  }
  // unitKind Faculty is allowed ONLY for Administrative staff.
  if (unitKind === "Faculty" && kind !== "Administrative") {
    return err(400, "STAFF_UNIT_INVALID", "Only administrative staff may belong directly to a faculty. Academics belong to a department.");
  }
  const rankId = (input.rankId as string | null) ?? null;
  // rankId must be null unless kind is Academic.
  if (rankId !== null && kind !== "Academic") {
    return err(400, "RANK_NOT_ALLOWED", "Only academic staff may hold a rank.");
  }
  if (rankId !== null && !db.ranks.some(r => r.rankId === rankId)) {
    return err(400, "RANK_NOT_FOUND", "That rank does not exist in this school.");
  }
  const staffNumber = typeof input.staffNumber === "string" ? input.staffNumber.trim() : "";
  if (!staffNumber && selfId === null) return err(400, "VALIDATION_FAILED", "Enter a staff number.");
  if (staffNumber && db.staff.some(s => s.staffProfileId !== selfId && s.staffNumber.toLowerCase() === staffNumber.toLowerCase())) {
    return err(409, "STAFF_NUMBER_EXISTS", "That staff number is already in use in this school.");
  }
  const title = typeof input.title === "string" ? input.title : "";
  if (title.length > 20) return err(400, "VALIDATION_FAILED", "Titles hold at most 20 characters.");
  return { kind, unitKind, rankId };
}

export function createStaff(organizationId: string, input: Record<string, unknown>): Op<StaffProfile> {
  const db = loadDB(organizationId);
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  if (!fullName) return err(400, "VALIDATION_FAILED", "Enter the staff member's full name.");
  const schoolEmail = typeof input.schoolEmail === "string" ? input.schoolEmail.trim() : "";
  if (!schoolEmail || !schoolEmail.includes("@")) return err(400, "VALIDATION_FAILED", "Enter a valid school email.");
  if (db.emails.some(e => e.toLowerCase() === schoolEmail.toLowerCase())) {
    return err(409, "EMAIL_EXISTS", "That school email is already in use.");
  }
  if (typeof input.userId === "string" && db.staff.some(member => member.userId === input.userId)) {
    return err(409, "USER_ALREADY_LINKED", "This account already has a staff record in this school.");
  }
  const unitId = typeof input.unitId === "string" ? input.unitId.trim() : "";
  if (!unitId) return err(400, "VALIDATION_FAILED", "Choose the department this person belongs to.");
  const checked = validateStaffInput(db, input, null);
  if ("ok" in checked && !checked.ok) return checked;
  const { kind, unitKind, rankId } = checked as { kind: StaffKind; unitKind: "Department" | "Faculty"; rankId: string | null };
  const structure = readSchoolSetup(organizationId)?.structure;
  if (!structure || unitKindOf(structure, unitId) !== unitKind) {
    return err(400, "STAFF_UNIT_INVALID", "Choose an existing unit of the selected kind.");
  }
  const profile: StaffProfile = {
    staffProfileId: crypto.randomUUID(),
    organizationId,
    userId: typeof input.userId === "string" ? input.userId : null,
    staffNumber: (input.staffNumber as string).trim(),
    fullName,
    title: typeof input.title === "string" ? input.title : "",
    kind,
    unitId,
    unitKind,
    rankId,
    schoolEmail,
    status: (input.status as StaffProfile["status"]) ?? "Active",
    appointedOn: typeof input.appointedOn === "string" ? input.appointedOn : nowISO(),
  };
  db.staff.push(profile);
  db.emails.push(schoolEmail);
  if (rankId) {
    db.rankHistory.push({
      rankHistoryId: crypto.randomUUID(), organizationId,
      staffProfileId: profile.staffProfileId, rankId, effectiveFrom: nowISO(), effectiveTo: null,
    });
  }
  saveDB(organizationId);
  return ok(profile, 201);
}

export function patchStaff(organizationId: string, staffProfileId: string, input: Record<string, unknown>): Op<StaffProfile> {
  const db = loadDB(organizationId);
  const profile = db.staff.find(s => s.staffProfileId === staffProfileId && s.organizationId === organizationId);
  if (!profile) return err(404, "STAFF_NOT_FOUND", "Staff record not found.");
  const merged: Record<string, unknown> = {
    kind: input.kind ?? profile.kind,
    unitKind: input.unitKind ?? profile.unitKind,
    rankId: input.rankId === undefined ? profile.rankId : (input.rankId as string | null),
    staffNumber: input.staffNumber ?? profile.staffNumber,
    title: input.title ?? profile.title,
  };
  const checked = validateStaffInput(db, merged, staffProfileId);
  if ("ok" in checked && !checked.ok) return checked;
  const next = checked as { kind: StaffKind; unitKind: "Department" | "Faculty"; rankId: string | null };
  const nextUnit = typeof input.unitId === "string" ? input.unitId.trim() : profile.unitId;
  const structure = readSchoolSetup(organizationId)?.structure;
  if (!structure || unitKindOf(structure, nextUnit) !== next.unitKind) {
    return err(400, "STAFF_UNIT_INVALID", "Choose an existing unit of the selected kind.");
  }
  // Changing someone's rank writes a RankHistory row.
  if (next.rankId !== profile.rankId) {
    const open = db.rankHistory.find(h => h.staffProfileId === staffProfileId && h.effectiveTo === null);
    if (open) open.effectiveTo = nowISO();
    if (next.rankId) {
      db.rankHistory.push({
        rankHistoryId: crypto.randomUUID(), organizationId,
        staffProfileId, rankId: next.rankId, effectiveFrom: nowISO(), effectiveTo: null,
      });
    }
    profile.rankId = next.rankId;
  }
  profile.kind = next.kind;
  profile.unitKind = next.unitKind;
  if (typeof input.staffNumber === "string") profile.staffNumber = input.staffNumber.trim();
  if (typeof input.title === "string") profile.title = input.title;
  if (typeof input.fullName === "string" && input.fullName.trim()) profile.fullName = (input.fullName as string).trim();
  if (typeof input.unitId === "string" && (input.unitId as string).trim()) profile.unitId = (input.unitId as string).trim();
  if (typeof input.status === "string") profile.status = input.status as StaffProfile["status"];
  if (typeof input.schoolEmail === "string" && (input.schoolEmail as string).trim()) {
    const email = (input.schoolEmail as string).trim();
    if (db.emails.some(e => e.toLowerCase() === email.toLowerCase() && e.toLowerCase() !== profile.schoolEmail.toLowerCase())) {
      return err(409, "EMAIL_EXISTS", "That school email is already in use.");
    }
    db.emails = db.emails.filter(e => e.toLowerCase() !== profile.schoolEmail.toLowerCase());
    profile.schoolEmail = email;
    db.emails.push(email);
  }
  saveDB(organizationId);
  return ok(profile);
}

export type StaffQuery = {
  facultyId?: string; departmentId?: string; kind?: string; rankId?: string; q?: string;
};

export function listStaff(organizationId: string, query: StaffQuery): Op<{ items: StaffProfile[]; total: number }> {
  const db = loadDB(organizationId);
  let items = db.staff.filter(s => s.organizationId === organizationId);
  if (query.facultyId) {
    // facultyId runs staffOfFaculty(). It does not read a stored field.
    const setup = readSchoolSetup(organizationId);
    const units = (setup?.structure.units ?? []).map(u => ({ key: u.key, parent: u.parent }));
    items = staffOfFaculty(items, units, query.facultyId);
  }
  if (query.departmentId) items = items.filter(s => s.unitId === query.departmentId);
  if (query.kind) items = items.filter(s => s.kind === query.kind);
  if (query.rankId) items = items.filter(s => s.rankId === query.rankId);
  if (query.q) {
    const needle = query.q.toLowerCase();
    items = items.filter(s => s.fullName.toLowerCase().includes(needle) || s.staffNumber.toLowerCase().includes(needle));
  }
  const total = items.length;
  return ok({ items, total });
}

export function getStaff(organizationId: string, staffProfileId: string): Op<StaffProfile> {
  const db = loadDB(organizationId);
  const profile = db.staff.find(s => s.staffProfileId === staffProfileId && s.organizationId === organizationId);
  if (!profile) return err(404, "STAFF_NOT_FOUND", "Staff record not found.");
  return ok(profile);
}

// ─── Appointments ─────────────────────────────────────────────────────────

export function listAppointments(
  organizationId: string,
  query: { scopeId?: string; post?: string; live?: string },
  now: Date = new Date(),
): Op<Appointment[]> {
  const db = loadDB(organizationId);
  let items = db.appointments.filter(a => a.organizationId === organizationId);
  if (query.scopeId) items = items.filter(a => a.scopeId === query.scopeId);
  if (query.post) items = items.filter(a => a.post === query.post);
  if (query.live === "true") items = items.filter(a => isAppointmentLive(a, now));
  return ok(items);
}

export function createAppointment(organizationId: string, input: Record<string, unknown>, now: Date = new Date()): Op<Appointment> {
  const db = loadDB(organizationId);
  const staffProfileId = typeof input.staffProfileId === "string" ? input.staffProfileId : "";
  const holder = db.staff.find(s => s.staffProfileId === staffProfileId && s.organizationId === organizationId);
  if (!holder) return err(404, "STAFF_NOT_FOUND", "Staff record not found.");
  // A staff member whose status is not Active must not be assignable.
  if (holder.status !== "Active") {
    return err(409, "STAFF_NOT_ACTIVE", `${holder.fullName} is ${holder.status} and cannot take an appointment.`);
  }
  const post = input.post as PostCode;
  if (!post || !(post in POST_SCOPE)) return err(400, "VALIDATION_FAILED", "Choose a valid post.");
  const scopeKind = input.scopeKind as Appointment["scopeKind"];
  if (scopeKind !== POST_SCOPE[post]) {
    return err(400, "APPOINTMENT_SCOPE_INVALID", `${post} must be scoped to a ${POST_SCOPE[post]}, not a ${String(scopeKind)}.`);
  }
  const scopeId = typeof input.scopeId === "string" ? input.scopeId.trim() : "";
  if (!scopeId) return err(400, "VALIDATION_FAILED", "Choose the unit this post belongs to.");
  if (scopeKind !== "Cohort") {
    const structure = readSchoolSetup(organizationId)?.structure;
    if (!structure || unitKindOf(structure, scopeId) !== scopeKind) {
      return err(400, "APPOINTMENT_SCOPE_INVALID", "Choose an existing unit for this post.");
    }
  }
  // Only Academic staff may hold an academic post; FacultyOfficer must be Administrative.
  if (post === "FacultyOfficer") {
    if (holder.kind !== "Administrative") {
      return err(400, "APPOINTMENT_KIND_INVALID", "The faculty officer must be administrative staff.");
    }
  } else if (holder.kind !== "Academic") {
    return err(400, "APPOINTMENT_KIND_INVALID", `Only academic staff may hold ${post}.`);
  }
  const startsOn = typeof input.startsOn === "string" && input.startsOn ? input.startsOn : nowISO();
  if (Number.isNaN(Date.parse(startsOn))) return err(400, "VALIDATION_FAILED", "Enter a valid start date.");
  const rawEndsOn = (input.endsOn as string | null) ?? null;
  const endsOn = rawEndsOn && /^\d{4}-\d{2}-\d{2}$/.test(rawEndsOn) ? `${rawEndsOn}T23:59:59.999Z` : rawEndsOn;
  if (endsOn !== null && Number.isNaN(Date.parse(endsOn))) return err(400, "VALIDATION_FAILED", "Enter a valid end date.");
  if (endsOn !== null && Date.parse(endsOn) < Date.parse(startsOn)) return err(400, "VALIDATION_FAILED", "End date cannot be before the start date.");
  // One live holder per (post, scopeId).
  const clash = db.appointments.find(a =>
    a.organizationId === organizationId && a.post === post && a.scopeId === scopeId &&
    isAppointmentLive({ startsOn: a.startsOn, endsOn: a.endsOn }, now) &&
    isAppointmentLive({ startsOn, endsOn }, now),
  );
  if (clash) {
    const current = db.staff.find(s => s.staffProfileId === clash.staffProfileId);
    return err(409, "POST_OCCUPIED", `${post} for this unit is held by ${current?.fullName ?? "another staff member"}. End that appointment first.`);
  }
  const appointment: Appointment = {
    appointmentId: crypto.randomUUID(), organizationId, staffProfileId,
    post, scopeId, scopeKind, startsOn, endsOn,
  };
  db.appointments.push(appointment);
  saveDB(organizationId);
  return ok(appointment, 201);
}

export function endAppointment(organizationId: string, appointmentId: string, input: Record<string, unknown>): Op<Appointment> {
  const db = loadDB(organizationId);
  const appointment = db.appointments.find(a => a.appointmentId === appointmentId && a.organizationId === organizationId);
  if (!appointment) return err(404, "APPOINTMENT_NOT_FOUND", "Appointment not found.");
  const allowed = new Set(["endsOn"]);
  if (Object.keys(input).some(key => !allowed.has(key))) {
    return err(400, "VALIDATION_FAILED", "Only endsOn may be changed. History is never edited.");
  }
  const endsOn = input.endsOn;
  if (typeof endsOn !== "string" || Number.isNaN(Date.parse(endsOn)) || Date.parse(endsOn) < Date.parse(appointment.startsOn)) {
    return err(400, "VALIDATION_FAILED", "Enter a valid end date.");
  }
  // Ending an appointment sets endsOn. It never deletes the row.
  appointment.endsOn = endsOn;
  saveDB(organizationId);
  return ok(appointment);
}

// ─── Invitations ──────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteInput = {
  kind?: unknown; email?: unknown; programmeId?: unknown; entryStageId?: unknown;
  departmentId?: unknown; proposedKind?: unknown; sessionId?: unknown; invitedBy?: unknown;
  expiresOn?: unknown; sessionName?: unknown; proposedPost?: unknown;
  organizationName?: unknown;
};

function validateInviteInput(organizationId: string, input: InviteInput): OpErr | null {
  const db = loadDB(organizationId);
  const structure = readSchoolSetup(organizationId)?.structure;
  const kind = input.kind as string;
  if (kind !== "Student" && kind !== "Staff") return err(400, "VALIDATION_FAILED", "Invite a Student or Staff member.");
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!EMAIL_RE.test(email)) return err(400, "VALIDATION_FAILED", `Enter a valid email address: ${String(input.email ?? "").trim() || "missing"}.`);
  const sessionId = typeof input.sessionId === "string" ? input.sessionId.trim() : "";
  if (!sessionId) return err(400, "VALIDATION_FAILED", "Choose the session this invitation belongs to.");
  const invitedBy = typeof input.invitedBy === "string" ? input.invitedBy.trim() : "";
  if (!invitedBy) return err(400, "VALIDATION_FAILED", "The inviter is required.");
  if (kind === "Student") {
    if (!input.programmeId || !input.entryStageId) {
      return err(400, "VALIDATION_FAILED", "A student invitation names a programme and an entry level.");
    }
    if (!structure || unitKindOf(structure, String(input.programmeId)) !== "Programme" ||
        !structure.stages.some(stage => stage.key === input.entryStageId)) {
      return err(400, "INVITATION_PLACEMENT_INVALID", "Choose an existing programme and level.");
    }
  } else if (!input.departmentId) {
    return err(400, "VALIDATION_FAILED", "A staff invitation names a department.");
  } else if (!structure || !["Department", "Faculty"].includes(unitKindOf(structure, String(input.departmentId)) ?? "")) {
    return err(400, "INVITATION_PLACEMENT_INVALID", "Choose an existing department or faculty office.");
  }
  const proposedKind = input.proposedKind as StaffKind | null | undefined;
  if (kind === "Staff" && proposedKind !== undefined && proposedKind !== null &&
    proposedKind !== "Academic" && proposedKind !== "Administrative" && proposedKind !== "Technical") {
    return err(400, "VALIDATION_FAILED", "Choose a valid proposed staff kind.");
  }
  const placement = resolveDepartmentAndFaculty(organizationId, input as Invitation);
  const invitedByStaff = db.staff.find(staff => staff.staffProfileId === invitedBy && staff.status === "Active");
  const posts = db.appointments.filter(appointment => appointment.organizationId === organizationId);
  const authorized = !!invitedByStaff && (
    (placement.facultyKey && ["Dean", "FacultyOfficer"].some(post => currentPostHolder(posts, post as PostCode, placement.facultyKey!)?.staffProfileId === invitedBy)) ||
    (placement.departmentKey && currentPostHolder(posts, "HOD", placement.departmentKey)?.staffProfileId === invitedBy)
  );
  if (!authorized) return err(403, "INVITATION_FORBIDDEN", "Only the dean, faculty officer or relevant HOD can invite this person.");
  return null;
}

export function createInvitations(organizationId: string, body: unknown): Op<{ created: Invitation[]; failed: { email: string; code: string; message: string }[] }> {
  const db = loadDB(organizationId);
  const inputs: InviteInput[] = Array.isArray(body) ? body : [body as InviteInput];
  if (!inputs.length) return err(400, "VALIDATION_FAILED", "Provide at least one invitation.");
  const created: Invitation[] = [];
  const failed: { email: string; code: string; message: string }[] = [];
  for (const input of inputs) {
    const problem = validateInviteInput(organizationId, input ?? {});
    if (problem) {
      failed.push({ email: String((input as InviteInput)?.email ?? ""), code: problem.code, message: problem.message });
      continue;
    }
    const invitation: Invitation = {
      invitationId: crypto.randomUUID(),
      organizationId,
      organizationName: typeof (input as InviteInput).organizationName === "string" ? String((input as InviteInput).organizationName).trim() : undefined,
      kind: (input as InviteInput).kind as Invitation["kind"],
      email: ((input as InviteInput).email as string).trim(),
      token: crypto.randomUUID(),
      programmeId: (input as InviteInput).programmeId != null ? String((input as InviteInput).programmeId) : null,
      entryStageId: (input as InviteInput).entryStageId != null ? String((input as InviteInput).entryStageId) : null,
      departmentId: (input as InviteInput).departmentId != null ? String((input as InviteInput).departmentId) : null,
      proposedKind: ((input as InviteInput).proposedKind as StaffKind | null) ?? null,
      proposedPost: (input as InviteInput).proposedPost === "FacultyOfficer" ? "FacultyOfficer" : null,
      sessionId: ((input as InviteInput).sessionId as string).trim(),
      invitedBy: ((input as InviteInput).invitedBy as string).trim(),
      expiresOn: typeof (input as InviteInput).expiresOn === "string" && (input as InviteInput).expiresOn
        ? String((input as InviteInput).expiresOn)
        : new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      status: "Sent",
      ...(typeof (input as InviteInput).sessionName === "string" && (input as InviteInput).sessionName
        ? { sessionName: String((input as InviteInput).sessionName) }
        : {}),
    };
    if (invitation.sessionName) db.sessionNames[invitation.sessionId] = invitation.sessionName;
    db.invitations.push(invitation);
    db.outbox.push({ to: invitation.email, subject: "Your school invitation", body: `/join/${invitation.token}`, createdAt: nowISO() });
    created.push(invitation);
  }
  // A single bad address never fails the batch; an entirely bad batch is a 400.
  if (!created.length) {
    const first = failed[0];
    return err(400, first.code, first.message);
  }
  saveDB(organizationId);
  return ok({ created, failed }, 201);
}

export function listInvitations(organizationId: string, status?: string): Op<Invitation[]> {
  const db = loadDB(organizationId);
  let items = db.invitations.filter(i => i.organizationId === organizationId);
  if (status) items = items.filter(i => i.status === status);
  return ok(items);
}

export function resendInvitation(organizationId: string, invitationId: string): Op<Invitation> {
  const db = loadDB(organizationId);
  const invitation = db.invitations.find(i => i.invitationId === invitationId && i.organizationId === organizationId);
  if (!invitation) return err(404, "INVITATION_NOT_FOUND", "Invitation not found.");
  if (invitation.status === "Approved" || invitation.status === "Submitted") {
    return err(409, "INVITATION_UNUSABLE", "This invitation already has a submitted or approved form.");
  }
  // Resending issues a new token and expiry and invalidates the old one.
  invitation.token = crypto.randomUUID();
  invitation.expiresOn = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  invitation.status = "Sent";
  db.outbox.push({ to: invitation.email, subject: "Your new school invitation link", body: `/join/${invitation.token}`, createdAt: nowISO() });
  saveDB(organizationId);
  return ok(invitation);
}

export function revokeInvitation(organizationId: string, invitationId: string): Op<null> {
  const db = loadDB(organizationId);
  const invitation = db.invitations.find(i => i.invitationId === invitationId && i.organizationId === organizationId);
  if (!invitation) return err(404, "INVITATION_NOT_FOUND", "Invitation not found.");
  invitation.status = "Expired";
  saveDB(organizationId);
  return ok(null);
}

function findByToken(token: string): { organizationId: string; db: OrgDB; invitation: Invitation } | null {
  // A public join link is often opened in a new tab or after a reload. Hydrate
  // persisted organizations before looking up the token.
  if (typeof localStorage !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith("edutracker.faculty.")) loadDB(key.slice("edutracker.faculty.".length));
      }
    } catch { /* In-memory invitations still work when storage is unavailable. */ }
  }
  for (const [organizationId, db] of memory.entries()) {
    const invitation = db.invitations.find(i => i.token === token);
    if (invitation) return { organizationId, db, invitation };
  }
  return null;
}

/** Approved students are the source for cohort rosters; no second person row is created. */
export function approvedStudentsInCohort(organizationId: string, cohortId: string): StudentProfile[] {
  return loadDB(organizationId).students.filter(student => student.currentCohortId === cohortId);
}

export function unusable(): OpErr {
  return err(410, "INVITATION_UNUSABLE", "This invitation link is no longer usable. Ask the school for a fresh one.");
}

function placementNames(organizationId: string, invitation: Invitation) {
  const setup = readSchoolSetup(organizationId);
  const units = setup?.structure.units ?? [];
  const stages = setup?.structure.stages ?? [];
  const programme = units.find(u => u.key === invitation.programmeId);
  const department = units.find(u => u.key === (invitation.departmentId ?? programme?.parent ?? undefined));
  const stage = stages.find(s => s.key === invitation.entryStageId);
  return {
    programmeName: programme?.name ?? null,
    departmentName: department?.name ?? null,
    stageName: stage?.name ?? null,
  };
}

export function getJoin(token: string, now: Date = new Date()): Op<{
  invitationId: string; organizationId: string; organizationName: string; kind: string; email: string;
  programmeName: string | null; departmentName: string | null; stageName: string | null;
  sessionName: string; expiresOn: string;
}> {
  const found = findByToken(token);
  if (!found) return unusable();
  const { organizationId, db, invitation } = found;
  if (!isTokenUsable(invitation, now)) {
    if (invitation.status !== "Approved" && invitation.status !== "Submitted") invitation.status = "Expired";
    saveDB(organizationId);
    return unusable();
  }
  if (invitation.status === "Sent") {
    invitation.status = "Opened";
    saveDB(organizationId);
  }
  const names = placementNames(organizationId, invitation);
  return ok({
    invitationId: invitation.invitationId,
    organizationId,
    organizationName: invitation.organizationName || "Your school",
    kind: invitation.kind,
    email: invitation.email,
    ...names,
    sessionName: db.sessionNames[invitation.sessionId] ?? invitation.sessionName ?? DEFAULT_SESSION_NAME,
    expiresOn: invitation.expiresOn,
  });
}

export function submitJoin(token: string, body: Record<string, unknown>, now: Date = new Date(), credential?: PasswordCredential): Op<PendingRecord> {
  const found = findByToken(token);
  if (!found) return unusable();
  const { organizationId, db, invitation } = found;
  if (!isTokenUsable(invitation, now)) {
    if (invitation.status !== "Approved" && invitation.status !== "Submitted") invitation.status = "Expired";
    saveDB(organizationId);
    return unusable();
  }
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) return err(400, "VALIDATION_FAILED", "Enter your full name.");
  const required = ["dateOfBirth", "sex", "phone", "homeAddress", "nextOfKinName", "nextOfKinPhone", "photograph"];
  if (invitation.kind === "Staff") required.push("highestQualification", "proposedRank");
  if (required.some(field => typeof body[field] !== "string" || !(body[field] as string).trim())) {
    return err(400, "VALIDATION_FAILED", "Complete every required form field before submitting.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth as string) || Number.isNaN(Date.parse(body.dateOfBirth as string))) {
    return err(400, "VALIDATION_FAILED", "Enter a valid date of birth.");
  }
  if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(body.photograph as string)) {
    return err(400, "VALIDATION_FAILED", "Upload a valid photograph.");
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8) return err(400, "VALIDATION_FAILED", "Choose a password of at least 8 characters.");
  // The placement fields are NEVER trusted from the form: strip them silently.
  const { programmeId: _p, entryStageId: _e, departmentId: _d, sessionId: _s, password: _password, ...submitted } = body;
  void _p; void _e; void _d; void _s; void _password;
  const pending: PendingRecord = {
    pendingRecordId: crypto.randomUUID(),
    invitationId: invitation.invitationId,
    organizationId,
    submitted: { ...submitted, fullName, email: invitation.email },
    submittedAt: nowISO(),
    status: "AwaitingReview",
    reviewedBy: null,
    rejectionReason: null,
  };
  db.pending.push(pending);
  if (credential) db.pendingCredentials[pending.pendingRecordId] = credential;
  invitation.status = "Submitted";
  // No serial is allocated here — approval owns numbering, so abandoned forms
  // leave no gaps.
  saveDB(organizationId);
  return ok(pending, 201);
}

// ─── Approval ─────────────────────────────────────────────────────────────

function resolveDepartmentAndFaculty(organizationId: string, invitation: Invitation): { departmentKey: string | null; facultyKey: string | null } {
  const setup = readSchoolSetup(organizationId);
  const units = setup?.structure.units ?? [];
  let departmentKey: string | null = null;
  if (invitation.kind === "Staff") {
    departmentKey = invitation.departmentId;
  } else if (invitation.programmeId) {
    const programme = units.find(u => u.key === invitation.programmeId);
    if (!programme) return { departmentKey: invitation.programmeId, facultyKey: null };
    // The department is the programme itself when it sits at depth ≤1
    // (transitional departments act as their own programme), else its parent.
    const depth = unitDepthOfUnits(units, programme.key);
    departmentKey = depth <= 1 ? programme.key : programme.parent;
  }
  if (!departmentKey) return { departmentKey: null, facultyKey: null };
  const department = units.find(u => u.key === departmentKey);
  if (!department) return { departmentKey, facultyKey: null };
  const facultyKey = department.parent ?? (unitDepthOfUnits(units, department.key) === 0 ? department.key : null);
  return { departmentKey, facultyKey };
}

function unitDepthOfUnits(units: { key: string; parent: string | null }[], key: string | null): number {
  let depth = 0;
  let current = units.find(unit => unit.key === key);
  const seen = new Set<string>();
  while (current?.parent && !seen.has(current.key)) {
    seen.add(current.key);
    depth += 1;
    current = units.find(unit => unit.key === current!.parent);
  }
  return depth;
}

function checkApprover(db: OrgDB, organizationId: string, invitation: Invitation, reviewerId: string, now: Date): OpErr | { facultyKey: string | null; departmentKey: string | null } {
  const reviewer = db.staff.find(s => s.staffProfileId === reviewerId && s.organizationId === organizationId);
  if (!reviewer) return err(403, "APPROVAL_FORBIDDEN", "Only the dean or the head of department may approve.");
  const { departmentKey, facultyKey } = resolveDepartmentAndFaculty(organizationId, invitation);
  // Who may approve: the Dean of that faculty, or the HOD of the department
  // the invitation names — checked through currentPostHolder, never a role string.
  if (facultyKey) {
    const dean = currentPostHolder(db.appointments.filter(a => a.organizationId === organizationId), "Dean", facultyKey, now);
    if (dean?.staffProfileId === reviewerId) return { facultyKey, departmentKey };
  }
  if (departmentKey) {
    const hod = currentPostHolder(db.appointments.filter(a => a.organizationId === organizationId), "HOD", departmentKey, now);
    if (hod?.staffProfileId === reviewerId) return { facultyKey, departmentKey };
  }
  return err(403, "APPROVAL_FORBIDDEN", "Only the dean of this faculty or the head of this department may approve.");
}

export type ApprovalResult =
  | { type: "Student"; student: StudentProfile; matriculationNumber: string; schoolEmail: string; cohortId: string }
  | { type: "Staff"; staff: StaffProfile; staffNumber: string; schoolEmail: string };

export function approvePending(
  organizationId: string,
  pendingRecordId: string,
  reviewerId: string,
  now: Date = new Date(),
): Op<ApprovalResult> {
  const db = loadDB(organizationId);
  const pending = db.pending.find(p => p.pendingRecordId === pendingRecordId && p.organizationId === organizationId);
  if (!pending) return err(404, "PENDING_NOT_FOUND", "Pending record not found.");
  if (pending.status !== "AwaitingReview") return err(409, "PENDING_DECIDED", "This record has already been decided.");
  const invitation = db.invitations.find(i => i.invitationId === pending.invitationId);
  if (!invitation) return err(404, "INVITATION_NOT_FOUND", "Invitation not found.");
  const access = checkApprover(db, organizationId, invitation, reviewerId, now);
  if ("ok" in access && !access.ok) return access;
  const { facultyKey: _f, departmentKey } = access as { facultyKey: string | null; departmentKey: string | null };
  void _f;

  const fullName = String(pending.submitted.fullName ?? "").trim();
  const emailTaken = (email: string) =>
    db.emails.some(e => e.toLowerCase() === email.toLowerCase());

  if (invitation.kind === "Student") {
    const setup = readSchoolSetup(organizationId);
    const units = setup?.structure.units ?? [];
    const department = units.find(u => u.key === departmentKey);
    const unitCode = (department?.code ?? "").toUpperCase();
    // A unit with no code blocks approval — never substitute silently.
    if (!unitCode) return err(409, "UNIT_CODE_MISSING", "Set a unit code for this department before approving. No code, no numbers.");
    const format = db.identifierFormat ?? defaultIdentifierFormat(organizationId);
    const sessionName = db.sessionNames[invitation.sessionId] ?? invitation.sessionName ?? DEFAULT_SESSION_NAME;
    const scope = serialScopeKey(format, invitation.sessionId, unitCode);
    const used = db.usedSerials[scope] ?? [];
    const { serial, identifier } = allocateSerial(
      format,
      { sessionId: invitation.sessionId, sessionName, unitCode },
      used,
      id => db.issuedIdentifiers.includes(id),
    );
    db.usedSerials[scope] = [...used, serial];
    db.issuedIdentifiers.push(identifier);
    const schoolEmail = generateSchoolEmail(fullName, "Student", db.domain, emailTaken);
    db.emails.push(schoolEmail);
    const stageId = fixtureId(organizationId, "stage", invitation.entryStageId!);
    const cohortId = fixtureId(organizationId, invitation.sessionId, stageId, invitation.programmeId!);
    const student: StudentProfile = {
      studentProfileId: crypto.randomUUID(),
      organizationId,
      userId: crypto.randomUUID(),
      fullName,
      matriculationNumber: identifier,
      programmeId: invitation.programmeId!,
      entryStageId: invitation.entryStageId!,
      entrySessionId: invitation.sessionId,
      currentCohortId: cohortId,
      schoolEmail,
      status: "Active",
      photograph: typeof pending.submitted.photograph === "string" ? pending.submitted.photograph : undefined,
    };
    db.students.push(student);
    const credential = db.pendingCredentials[pendingRecordId];
    if (credential) db.accounts.push({ userId: student.userId, schoolEmail, kind: "Student", credential });
    delete db.pendingCredentials[pendingRecordId];
    pending.status = "Approved";
    pending.reviewedBy = reviewerId;
    invitation.status = "Approved";
    db.outbox.push({ to: invitation.email, subject: "Your school account is ready", body: `Matriculation number: ${identifier}. School email: ${schoolEmail}.`, createdAt: nowISO() });
    saveDB(organizationId);
    return ok({ type: "Student", student, matriculationNumber: identifier, schoolEmail, cohortId });
  }

  // Staff approval.
  const proposedKind: StaffKind = (invitation.proposedKind as StaffKind | null) ?? "Academic";
  const unitKind: "Department" | "Faculty" = proposedKind === "Administrative" && departmentKey === invitation.departmentId && isFacultyKey(unitsOf(organizationId), invitation.departmentId)
    ? "Faculty"
    : "Department";
  if (unitKind === "Faculty" && proposedKind !== "Administrative") {
    return err(400, "STAFF_UNIT_INVALID", "Only administrative staff may belong directly to a faculty.");
  }
  const proposedRank = typeof pending.submitted.proposedRank === "string" ? (pending.submitted.proposedRank as string).trim() : "";
  let rankId: string | null = null;
  if (proposedKind === "Academic" && proposedRank) {
    const rank = db.ranks.find(r => r.name.toLowerCase() === proposedRank.toLowerCase());
    if (rank) rankId = rank.rankId;
  }
  let staffNumber: string;
  do {
    db.staffSeq += 1;
    staffNumber = `STF/${String(db.staffSeq).padStart(4, "0")}`;
  } while (db.staff.some(member => member.staffNumber.toLowerCase() === staffNumber.toLowerCase()));
  const schoolEmail = generateSchoolEmail(fullName, "Staff", db.domain, emailTaken);
  db.emails.push(schoolEmail);
  const wantsLogin = proposedKind === "Academic" ||
    (proposedKind === "Administrative" && (pending.submitted.proposedPost === "FacultyOfficer" || (invitation as { proposedPost?: string }).proposedPost === "FacultyOfficer"));
  const profile: StaffProfile = {
    staffProfileId: crypto.randomUUID(),
    organizationId,
    // StaffProfile.userId is nullable on purpose: Academic staff and the faculty
    // officer get accounts; Technical staff get a record with no account.
    userId: wantsLogin ? crypto.randomUUID() : null,
    staffNumber,
    fullName,
    title: typeof pending.submitted.title === "string" ? (pending.submitted.title as string).slice(0, 20) : "",
    kind: proposedKind,
    unitId: invitation.departmentId!,
    unitKind,
    rankId,
    schoolEmail,
    status: "Active",
    appointedOn: nowISO(),
    photograph: typeof pending.submitted.photograph === "string" ? pending.submitted.photograph : undefined,
    highestQualification: typeof pending.submitted.highestQualification === "string" ? pending.submitted.highestQualification : undefined,
  };
  db.staff.push(profile);
  const credential = db.pendingCredentials[pendingRecordId];
  if (credential && profile.userId) db.accounts.push({ userId: profile.userId, schoolEmail, kind: "Staff", credential });
  delete db.pendingCredentials[pendingRecordId];
  if (rankId) {
    db.rankHistory.push({
      rankHistoryId: crypto.randomUUID(), organizationId,
      staffProfileId: profile.staffProfileId, rankId, effectiveFrom: nowISO(), effectiveTo: null,
    });
  }
  pending.status = "Approved";
  pending.reviewedBy = reviewerId;
  invitation.status = "Approved";
  db.outbox.push({ to: invitation.email, subject: "Your school account is ready", body: `Staff number: ${staffNumber}. School email: ${schoolEmail}.`, createdAt: nowISO() });
  saveDB(organizationId);
  return ok({ type: "Staff", staff: profile, staffNumber, schoolEmail });
}

function unitsOf(organizationId: string) {
  return readSchoolSetup(organizationId)?.structure.units ?? [];
}

function isFacultyKey(units: { key: string; parent: string | null }[], key: string | null): boolean {
  if (!key) return false;
  const unit = units.find(u => u.key === key);
  return !!unit && unit.parent === null;
}

export function rejectPending(
  organizationId: string,
  pendingRecordId: string,
  reviewerId: string,
  reason: unknown,
  now: Date = new Date(),
): Op<PendingRecord> {
  const db = loadDB(organizationId);
  const pending = db.pending.find(p => p.pendingRecordId === pendingRecordId && p.organizationId === organizationId);
  if (!pending) return err(404, "PENDING_NOT_FOUND", "Pending record not found.");
  if (pending.status !== "AwaitingReview") return err(409, "PENDING_DECIDED", "This record has already been decided.");
  const invitation = db.invitations.find(i => i.invitationId === pending.invitationId);
  if (!invitation) return err(404, "INVITATION_NOT_FOUND", "Invitation not found.");
  const access = checkApprover(db, organizationId, invitation, reviewerId, now);
  if ("ok" in access && !access.ok) return access;
  if (typeof reason !== "string" || !reason.trim()) {
    return err(400, "VALIDATION_FAILED", "Give a reason. The person sees it and resubmits against it.");
  }
  pending.status = "Rejected";
  pending.reviewedBy = reviewerId;
  pending.rejectionReason = reason.trim();
  delete db.pendingCredentials[pendingRecordId];
  // Rejection reopens the invitation so the person can resubmit. No serial was
  // allocated at submission, so resubmitting and approving consumes exactly one.
  invitation.status = "Opened";
  db.outbox.push({ to: invitation.email, subject: "Please correct your school form", body: reason.trim(), createdAt: nowISO() });
  saveDB(organizationId);
  return ok(pending);
}

export async function portalLogin(organizationId: string, schoolEmail: string, password: string): Promise<Op<{ userId: string; kind: "Student" | "Staff"; schoolEmail: string }>> {
  const db = loadDB(organizationId);
  const account = db.accounts.find(item => item.schoolEmail.toLowerCase() === schoolEmail.trim().toLowerCase());
  if (!account || !(await verifyPassword(password, account.credential))) {
    return err(401, "INVALID_CREDENTIALS", "The school email or password is incorrect.");
  }
  return ok({ userId: account.userId, kind: account.kind, schoolEmail: account.schoolEmail });
}

export function listMockOutbox(organizationId: string): Op<MockEmail[]> {
  return ok([...loadDB(organizationId).outbox]);
}

export function listPending(organizationId: string, query: { facultyId?: string; status?: string }): Op<PendingRecord[]> {
  const db = loadDB(organizationId);
  let items = db.pending.filter(p => p.organizationId === organizationId);
  if (query.status) items = items.filter(p => p.status === query.status);
  if (query.facultyId) {
    items = items.filter(p => {
      const invitation = db.invitations.find(i => i.invitationId === p.invitationId);
      if (!invitation) return false;
      return resolveDepartmentAndFaculty(organizationId, invitation).facultyKey === query.facultyId;
    });
  }
  return ok(items);
}

// ─── Students, courses, tracking ────────────────────────────────────────────

export function listStudents(
  organizationId: string,
  query: { facultyId?: string; programmeId?: string; q?: string },
): Op<{ items: StudentProfile[]; total: number }> {
  const db = loadDB(organizationId);
  let items = db.students.filter(s => s.organizationId === organizationId);
  if (query.facultyId) {
    const setup = readSchoolSetup(organizationId);
    const units = (setup?.structure.units ?? []).map(u => ({ key: u.key, parent: u.parent }));
    const under = new Set(units.filter(u => u.parent === query.facultyId).map(u => u.key));
    // Programmes sit under departments; a student belongs via their programme.
    const programmeKeys = new Set(
      units.filter(u => u.parent && (under.has(u.parent) || u.parent === query.facultyId)).map(u => u.key),
    );
    items = items.filter(s => programmeKeys.has(s.programmeId) || under.has(s.programmeId) || s.programmeId === query.facultyId);
  }
  if (query.programmeId) items = items.filter(s => s.programmeId === query.programmeId);
  if (query.q) {
    const needle = query.q.toLowerCase();
    items = items.filter(s => s.fullName.toLowerCase().includes(needle) || s.matriculationNumber.toLowerCase().includes(needle));
  }
  const total = items.length;
  return ok({ items, total });
}

export function getStudent(organizationId: string, studentProfileId: string): Op<StudentProfile> {
  const db = loadDB(organizationId);
  const student = db.students.find(s => s.studentProfileId === studentProfileId && s.organizationId === organizationId);
  if (!student) return err(404, "STUDENT_NOT_FOUND", "Student record not found.");
  return ok(student);
}

export type LecturerCourseRow = {
  courseId: string; code: string; title: string; enrolment: number;
  resultsState: "Not started" | "Partial" | "Submitted";
};

export type StaffTracking = {
  profile: StaffProfile;
  rankName: string | null;
  departmentName: string | null;
  courses: LecturerCourseRow[];
  outstandingResults: number;
  attendance: (AttendanceSummary & { courseId: string; code: string; title: string })[];
  posts: (Appointment & { expired: boolean })[];
  rankHistory: (RankHistory & { rankName: string | null })[];
};

function latestTrackingSession(db: OrgDB): string | undefined {
  const ids = new Set([...Object.keys(db.sessionNames), ...db.assignments.map(item => item.sessionId)]);
  return [...ids].sort((left, right) => {
    const year = (id: string) => Number.parseInt((db.sessionNames[id] ?? id).match(/\d{4}/)?.[0] ?? "0", 10);
    return year(left) - year(right) || left.localeCompare(right);
  }).at(-1);
}

export function staffTracking(organizationId: string, staffProfileId: string, sessionId?: string): Op<StaffTracking> {
  const db = loadDB(organizationId);
  const profile = db.staff.find(s => s.staffProfileId === staffProfileId && s.organizationId === organizationId);
  if (!profile) return err(404, "STAFF_NOT_FOUND", "Staff record not found.");
  const setup = readSchoolSetup(organizationId);
  const units = setup?.structure.units ?? [];
  const departmentName = units.find(u => u.key === profile.unitId)?.name ?? null;
  const rankName = profile.rankId ? (db.ranks.find(r => r.rankId === profile.rankId)?.name ?? null) : null;
  const activeSessionId = sessionId ?? latestTrackingSession(db);
  let assignments = db.assignments.filter(a => a.staffProfileId === staffProfileId);
  if (activeSessionId) assignments = assignments.filter(a => a.sessionId === activeSessionId);
  const courses: LecturerCourseRow[] = assignments.map(a => {
    const course = db.courses.find(c => c.courseId === a.courseId);
    const enrolment = db.registrations.filter(r => r.courseId === a.courseId && r.sessionId === a.sessionId && r.status === "Registered").length;
    const resultsState = db.results.find(r => r.courseId === a.courseId && r.sessionId === a.sessionId)?.state ?? "Not started";
    return {
      courseId: a.courseId,
      code: course?.code ?? "—",
      title: course?.title ?? "Unknown course",
      enrolment,
      resultsState,
    };
  });
  const outstandingResults = courses.filter(c => c.resultsState !== "Submitted").length;
  const attendance = db.attendance
    .filter(a => a.ownerKind === "staff" && a.ownerId === staffProfileId && (!activeSessionId || a.sessionId === activeSessionId))
    .map(a => {
      const course = db.courses.find(c => c.courseId === a.courseId);
      return { courseId: a.courseId, sessionId: a.sessionId, code: course?.code ?? "—", title: course?.title ?? "Unknown course", taken: a.taken, scheduled: a.scheduled };
    });
  const now = new Date();
  const posts = postsHeldBy(db.appointments.filter(a => a.organizationId === organizationId), staffProfileId)
    .map(a => ({ ...a, expired: a.endsOn !== null && !Number.isNaN(Date.parse(a.endsOn)) && new Date(a.endsOn).getTime() < now.getTime() }))
    .sort((a, b) => b.startsOn.localeCompare(a.startsOn));
  const rankHistory = db.rankHistory
    .filter(h => h.staffProfileId === staffProfileId)
    .map(h => ({ ...h, rankName: db.ranks.find(r => r.rankId === h.rankId)?.name ?? null }))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return ok({ profile, rankName, departmentName, courses, outstandingResults, attendance, posts, rankHistory });
}

export type StudentCourseRow = {
  courseId: string; code: string; title: string; creditUnits: number;
  lecturer: string | null; requirement: string | null; resultsState: "Not started" | "Partial" | "Submitted";
  grade: string | null;
};

export type StudentTracking = {
  student: StudentProfile;
  chain: string[];
  courses: StudentCourseRow[];
  attendance: { overall: { taken: number; scheduled: number }; perCourse: (AttendanceSummary & { code: string })[] };
  levelAdviser: string | null;
  history: StudentSessionHistory[];
  standing: "Results pending" | "On track" | "Carryover";
};

export function studentTracking(organizationId: string, studentProfileId: string, sessionId?: string): Op<StudentTracking> {
  const db = loadDB(organizationId);
  const student = db.students.find(s => s.studentProfileId === studentProfileId && s.organizationId === organizationId);
  if (!student) return err(404, "STUDENT_NOT_FOUND", "Student record not found.");
  const setup = readSchoolSetup(organizationId);
  const units = setup?.structure.units ?? [];
  const stages = setup?.structure.stages ?? [];
  const chainUnits = studentUnitChain(units.map(u => ({ key: u.key, parent: u.parent, name: u.name })), student.programmeId);
  const chain = chainUnits.map(u => u.name);
  const currentCohort = Object.keys(db.sessionNames).flatMap(sessionKey =>
    stages.map(stage => ({ sessionKey, stage, id: fixtureId(organizationId, sessionKey, fixtureId(organizationId, "stage", stage.key), student.programmeId) })),
  ).find(candidate => candidate.id === student.currentCohortId);
  const currentStage = currentCohort?.stage ?? stages.find(s => s.key === student.entryStageId);
  if (currentStage) chain.push(currentStage.name);
  const currentSessionId = currentCohort?.sessionKey ?? student.entrySessionId;
  const sessionName = db.sessionNames[currentSessionId] ?? DEFAULT_SESSION_NAME;
  chain.push(sessionName);
  const session = sessionId ?? currentSessionId;
  const registrations = db.registrations.filter(r => r.studentProfileId === studentProfileId && r.sessionId === session && r.status === "Registered");
  const courses: StudentCourseRow[] = registrations.map(r => {
    const course = db.courses.find(c => c.courseId === r.courseId);
    const lead = db.assignments.find(a => a.courseId === r.courseId && a.sessionId === session && a.role === "Lead");
    const lecturer = lead ? (db.staff.find(s => s.staffProfileId === lead.staffProfileId)?.fullName ?? null) : null;
    const resultsState = db.results.find(x => x.courseId === r.courseId && x.sessionId === session)?.state ?? "Not started";
    const offering = db.offerings.find(item => item.offeringId === r.offeringId);
    const result = db.studentResults.find(item => item.studentProfileId === studentProfileId && item.courseId === r.courseId && item.sessionId === session);
    return {
      courseId: r.courseId, code: course?.code ?? "—", title: course?.title ?? "Unknown course",
      creditUnits: course?.creditUnits ?? 0, lecturer, requirement: offering?.requirement ?? null, resultsState,
      grade: result?.grade ?? null,
    };
  });
  const releasedResults = db.studentResults.filter(item => item.studentProfileId === studentProfileId && item.sessionId === session);
  const standing = releasedResults.some(item => !item.passed) ? "Carryover"
    : courses.length > 0 && courses.every(course => course.grade !== null) ? "On track"
    : "Results pending";
  const rows = db.attendance.filter(a => a.ownerKind === "student" && a.ownerId === studentProfileId && a.sessionId === session);
  const overall = rows.reduce((sum, r) => ({ taken: sum.taken + r.taken, scheduled: sum.scheduled + r.scheduled }), { taken: 0, scheduled: 0 });
  const perCourse = rows.map(r => ({
    courseId: r.courseId, sessionId: r.sessionId,
    code: db.courses.find(c => c.courseId === r.courseId)?.code ?? "—",
    taken: r.taken, scheduled: r.scheduled,
  }));
  const adviser = currentPostHolder(db.appointments.filter(a => a.organizationId === organizationId), "LevelAdviser", student.currentCohortId);
  const levelAdviser = adviser ? (db.staff.find(s => s.staffProfileId === adviser.staffProfileId)?.fullName ?? null) : null;
  const history = db.studentHistory
    .filter(h => h.studentProfileId === studentProfileId)
    .sort((a, b) => a.sessionName.localeCompare(b.sessionName));
  return ok({ student, chain, courses, attendance: { overall, perCourse }, levelAdviser, history, standing });
}

export type FacultySummary = {
  facultyId: string;
  facultyName: string | null;
  dean: string | null;
  subDean: string | null;
  facultyOfficer: string | null;
  departments: { departmentId: string; name: string; hod: string | null; staffCount: number }[];
  staffByRank: { rankId: string; name: string; count: number }[];
  studentsByProgramme: { programmeId: string; name: string; count: number }[];
  pendingApprovals: number;
  staffTotal: number;
  studentTotal: number;
};

/** The overview is one request, not eleven. */
export function facultySummary(organizationId: string, facultyId: string, now: Date = new Date()): Op<FacultySummary> {
  const db = loadDB(organizationId);
  const setup = readSchoolSetup(organizationId);
  const units = setup?.structure.units ?? [];
  const facultyName = units.find(u => u.key === facultyId)?.name ?? null;
  const live = db.appointments.filter(a => a.organizationId === organizationId);
  const nameOf = (post: "Dean" | "SubDean" | "FacultyOfficer") => {
    const holder = currentPostHolder(live, post, facultyId, now);
    return holder ? (db.staff.find(s => s.staffProfileId === holder.staffProfileId)?.fullName ?? null) : null;
  };
  const departments = units.filter(u => u.parent === facultyId);
  const facultyStaff = staffOfFaculty(db.staff.filter(s => s.organizationId === organizationId), units.map(u => ({ key: u.key, parent: u.parent })), facultyId);
  const hodOf = (departmentId: string) => {
    const holder = currentPostHolder(live, "HOD", departmentId, now);
    return holder ? (db.staff.find(s => s.staffProfileId === holder.staffProfileId)?.fullName ?? null) : null;
  };
  const staffByRankMap = new Map<string, number>();
  for (const member of facultyStaff.filter(s => s.kind === "Academic" && s.rankId)) {
    staffByRankMap.set(member.rankId!, (staffByRankMap.get(member.rankId!) ?? 0) + 1);
  }
  const staffByRank = [...staffByRankMap.entries()].map(([rankId, count]) => ({
    rankId, name: db.ranks.find(r => r.rankId === rankId)?.name ?? "Unknown", count,
  })).sort((a, b) => {
    const oa = db.ranks.find(r => r.rankId === a.rankId)?.order ?? 0;
    const ob = db.ranks.find(r => r.rankId === b.rankId)?.order ?? 0;
    return oa - ob;
  });
  // Students of the faculty: every student whose programme sits under it.
  const under = new Set(departments.map(d => d.key));
  const programmeKeys = new Set(units.filter(u => u.parent && (under.has(u.parent) || u.parent === facultyId)).map(u => u.key));
  const facultyStudents = db.students.filter(s =>
    s.organizationId === organizationId &&
    (programmeKeys.has(s.programmeId) || under.has(s.programmeId) || s.programmeId === facultyId));
  const byProgramme = new Map<string, number>();
  for (const student of facultyStudents) byProgramme.set(student.programmeId, (byProgramme.get(student.programmeId) ?? 0) + 1);
  const studentsByProgramme = [...byProgramme.entries()].map(([programmeId, count]) => ({
    programmeId, name: units.find(u => u.key === programmeId)?.name ?? programmeId, count,
  }));
  const pendingApprovals = db.pending.filter(p => {
    if (p.organizationId !== organizationId || p.status !== "AwaitingReview") return false;
    const invitation = db.invitations.find(i => i.invitationId === p.invitationId);
    return !!invitation && resolveDepartmentAndFaculty(organizationId, invitation).facultyKey === facultyId;
  }).length;
  return ok({
    facultyId,
    facultyName,
    dean: nameOf("Dean"),
    subDean: nameOf("SubDean"),
    facultyOfficer: nameOf("FacultyOfficer"),
    departments: departments.map(d => ({
      departmentId: d.key,
      name: d.name,
      hod: hodOf(d.key),
      staffCount: facultyStaff.filter(s => s.unitId === d.key).length,
    })),
    staffByRank,
    studentsByProgramme,
    pendingApprovals,
    staffTotal: facultyStaff.length,
    studentTotal: facultyStudents.length,
  });
}

// ─── Test + tracking seed helpers (same-process; used by Vitest and UI fixtures) ──

export function facultyTestUtils(organizationId: string) {
  const db = loadDB(organizationId);
  const persist = () => saveDB(organizationId);
  return {
    db,
    persist,
    setDomain(domain: string) { db.domain = domain; persist(); },
    setSessionName(sessionId: string, name: string) { db.sessionNames[sessionId] = name; persist(); },
    setIdentifierFormat(format: IdentifierFormat) { db.identifierFormat = format; persist(); },
    addCourse(input: { owningDepartmentId: string; code: string; title: string; creditUnits?: number }): Course {
      const course: Course = {
        courseId: crypto.randomUUID(), organizationId,
        owningDepartmentId: input.owningDepartmentId, code: input.code, title: input.title,
        creditUnits: input.creditUnits ?? 3,
      };
      db.courses.push(course);
      persist();
      return course;
    },
    assignCourse(courseId: string, sessionId: string, staffProfileId: string, role: "Lead" | "Assistant" = "Lead"): CourseAssignment {
      // FACULTY-BUILD §1 — a staff member whose status is not Active must not
      // be assignable to a course. Reject with 409 STAFF_NOT_ACTIVE.
      const holder = db.staff.find(s => s.staffProfileId === staffProfileId && s.organizationId === organizationId);
      if (!holder) throw Object.assign(new Error("Staff record not found."), { status: 404, code: "STAFF_NOT_FOUND" });
      if (holder.status !== "Active") {
        throw Object.assign(
          new Error(`${holder.fullName} is ${holder.status} and cannot take a course assignment.`),
          { status: 409, code: "STAFF_NOT_ACTIVE" },
        );
      }
      const assignment: CourseAssignment = { assignmentId: crypto.randomUUID(), courseId, sessionId, staffProfileId, role };
      db.assignments.push(assignment);
      persist();
      return assignment;
    },
    registerStudent(courseId: string, sessionId: string, studentProfileId: string, offeringId?: string): Registration {
      const registration: Registration = {
        registrationId: crypto.randomUUID(), sessionId, courseId, studentProfileId,
        registeredAt: nowISO(), status: "Registered", offeringId,
      };
      db.registrations.push(registration);
      persist();
      return registration;
    },
    setResults(courseId: string, sessionId: string, state: CourseResults["state"]): CourseResults {
      const existing = db.results.find(r => r.courseId === courseId && r.sessionId === sessionId);
      if (existing) { existing.state = state; persist(); return existing; }
      const row: CourseResults = { courseId, sessionId, state };
      db.results.push(row);
      persist();
      return row;
    },
    addOffering(input: Omit<CourseOffering, "offeringId">): CourseOffering {
      const row: CourseOffering = { offeringId: crypto.randomUUID(), ...input };
      db.offerings.push(row);
      persist();
      return row;
    },
    setStudentResult(row: StudentResult) {
      db.studentResults = db.studentResults.filter(item => !(item.studentProfileId === row.studentProfileId && item.courseId === row.courseId && item.sessionId === row.sessionId));
      db.studentResults.push(row);
      persist();
    },
    setAttendance(ownerKind: "staff" | "student", ownerId: string, courseId: string, sessionId: string, taken: number, scheduled: number) {
      const existing = db.attendance.find(a => a.ownerKind === ownerKind && a.ownerId === ownerId && a.courseId === courseId && a.sessionId === sessionId);
      if (existing) { existing.taken = taken; existing.scheduled = scheduled; persist(); return existing; }
      const row: AttendanceRow = { courseId, sessionId, ownerKind, ownerId, taken, scheduled };
      db.attendance.push(row);
      persist();
      return row;
    },
    addStudentHistory(row: Omit<StudentSessionHistory, "organizationId">) {
      const full: StudentSessionHistory = { ...row, organizationId };
      db.studentHistory.push(full);
      persist();
      return full;
    },
  };
}

export function lookupStaffOrg(staffProfileId: string): string | null {
  return findOrgOfStaff(staffProfileId)?.organizationId ?? null;
}
