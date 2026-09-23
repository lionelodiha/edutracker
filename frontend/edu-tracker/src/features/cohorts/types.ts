/** Cohort API contract from COHORT-MODEL.md; independent of mock fixtures. */
export type Stage = {
  id: string; organizationId: string; ordinal: number; name: string; shortName: string;
};
export type Cohort = {
  id: string; organizationId: string; academicUnitId: string | null;
  academicUnitName: string | null; stageId: string; stageName: string;
  arm: string | null; displayName: string; sessionId: string;
  formTeacherId: string | null; formTeacherName: string | null; studentCount: number;
};
export type CohortStudent = {
  studentProfileId: string; userId: string; admissionNumber: string; fullName: string;
  status: "Active" | "Deferred" | "Suspended" | "Withdrawn" | "Graduated";
};
export type AcademicUnitOption = {
  id: string;
  parentId: string | null;
  name: string;
  /** PEOPLE-AND-COURSES §1. Present for University trees; inferred from depth when absent. */
  kind?: "Faculty" | "Department" | "Programme";
  /** FACULTY-BUILD §7 unit code (max 6 chars, uppercase, unique among siblings). */
  code?: string;
};
