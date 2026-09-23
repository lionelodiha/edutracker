/** FACULTY-BUILD §4–§5 — invitations and pending records. */

import type { StaffKind } from "../staff/types";

export type InviteKind = "Student" | "Staff";

export type Invitation = {
  invitationId: string;
  organizationId: string;
  organizationName?: string;
  kind: InviteKind;
  email: string;
  token: string; // what goes in the link; unguessable
  // Set by the inviter, carried by the link, NEVER asked on the form:
  programmeId: string | null; // Student only, required
  entryStageId: string | null; // Student only, required
  departmentId: string | null; // Staff only, required
  proposedKind: StaffKind | null;
  proposedPost?: "FacultyOfficer" | null;
  sessionId: string;
  invitedBy: string; // staffProfileId
  expiresOn: string; // ISO; default 14 days out
  status: "Sent" | "Opened" | "Submitted" | "Approved" | "Rejected" | "Expired";
  /** Optional display label for the entry session (defaults to 2025/2026 in the mock). */
  sessionName?: string;
};

export type PendingRecord = {
  pendingRecordId: string;
  invitationId: string;
  organizationId: string;
  submitted: Record<string, unknown>; // exactly what the form sent
  submittedAt: string;
  status: "AwaitingReview" | "Approved" | "Rejected";
  reviewedBy: string | null;
  rejectionReason: string | null;
};

/** A used, expired or rejected token returns 410 INVITATION_UNUSABLE, not a form. */
export function isTokenUsable(invitation: Pick<Invitation, "status" | "expiresOn">, now: Date = new Date()): boolean {
  if (invitation.status !== "Sent" && invitation.status !== "Opened") return false;
  if (Number.isNaN(Date.parse(invitation.expiresOn))) return false;
  return new Date(invitation.expiresOn).getTime() > now.getTime();
}

export function invitationPlacement(invitation: Invitation): { programmeId: string | null; entryStageId: string | null; departmentId: string | null } {
  // The placement fields are set by the inviter and are read-only from the form
  // onward. The form never sends them; if a request body contains them they are
  // ignored silently rather than trusted.
  return { programmeId: invitation.programmeId, entryStageId: invitation.entryStageId, departmentId: invitation.departmentId };
}
