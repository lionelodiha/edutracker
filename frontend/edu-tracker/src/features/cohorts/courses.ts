/**
 * Minimal teaching model backing the faculty tracking pages.
 *
 * Shape follows PEOPLE-AND-COURSES §2–§4: a Course is owned by the department
 * that teaches it; CourseAssignment links staff to a course per session;
 * Registration links students to a course per session. Results and attendance
 * are per (course, session) states, which is all the tracker needs.
 */

export type Course = {
  courseId: string;
  organizationId: string;
  owningDepartmentId: string; // the Department that TEACHES it, not who takes it
  code: string; // "EEE 201" — required, unique per organization
  title: string;
  creditUnits: number;
};

export type CourseAssignment = {
  assignmentId: string;
  courseId: string;
  sessionId: string;
  staffProfileId: string;
  role: "Lead" | "Assistant";
};

export type Registration = {
  registrationId: string;
  sessionId: string;
  courseId: string;
  studentProfileId: string;
  registeredAt: string; // ISO
  status: "Registered" | "Dropped";
  offeringId?: string;
};

export type CourseOffering = {
  offeringId: string;
  courseId: string;
  programmeId: string;
  stageId: string;
  requirement: "Core" | "Elective";
};

export type StudentResult = {
  studentProfileId: string;
  courseId: string;
  sessionId: string;
  grade: string;
  passed: boolean;
};

export type ResultsState = "Not started" | "Partial" | "Submitted";

export type CourseResults = {
  courseId: string;
  sessionId: string;
  state: ResultsState;
};

export type AttendanceSummary = {
  courseId: string;
  sessionId: string;
  /** For staff rows: sessions taken vs scheduled. For student rows: attended vs held. */
  taken: number;
  scheduled: number;
};

/** Faculty student record. The faculty chain is derived from programmeId, never stored. */
export type StudentProfile = {
  studentProfileId: string;
  organizationId: string;
  userId: string;
  fullName: string;
  matriculationNumber: string; // unique per organization, case-insensitive
  programmeId: string; // the Programme they were admitted into (unit key)
  entryStageId: string; // the Level they entered at
  entrySessionId: string;
  currentCohortId: string;
  schoolEmail: string;
  status: "Active" | "Suspended" | "Graduated" | "Withdrawn";
  photograph?: string;
};

/** One row per past session: the level they were at, and whether they moved up. */
export type StudentSessionHistory = {
  studentProfileId: string;
  organizationId: string;
  sessionId: string;
  sessionName: string;
  stageName: string;
  outcome: "Promoted" | "Repeated" | "CarriedOver" | "Graduated";
};
