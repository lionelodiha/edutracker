import { http, HttpResponse, delay } from "msw";
import { seedSchool, structures, fixtureId, type Cohort, type CohortStudent } from "./data";
import { readSchoolSetup } from "../features/cohorts/schoolSetup";
import { getGroupSettings } from "../features/cohorts/settings";
import { approvedStudentsInCohort, resetFacultyMocks } from "./faculty";
import { facultyHandlers } from "./facultyHandlers";

const API = "*";
let cohortStore: Cohort[] = [];
const studentStore: Record<string, CohortStudent[]> = {};
const studentDirectory = new Map<string, { organizationId: string; student: CohortStudent }>();
const seeded = new Map<string, string>();

function currentStructure(organizationId: string) {
  return readSchoolSetup(organizationId)?.structure ?? structures[getGroupSettings(organizationId).model];
}

function persistSchool(organizationId: string) {
  if (typeof localStorage === "undefined") return;
  const groups = cohortStore.filter(c => c.organizationId === organizationId);
  const previous = JSON.parse(localStorage.getItem(`edutracker.records.${organizationId}`) || "{}");
  const rosters = { ...(previous.rosters ?? {}), ...Object.fromEntries(groups.map(c => [c.id, studentStore[c.id] ?? []])) };
  const directory = [...studentDirectory.entries()].filter(([, record]) => record.organizationId === organizationId);
  localStorage.setItem(`edutracker.records.${organizationId}`, JSON.stringify({ rosters, directory }));
}

function ensureSchool(organizationId: string, sessionId: string) {
  const structure = currentStructure(organizationId);
  const revision = JSON.stringify(structure);
  const key = JSON.stringify([organizationId, sessionId]);
  if (seeded.get(key) === revision) return;
  if (!cohortStore.some(c => c.organizationId === organizationId) && typeof localStorage !== "undefined") {
    const saved = JSON.parse(localStorage.getItem(`edutracker.records.${organizationId}`) || "null");
    if (saved?.rosters && saved?.directory) {
      Object.assign(studentStore, saved.rosters);
      for (const [id, record] of saved.directory) studentDirectory.set(id, record);
    }
  }
  const configured = readSchoolSetup(organizationId) !== null;
  const seed = seedSchool(organizationId, sessionId, structure, configured ? 0 : 12);
  for (const group of seed.cohorts) {
    studentStore[group.id] ??= structuredClone(seed.studentsByCohort[group.id]);
    group.studentCount = studentStore[group.id].length;
    for (const student of studentStore[group.id]) studentDirectory.set(student.studentProfileId, { organizationId, student });
  }
  cohortStore = cohortStore.filter(c => c.organizationId !== organizationId || c.sessionId !== sessionId);
  cohortStore.push(...seed.cohorts);
  seeded.set(key, revision);
}

function syncApprovedStudents(cohort: Cohort) {
  const roster = studentStore[cohort.id] ?? [];
  const approved = approvedStudentsInCohort(cohort.organizationId, cohort.id);
  for (const profile of approved) {
    const row: CohortStudent = {
      studentProfileId: profile.studentProfileId,
      userId: profile.userId,
      fullName: profile.fullName,
      admissionNumber: profile.matriculationNumber,
      status: profile.status,
    };
    const index = roster.findIndex(student => student.studentProfileId === profile.studentProfileId);
    if (index === -1) roster.push(row);
    else roster[index] = row;
    studentDirectory.set(row.studentProfileId, { organizationId: cohort.organizationId, student: row });
  }
  studentStore[cohort.id] = roster;
  cohort.studentCount = roster.length;
}

/** The repo's success envelope. */
function ok<T>(id: string, title: string, data: T, status = 200) {
  return HttpResponse.json({ id, title, data }, { status });
}

/** The repo's failure envelope. */
function fail(id: string, title: string, status: number) {
  return HttpResponse.json({ id, title, details: [] }, { status });
}

