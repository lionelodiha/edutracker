import { API_BASE } from "../../apiBase";
import { isDemoMode } from "../../demoMode";
import type { AcademicOffering, AcademicSession, CatalogueCourse, DepartmentInput, PrepareSessionInput, StructureResponse } from "./types";

export class AcademicApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  // The real backend doesn't serve these endpoints yet, so an empty or non-JSON
  // body means the request skipped the mock worker (e.g. after a hard refresh).
  const text = await response.text();
  let payload: { id?: string; title?: string; data?: T };
  try { payload = text ? JSON.parse(text) : {}; }
  catch { payload = {}; }
  if (!text || !("data" in payload || "title" in payload)) {
    throw new AcademicApiError(response.status, "ACADEMIC_UNAVAILABLE", isDemoMode()
      ? "Demo data didn't load. Reload the page normally and try again."
      : "Academic structure isn't available yet.");
  }
  if (!response.ok) throw new AcademicApiError(response.status, payload.id ?? "ACADEMIC_ERROR", payload.title ?? "Academic request failed.");
  return payload.data as T;
}
const orgPath = (org: string) => `/api/organizations/${encodeURIComponent(org)}`;
const json = (value: unknown) => JSON.stringify(value);

export const academicApi = {
  structure: (org: string) => request<StructureResponse>(`${orgPath(org)}/structure`),
  initialize: (org: string, model: string) => request<StructureResponse>(`${orgPath(org)}/structure/initialize`, { method: "POST", body: json({ model }) }),
  createFaculty: (org: string, input: { name: string; code: string; description: string; deanStaffProfileId: string | null }) => request<{ key: string }>(`${orgPath(org)}/structure/faculties`, { method: "POST", body: json(input) }),
  editFaculty: (org: string, key: string, input: Record<string, unknown>) => request<unknown>(`${orgPath(org)}/structure/faculties/${encodeURIComponent(key)}`, { method: "PATCH", body: json(input) }),
  createDepartment: (org: string, input: DepartmentInput) => request<{ key: string }>(`${orgPath(org)}/structure/departments`, { method: "POST", body: json(input) }),
  editDepartment: (org: string, key: string, input: Partial<DepartmentInput>) => request<unknown>(`${orgPath(org)}/structure/departments/${encodeURIComponent(key)}`, { method: "PATCH", body: json(input) }),
  sessions: (org: string) => request<{ items: AcademicSession[]; currentSessionId: string | null }>(`${orgPath(org)}/sessions`),
  prepare: (org: string, input: PrepareSessionInput) => request<{ session: AcademicSession; copiedOfferings: number; copiedLecturers: number }>(`${orgPath(org)}/sessions/prepare`, { method: "POST", body: json(input) }),
  start: (org: string, sessionId: string) => request<AcademicSession>(`${orgPath(org)}/sessions/${encodeURIComponent(sessionId)}/start`, { method: "POST" }),
  closeTerm: (org: string, termId: string) => request<AcademicSession>(`${orgPath(org)}/terms/${encodeURIComponent(termId)}/close`, { method: "POST" }),
  offerings: (org: string, sessionId: string, departmentId?: string) => request<AcademicOffering[]>(`${orgPath(org)}/sessions/${encodeURIComponent(sessionId)}/offerings${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ""}`),
  addOffering: (org: string, sessionId: string, input: Omit<AcademicOffering, "offeringId" | "organizationId" | "departmentId" | "sessionId">) => request<AcademicOffering>(`${orgPath(org)}/sessions/${encodeURIComponent(sessionId)}/offerings`, { method: "POST", body: json(input) }),
  editOffering: (org: string, offeringId: string, input: { lecturerStaffProfileId?: string | null; units?: number; isCompulsory?: boolean }) => request<AcademicOffering>(`${orgPath(org)}/offerings/${encodeURIComponent(offeringId)}`, { method: "PATCH", body: json(input) }),
  courses: (org: string, departmentId?: string, q?: string, page = 1) => {
    const params = new URLSearchParams({ page: String(page) });
    if (departmentId) params.set("departmentId", departmentId);
    if (q) params.set("q", q);
    return request<{ items: CatalogueCourse[]; total: number; page: number }>(`${orgPath(org)}/courses?${params}`);
  },
  addCourse: (org: string, input: Omit<CatalogueCourse, "courseId" | "organizationId" | "archivedAt">) => request<CatalogueCourse>(`${orgPath(org)}/courses`, { method: "POST", body: json(input) }),
};
