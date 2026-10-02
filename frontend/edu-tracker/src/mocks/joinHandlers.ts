/**
 * Mock endpoints for school invite links.
 *
 * Public: GET/POST /api/invite-links/{token}, opened by someone with no account.
 * Admin: /api/organizations/{id}/join-links and /join-requests. The real API
 * must check the caller is an owner or admin of that organization.
 */
import { http, HttpResponse, delay } from "msw";
import { makeCredential } from "../features/onboarding/passwords";
import type { Op } from "./faculty";
import { approveJoinRequest, createJoinLink, declineJoinRequest, joinBoard, revokeJoinLink, submitJoinRequest, viewJoinLink } from "./join";

const API = "*";

function send<T>(result: Op<T>, title: string) {
  if (result.ok) return HttpResponse.json({ id: "OK", title, data: result.data }, { status: result.status });
  return HttpResponse.json({ id: result.code, title: result.message, details: [] }, { status: result.status });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

export const joinHandlers = [
  http.get(`${API}/api/invite-links/:token`, async ({ params }) => {
    await delay(150);
    return send(viewJoinLink(String(params.token)), "Invite link retrieved.");
  }),
  http.post(`${API}/api/invite-links/:token`, async ({ params, request }) => {
    await delay(250);
    const body = await readBody(request);
    // The password is hashed here and never stored as typed.
    const credential = typeof body.password === "string" && body.password.length >= 8 ? await makeCredential(body.password) : undefined;
    return send(submitJoinRequest(String(params.token), body, credential), "Your request was sent to the school.");
  }),

  http.get(`${API}/api/organizations/:id/join-links`, async ({ params }) => {
    await delay(150);
    return send(joinBoard(String(params.id)), "Invite links retrieved.");
  }),
  http.post(`${API}/api/organizations/:id/join-links`, async ({ params, request }) => {
    await delay(150);
    return send(createJoinLink(String(params.id), await readBody(request)), "Invite link created.");
  }),
  http.delete(`${API}/api/organizations/:id/join-links/:linkId`, async ({ params }) => {
    await delay(120);
    return send(revokeJoinLink(String(params.id), String(params.linkId)), "Invite link cancelled.");
  }),
  http.post(`${API}/api/organizations/:id/join-requests/:requestId/approve`, async ({ params, request }) => {
    await delay(200);
    return send(approveJoinRequest(String(params.id), String(params.requestId), await readBody(request)), "Request approved.");
  }),
  http.post(`${API}/api/organizations/:id/join-requests/:requestId/decline`, async ({ params, request }) => {
    await delay(150);
    return send(declineJoinRequest(String(params.id), String(params.requestId), await readBody(request)), "Request declined.");
  }),
];
