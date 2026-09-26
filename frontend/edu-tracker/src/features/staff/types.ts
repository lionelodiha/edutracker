/** FACULTY-BUILD §1 — staff records. Faculty membership is derived, never stored. */

export type StaffKind = "Academic" | "Administrative" | "Technical";

export type StaffStatus =
  | "Active"
  | "OnSabbatical"
  | "OnStudyLeave"
  | "Suspended"
  | "Retired"
  | "Resigned";

export type StaffProfile = {
  staffProfileId: string;
  organizationId: string;
  userId: string | null; // null when this person has no login — see onboarding §6
  staffNumber: string; // unique per organization, case-insensitive
  fullName: string;
  title: string; // "Dr.", "Prof.", "Mr." — free text, max 20 chars
  kind: StaffKind;
  unitId: string; // the Department they belong to…
  unitKind: "Department" | "Faculty"; // …or the Faculty, for faculty-office staff only
  rankId: string | null; // null for Administrative and Technical staff
  schoolEmail: string;
  status: StaffStatus;
  appointedOn: string; // ISO date they joined the school
  photograph?: string;
  highestQualification?: string;
};

export type RankHistory = {
  rankHistoryId: string;
  organizationId: string;
  staffProfileId: string;
  rankId: string;
  effectiveFrom: string; // ISO
  effectiveTo: string | null; // null = current rank
};

/** A staff member counts as assignable only while Active. */
export function isStaffAssignable(status: StaffStatus): boolean {
  return status === "Active";
}
