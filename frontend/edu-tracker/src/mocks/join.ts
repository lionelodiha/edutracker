/**
 * School invite links: the school sends a link, the person fills in their own
 * details, and an admin approves the request and places them.
 *
 * Like faculty.ts, this is the server. People, accounts and numbering live in
 * the faculty store, so an approved person signs in through the same portal
 * login as everyone else. Courses and departments come from the academic store.
 */
import { readAcademics, updateOffering } from "../features/academics/store";
import { readSchoolSetup } from "../features/cohorts/schoolSetup";
import { fixtureId } from "../features/cohorts/fixtureId";
import type { StudentProfile } from "../features/cohorts/courses";
import {
  allocateSerial, defaultIdentifierFormat, generateSchoolEmail, serialScopeKey, DEFAULT_SESSION_NAME,
} from "../features/onboarding/identifiers";
import {
  newJoinToken, type JoinApproval, type JoinBoard, type JoinDepartment, type JoinDetails, type JoinLink,
  type JoinLinkView, type JoinOffering, type JoinRequest, type JoinRole,
} from "../features/onboarding/joinLinks";
import type { PasswordCredential } from "../features/onboarding/passwords";
import type { StaffProfile } from "../features/staff/types";
import { facultyStore, findFacultyOrg, type Op, type OpErr, type OpOk, type OrgDB } from "./faculty";

const ok = <T>(data: T, status = 200): OpOk<T> => ({ ok: true, data, status });
const err = (status: number, code: string, message: string): OpErr => ({ ok: false, status, code, message });

const ROLES: JoinRole[] = ["Student", "Teaching", "NonTeaching"];
const LINK_DAYS = 14;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;
const MAX_PHOTO = 1_400_000; // A 1 MB image as a data URL.

// ─── Lookups ────────────────────────────────────────────────────────────────

function schoolName(organizationId: string): string {
  try { return localStorage.getItem(`edutracker.organizationName.${organizationId}`) || "Your school"; } catch { return "Your school"; }
}

