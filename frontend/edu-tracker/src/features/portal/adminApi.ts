/**
 * Admin-side client for the portal records a school sets up: timetables,
 * course registration, and non-teaching staff operations (employment record,
 * duty roster, tasks, appraisals, leave approvals).
 *
 * These calls come from the signed-in admin app. The real API must check the
 * caller is an owner or admin of the organization in the path.
 */
import { API_BASE } from "../../apiBase";
import type {
  AdminSlot, Appraisal, DepartmentTimetable, DutyShift, EmploymentRecord, LeaveQueueRow,
  LeaveRequest, OfferingRoster, StaffOperations, WorkTask,
} from "./types";

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "AdminApiError";
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
    throw new AdminApiError("Could not connect. Check your connection and try again.", 0, "NETWORK_ERROR");
  }
  const body = (await response.json().catch(() => null)) as { data?: T; id?: string; title?: string } | null;
  if (!response.ok) throw new AdminApiError(body?.title || "Something went wrong. Try again.", response.status, body?.id || "REQUEST_FAILED");
  if (!body || !("data" in body)) throw new AdminApiError("This isn't available yet.", response.status, "UNAVAILABLE");
  return body.data as T;
}

const org = (organizationId: string) => `/api/organizations/${encodeURIComponent(organizationId)}`;
const id = encodeURIComponent;
const json = (value: unknown) => JSON.stringify(value);

export const adminApi = {
  // Timetables
  timetable: (organizationId: string, departmentId: string, termId: string) =>
    request<DepartmentTimetable>(`${org(organizationId)}/departments/${id(departmentId)}/timetable?termId=${id(termId)}`),
  addSlot: (organizationId: string, input: { offeringId: string; day: number; start: string; end: string; venue: string }) =>
    request<AdminSlot>(`${org(organizationId)}/timetable/slots`, { method: "POST", body: json(input) }),
  removeSlot: (organizationId: string, slotId: string) =>
    request<null>(`${org(organizationId)}/timetable/slots/${id(slotId)}`, { method: "DELETE" }),

  // Course registration
  roster: (organizationId: string, offeringId: string) =>
    request<OfferingRoster>(`${org(organizationId)}/offerings/${id(offeringId)}/roster`),
  enrol: (organizationId: string, offeringId: string, studentProfileId: string) =>
    request<null>(`${org(organizationId)}/offerings/${id(offeringId)}/roster`, { method: "POST", body: json({ studentProfileId }) }),
  drop: (organizationId: string, offeringId: string, studentProfileId: string) =>
    request<null>(`${org(organizationId)}/offerings/${id(offeringId)}/roster/${id(studentProfileId)}`, { method: "DELETE" }),

  // Staff operations
  staffOperations: (organizationId: string, staffProfileId: string) =>
    request<StaffOperations>(`${org(organizationId)}/staff/${id(staffProfileId)}/operations`),
  saveEmployment: (organizationId: string, staffProfileId: string, input: EmploymentRecord) =>
    request<null>(`${org(organizationId)}/staff/${id(staffProfileId)}/employment`, { method: "PUT", body: json(input) }),
  addDuty: (organizationId: string, staffProfileId: string, input: Omit<DutyShift, "dutyId">) =>
    request<DutyShift>(`${org(organizationId)}/staff/${id(staffProfileId)}/duties`, { method: "POST", body: json(input) }),
  removeDuty: (organizationId: string, dutyId: string) =>
    request<null>(`${org(organizationId)}/duties/${id(dutyId)}`, { method: "DELETE" }),
  assignTask: (organizationId: string, staffProfileId: string, input: { title: string; detail: string; priority: WorkTask["priority"]; dueOn: string | null; requestedBy: string }) =>
    request<WorkTask>(`${org(organizationId)}/staff/${id(staffProfileId)}/tasks`, { method: "POST", body: json(input) }),
  addAppraisal: (organizationId: string, staffProfileId: string, input: { year: number; score: number; appraiser: string; comment: string }) =>
    request<Appraisal>(`${org(organizationId)}/staff/${id(staffProfileId)}/appraisals`, { method: "POST", body: json(input) }),

  // Leave approvals
  leaveQueue: (organizationId: string) => request<LeaveQueueRow[]>(`${org(organizationId)}/leave`),
  decideLeave: (organizationId: string, requestId: string, input: { decision: "Approved" | "Declined"; note: string; decidedBy: string }) =>
    request<LeaveRequest>(`${org(organizationId)}/leave/${id(requestId)}/decision`, { method: "POST", body: json(input) }),
};
