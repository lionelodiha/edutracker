/**
 * Portal client. The portal session lives in sessionStorage until the real
 * portal login ships; the server should then read identity from its cookie
 * and ignore the organizationId/userId query parameters.
 */
import { API_BASE } from "../../apiBase";
import type { Scores } from "../assessment/scheme";
import type { DepartmentResultRow, LeaveRequest, PortalOrganization, PortalPayload, ResultSheet, TaskStatus } from "./types";

export type PortalSession = { organizationId: string; userId: string; kind: "Student" | "Staff"; schoolEmail?: string };

const SESSION_KEY = "edutracker.mockPortalSession";

export function readPortalSession(): PortalSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (value && typeof value.organizationId === "string" && typeof value.userId === "string") return value;
  } catch { /* No session. */ }
  return null;
}
export function savePortalSession(session: PortalSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearPortalSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Already gone. */ }
}

export class PortalApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "PortalApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
  } catch {
    throw new PortalApiError("Could not connect. Check your connection and try again.", 0, "NETWORK_ERROR");
  }
  const body = (await response.json().catch(() => null)) as { data?: T; id?: string; title?: string } | null;
  if (!response.ok) throw new PortalApiError(body?.title || "Something went wrong. Try again.", response.status, body?.id || "REQUEST_FAILED");
  if (!body || !("data" in body)) throw new PortalApiError("The portal isn't available yet.", response.status, "PORTAL_UNAVAILABLE");
  return body.data as T;
}

const as = (session: PortalSession) => `organizationId=${encodeURIComponent(session.organizationId)}&userId=${encodeURIComponent(session.userId)}`;
const json = (value: unknown) => JSON.stringify(value);
const id = encodeURIComponent;

export const portalApi = {
  school: (schoolId: string) => request<PortalOrganization>(`/api/portal/schools/${id(schoolId)}`),
  me: (s: PortalSession) => request<PortalPayload>(`/api/portal/me?${as(s)}`),

  sheet: (s: PortalSession, offeringId: string) => request<ResultSheet>(`/api/portal/sheets/${id(offeringId)}?${as(s)}`),
  saveScores: (s: PortalSession, offeringId: string, scores: Record<string, Scores>) =>
    request<ResultSheet>(`/api/portal/sheets/${id(offeringId)}/scores?${as(s)}`, { method: "PUT", body: json({ scores }) }),
  publish: (s: PortalSession, offeringId: string, components: string[]) =>
    request<ResultSheet>(`/api/portal/sheets/${id(offeringId)}/publish?${as(s)}`, { method: "POST", body: json({ components }) }),
  submit: (s: PortalSession, offeringId: string) =>
    request<ResultSheet>(`/api/portal/sheets/${id(offeringId)}/submit?${as(s)}`, { method: "POST", body: json({}) }),

  postCoursework: (s: PortalSession, input: { offeringId: string; componentKey: string; title: string; instructions: string; dueAt: string }) =>
    request<{ itemId: string }>(`/api/portal/coursework?${as(s)}`, { method: "POST", body: json(input) }),
  handIn: (s: PortalSession, itemId: string, input: { note: string; fileName: string | null }) =>
    request<null>(`/api/portal/coursework/${id(itemId)}/submission?${as(s)}`, { method: "POST", body: json(input) }),

  markRead: (s: PortalSession, notificationId: string | "all") =>
    request<null>(`/api/portal/notifications/${id(notificationId)}/read?${as(s)}`, { method: "POST", body: json({}) }),

  requestLeave: (s: PortalSession, input: { type: string; startsOn: string; endsOn: string; reason: string }) =>
    request<LeaveRequest>(`/api/portal/leave?${as(s)}`, { method: "POST", body: json(input) }),
  updateTask: (s: PortalSession, taskId: string, status: TaskStatus) =>
    request<null>(`/api/portal/tasks/${id(taskId)}?${as(s)}`, { method: "PATCH", body: json({ status }) }),

  departmentResults: (organizationId: string, departmentId: string, sessionId: string) =>
    request<DepartmentResultRow[]>(`/api/organizations/${id(organizationId)}/departments/${id(departmentId)}/results?sessionId=${id(sessionId)}`),
  departmentSheet: (organizationId: string, offeringId: string) =>
    request<ResultSheet>(`/api/organizations/${id(organizationId)}/results/${id(offeringId)}`),
};