function departmentsOf(organizationId: string): (JoinDepartment & { code: string })[] {
  const units = readSchoolSetup(organizationId)?.structure.units ?? [];
  return readAcademics(organizationId).departments.map(department => {
    const unit = units.find(item => item.key === department.unitKey);
    return { departmentId: department.unitKey, name: unit?.name ?? "Department", code: (unit?.code ?? "").toUpperCase(), levels: department.levels };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/** What the form and the admin need: no unit codes. */
const publicDepartments = (organizationId: string): JoinDepartment[] =>
  departmentsOf(organizationId).map(item => ({ departmentId: item.departmentId, name: item.name, levels: item.levels }));

function currentSession(organizationId: string) {
  const sessions = readAcademics(organizationId).sessions;
  return sessions.find(item => item.status === "Current") ?? sessions[sessions.length - 1] ?? null;
}

/** Courses an admin can hand a new teacher: everything in the current session. */
function offeringsOf(organizationId: string, db: OrgDB): JoinOffering[] {
  const academics = readAcademics(organizationId);
  const session = currentSession(organizationId);
  if (!session || session.status === "Closed") return [];
  const open = new Set(session.terms.filter(term => term.status !== "Closed").map(term => term.termId));
  const courses = new Map(academics.courses.map(course => [course.courseId, course]));
  const nameOf = (id: string | null) => {
    const member = id ? db.staff.find(item => item.staffProfileId === id) : undefined;
    return member ? `${member.title ? `${member.title} ` : ""}${member.fullName}` : null;
  };
  return academics.offerings
    .filter(offering => offering.sessionId === session.sessionId && open.has(offering.termId))
    .map(offering => ({
      offeringId: offering.offeringId, departmentId: offering.departmentId, levelKey: offering.levelKey,
      code: courses.get(offering.courseId)?.code ?? "—", title: courses.get(offering.courseId)?.title ?? "Unknown course",
      termName: session.terms.find(term => term.termId === offering.termId)?.name ?? "",
      lecturer: nameOf(offering.lecturerStaffProfileId),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** Open links past their date stop working; the list shows them as expired. */
function expireStale(db: OrgDB, now: Date): boolean {
  let changed = false;
  for (const link of db.joinLinks) {
    if (link.status === "Open" && new Date(link.expiresOn).getTime() <= now.getTime()) { link.status = "Expired"; changed = true; }
  }
  return changed;
}

function byToken(token: string) {
  if (!token) return null;
  const found = findFacultyOrg(db => db.joinLinks.some(link => link.token === token));
  if (!found) return null;
  return { ...found, link: found.db.joinLinks.find(link => link.token === token)! };
}

// ─── Admin: links ───────────────────────────────────────────────────────────

export function createJoinLink(organizationId: string, input: Record<string, unknown>, now: Date = new Date()): Op<JoinLink> {
  const role = input.role as JoinRole;
  if (!ROLES.includes(role)) return err(400, "VALIDATION_FAILED", "Choose who the link is for: a student, teaching staff or non-teaching staff.");
  const sentTo = typeof input.sentTo === "string" ? input.sentTo.trim() : "";
  if (!sentTo) return err(400, "VALIDATION_FAILED", "Say who you're sending it to, so you can tell the links apart later.");
  const { db, persist } = facultyStore(organizationId);
  const link: JoinLink = {
    linkId: crypto.randomUUID(), organizationId, token: newJoinToken(), role, sentTo: sentTo.slice(0, 80),
    createdAt: now.toISOString(), expiresOn: new Date(now.getTime() + LINK_DAYS * 86_400_000).toISOString(), status: "Open",
  };
  db.joinLinks.push(link);
  persist();
  return ok(link, 201);
}

export function revokeJoinLink(organizationId: string, linkId: string): Op<null> {
  const { db, persist } = facultyStore(organizationId);
  const link = db.joinLinks.find(item => item.linkId === linkId);
  if (!link) return err(404, "JOIN_LINK_NOT_FOUND", "That link doesn't exist.");
  if (link.status !== "Open") return err(409, "JOIN_LINK_USED", "Only an unused link can be cancelled. Decline the request instead.");
  link.status = "Revoked";
  persist();
  return ok(null);
}

export function joinBoard(organizationId: string, now: Date = new Date()): Op<JoinBoard> {
  const { db, persist } = facultyStore(organizationId);
  if (expireStale(db, now)) persist();
  return ok({
    links: [...db.joinLinks].reverse().map(link => ({ ...link, requestId: db.joinRequests.find(item => item.linkId === link.linkId)?.requestId ?? null })),
    requests: [...db.joinRequests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    departments: publicDepartments(organizationId),
    offerings: offeringsOf(organizationId, db),
  });
}

// ─── Public: the link itself ────────────────────────────────────────────────

const unknownLink = () => err(404, "JOIN_LINK_NOT_FOUND", "This invite link isn't valid. Check you copied all of it, or ask the school for a new one.");

export function viewJoinLink(token: string, now: Date = new Date()): Op<JoinLinkView> {
  const found = byToken(token);
  if (!found) return unknownLink();
  const { organizationId, db, link } = found;
  if (expireStale(db, now)) facultyStore(organizationId).persist();
  const request = db.joinRequests.find(item => item.linkId === link.linkId);
  return ok({
    organizationId, schoolName: schoolName(organizationId), role: link.role, status: link.status, expiresOn: link.expiresOn,
    // The form only needs the choices while it can still be sent.
    departments: link.status === "Open" ? publicDepartments(organizationId) : [],
    request: request ? {
      status: request.status, submittedAt: request.submittedAt, fullName: request.details.fullName,
      declineReason: request.declineReason, outcome: request.outcome,
    } : null,
  });
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export function submitJoinRequest(token: string, body: Record<string, unknown>, credential: PasswordCredential | undefined, now: Date = new Date()): Op<{ requestId: string }> {
  const found = byToken(token);
  if (!found) return unknownLink();
  const { organizationId, db, link } = found;
  expireStale(db, now);
  if (link.status !== "Open") {
    return err(410, "JOIN_LINK_UNUSABLE", link.status === "Submitted" || link.status === "Approved" || link.status === "Declined"
      ? "This link has already been used to send a request."
      : "This link has expired or was cancelled. Ask the school for a new one.");
  }

  const fullName = text(body.fullName, 120).replace(/\s+/g, " ");
  if (fullName.split(" ").length < 2) return err(400, "VALIDATION_FAILED", "Enter your first name and surname.");
  const email = text(body.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return err(400, "VALIDATION_FAILED", "Enter a valid email address.");
  const phone = text(body.phone, 20);
  if (!PHONE_RE.test(phone)) return err(400, "VALIDATION_FAILED", "Enter a valid phone number.");
  const dateOfBirth = text(body.dateOfBirth, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Date.parse(dateOfBirth) >= now.getTime()) return err(400, "VALIDATION_FAILED", "Enter your date of birth.");
  const sex = body.sex === "Female" || body.sex === "Male" ? body.sex : null;
  if (!sex) return err(400, "VALIDATION_FAILED", "Choose your sex.");
  const homeAddress = text(body.homeAddress, 200);
  const nextOfKinName = text(body.nextOfKinName, 120);
  const nextOfKinPhone = text(body.nextOfKinPhone, 20);
  if (!homeAddress || !nextOfKinName || !PHONE_RE.test(nextOfKinPhone)) return err(400, "VALIDATION_FAILED", "Enter your home address and your next of kin's name and phone number.");
  const photograph = typeof body.photograph === "string" && body.photograph.startsWith("data:image/") ? body.photograph : undefined;
  if (photograph && photograph.length > MAX_PHOTO) return err(400, "VALIDATION_FAILED", "Choose a photograph under 1 MB.");

  const department = departmentsOf(organizationId).find(item => item.departmentId === body.departmentId);
  if (!department) return err(400, "VALIDATION_FAILED", "Choose your department.");
  const details: JoinDetails = {
    fullName, email, phone, dateOfBirth, sex, homeAddress, nextOfKinName, nextOfKinPhone, photograph, departmentId: department.departmentId,
  };
  if (link.role === "Student") {
    const level = text(body.level, 40);
    if (!department.levels.includes(level)) return err(400, "VALIDATION_FAILED", "Choose your level or class.");
    details.level = level;
    details.previousSchool = text(body.previousSchool, 120) || undefined;
  } else {
    details.title = text(body.title, 20) || undefined;
    details.highestQualification = text(body.highestQualification, 120);
    if (!details.highestQualification) return err(400, "VALIDATION_FAILED", "Enter your highest qualification.");
    if (link.role === "Teaching") {
      details.subjects = text(body.subjects, 300);
      if (!details.subjects) return err(400, "VALIDATION_FAILED", "List the courses or subjects you can teach.");
    } else {
      details.jobTitle = text(body.jobTitle, 80);
      if (!details.jobTitle) return err(400, "VALIDATION_FAILED", "Enter the post you're joining as, for example Bursary clerk.");
    }
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 8 || !credential) return err(400, "VALIDATION_FAILED", "Choose a password of at least 8 characters.");
  const taken = db.joinRequests.some(item => item.status !== "Declined" && item.details.email === email);
  if (taken) return err(409, "JOIN_EMAIL_TAKEN", "A request with this email has already been sent to the school.");

  const request: JoinRequest = {
    requestId: crypto.randomUUID(), linkId: link.linkId, organizationId, role: link.role, details,
    submittedAt: now.toISOString(), status: "Pending", decidedAt: null, decidedBy: null, declineReason: null, outcome: null,
  };
  db.joinRequests.push(request);
  db.pendingCredentials[request.requestId] = credential;
  link.status = "Submitted";
  facultyStore(organizationId).persist();
  return ok({ requestId: request.requestId }, 201);
}

// ─── Admin: decisions ───────────────────────────────────────────────────────

function pendingRequest(db: OrgDB, requestId: string): OpErr | JoinRequest {
  const request = db.joinRequests.find(item => item.requestId === requestId);
  if (!request) return err(404, "JOIN_REQUEST_NOT_FOUND", "That request doesn't exist.");
  if (request.status !== "Pending") return err(409, "JOIN_REQUEST_DECIDED", "This request has already been decided.");
  return request;
}

export function approveJoinRequest(organizationId: string, requestId: string, input: Partial<JoinApproval>, now: Date = new Date()): Op<JoinRequest> {
  const { db, persist } = facultyStore(organizationId);
  const request = pendingRequest(db, requestId);
  if ("ok" in request) return request;
  const department = departmentsOf(organizationId).find(item => item.departmentId === input.departmentId);
  if (!department) return err(400, "VALIDATION_FAILED", "Choose the department they belong to.");
  const decidedBy = typeof input.decidedBy === "string" && input.decidedBy.trim() ? input.decidedBy.trim() : "School admin";
  const credential = db.pendingCredentials[requestId];
  if (!credential) return err(409, "JOIN_REQUEST_INCOMPLETE", "This request has no password. Decline it and send a new link.");
  const { details } = request;
  const emailTaken = (email: string) => db.emails.some(item => item.toLowerCase() === email.toLowerCase());
  let outcome: JoinRequest["outcome"];

  if (request.role === "Student") {
    const level = typeof input.level === "string" ? input.level : "";
    const stage = department.levels.indexOf(level);
    if (stage < 0) return err(400, "VALIDATION_FAILED", "Choose the level or class they're joining.");
    const session = currentSession(organizationId);
    const sessionId = session?.sessionId ?? "unassigned";
    const unitCode = department.code || department.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "STU";
    const format = db.identifierFormat ?? defaultIdentifierFormat(organizationId);
    const scope = serialScopeKey(format, sessionId, unitCode);
    const used = db.usedSerials[scope] ?? [];
    const { serial, identifier } = allocateSerial(format, { sessionId, sessionName: session?.name ?? DEFAULT_SESSION_NAME, unitCode }, used, id => db.issuedIdentifiers.includes(id));
    db.usedSerials[scope] = [...used, serial];
    db.issuedIdentifiers.push(identifier);
    const schoolEmail = generateSchoolEmail(details.fullName, "Student", db.domain, emailTaken);
    db.emails.push(schoolEmail);
    const student: StudentProfile = {
      studentProfileId: crypto.randomUUID(), organizationId, userId: crypto.randomUUID(), fullName: details.fullName,
      matriculationNumber: identifier,
      // The portal places a student by programme (the department) and entry stage (the level's position).
      programmeId: department.departmentId, entryStageId: `stage-${stage}`, entrySessionId: sessionId,
      currentCohortId: fixtureId(organizationId, sessionId, `stage-${stage}`, department.departmentId),
      schoolEmail, status: "Active", photograph: details.photograph,
    };
    db.students.push(student);
    db.accounts.push({ userId: student.userId, schoolEmail, kind: "Student", credential });
    outcome = { schoolEmail, number: identifier, placement: `${department.name} · ${level}` };
  } else {
    const offeringIds = request.role === "Teaching" && Array.isArray(input.offeringIds) ? [...new Set(input.offeringIds.map(String))] : [];
    const offerings = offeringsOf(organizationId, db);
    const chosen = offeringIds.map(id => offerings.find(item => item.offeringId === id));
    if (chosen.some(item => !item)) return err(400, "VALIDATION_FAILED", "One of those courses isn't offered this session.");
    let staffNumber: string;
    do {
      db.staffSeq += 1;
      staffNumber = `STF/${String(db.staffSeq).padStart(4, "0")}`;
    } while (db.staff.some(member => member.staffNumber.toLowerCase() === staffNumber.toLowerCase()));
    const schoolEmail = generateSchoolEmail(details.fullName, "Staff", db.domain, emailTaken);
    db.emails.push(schoolEmail);
    const profile: StaffProfile = {
      staffProfileId: crypto.randomUUID(), organizationId, userId: crypto.randomUUID(), staffNumber,
      fullName: details.fullName, title: details.title ?? "",
      // Academic staff get the teaching portal; everyone else gets the non-teaching one.
      kind: request.role === "Teaching" ? "Academic" : "Administrative",
      unitId: department.departmentId, unitKind: "Department", rankId: null, schoolEmail, status: "Active",
      appointedOn: now.toISOString(), photograph: details.photograph, highestQualification: details.highestQualification,
    };
    db.staff.push(profile);
    db.accounts.push({ userId: profile.userId!, schoolEmail, kind: "Staff", credential });
    for (const offering of chosen) updateOffering(organizationId, offering!.offeringId, { lecturerStaffProfileId: profile.staffProfileId });
    outcome = {
      schoolEmail, number: staffNumber,
      placement: request.role === "Teaching"
        ? `${department.name}${chosen.length ? ` · teaches ${chosen.map(item => item!.code).join(", ")}` : ""}`
        : `${department.name} · ${details.jobTitle}`,
    };
  }

  delete db.pendingCredentials[requestId];
  request.status = "Approved";
  request.decidedAt = now.toISOString();
  request.decidedBy = decidedBy;
  request.outcome = outcome;
  const link = db.joinLinks.find(item => item.linkId === request.linkId);
  if (link) link.status = "Approved";
  db.outbox.push({
    to: details.email, subject: "Your school account is ready",
    body: `School email: ${outcome.schoolEmail}. Number: ${outcome.number}. Sign in at /portal/${organizationId} with the password you chose.`,
    createdAt: now.toISOString(),
  });
  persist();
  return ok(request);
}

export function declineJoinRequest(organizationId: string, requestId: string, input: Record<string, unknown>, now: Date = new Date()): Op<JoinRequest> {
  const { db, persist } = facultyStore(organizationId);
  const request = pendingRequest(db, requestId);
  if ("ok" in request) return request;
  const reason = text(input.reason, 300);
  if (!reason) return err(400, "VALIDATION_FAILED", "Give a reason. The person sees it when they open their link.");
  delete db.pendingCredentials[requestId];
  request.status = "Declined";
  request.decidedAt = now.toISOString();
  request.decidedBy = text(input.decidedBy, 120) || "School admin";
  request.declineReason = reason;
  const link = db.joinLinks.find(item => item.linkId === request.linkId);
  if (link) link.status = "Declined";
  db.outbox.push({ to: request.details.email, subject: "Your school request", body: reason, createdAt: now.toISOString() });
  persist();
  return ok(request);
}
