/**
 * FACULTY-BUILD §11 — mock endpoints for the faculty system.
 *
 * Same conventions as the cohort handlers: the ok/fail envelopes, a delay,
 * orgGuard, and persistence (the faculty store writes localStorage after every
 * mutation). Extend resetCohortMocks() coverage via resetFacultyMocks().
 */
import { http, HttpResponse, delay } from "msw";
import { makeCredential } from "../features/onboarding/passwords";
import {
  approvePending,
  createAppointment,
  createInvitations,
  createRank,
  createStaff,
  endAppointment,
  facultySummary,
  getJoin,
  getStaff,
  getStudent,
  listAppointments,
  listInvitations,
  listPending,
  listRanks,
  listStaff,
  listStudents,
  patchRank,
  patchStaff,
  portalLogin,
  rejectPending,
  resendInvitation,
  revokeInvitation,
  staffTracking,
  studentTracking,
  submitJoin,
  type Op,
} from "./faculty";

const API = "*";

/** The repo's success envelope. */
function ok<T>(id: string, title: string, data: T, status = 200) {
  return HttpResponse.json({ id, title, data }, { status });
}

/** The repo's failure envelope. */
function fail(id: string, title: string, status: number) {
  return HttpResponse.json({ id, title, details: [] }, { status });
}

function orgGuard(organizationId: string | null) {
  if (!organizationId?.trim()) return fail("VALIDATION_FAILED", "organizationId is required.", 400);
  return null;
}

function send<T>(result: Op<T>, titles: { ok: string; err?: string }) {
  if (result.ok) return ok("OK", titles.ok, result.data, result.status);
  return fail(result.code, result.message || titles.err || "Unable to complete this request.", result.status);
}

