/**
 * MSW request handlers for the cohort endpoints.
 *
 * These implement the contract in COHORT-MODEL.md exactly — same paths, same
 * shapes, same status codes. The real backend returns the same thing, so the
 * frontend does not change when this is deleted.
 *
 * Deliberately included, because the UI has to cope with them:
 *   - 403 for an organization you are not scoped to
 *   - 404 for a cohort that does not exist
 *   - 409 for a duplicate (unit, stage, arm, session)
 *   - a small latency so loading states are actually visible
 */

import { http, HttpResponse, delay } from "msw";
import {
  ORG_SCHOOL,
  ORG_UNIVERSITY,
  SESSION_2026,
  academicUnits,
  cohorts,
  stages,
  studentsByCohort,
  type Cohort,
  type CohortStudent,
} from "./data";

const API = "http://localhost:3187";

// Mutable copies, so POST and DELETE actually change what GET returns within
// a session. A mock where writes do nothing teaches the UI bad habits.
let cohortStore: Cohort[] = [...cohorts];
const studentStore: Record<string, CohortStudent[]> = structuredClone(studentsByCohort);

const KNOWN_ORGS = new Set([ORG_SCHOOL, ORG_UNIVERSITY]);

/** The repo's success envelope. */
function ok<T>(id: string, title: string, data: T, status = 200) {
  return HttpResponse.json({ id, title, data }, { status });
}

/** The repo's failure envelope. */
function fail(id: string, title: string, status: number) {
  return HttpResponse.json({ id, title, details: [] }, { status });
}

/**
 * Stand-in for the real tenant check. The server resolves the organization
 * FROM the resource and compares; it never trusts an id in the request.
 */
function orgGuard(organizationId: string | null) {
  if (!organizationId) return fail("VALIDATION_FAILED", "organizationId is required.", 400);
  if (!KNOWN_ORGS.has(organizationId)) {
    return fail("AUTHORIZATION_FORBIDDEN", "You are not a member of this organization.", 403);
  }
  return null;
}

