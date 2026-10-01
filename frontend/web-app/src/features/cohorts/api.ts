import { API_BASE } from "../../apiBase";
import type { Cohort, CohortStudent, Stage } from "./types";

export class CohortApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "CohortApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init, credentials: "include",
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
  } catch {
    throw new CohortApiError("Could not connect. Check your connection and try again.", 0, "NETWORK_ERROR");
  }
  const body = await response.json().catch(() => null) as {
    data?: T; id?: string; title?: string; details?: { message?: string }[];
  } | null;
  if (!response.ok) {
    const message = body?.details?.map((detail) => detail.message).filter(Boolean).join(" ") || body?.title;
    throw new CohortApiError(message || (response.status === 401 ? "Your session has expired. Please sign in again." : "Unable to complete this request. Please try again."), response.status, body?.id || "REQUEST_FAILED");
  }
  if (!body || !("data" in body)) {
    throw new CohortApiError("The student service returned an unexpected response.", response.status, "INVALID_RESPONSE");
  }
  return body.data as T;
}
const cohortPath = (id: string) => `/api/cohorts/${encodeURIComponent(id)}`;
export const cohortApi = {
  stages: (organizationId: string) => request<Stage[]>(`/api/stages?${new URLSearchParams({ organizationId })}`),
  list: (organizationId: string, filters: { sessionId?: string; stageId?: string; academicUnitId?: string } = {}) => {
    const query = new URLSearchParams({ organizationId });
    if (filters.sessionId) query.set("sessionId", filters.sessionId);
    if (filters.stageId) query.set("stageId", filters.stageId);
    if (filters.academicUnitId) query.set("academicUnitId", filters.academicUnitId);
    return request<Cohort[]>(`/api/cohorts?${query}`);
  },
  get: (id: string) => request<Cohort>(cohortPath(id)),
  students: (id: string) => request<CohortStudent[]>(`${cohortPath(id)}/students`),
  admitStudent: (id: string, body: { fullName: string; admissionNumber: string }) => request<CohortStudent>(`${cohortPath(id)}/admissions`, { method: "POST", body: JSON.stringify(body) }),
  addStudents: (id: string, studentProfileIds: string[]) => request<number>(`${cohortPath(id)}/students`, { method: "POST", body: JSON.stringify({ studentProfileIds }) }),
  removeStudent: (id: string, studentProfileId: string) => request<null>(`${cohortPath(id)}/students/${encodeURIComponent(studentProfileId)}`, { method: "DELETE" }),
};