async function readBody(request: Request): Promise<Record<string, unknown> & { [key: string]: unknown }> {
  try {
    const body: unknown = await request.json();
    if (body !== null && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    if (Array.isArray(body)) return { __list: body } as unknown as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

export const facultyHandlers = [
  // ── Ranks ──
  http.get(`${API}/api/ranks`, async ({ request }) => {
    await delay(120);
    const organizationId = new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(listRanks(organizationId!), { ok: "Ranks retrieved successfully." });
  }),
  http.post(`${API}/api/ranks`, async ({ request }) => {
    await delay(150);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : null;
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    const result = createRank(organizationId!, body);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("RANK_CREATED", "Rank saved.", result.data, 201);
  }),
  http.patch(`${API}/api/ranks/:rankId`, async ({ params, request }) => {
    await delay(150);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string"
      ? body.organizationId
      : new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(patchRank(organizationId!, params.rankId as string, body), { ok: "Rank updated." });
  }),

  // ── Staff ──
  http.get(`${API}/api/staff`, async ({ request }) => {
    await delay(150);
    const params = new URL(request.url).searchParams;
    const organizationId = params.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(listStaff(organizationId!, {
      facultyId: params.get("facultyId") ?? undefined,
      departmentId: params.get("departmentId") ?? undefined,
      kind: params.get("kind") ?? undefined,
      rankId: params.get("rankId") ?? undefined,
      q: params.get("q") ?? undefined,
    }), { ok: "Staff retrieved successfully." });
  }),
  http.get(`${API}/api/staff/:staffProfileId/tracking`, async ({ params, request }) => {
    await delay(150);
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    // Both tracking endpoints return everything their page needs in one response.
    return send(
      staffTracking(organizationId!, params.staffProfileId as string, url.searchParams.get("sessionId") ?? undefined),
      { ok: "Staff tracking retrieved successfully." },
    );
  }),
  http.get(`${API}/api/staff/:staffProfileId`, async ({ params, request }) => {
    await delay(120);
    const organizationId = new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(getStaff(organizationId!, params.staffProfileId as string), { ok: "Staff retrieved successfully." });
  }),
  http.post(`${API}/api/staff`, async ({ request }) => {
    await delay(180);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : null;
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    const result = createStaff(organizationId!, body);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("STAFF_CREATED", "Staff record saved.", result.data, 201);
  }),
  http.patch(`${API}/api/staff/:staffProfileId`, async ({ params, request }) => {
    await delay(150);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string"
      ? body.organizationId
      : new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(patchStaff(organizationId!, params.staffProfileId as string, body), { ok: "Staff updated." });
  }),

  // ── Appointments ──
  http.get(`${API}/api/appointments`, async ({ request }) => {
    await delay(120);
    const params = new URL(request.url).searchParams;
    const organizationId = params.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(listAppointments(organizationId!, {
      scopeId: params.get("scopeId") ?? undefined,
      post: params.get("post") ?? undefined,
      live: params.get("live") ?? undefined,
    }), { ok: "Appointments retrieved successfully." });
  }),
  http.post(`${API}/api/appointments`, async ({ request }) => {
    await delay(180);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : null;
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    const result = createAppointment(organizationId!, body);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("APPOINTMENT_CREATED", "Appointment saved.", result.data, 201);
  }),
  http.patch(`${API}/api/appointments/:appointmentId`, async ({ params, request }) => {
    await delay(150);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string"
      ? body.organizationId
      : new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    const { organizationId: _org, ...changes } = body;
    void _org;
    return send(endAppointment(organizationId!, params.appointmentId as string, changes), { ok: "Appointment updated." });
  }),

  // ── Invitations ──
  http.get(`${API}/api/invitations`, async ({ request }) => {
    await delay(120);
    const params = new URL(request.url).searchParams;
    const organizationId = params.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(listInvitations(organizationId!, params.get("status") ?? undefined), { ok: "Invitations retrieved successfully." });
  }),
  http.post(`${API}/api/invitations`, async ({ request }) => {
    await delay(180);
    const body = await readBody(request);
    const payload = "__list" in body ? (body.__list as unknown) : (body.invitations ?? body);
    const organizationId = typeof (body as Record<string, unknown>).organizationId === "string"
      ? (body as Record<string, unknown>).organizationId as string
      : Array.isArray(payload)
        ? (payload[0] as Record<string, unknown>)?.organizationId as string ?? null
        : (payload as Record<string, unknown>)?.organizationId as string ?? null;
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    const result = createInvitations(organizationId!, payload);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("INVITATIONS_CREATED", "Invitations sent.", result.data, 201);
  }),
  http.post(`${API}/api/invitations/:invitationId/resend`, async ({ params, request }) => {
    await delay(150);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string"
      ? body.organizationId
      : new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(resendInvitation(organizationId!, params.invitationId as string), { ok: "Invitation resent." });
  }),
  http.delete(`${API}/api/invitations/:invitationId`, async ({ params, request }) => {
    await delay(150);
    const url = new URL(request.url);
    let organizationId = url.searchParams.get("organizationId");
    if (!organizationId) {
      try {
        const body = await request.clone().json() as { organizationId?: string };
        organizationId = body?.organizationId ?? null;
      } catch { /* query param is the usual carrier */ }
    }
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(revokeInvitation(organizationId!, params.invitationId as string), { ok: "Invitation revoked." });
  }),

  // ── Public join ──
  http.get(`${API}/api/join/:token`, async ({ params }) => {
    await delay(150);
    const result = getJoin(params.token as string);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("INVITATION_RETRIEVED", "Invitation retrieved successfully.", result.data);
  }),
  http.post(`${API}/api/join/:token`, async ({ params, request }) => {
    await delay(200);
    const body = await readBody(request);
    const credential = typeof body.password === "string" && body.password.length >= 8
      ? await makeCredential(body.password)
      : undefined;
    const result = submitJoin(params.token as string, body, new Date(), credential);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("FORM_SUBMITTED", "Your details were sent for review.", result.data, 201);
  }),

  http.post(`${API}/api/auth/portal-login`, async ({ request }) => {
    await delay(150);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : null;
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(await portalLogin(organizationId!, String(body.schoolEmail ?? ""), String(body.password ?? "")), { ok: "Signed in." });
  }),

  // ── Approval queue ──
  http.get(`${API}/api/pending`, async ({ request }) => {
    await delay(150);
    const params = new URL(request.url).searchParams;
    const organizationId = params.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(listPending(organizationId!, {
      facultyId: params.get("facultyId") ?? undefined,
      status: params.get("status") ?? undefined,
    }), { ok: "Pending records retrieved successfully." });
  }),
  http.post(`${API}/api/pending/:pendingRecordId/approve`, async ({ params, request }) => {
    await delay(200);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string"
      ? body.organizationId
      : new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    const reviewer = typeof body.reviewedBy === "string" ? body.reviewedBy : typeof body.reviewerId === "string" ? body.reviewerId : "";
    if (!reviewer) return fail("VALIDATION_FAILED", "The approver is required.", 400);
    const result = approvePending(organizationId!, params.pendingRecordId as string, reviewer);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("PENDING_APPROVED", "Record approved. Identifiers generated.", result.data);
  }),
  http.post(`${API}/api/pending/:pendingRecordId/reject`, async ({ params, request }) => {
    await delay(200);
    const body = await readBody(request);
    const organizationId = typeof body.organizationId === "string"
      ? body.organizationId
      : new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    const reviewer = typeof body.reviewedBy === "string" ? body.reviewedBy : typeof body.reviewerId === "string" ? body.reviewerId : "";
    if (!reviewer) return fail("VALIDATION_FAILED", "The reviewer is required.", 400);
    const result = rejectPending(organizationId!, params.pendingRecordId as string, reviewer, body.reason ?? body.rejectionReason);
    if (!result.ok) return fail(result.code, result.message, result.status);
    return ok("PENDING_REJECTED", "Record rejected.", result.data);
  }),

  // ── Students + faculty summary ──
  http.get(`${API}/api/students`, async ({ request }) => {
    await delay(150);
    const params = new URL(request.url).searchParams;
    const organizationId = params.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(listStudents(organizationId!, {
      facultyId: params.get("facultyId") ?? undefined,
      programmeId: params.get("programmeId") ?? undefined,
      q: params.get("q") ?? undefined,
    }), { ok: "Students retrieved successfully." });
  }),
  http.get(`${API}/api/students/:studentProfileId/tracking`, async ({ params, request }) => {
    await delay(150);
    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(
      studentTracking(organizationId!, params.studentProfileId as string, url.searchParams.get("sessionId") ?? undefined),
      { ok: "Student tracking retrieved successfully." },
    );
  }),
  http.get(`${API}/api/students/:studentProfileId`, async ({ params, request }) => {
    await delay(120);
    const organizationId = new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(getStudent(organizationId!, params.studentProfileId as string), { ok: "Student retrieved successfully." });
  }),
  http.get(`${API}/api/faculties/:facultyId/summary`, async ({ params, request }) => {
    await delay(150);
    const organizationId = new URL(request.url).searchParams.get("organizationId");
    const denied = orgGuard(organizationId);
    if (denied) return denied;
    return send(facultySummary(organizationId!, params.facultyId as string), { ok: "Faculty summary retrieved successfully." });
  }),
];
