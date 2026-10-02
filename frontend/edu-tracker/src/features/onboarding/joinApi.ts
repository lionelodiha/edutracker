/**
 * Client for school invite links: the public form at /invite/{token} and the
 * admin's Invites page.
 */
import { API_BASE } from "../../apiBase";
import { AdminApiError } from "../portal/adminApi";
import type { JoinApproval, JoinBoard, JoinLink, JoinLinkView, JoinRequest, JoinRole } from "./joinLinks";

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

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
const org = (organizationId: string) => `/api/organizations/${encodeURIComponent(organizationId)}`;

export const joinApi = {
  view: (token: string) => request<JoinLinkView>(`/api/invite-links/${encodeURIComponent(token)}`),
  submit: (token: string, form: Record<string, unknown>) => request<{ requestId: string }>(`/api/invite-links/${encodeURIComponent(token)}`, json("POST", form)),

  board: (organizationId: string) => request<JoinBoard>(`${org(organizationId)}/join-links`),
  createLink: (organizationId: string, input: { role: JoinRole; sentTo: string }) => request<JoinLink>(`${org(organizationId)}/join-links`, json("POST", input)),
  revokeLink: (organizationId: string, linkId: string) => request<null>(`${org(organizationId)}/join-links/${linkId}`, { method: "DELETE" }),
  approve: (organizationId: string, requestId: string, input: JoinApproval) => request<JoinRequest>(`${org(organizationId)}/join-requests/${requestId}/approve`, json("POST", input)),
  decline: (organizationId: string, requestId: string, reason: string, decidedBy: string) => request<JoinRequest>(`${org(organizationId)}/join-requests/${requestId}/decline`, json("POST", { reason, decidedBy })),
};
