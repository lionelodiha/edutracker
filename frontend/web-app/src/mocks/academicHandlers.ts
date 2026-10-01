import { http, HttpResponse } from "msw";
import {
  AcademicError, addCourse, addOffering, closeTerm, createDepartment, createFaculty,
  currentSession, editFaculty, getStructure, initializeStructure, listCourses,
  listOfferings, listSessions, prepareSession, startSession, updateDepartment,
  updateOffering,
} from "../features/academics/store";
import type { DepartmentInput, PrepareSessionInput } from "../features/academics/types";
import type { SchoolModel } from "../features/cohorts/settings";

const API = "*";
const ok = <T>(data: T, status = 200) => HttpResponse.json({ id: "ACADEMIC_OK", title: "Academic record saved.", data }, { status });
const fail = (error: unknown) => {
  const issue = error instanceof AcademicError ? error : new AcademicError(500, "ACADEMIC_ERROR", error instanceof Error ? error.message : "Unable to save academic record.");
  return HttpResponse.json({ id: issue.code, title: issue.message, details: [] }, { status: issue.status });
};
const body = async (request: Request): Promise<Record<string, unknown>> => {
  const parsed: unknown = await request.json();
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new AcademicError(400, "VALIDATION_FAILED", "Send an object.");
  return parsed as Record<string, unknown>;
};
const routeOrg = (id: string | readonly string[] | undefined) => String(id ?? "");

export const academicHandlers = [
  http.get(`${API}/api/organizations/:id/structure`, ({ params, request }) => {
    try {
      const result = getStructure(routeOrg(params.id));
      const url = new URL(request.url);
      const root = url.searchParams.get("rootUnitId");
      const depth = Number(url.searchParams.get("depth") ?? "0");
      if (!root && !depth) return ok(result);
      const visible = root ? result.units.filter(unit => unit.key === root || unit.parent === root) : result.units.filter(unit => unit.parent === null);
      return ok({ ...result, units: visible });
    } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/structure/initialize`, async ({ params, request }) => {
    try { const input = await body(request); return ok(initializeStructure(routeOrg(params.id), input.model as SchoolModel), 201); } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/structure/faculties`, async ({ params, request }) => {
    try { const input = await body(request); return ok(createFaculty(routeOrg(params.id), { name: String(input.name ?? ""), code: String(input.code ?? ""), description: String(input.description ?? ""), deanStaffProfileId: typeof input.deanStaffProfileId === "string" ? input.deanStaffProfileId : null }), 201); } catch (error) { return fail(error); }
  }),
  http.patch(`${API}/api/organizations/:id/structure/faculties/:key`, async ({ params, request }) => {
    try { return ok(editFaculty(routeOrg(params.id), String(params.key), await body(request) as unknown as Parameters<typeof editFaculty>[2])); } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/structure/departments`, async ({ params, request }) => {
    try { return ok(createDepartment(routeOrg(params.id), await body(request) as unknown as DepartmentInput), 201); } catch (error) { return fail(error); }
  }),
  http.patch(`${API}/api/organizations/:id/structure/departments/:key`, async ({ params, request }) => {
    try { return ok(updateDepartment(routeOrg(params.id), String(params.key), await body(request) as unknown as Partial<DepartmentInput>)); } catch (error) { return fail(error); }
  }),
  http.get(`${API}/api/organizations/:id/sessions`, ({ params }) => {
    try { const id = routeOrg(params.id); return ok({ items: listSessions(id), currentSessionId: currentSession(id)?.sessionId ?? null }); } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/sessions/prepare`, async ({ params, request }) => {
    try { return ok(prepareSession(routeOrg(params.id), await body(request) as unknown as PrepareSessionInput), 201); } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/sessions/:sessionId/start`, ({ params }) => {
    try { return ok(startSession(routeOrg(params.id), String(params.sessionId))); } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/terms/:termId/close`, ({ params }) => {
    try { return ok(closeTerm(routeOrg(params.id), String(params.termId))); } catch (error) { return fail(error); }
  }),
  http.get(`${API}/api/organizations/:id/sessions/:sessionId/offerings`, ({ params, request }) => {
    try { const url = new URL(request.url); return ok(listOfferings(routeOrg(params.id), { sessionId: String(params.sessionId), departmentId: url.searchParams.get("departmentId") ?? undefined, levelKey: url.searchParams.get("level") ?? undefined, termId: url.searchParams.get("termId") ?? undefined })); } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/sessions/:sessionId/offerings`, async ({ params, request }) => {
    try { const input = await body(request); return ok(addOffering(routeOrg(params.id), { ...input, sessionId: String(params.sessionId) } as Parameters<typeof addOffering>[1]), 201); } catch (error) { return fail(error); }
  }),
  http.patch(`${API}/api/organizations/:id/offerings/:offeringId`, async ({ params, request }) => {
    try { return ok(updateOffering(routeOrg(params.id), String(params.offeringId), await body(request) as unknown as Parameters<typeof updateOffering>[2])); } catch (error) { return fail(error); }
  }),
  http.get(`${API}/api/organizations/:id/courses`, ({ params, request }) => {
    try { const url = new URL(request.url); return ok(listCourses(routeOrg(params.id), url.searchParams.get("departmentId") ?? undefined, url.searchParams.get("q") ?? undefined, Number(url.searchParams.get("page") ?? 1))); } catch (error) { return fail(error); }
  }),
  http.post(`${API}/api/organizations/:id/courses`, async ({ params, request }) => {
    try { return ok(addCourse(routeOrg(params.id), await body(request) as unknown as Parameters<typeof addCourse>[1]), 201); } catch (error) { return fail(error); }
  }),
];