// This development mock accepts the active application's organization ID.
// Authentication remains the real API's responsibility; this is not an auth emulator.
function orgGuard(organizationId: string | null) {
  if (!organizationId?.trim()) return fail("VALIDATION_FAILED", "organizationId is required.", 400);
  return null;
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export const cohortHandlers = [
  // Frontend-only admission preview. No real backend endpoint is changed.
  http.post(`${API}/api/cohorts/:id/admissions`, async ({ params, request }) => {
    const cohort = cohortStore.find(c => c.id === params.id);
    if (!cohort) return fail("COHORT_NOT_FOUND", "Student group not found.", 404);
    const body = await readBody(request);
    if (typeof body?.fullName !== "string" || !body.fullName.trim() || body.fullName.length > 120 ||
        typeof body.admissionNumber !== "string" || !body.admissionNumber.trim() || body.admissionNumber.length > 80) {
      return fail("VALIDATION_FAILED", "Enter the student's name and admission number.", 400);
    }
    const admissionNumber = body.admissionNumber.trim();
    if ([...studentDirectory.values()].some(record => record.organizationId === cohort.organizationId && record.student.admissionNumber.toLowerCase() === admissionNumber.toLowerCase())) {
      return fail("ADMISSION_NUMBER_EXISTS", "This admission number already belongs to a student. Use placement correction for an existing record.", 409);
    }
    const student: CohortStudent = { studentProfileId: crypto.randomUUID(), userId: crypto.randomUUID(), fullName: body.fullName.trim(), admissionNumber, status: "Active" };
    studentDirectory.set(student.studentProfileId, { organizationId: cohort.organizationId, student });
    studentStore[cohort.id] = [...(studentStore[cohort.id] ?? []), student];
    cohort.studentCount = studentStore[cohort.id].length;
    persistSchool(cohort.organizationId);
    return ok("STUDENT_ADMITTED", "Student record saved.", student, 201);
  }),
  // GET /api/stages?organizationId=
  http.get(`${API}/api/stages`, async ({ request }) => {
    await delay(120);
    const organizationId = new URL(request.url).searchParams.get("organizationId");

    const denied = orgGuard(organizationId);
    if (denied) return denied;

    const data = seedSchool(organizationId!, "", currentStructure(organizationId!)).stages;

    return ok("STAGE_RETRIEVED", "Stages retrieved successfully.", data);
  }),

  // GET /api/cohorts?organizationId=&stageId=&academicUnitId=
  http.get(`${API}/api/cohorts`, async ({ request }) => {
    await delay(180);
    const params = new URL(request.url).searchParams;
    const organizationId = params.get("organizationId");

    const denied = orgGuard(organizationId);
    if (denied) return denied;

    const sessionId = params.get("sessionId");
    if (sessionId || !cohortStore.some(c => c.organizationId === organizationId)) {
      ensureSchool(organizationId!, sessionId || fixtureId(organizationId!, "default-session"));
    }
    cohortStore.filter(c => c.organizationId === organizationId).forEach(syncApprovedStudents);
    const stageId = params.get("stageId");
    const academicUnitId = params.get("academicUnitId");

    const data = cohortStore
      .filter((c) => c.organizationId === organizationId)
      .filter((c) => !sessionId || c.sessionId === sessionId)
      .filter((c) => !stageId || c.stageId === stageId)
      .filter((c) => !academicUnitId || c.academicUnitId === academicUnitId)
      .sort((a, b) => {
        const stages = currentStructure(organizationId!).stages;
        return stages.findIndex(s => s.name === a.stageName) - stages.findIndex(s => s.name === b.stageName)
          || a.displayName.localeCompare(b.displayName);
      });

    return ok("COHORT_RETRIEVED", "Groups retrieved successfully.", data);
  }),

  // GET /api/cohorts/{id}
  http.get(`${API}/api/cohorts/:id`, async ({ params }) => {
    await delay(120);
    const cohort = cohortStore.find((c) => c.id === params.id);

    // Authentication is deliberately not simulated by these development fixtures.
    if (!cohort) return fail("COHORT_NOT_FOUND", "Group not found.", 404);

    syncApprovedStudents(cohort);

    return ok("COHORT_RETRIEVED", "Group retrieved successfully.", cohort);
  }),

  // GET /api/cohorts/{id}/students
  http.get(`${API}/api/cohorts/:id/students`, async ({ params }) => {
    await delay(200);
    const id = params.id as string;

    const cohort = cohortStore.find((c) => c.id === id);
    if (!cohort) {
      return fail("COHORT_NOT_FOUND", "Group not found.", 404);
    }

    syncApprovedStudents(cohort);

    return ok("COHORT_STUDENTS_RETRIEVED", "Students retrieved successfully.", studentStore[id] ?? []);
  }),

  // POST /api/cohorts/{id}/students
  http.post(`${API}/api/cohorts/:id/students`, async ({ params, request }) => {
    await delay(200);
    const id = params.id as string;
    const cohort = cohortStore.find((c) => c.id === id);
    if (!cohort) return fail("COHORT_NOT_FOUND", "Group not found.", 404);

    const body = await readBody(request);
    if (!Array.isArray(body?.studentProfileIds) || !body.studentProfileIds.length ||
        body.studentProfileIds.some((sp) => typeof sp !== "string" || !sp.trim())) {
      return fail("VALIDATION_FAILED", "At least one student is required.", 400);
    }

    const existing = studentStore[id] ?? [];
    const profileIds = [...new Set((body.studentProfileIds as string[]).map((sp) => sp.trim()))];
    if (profileIds.some((sp) => {
      const record = studentDirectory.get(sp);
      return record && record.organizationId !== cohort.organizationId;
    })) {
      return fail("VALIDATION_FAILED", "Every student must belong to this organization.", 400);
    }

    const added: CohortStudent[] = profileIds
      .filter((sp) => !existing.some((s) => s.studentProfileId === sp))
      .map((sp) => {
        const known = studentDirectory.get(sp);
        if (known) return structuredClone(known.student);

        const student: CohortStudent = {
          studentProfileId: sp,
          userId: crypto.randomUUID(),
          admissionNumber: `NEW/${String(studentDirectory.size + 1).padStart(4, "0")}`,
          fullName: "Newly Added Student",
          status: "Active",
        };
        studentDirectory.set(sp, { organizationId: cohort.organizationId, student });
        return structuredClone(student);
      });

    studentStore[id] = [...existing, ...added];
    cohort.studentCount = studentStore[id].length;
    persistSchool(cohort.organizationId);

    return ok("COHORT_STUDENTS_ADDED", "Students added successfully.", added.length, 201);
  }),

  // DELETE /api/cohorts/{id}/students/{studentProfileId}
  http.delete(`${API}/api/cohorts/:id/students/:studentProfileId`, async ({ params }) => {
    await delay(150);
    const id = params.id as string;
    const cohort = cohortStore.find((c) => c.id === id);
    if (!cohort) return fail("COHORT_NOT_FOUND", "Group not found.", 404);

    const before = studentStore[id] ?? [];
    const after = before.filter((s) => s.studentProfileId !== params.studentProfileId);

    if (after.length === before.length) {
      return fail("STUDENT_NOT_IN_COHORT", "That student is not in this group.", 404);
    }

    studentStore[id] = after;
    cohort.studentCount = after.length;
    persistSchool(cohort.organizationId);

    return ok("COHORT_STUDENT_REMOVED", "Student removed successfully.", null);
  }),
];

/** Reset between tests, so one test's writes cannot leak into the next. */
export function resetCohortMocks() {
  cohortStore = [];
  for (const key of Object.keys(studentStore)) delete studentStore[key];
  studentDirectory.clear();
  seeded.clear();
  // FACULTY-BUILD §11 — clear everything added by the faculty system too,
  // or the tests will leak into each other.
  resetFacultyMocks();
}

export const handlers = [...cohortHandlers, ...facultyHandlers];
