import { initialSchoolSetup, readSchoolSetup, saveSchoolSetup, type AcademicUnitNode, type SchoolSetup } from "../cohorts/schoolSetup";
import type { SchoolModel } from "../cohorts/settings";
import type { AcademicOffering, AcademicSession, AcademicState, CatalogueCourse, DepartmentDetails, DepartmentInput, PrepareSessionInput, StructureResponse } from "./types";

export class AcademicError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}
const bad = (code: string, message: string, status = 400): never => { throw new AcademicError(status, code, message); };
const empty = (): AcademicState => ({ faculties: [], departments: [], sessions: [], courses: [], offerings: [] });
const memory = new Map<string, AcademicState>();
const storageKey = (organizationId: string) => `edutracker.academics.${organizationId}`;

export function readAcademics(organizationId: string): AcademicState {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(organizationId)) || "null");
    if (saved && Array.isArray(saved.sessions) && Array.isArray(saved.courses) && Array.isArray(saved.offerings)) return saved;
  } catch { /* Node tests use memory. */ }
  return structuredClone(memory.get(organizationId) ?? empty());
}
function saveAcademics(organizationId: string, state: AcademicState): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(storageKey(organizationId), JSON.stringify(state));
  memory.set(organizationId, structuredClone(state));
}
export function resetAcademicsForTest(organizationId: string): void {
  memory.delete(organizationId);
  try { localStorage.removeItem(storageKey(organizationId)); } catch { /* Node tests. */ }
}
export function getStructure(organizationId: string): StructureResponse {
  const setup = readSchoolSetup(organizationId);
  const state = readAcademics(organizationId);
  if (setup) {
    let changed = false;
    for (const unit of setup.structure.units) {
      if (unit.parent === null && setup.model !== "Primary" && !state.faculties.some(item => item.unitKey === unit.key)) {
        state.faculties.push({ unitKey: unit.key, description: "", deanStaffProfileId: null, archivedAt: null });
        changed = true;
      }
      const isDepartment = setup.model === "Primary" ? unit.parent === null : unit.parent !== null && setup.structure.units.some(parent => parent.key === unit.parent && parent.parent === null);
      if (isDepartment && !state.departments.some(item => item.unitKey === unit.key)) {
        const childKeys = new Set(setup.structure.units.filter(item => item.parent === unit.key).map(item => item.key));
        const placement = setup.structure.placements.find(item => item.unit === unit.key || (item.unit !== null && childKeys.has(item.unit)));
        const levels = placement?.labels.filter(Boolean) ?? [];
        const effectiveLevels = levels.length ? levels : setup.structure.stages.map(stage => stage.shortName);
        state.departments.push({ unitKey: unit.key, award: "", description: "", hodStaffProfileId: null,
          durationYears: effectiveLevels.length, levels: effectiveLevels, semestersPerLevel: setup.model === "University" ? 2 : 3,
          industrialTraining: null, postGraduationInternshipYears: null, directEntryLevel: null, maxIntakePerSession: 1,
          minUtmeScore: null, utmeSubjects: [], oLevelRequirement: "", otherRequirements: "", archivedAt: null });
        changed = true;
      }
    }
    if (changed) saveAcademics(organizationId, state);
  }
  return { setup, units: setup?.structure.units ?? [], faculties: state.faculties, departments: state.departments };
}
function existingSetup(organizationId: string): SchoolSetup {
  return readSchoolSetup(organizationId) ?? bad("STRUCTURE_NOT_INITIALIZED", "Choose the school type first.", 409);
}
function uniqueCode(units: AcademicUnitNode[], code: string, selfKey?: string): string {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{1,6}$/.test(clean)) bad("UNIT_CODE_INVALID", "Use 1–6 letters or digits for the code.");
  if (units.some(unit => unit.key !== selfKey && unit.code?.toUpperCase() === clean)) bad("UNIT_CODE_EXISTS", "That code is already used in this school.", 409);
  return clean;
}
function uniqueName(units: AcademicUnitNode[], parent: string | null, name: string, selfKey?: string): string {
  const clean = name.trim();
  if (!clean) bad("VALIDATION_FAILED", "Enter a name.");
  if (units.some(unit => unit.key !== selfKey && unit.parent === parent && unit.name.toLowerCase() === clean.toLowerCase())) bad("UNIT_NAME_EXISTS", "That name already exists here.", 409);
  return clean;
}
export function initializeStructure(organizationId: string, model: SchoolModel): StructureResponse {
  if (model !== "University" && model !== "Secondary" && model !== "Primary") bad("MODEL_INVALID", "Choose a valid school model.");
  if (!readSchoolSetup(organizationId)) saveSchoolSetup(organizationId, initialSchoolSetup(model));
  return getStructure(organizationId);
}
export function createFaculty(organizationId: string, input: { name: string; code: string; description?: string; deanStaffProfileId?: string | null }): AcademicUnitNode {
  const setup = structuredClone(existingSetup(organizationId));
  if (setup.model === "Primary") bad("UNSUPPORTED_UNIT", "Primary schools start with classes.");
  const name = uniqueName(setup.structure.units, null, input.name);
  const code = uniqueCode(setup.structure.units, input.code);
  const unit: AcademicUnitNode = { key: crypto.randomUUID(), parent: null, name, code, kind: setup.model === "University" ? "Faculty" : undefined };
  setup.structure.units.push(unit);
  const state = readAcademics(organizationId);
  state.faculties.push({ unitKey: unit.key, description: input.description?.trim() ?? "", deanStaffProfileId: input.deanStaffProfileId ?? null, archivedAt: null });
  saveSchoolSetup(organizationId, setup); saveAcademics(organizationId, state);
  return unit;
}
export function editFaculty(organizationId: string, key: string, input: { name?: string; code?: string; description?: string; deanStaffProfileId?: string | null; archive?: boolean }): AcademicUnitNode {
  const setup = structuredClone(existingSetup(organizationId));
  const unit = setup.structure.units.find(item => item.key === key && item.parent === null) ?? bad("UNIT_NOT_FOUND", "Faculty not found.", 404);
  if (input.name !== undefined) unit.name = uniqueName(setup.structure.units, null, input.name, key);
  if (input.code !== undefined) unit.code = uniqueCode(setup.structure.units, input.code, key);
  const state = readAcademics(organizationId);
  const detail = state.faculties.find(item => item.unitKey === key) ?? { unitKey: key, description: "", deanStaffProfileId: null, archivedAt: null };
  if (!state.faculties.includes(detail)) state.faculties.push(detail);
  if (input.description !== undefined) detail.description = input.description.trim();
  if (input.deanStaffProfileId !== undefined) detail.deanStaffProfileId = input.deanStaffProfileId;
  if (input.archive) detail.archivedAt = new Date().toISOString();
  saveSchoolSetup(organizationId, setup); saveAcademics(organizationId, state);
  return unit;
}
export function generatedLevels(length: number): string[] {
  if (!Number.isInteger(length) || length < 1 || length > 7) bad("DURATION_INVALID", "Programme length must be 1–7 years.");
  return Array.from({ length }, (_, index) => `${(index + 1) * 100}L`);
}
function ensureGlobalStages(setup: SchoolSetup, length: number): void {
  if (setup.model !== "University") return;
  while (setup.structure.stages.length < length) {
    const n = setup.structure.stages.length + 1;
    const name = `${n * 100} Level`;
    setup.structure.stages.push({ key: `stage-${n - 1}`, name, shortName: `${n * 100}L` });
    setup.structure.placements.forEach(placement => placement.labels.push(""));
  }
}
export function createDepartment(organizationId: string, input: DepartmentInput): AcademicUnitNode {
  const setup = structuredClone(existingSetup(organizationId));
  const model = setup.model;
  const parent = model === "Primary" ? null : input.facultyId;
  if (model !== "Primary" && !setup.structure.units.some(unit => unit.key === parent && unit.parent === null)) bad("FACULTY_NOT_FOUND", "Choose an existing faculty or section.", 404);
  const name = uniqueName(setup.structure.units, parent, input.name);
  const code = uniqueCode(setup.structure.units, input.code);
  if (!Number.isInteger(input.maxIntakePerSession) || input.maxIntakePerSession < 1) bad("INTAKE_INVALID", "Enter a maximum intake above zero.");
  if (!Number.isInteger(input.semestersPerLevel) || input.semestersPerLevel < 1 || input.semestersPerLevel > 4) bad("TERM_COUNT_INVALID", "Choose 1–4 terms per level.");
  const levels = input.levels?.map(level => level.trim()).filter(Boolean) ?? generatedLevels(input.durationYears);
  if (levels.length !== input.durationYears || new Set(levels.map(level => level.toLowerCase())).size !== levels.length) bad("LEVELS_INVALID", "Provide one distinct level name for each year.");
  if (input.directEntryLevel && !levels.includes(input.directEntryLevel)) bad("DIRECT_ENTRY_INVALID", "Choose an existing level for Direct Entry.");
  if (input.industrialTraining && (!levels.includes(input.industrialTraining.level) || input.industrialTraining.termOrdinal < 1 || input.industrialTraining.termOrdinal > input.semestersPerLevel)) bad("TRAINING_INVALID", "Choose an existing level and term for industrial training.");
  ensureGlobalStages(setup, input.durationYears);
  const unit: AcademicUnitNode = { key: crypto.randomUUID(), parent, name, code, kind: model === "University" ? "Department" : undefined };
  setup.structure.units.push(unit);
  if (model === "University") {
    // The existing faculty onboarding flow still needs a Programme leaf. The new
    // structure UI treats this as the department's single default course of study.
    const programmeKey = crypto.randomUUID();
    setup.structure.units.push({ key: programmeKey, parent: unit.key, name, kind: "Programme" });
    const labels = setup.structure.stages.map((_, index) => index < levels.length ? levels[index] : "");
    setup.structure.placements.push({ key: unit.key, unit: unit.key, arm: null, labels: [...labels] });
    setup.structure.placements.push({ key: programmeKey, unit: programmeKey, arm: null, labels: [...labels] });
  } else {
    setup.structure.placements.push({ key: unit.key, unit: unit.key, arm: null, labels: setup.structure.stages.map(stage => stage.name) });
  }
  const detail: DepartmentDetails = {
    unitKey: unit.key, award: input.award.trim(), description: input.description.trim(), hodStaffProfileId: input.hodStaffProfileId,
    durationYears: input.durationYears, levels, semestersPerLevel: input.semestersPerLevel,
    industrialTraining: input.industrialTraining, postGraduationInternshipYears: input.postGraduationInternshipYears,
    directEntryLevel: input.directEntryLevel, maxIntakePerSession: input.maxIntakePerSession,
    minUtmeScore: input.minUtmeScore, utmeSubjects: input.utmeSubjects, oLevelRequirement: input.oLevelRequirement.trim(),
    otherRequirements: input.otherRequirements.trim(), archivedAt: null,
  };
  const state = readAcademics(organizationId);
  state.departments.push(detail);
  saveSchoolSetup(organizationId, setup); saveAcademics(organizationId, state);
  return unit;
}
export function updateDepartment(organizationId: string, key: string, input: Partial<DepartmentInput>): DepartmentDetails {
  const setup = structuredClone(existingSetup(organizationId));
  const unit = setup.structure.units.find(item => item.key === key) ?? bad("UNIT_NOT_FOUND", "Department not found.", 404);
  const state = readAcademics(organizationId);
  const detail = state.departments.find(item => item.unitKey === key) ?? bad("UNIT_NOT_FOUND", "Department details not found.", 404);
  if (input.name !== undefined) unit.name = uniqueName(setup.structure.units, unit.parent, input.name, key);
  if (input.code !== undefined) unit.code = uniqueCode(setup.structure.units, input.code, key);
  if (input.durationYears !== undefined && input.durationYears !== detail.durationYears) {
    const nextLevels = input.levels ?? generatedLevels(input.durationYears);
    const historyLevels = new Set(state.offerings.filter(item => item.departmentId === key).map(item => item.levelKey));
    if (detail.levels.some(level => historyLevels.has(level) && !nextLevels.includes(level))) bad("LEVEL_HAS_HISTORY", "A level with offerings cannot be removed; archive it instead.", 409);
    detail.durationYears = input.durationYears; detail.levels = nextLevels;
    ensureGlobalStages(setup, input.durationYears);
  } else if (input.levels !== undefined && input.levels.join("|") !== detail.levels.join("|")) {
    // Renamed or resized levels (or arms) without a change in programme length.
    const historyLevels = new Set(state.offerings.filter(item => item.departmentId === key).map(item => item.levelKey));
    if (detail.levels.some(level => historyLevels.has(level) && !input.levels!.includes(level))) bad("LEVEL_HAS_HISTORY", "A level with offerings cannot be removed or renamed; archive it instead.", 409);
    detail.levels = input.levels;
  }
  for (const field of ["award", "description", "hodStaffProfileId", "semestersPerLevel", "industrialTraining", "postGraduationInternshipYears", "directEntryLevel", "maxIntakePerSession", "minUtmeScore", "utmeSubjects", "oLevelRequirement", "otherRequirements"] as const) {
    if (input[field] !== undefined) Object.assign(detail, { [field]: input[field] });
  }
  saveSchoolSetup(organizationId, setup); saveAcademics(organizationId, state);
  return detail;
}
export function listSessions(organizationId: string): AcademicSession[] {
  return readAcademics(organizationId).sessions.sort((a, b) => b.startYear - a.startYear);
}
export function currentSession(organizationId: string): AcademicSession | null {
  return listSessions(organizationId).find(session => session.status === "Current") ?? null;
}
export function prepareSession(organizationId: string, input: PrepareSessionInput): { session: AcademicSession; copiedOfferings: number; copiedLecturers: number } {
  const state = readAcademics(organizationId);
  if (!Number.isInteger(input.startYear) || input.endYear <= input.startYear || !input.name.trim()) bad("SESSION_INVALID", "Enter a session name and valid years.");
  const begins = Date.parse(`${input.startsOn}T00:00:00Z`);
  const ends = Date.parse(`${input.endsOn}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endsOn) || !Number.isFinite(begins) || !Number.isFinite(ends) || ends <= begins) bad("SESSION_DATES_INVALID", "Choose valid session start and end dates.");
  if (state.sessions.some(session => session.startYear === input.startYear)) bad("SESSION_EXISTS", "A session for that year already exists.", 409);
  if (!input.termNames.length || input.termNames.some(name => !name.trim())) bad("TERMS_INVALID", "Name every term.");
  if ((ends - begins) / 86_400_000 + 1 < input.termNames.length) bad("SESSION_DATES_INVALID", "Leave at least one day for each term.");
  const from = input.fromSessionId ? state.sessions.find(session => session.sessionId === input.fromSessionId) ?? bad("SESSION_NOT_FOUND", "Source session not found.", 404) : null;
  const sessionId = crypto.randomUUID();
  const day = 86_400_000;
  const dateAt = (index: number) => new Date(begins + Math.floor(((ends - begins) / day + 1) * index / input.termNames.length) * day).toISOString().slice(0, 10);
  const terms = input.termNames.map((name, index) => ({ termId: crypto.randomUUID(), sessionId, ordinal: index + 1, name: name.trim(), startsOn: dateAt(index), endsOn: index === input.termNames.length - 1 ? input.endsOn : new Date(Date.parse(`${dateAt(index + 1)}T00:00:00Z`) - day).toISOString().slice(0, 10), status: "Upcoming" as const }));
  const session: AcademicSession = { sessionId, organizationId, name: input.name.trim(), startYear: input.startYear, endYear: input.endYear, startsOn: input.startsOn, endsOn: input.endsOn, status: "Upcoming", createdAt: new Date().toISOString(), terms };
  let copiedOfferings = 0; let copiedLecturers = 0;
  if (from && input.copy.courseOfferings) for (const offering of state.offerings.filter(item => item.sessionId === from.sessionId)) {
    const oldTerm = from.terms.find(term => term.termId === offering.termId);
    const newTerm = terms.find(term => term.ordinal === oldTerm?.ordinal);
    if (!newTerm) continue;
    const lecturerStaffProfileId = input.copy.lecturerAssignments ? offering.lecturerStaffProfileId : null;
    state.offerings.push({ ...offering, offeringId: crypto.randomUUID(), sessionId, termId: newTerm.termId, lecturerStaffProfileId });
    copiedOfferings += 1; if (lecturerStaffProfileId) copiedLecturers += 1;
  }
  state.sessions.push(session);
  saveAcademics(organizationId, state);
  return { session, copiedOfferings, copiedLecturers };
}
export function startSession(organizationId: string, sessionId: string): AcademicSession {
  const state = readAcademics(organizationId);
  const target = state.sessions.find(session => session.sessionId === sessionId) ?? bad("SESSION_NOT_FOUND", "Session not found.", 404);
  if (target.status === "Closed") bad("SESSION_CLOSED", "Closed sessions cannot be restarted.", 409);
  for (const session of state.sessions) if (session.status === "Current") {
    session.status = "Closed"; session.terms.forEach(term => { term.status = "Closed"; });
  }
  target.status = "Current";
  target.terms.forEach((term, index) => { term.status = index === 0 ? "Current" : "Upcoming"; });
  saveAcademics(organizationId, state);
  return target;
}
export function closeTerm(organizationId: string, termId: string): AcademicSession {
  const state = readAcademics(organizationId);
  const session = state.sessions.find(item => item.terms.some(term => term.termId === termId)) ?? bad("TERM_NOT_FOUND", "Term not found.", 404);
  const term = session.terms.find(item => item.termId === termId)!;
  if (session.status !== "Current" || term.status !== "Current") bad("TERM_NOT_CURRENT", "Only the current term can be closed.", 409);
  term.status = "Closed";
  const next = session.terms.find(item => item.ordinal === term.ordinal + 1);
  if (next) next.status = "Current"; else session.status = "Closed";
  saveAcademics(organizationId, state);
  return session;
}
export function listCourses(organizationId: string, departmentId?: string, q?: string, page = 1): { items: CatalogueCourse[]; total: number; page: number } {
  let courses = readAcademics(organizationId).courses.filter(course => !course.archivedAt);
  if (departmentId) courses = courses.filter(course => course.departmentId === departmentId);
  if (q) courses = courses.filter(course => `${course.code} ${course.title}`.toLowerCase().includes(q.toLowerCase()));
  courses.sort((a, b) => a.code.localeCompare(b.code));
  return { items: courses.slice((page - 1) * 50, page * 50), total: courses.length, page };
}
export function addCourse(organizationId: string, input: Omit<CatalogueCourse, "courseId" | "organizationId" | "archivedAt">): CatalogueCourse {
  const state = readAcademics(organizationId);
  if (!getStructure(organizationId).units.some(unit => unit.key === input.departmentId)) bad("DEPARTMENT_NOT_FOUND", "Department not found.", 404);
  const code = input.code.trim().toUpperCase();
  if (!code || state.courses.some(course => course.code.toUpperCase() === code)) bad("COURSE_CODE_EXISTS", "Enter a unique course code.", 409);
  if (!input.title.trim() || !Number.isInteger(input.units) || input.units < 1 || input.units > 12) bad("COURSE_INVALID", "Enter a title and 1–12 credit units.");
  const course: CatalogueCourse = { ...input, courseId: crypto.randomUUID(), organizationId, code, title: input.title.trim(), archivedAt: null };
  state.courses.push(course); saveAcademics(organizationId, state); return course;
}
export function listOfferings(organizationId: string, query: { sessionId: string; departmentId?: string; levelKey?: string; termId?: string }): AcademicOffering[] {
  return readAcademics(organizationId).offerings.filter(offering => offering.sessionId === query.sessionId && (!query.departmentId || offering.departmentId === query.departmentId) && (!query.levelKey || offering.levelKey === query.levelKey) && (!query.termId || offering.termId === query.termId));
}
export function addOffering(organizationId: string, input: Omit<AcademicOffering, "offeringId" | "organizationId" | "departmentId">): AcademicOffering {
  const state = readAcademics(organizationId);
  const session = state.sessions.find(item => item.sessionId === input.sessionId) ?? bad("SESSION_NOT_FOUND", "Session not found.", 404);
  const term = session.terms.find(item => item.termId === input.termId) ?? bad("TERM_NOT_FOUND", "Term not in session.", 404);
  if (session.status === "Closed" || term.status === "Closed") bad("OFFERING_LOCKED", "Closed session offerings are read-only.", 409);
  const course = state.courses.find(item => item.courseId === input.courseId) ?? bad("COURSE_NOT_FOUND", "Course not found.", 404);
  if (state.offerings.some(item => item.termId === input.termId && item.courseId === input.courseId && item.levelKey === input.levelKey)) bad("OFFERING_EXISTS", "That course already runs in this level and term.", 409);
  const offering: AcademicOffering = { ...input, offeringId: crypto.randomUUID(), organizationId, departmentId: course.departmentId };
  state.offerings.push(offering); saveAcademics(organizationId, state); return offering;
}
export function updateOffering(organizationId: string, offeringId: string, changes: { lecturerStaffProfileId?: string | null; units?: number; isCompulsory?: boolean }): AcademicOffering {
  const state = readAcademics(organizationId);
  const offering = state.offerings.find(item => item.offeringId === offeringId) ?? bad("OFFERING_NOT_FOUND", "Offering not found.", 404);
  const session = state.sessions.find(item => item.sessionId === offering.sessionId)!;
  const term = session.terms.find(item => item.termId === offering.termId)!;
  if (session.status === "Closed" || term.status === "Closed") bad("OFFERING_LOCKED", "Closed session offerings are read-only.", 409);
  if (changes.units !== undefined && (!Number.isInteger(changes.units) || changes.units < 1 || changes.units > 12)) bad("COURSE_INVALID", "Choose 1–12 credit units.");
  Object.assign(offering, changes); saveAcademics(organizationId, state); return offering;
}
