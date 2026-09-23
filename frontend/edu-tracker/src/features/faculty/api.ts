/**
 * FACULTY-BUILD §11 — one request per page section.
 * Both tracking endpoints and the faculty summary return everything
 * their page needs in one response; pages never assemble from six calls.
 */
import { API_BASE } from "../../apiBase";
import type { AcademicRank } from "../staff/ranks";
import type { Appointment } from "../staff/appointments";
import type { StaffProfile } from "../staff/types";
import type { Invitation, PendingRecord } from "../onboarding/invitations";
import type {
  FacultySummary,
  StaffTracking,
  StudentTracking,
  ApprovalResult,
} from "../../mocks/faculty";
import type { StudentProfile } from "../cohorts/courses";

export class FacultyApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "FacultyApiError";
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
    throw new FacultyApiError("Could not connect. Check your connection and try again.", 0, "NETWORK_ERROR");
  }
  const body = (await response.json().catch(() => null)) as {
    data?: T;
    id?: string;
    title?: string;
    details?: { message?: string }[];
  } | null;
  if (!response.ok) {
    const message =
      body?.details?.map((d) => d.message).filter(Boolean).join(" ") ||
      body?.title ||
      "Unable to complete this request. Please try again.";
    throw new FacultyApiError(message, response.status, body?.id || "REQUEST_FAILED");
  }
  if (!body || !("data" in body)) {
    throw new FacultyApiError("The faculty service returned an unexpected response.", response.status, "INVALID_RESPONSE");
  }
  return body.data as T;
}

const qs = (params: Record<string, string | undefined>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
};

export type StaffListResponse = { items: StaffProfile[]; total: number };
export type StudentListResponse = { items: StudentProfile[]; total: number };
export type InviteBatchResponse = {
  created: Invitation[];
  failed: { email: string; code: string; message: string }[];
};
export type JoinInfo = {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  kind: string;
  email: string;
  programmeName: string | null;
  departmentName: string | null;
  stageName: string | null;
  sessionName: string;
  expiresOn: string;
};

export const facultyApi = {
  // ── Ranks ──
  ranks: (organizationId: string) =>
    request<AcademicRank[]>(`/api/ranks${qs({ organizationId })}`),
  createRank: (organizationId: string, body: { name: string; order?: number }) =>
    request<AcademicRank>("/api/ranks", { method: "POST", body: JSON.stringify({ organizationId, ...body }) }),
  patchRank: (organizationId: string, rankId: string, body: { name?: string; order?: number }) =>
    request<AcademicRank>(`/api/ranks/${encodeURIComponent(rankId)}`, {
      method: "PATCH",
      body: JSON.stringify({ organizationId, ...body }),
    }),

  // ── Staff ──
  staff: (
    organizationId: string,
    filters: { facultyId?: string; departmentId?: string; kind?: string; rankId?: string; q?: string } = {},
  ) => request<StaffListResponse>(`/api/staff${qs({ organizationId, ...filters })}`),
  getStaff: (organizationId: string, staffProfileId: string) =>
    request<StaffProfile>(`/api/staff/${encodeURIComponent(staffProfileId)}${qs({ organizationId })}`),
  createStaff: (organizationId: string, body: Record<string, unknown>) =>
    request<StaffProfile>("/api/staff", { method: "POST", body: JSON.stringify({ organizationId, ...body }) }),
  patchStaff: (organizationId: string, staffProfileId: string, body: Record<string, unknown>) =>
    request<StaffProfile>(`/api/staff/${encodeURIComponent(staffProfileId)}`, {
      method: "PATCH",
      body: JSON.stringify({ organizationId, ...body }),
    }),
  staffTracking: (organizationId: string, staffProfileId: string, sessionId?: string) =>
    request<StaffTracking>(
      `/api/staff/${encodeURIComponent(staffProfileId)}/tracking${qs({ organizationId, sessionId })}`,
    ),

  // ── Appointments ──
  appointments: (
    organizationId: string,
    filters: { scopeId?: string; post?: string; live?: string } = {},
  ) => request<Appointment[]>(`/api/appointments${qs({ organizationId, ...filters })}`),
  createAppointment: (organizationId: string, body: Record<string, unknown>) =>
    request<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify({ organizationId, ...body }),
    }),
  endAppointment: (organizationId: string, appointmentId: string, endsOn: string | null) =>
    request<Appointment>(`/api/appointments/${encodeURIComponent(appointmentId)}`, {
      method: "PATCH",
      body: JSON.stringify({ organizationId, endsOn }),
    }),

  // ── Invitations ──
  invitations: (organizationId: string, status?: string) =>
    request<Invitation[]>(`/api/invitations${qs({ organizationId, status })}`),
  createInvitations: (organizationId: string, payload: Record<string, unknown> | Record<string, unknown>[]) => {
    const body = Array.isArray(payload)
      ? payload.map((p) => ({ organizationId, ...p }))
      : { organizationId, ...payload };
    return request<InviteBatchResponse>("/api/invitations", { method: "POST", body: JSON.stringify(body) });
  },
  resendInvitation: (organizationId: string, invitationId: string) =>
    request<Invitation>(`/api/invitations/${encodeURIComponent(invitationId)}/resend`, {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    }),
  revokeInvitation: (organizationId: string, invitationId: string) =>
    request<null>(
      `/api/invitations/${encodeURIComponent(invitationId)}${qs({ organizationId })}`,
      { method: "DELETE" },
    ),

  // ── Public join (no auth — the person has no account yet) ──
  joinInfo: (token: string) => request<JoinInfo>(`/api/join/${encodeURIComponent(token)}`),
  submitJoin: (token: string, body: Record<string, unknown>) =>
    request<PendingRecord>(`/api/join/${encodeURIComponent(token)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Approval queue ──
  pending: (organizationId: string, filters: { facultyId?: string; status?: string } = {}) =>
    request<PendingRecord[]>(`/api/pending${qs({ organizationId, ...filters })}`),
  approvePending: (organizationId: string, pendingRecordId: string, reviewerId: string) =>
    request<ApprovalResult>(`/api/pending/${encodeURIComponent(pendingRecordId)}/approve`, {
      method: "POST",
      body: JSON.stringify({ organizationId, reviewedBy: reviewerId }),
    }),
  rejectPending: (organizationId: string, pendingRecordId: string, reviewerId: string, reason: string) =>
    request<PendingRecord>(`/api/pending/${encodeURIComponent(pendingRecordId)}/reject`, {
      method: "POST",
      body: JSON.stringify({ organizationId, reviewedBy: reviewerId, reason }),
    }),

  // ── Students + summary ──
  students: (
    organizationId: string,
    filters: { facultyId?: string; programmeId?: string; q?: string } = {},
  ) => request<StudentListResponse>(`/api/students${qs({ organizationId, ...filters })}`),
  studentTracking: (organizationId: string, studentProfileId: string, sessionId?: string) =>
    request<StudentTracking>(
      `/api/students/${encodeURIComponent(studentProfileId)}/tracking${qs({ organizationId, sessionId })}`,
    ),
  facultySummary: (organizationId: string, facultyId: string) =>
    request<FacultySummary>(
      `/api/faculties/${encodeURIComponent(facultyId)}/summary${qs({ organizationId })}`,
    ),
};
