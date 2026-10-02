/**
 * Mock endpoints for the student and staff portals, and the department's
 * results view.
 *
 * Portal requests carry organizationId and userId in the query string
 * because the mock portal login has no server session. The real API reads
 * both from the signed-in session and should ignore them.
 */
import { http, HttpResponse, delay } from "msw";
import {
  departmentResults, departmentSheet, getSheet, markRead, portalFor, postCoursework, schoolInfo,
  publishComponents, requestLeave, saveScores, submitCoursework, submitSheet, updateTask,
  addAppraisal, addDuty, addSlot, assignTask, decideLeave, departmentTimetable, dropStudent,
  enrolStudent, leaveQueue, offeringRoster, removeDuty, removeSlot, saveEmploymentRecord, staffOperations,
} from "./portal";
import type { Op } from "./faculty";

const API = "*";

function send<T>(result: Op<T>, title: string) {
  if (result.ok) return HttpResponse.json({ id: "OK", title, data: result.data }, { status: result.status });
  return HttpResponse.json({ id: result.code, title: result.message, details: [] }, { status: result.status });
}

function who(request: Request) {
  const params = new URL(request.url).searchParams;
  return { organizationId: params.get("organizationId") ?? "", userId: params.get("userId") ?? "" };
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

const missing = () => HttpResponse.json({ id: "VALIDATION_FAILED", title: "organizationId and userId are required.", details: [] }, { status: 400 });

export const portalHandlers = [
  // Public: the school's portal sign-in page needs its name before anyone signs in.
  http.get(`${API}/api/portal/schools/:schoolId`, async ({ params }) => {
    await delay(80);
    return send(schoolInfo(String(params.schoolId)), "School found.");
  }),

  http.get(`${API}/api/portal/me`, async ({ request }) => {
    await delay(120);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    return send(portalFor(organizationId, userId), "Portal loaded.");
  }),

  // ── Result sheets (teaching staff) ──
  http.get(`${API}/api/portal/sheets/:offeringId`, async ({ request, params }) => {
    await delay(120);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    return send(getSheet(organizationId, userId, String(params.offeringId)), "Result sheet loaded.");
  }),
  http.put(`${API}/api/portal/sheets/:offeringId/scores`, async ({ request, params }) => {
    await delay(150);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    const body = await readBody(request);
    return send(saveScores(organizationId, userId, String(params.offeringId), body.scores), "Marks saved.");
  }),
  http.post(`${API}/api/portal/sheets/:offeringId/publish`, async ({ request, params }) => {
    await delay(150);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    const body = await readBody(request);
    return send(publishComponents(organizationId, userId, String(params.offeringId), body.components), "Marks published.");
  }),
  http.post(`${API}/api/portal/sheets/:offeringId/submit`, async ({ request, params }) => {
    await delay(200);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    return send(submitSheet(organizationId, userId, String(params.offeringId)), "Results submitted.");
  }),

  // ── Coursework ──
  http.post(`${API}/api/portal/coursework`, async ({ request }) => {
    await delay(150);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    return send(postCoursework(organizationId, userId, await readBody(request)), "Coursework posted.");
  }),
  http.post(`${API}/api/portal/coursework/:itemId/submission`, async ({ request, params }) => {
    await delay(150);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    return send(submitCoursework(organizationId, userId, String(params.itemId), await readBody(request)), "Handed in.");
  }),

  // ── Notifications ──
  http.post(`${API}/api/portal/notifications/:notificationId/read`, async ({ request, params }) => {
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    return send(markRead(organizationId, userId, String(params.notificationId)), "Marked as read.");
  }),

  // ── Non-teaching staff ──
  http.post(`${API}/api/portal/leave`, async ({ request }) => {
    await delay(150);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    return send(requestLeave(organizationId, userId, await readBody(request)), "Leave requested.");
  }),
  http.patch(`${API}/api/portal/tasks/:taskId`, async ({ request, params }) => {
    await delay(120);
    const { organizationId, userId } = who(request);
    if (!organizationId || !userId) return missing();
    const body = await readBody(request);
    return send(updateTask(organizationId, userId, String(params.taskId), body.status), "Task updated.");
  }),

  // ── Department results (school side) ──
  http.get(`${API}/api/organizations/:id/departments/:departmentId/results`, async ({ request, params }) => {
    await delay(120);
    const sessionId = new URL(request.url).searchParams.get("sessionId") ?? "";
    return send(departmentResults(String(params.id), String(params.departmentId), sessionId), "Results loaded.");
  }),
  http.get(`${API}/api/organizations/:id/results/:offeringId`, async ({ params }) => {
    await delay(120);
    return send(departmentSheet(String(params.id), String(params.offeringId)), "Result sheet loaded.");
  }),

  // ── School admin: timetables ──
  http.get(`${API}/api/organizations/:id/departments/:departmentId/timetable`, async ({ request, params }) => {
    await delay(120);
    const termId = new URL(request.url).searchParams.get("termId") ?? "";
    return send(departmentTimetable(String(params.id), String(params.departmentId), termId), "Timetable loaded.");
  }),
  http.post(`${API}/api/organizations/:id/timetable/slots`, async ({ request, params }) => {
    await delay(150);
    return send(addSlot(String(params.id), await readBody(request)), "Period added.");
  }),
  http.delete(`${API}/api/organizations/:id/timetable/slots/:slotId`, async ({ params }) => {
    await delay(120);
    return send(removeSlot(String(params.id), String(params.slotId)), "Period removed.");
  }),

  // ── School admin: course registration ──
  http.get(`${API}/api/organizations/:id/offerings/:offeringId/roster`, async ({ params }) => {
    await delay(120);
    return send(offeringRoster(String(params.id), String(params.offeringId)), "Roster loaded.");
  }),
  http.post(`${API}/api/organizations/:id/offerings/:offeringId/roster`, async ({ request, params }) => {
    await delay(120);
    const body = await readBody(request);
    return send(enrolStudent(String(params.id), String(params.offeringId), String(body.studentProfileId ?? "")), "Student registered.");
  }),
  http.delete(`${API}/api/organizations/:id/offerings/:offeringId/roster/:studentProfileId`, async ({ params }) => {
    await delay(120);
    return send(dropStudent(String(params.id), String(params.offeringId), String(params.studentProfileId)), "Student dropped.");
  }),

  // ── School admin: staff operations ──
  http.get(`${API}/api/organizations/:id/staff/:staffProfileId/operations`, async ({ params }) => {
    await delay(120);
    return send(staffOperations(String(params.id), String(params.staffProfileId)), "Staff record loaded.");
  }),
  http.put(`${API}/api/organizations/:id/staff/:staffProfileId/employment`, async ({ request, params }) => {
    await delay(150);
    return send(saveEmploymentRecord(String(params.id), String(params.staffProfileId), await readBody(request)), "Employment record saved.");
  }),
  http.post(`${API}/api/organizations/:id/staff/:staffProfileId/duties`, async ({ request, params }) => {
    await delay(150);
    return send(addDuty(String(params.id), String(params.staffProfileId), await readBody(request)), "Shift added.");
  }),
  http.delete(`${API}/api/organizations/:id/duties/:dutyId`, async ({ params }) => {
    await delay(120);
    return send(removeDuty(String(params.id), String(params.dutyId)), "Shift removed.");
  }),
  http.post(`${API}/api/organizations/:id/staff/:staffProfileId/tasks`, async ({ request, params }) => {
    await delay(150);
    return send(assignTask(String(params.id), String(params.staffProfileId), await readBody(request)), "Task assigned.");
  }),
  http.post(`${API}/api/organizations/:id/staff/:staffProfileId/appraisals`, async ({ request, params }) => {
    await delay(150);
    return send(addAppraisal(String(params.id), String(params.staffProfileId), await readBody(request)), "Appraisal recorded.");
  }),

  // ── School admin: leave approvals ──
  http.get(`${API}/api/organizations/:id/leave`, async ({ params }) => {
    await delay(120);
    return send(leaveQueue(String(params.id)), "Leave requests loaded.");
  }),
  http.post(`${API}/api/organizations/:id/leave/:requestId/decision`, async ({ request, params }) => {
    await delay(150);
    return send(decideLeave(String(params.id), String(params.requestId), await readBody(request)), "Decision saved.");
  }),
];
