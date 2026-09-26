import type { AcademicUnitNode, SchoolSetup } from "../cohorts/schoolSetup";

export type SessionStatus = "Upcoming" | "Current" | "Closed";
export type TermStatus = SessionStatus;
export type AcademicTerm = {
  termId: string;
  sessionId: string;
  ordinal: number;
  name: string;
  startsOn: string;
  endsOn: string;
  status: TermStatus;
};
export type AcademicSession = {
  sessionId: string;
  organizationId: string;
  name: string;
  startYear: number;
  endYear: number;
  startsOn: string;
  endsOn: string;
  status: SessionStatus;
  createdAt: string;
  terms: AcademicTerm[];
};
export type FacultyDetails = {
  unitKey: string;
  description: string;
  deanStaffProfileId: string | null;
  archivedAt: string | null;
};
export type DepartmentDetails = {
  unitKey: string;
  award: string;
  description: string;
  hodStaffProfileId: string | null;
  durationYears: number;
  levels: string[];
  semestersPerLevel: number;
  industrialTraining: { level: string; termOrdinal: number } | null;
  postGraduationInternshipYears: number | null;
  directEntryLevel: string | null;
  maxIntakePerSession: number;
  minUtmeScore: number | null;
  utmeSubjects: string[];
  oLevelRequirement: string;
  otherRequirements: string;
  archivedAt: string | null;
};
export type CatalogueCourse = {
  courseId: string;
  organizationId: string;
  departmentId: string;
  code: string;
  title: string;
  units: number;
  description: string;
  defaultLevel: string;
  defaultTermOrdinal: number;
  defaultCompulsory: boolean;
  archivedAt: string | null;
};
export type AcademicOffering = {
  offeringId: string;
  organizationId: string;
  sessionId: string;
  termId: string;
  courseId: string;
  departmentId: string;
  levelKey: string;
  units: number;
  isCompulsory: boolean;
  lecturerStaffProfileId: string | null;
};
export type AcademicState = {
  faculties: FacultyDetails[];
  departments: DepartmentDetails[];
  sessions: AcademicSession[];
  courses: CatalogueCourse[];
  offerings: AcademicOffering[];
};
export type StructureResponse = { setup: SchoolSetup | null; units: AcademicUnitNode[]; faculties: FacultyDetails[]; departments: DepartmentDetails[] };
export type PrepareSessionInput = {
  fromSessionId: string | null;
  name: string;
  startYear: number;
  endYear: number;
  startsOn: string;
  endsOn: string;
  termNames: string[];
  copy: { courseOfferings: boolean; lecturerAssignments: boolean; classArms: boolean };
};
export type DepartmentInput = Omit<DepartmentDetails, "unitKey" | "archivedAt" | "levels"> & {
  facultyId: string | null;
  name: string;
  code: string;
  levels?: string[];
};