export const cohortHandlers = [
  // GET /api/stages?organizationId=
  http.get(`${API}/api/stages`, async ({ request }) => {
    await delay(120);
    const organizationId = new URL(request.url).searchParams.get("organizationId");

    const denied = orgGuard(organizationId);
    if (denied) return denied;

    const data = stages
      .filter((s) => s.organizationId === organizationId)
      .sort((a, b) => a.ordinal - b.ordinal);

    return ok("STAGE_RETRIEVED", "Stages retrieved successfully.", data);
  }),

  // GET /api/cohorts?organizationId=&stageId=&academicUnitId=
  http.get(`${API}/api/cohorts`, async ({ request }) => {
    await delay(180);
    const params = new URL(request.url).searchParams;
    const organizationId = params.get("organizationId");

    const denied = orgGuard(organizationId);
    if (denied) return denied;

    const stageId = params.get("stageId");
    const academicUnitId = params.get("academicUnitId");

    const data = cohortStore
      .filter((c) => c.organizationId === organizationId)
      .filter((c) => !stageId || c.stageId === stageId)
      .filter((c) => !academicUnitId || c.academicUnitId === academicUnitId)
      .sort((a, b) => {
        const sa = stages.find((s) => s.id === a.stageId)?.ordinal ?? 0;
        const sb = stages.find((s) => s.id === b.stageId)?.ordinal ?? 0;
        return sa - sb || a.displayName.localeCompare(b.displayName);
      });

    return ok("COHORT_RETRIEVED", "Cohorts retrieved successfully.", data);
  }),

  // GET /api/cohorts/{id}
  http.get(`${API}/api/cohorts/:id`, async ({ params }) => {
    await delay(120);
    const cohort = cohortStore.find((c) => c.id === params.id);

    // 404, not 403 — but note the server reaches this only after confirming
    // the caller belongs to the cohort's organization.
    if (!cohort) return fail("COHORT_NOT_FOUND", "Cohort not found.", 404);

    return ok("COHORT_RETRIEVED", "Cohort retrieved successfully.", cohort);
  }),

  // POST /api/cohorts
  http.post(`${API}/api/cohorts`, async ({ request }) => {
    await delay(220);
    const body = (await request.json()) as {
      organizationId: string;
      academicUnitId: string | null;
      stageId: string;
      arm: string | null;
      sessionId: string;
      formTeacherId: string | null;
    };

    const denied = orgGuard(body.organizationId);
    if (denied) return denied;

    const stage = stages.find((s) => s.id === body.stageId);
    if (!stage) return fail("STAGE_NOT_FOUND", "Stage not found.", 404);

    // The uniqueness rule the database enforces for real.
    const clash = cohortStore.find(
      (c) =>
        c.organizationId === body.organizationId &&
        c.stageId === body.stageId &&
        c.academicUnitId === body.academicUnitId &&
        c.arm === body.arm &&
        c.sessionId === body.sessionId,
    );
    if (clash) {
      return fail("COHORT_ALREADY_EXISTS", "A cohort with these details already exists.", 409);
    }

    const unit = academicUnits.find((u) => u.id === body.academicUnitId) ?? null;

    // displayName is composed HERE, on the server side of the contract, so
    // every screen shows the same string.
    const displayName = [stage.name, unit?.name, body.arm].filter(Boolean).join(" ");

    const created: Cohort = {
      id: `co-${Math.random().toString(36).slice(2, 10)}`,
      organizationId: body.organizationId,
      academicUnitId: body.academicUnitId,
      academicUnitName: unit?.name ?? null,
      stageId: body.stageId,
      stageName: stage.name,
      arm: body.arm,
      displayName,
      sessionId: body.sessionId || SESSION_2026,
      formTeacherId: body.formTeacherId,
      formTeacherName: null,
      studentCount: 0,
    };

    cohortStore = [...cohortStore, created];
    studentStore[created.id] = [];

    return ok("COHORT_CREATED", "Cohort created successfully.", created.id, 201);
  }),

  // GET /api/cohorts/{id}/students
  http.get(`${API}/api/cohorts/:id/students`, async ({ params }) => {
    await delay(200);
    const id = params.id as string;

    if (!cohortStore.some((c) => c.id === id)) {
      return fail("COHORT_NOT_FOUND", "Cohort not found.", 404);
    }

    return ok("COHORT_STUDENTS_RETRIEVED", "Students retrieved successfully.", studentStore[id] ?? []);
  }),

  // POST /api/cohorts/{id}/students
  http.post(`${API}/api/cohorts/:id/students`, async ({ params, request }) => {
    await delay(200);
    const id = params.id as string;
    const cohort = cohortStore.find((c) => c.id === id);
    if (!cohort) return fail("COHORT_NOT_FOUND", "Cohort not found.", 404);

    const body = (await request.json()) as { studentProfileIds: string[] };
    if (!body.studentProfileIds?.length) {
      return fail("VALIDATION_FAILED", "At least one student is required.", 400);
    }

    const existing = studentStore[id] ?? [];
    const added: CohortStudent[] = body.studentProfileIds
      .filter((sp) => !existing.some((s) => s.studentProfileId === sp))
      .map((sp, i) => ({
        studentProfileId: sp,
        userId: `${id}-u-new-${i}`,
        admissionNumber: `NEW/${String(existing.length + i + 1).padStart(4, "0")}`,
        fullName: "Newly Added Student",
        status: "Active" as const,
      }));

    studentStore[id] = [...existing, ...added];
    cohort.studentCount = studentStore[id].length;

    return ok("COHORT_STUDENTS_ADDED", "Students added successfully.", added.length, 201);
  }),

  // DELETE /api/cohorts/{id}/students/{studentProfileId}
  http.delete(`${API}/api/cohorts/:id/students/:studentProfileId`, async ({ params }) => {
    await delay(150);
    const id = params.id as string;
    const cohort = cohortStore.find((c) => c.id === id);
    if (!cohort) return fail("COHORT_NOT_FOUND", "Cohort not found.", 404);

    const before = studentStore[id] ?? [];
    const after = before.filter((s) => s.studentProfileId !== params.studentProfileId);

    if (after.length === before.length) {
      return fail("STUDENT_NOT_IN_COHORT", "That student is not in this cohort.", 404);
    }

    studentStore[id] = after;
    cohort.studentCount = after.length;

    return ok("COHORT_STUDENT_REMOVED", "Student removed successfully.", null);
  }),
];

/** Reset between tests, so one test's writes cannot leak into the next. */
export function resetCohortMocks() {
  cohortStore = [...cohorts];
  for (const key of Object.keys(studentStore)) delete studentStore[key];
  Object.assign(studentStore, structuredClone(studentsByCohort));
}

export const handlers = [...cohortHandlers];
