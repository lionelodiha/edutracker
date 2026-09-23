/** FACULTY-BUILD §3 — appointments (what a person does) are separate from rank (what they are). */

export type PostCode =
  | "Dean" | "SubDean" | "FacultyOfficer" | "FacultyExamOfficer"
  | "HOD" | "DepartmentExamOfficer" | "LevelAdviser"
  | "ProgrammeCoordinator" | "ProjectCoordinator";

export type AppointmentScopeKind = "Faculty" | "Department" | "Programme" | "Cohort";

export type Appointment = {
  appointmentId: string;
  organizationId: string;
  staffProfileId: string;
  post: PostCode;
  scopeId: string; // a Faculty, Department, Programme or Cohort id
  scopeKind: AppointmentScopeKind;
  startsOn: string; // ISO
  endsOn: string | null; // null = open-ended; most posts run two years
};

/**
 * The valid scope for each post, in one table. Validate against this —
 * never scatter `if (post === "HOD")` through the code.
 */
export const POST_SCOPE: Record<PostCode, AppointmentScopeKind> = {
  Dean: "Faculty",
  SubDean: "Faculty",
  FacultyOfficer: "Faculty",
  FacultyExamOfficer: "Faculty",
  HOD: "Department",
  DepartmentExamOfficer: "Department",
  ProgrammeCoordinator: "Programme",
  ProjectCoordinator: "Programme",
  LevelAdviser: "Cohort",
};

export const POST_NAMES: Record<PostCode, string> = {
  Dean: "Dean",
  SubDean: "Sub-Dean",
  FacultyOfficer: "Faculty Officer",
  FacultyExamOfficer: "Faculty Examination Officer",
  HOD: "Head of Department",
  DepartmentExamOfficer: "Departmental Exam Officer",
  LevelAdviser: "Level Adviser",
  ProgrammeCoordinator: "Programme Coordinator",
  ProjectCoordinator: "Project Coordinator",
};

/** A live appointment is one where startsOn is past and endsOn is null or future. */
export function isAppointmentLive(appointment: Pick<Appointment, "startsOn" | "endsOn">, now: Date = new Date()): boolean {
  if (Number.isNaN(Date.parse(appointment.startsOn))) return false;
  if (new Date(appointment.startsOn).getTime() > now.getTime()) return false;
  if (appointment.endsOn === null) return true;
  if (Number.isNaN(Date.parse(appointment.endsOn))) return false;
  return new Date(appointment.endsOn).getTime() >= now.getTime();
}

/** A post whose endsOn is in the past is expired, not ended. The UI flags it amber. */
export function isAppointmentExpired(appointment: Pick<Appointment, "endsOn">, now: Date = new Date()): boolean {
  if (appointment.endsOn === null) return false;
  if (Number.isNaN(Date.parse(appointment.endsOn))) return false;
  return new Date(appointment.endsOn).getTime() < now.getTime();
}
