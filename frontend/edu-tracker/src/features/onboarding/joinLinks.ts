/**
 * School invite links.
 *
 * The school makes one link per person and sends it however it likes
 * (WhatsApp, SMS, email). The person opens it, fills in their own details
 * and sends a request. Nothing exists in the school until an admin approves
 * it and decides the placement: a department and level for a student, the
 * courses or subjects for a teacher, the department for non-teaching staff.
 */

export type JoinRole = "Student" | "Teaching" | "NonTeaching";

export const JOIN_ROLE_LABEL: Record<JoinRole, string> = {
  Student: "Student",
  Teaching: "Teaching staff",
  NonTeaching: "Non-teaching staff",
};

export type JoinLinkStatus = "Open" | "Submitted" | "Approved" | "Declined" | "Revoked" | "Expired";

export type JoinLink = {
  linkId: string;
  organizationId: string;
  /** Random and single-use: whoever holds it can send one request. */
  token: string;
  role: JoinRole;
  /** Who the school made it for, so the list makes sense later. Never shown to the applicant as a choice. */
  sentTo: string;
  createdAt: string;
  expiresOn: string;
  status: JoinLinkStatus;
};

/** What the applicant types. The school decides everything else on approval. */
export type JoinDetails = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  sex: "Female" | "Male";
  homeAddress: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  photograph?: string;
  /** Where they say they belong. The admin can change both on approval. */
  departmentId: string;
  level?: string; // Student
  previousSchool?: string; // Student
  title?: string; // Staff
  highestQualification?: string; // Staff
  subjects?: string; // Teaching: what they can teach, in their words
  jobTitle?: string; // Non-teaching: the post they're joining as
};

export type JoinRequestStatus = "Pending" | "Approved" | "Declined";

export type JoinRequest = {
  requestId: string;
  linkId: string;
  organizationId: string;
  role: JoinRole;
  details: JoinDetails;
  submittedAt: string;
  status: JoinRequestStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  declineReason: string | null;
  /** Filled on approval: what the person signs in with. */
  outcome: { schoolEmail: string; number: string; placement: string } | null;
};

/** The admin's choices when approving. */
export type JoinApproval = {
  departmentId: string;
  level?: string; // Student
  offeringIds?: string[]; // Teaching: courses or subjects they'll take
  decidedBy: string;
};

export type JoinDepartment = { departmentId: string; name: string; levels: string[] };
export type JoinOffering = {
  offeringId: string; departmentId: string; levelKey: string; code: string; title: string;
  termName: string; lecturer: string | null;
};

/** The public page's view of a link: who it's for and what to show. */
export type JoinLinkView = {
  organizationId: string;
  schoolName: string;
  role: JoinRole;
  status: JoinLinkStatus;
  expiresOn: string;
  departments: JoinDepartment[];
  /** Once sent: where the request stands, so reopening the link shows progress. */
  request: { status: JoinRequestStatus; submittedAt: string; fullName: string; declineReason: string | null; outcome: JoinRequest["outcome"] } | null;
};

/** The admin's page: links, requests and what they can be placed into. */
export type JoinBoard = {
  links: (JoinLink & { requestId: string | null })[];
  requests: JoinRequest[];
  departments: JoinDepartment[];
  offerings: JoinOffering[];
};

/** A random, URL-safe token. 24 bytes is far beyond guessing. */
export function newJoinToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const joinUrl = (token: string, origin = typeof window !== "undefined" ? window.location.origin : "") => `${origin}/invite/${token}`;
