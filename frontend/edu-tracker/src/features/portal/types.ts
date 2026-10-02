/**
 * Portal payloads. Each role gets one response with everything its pages
 * show; mutations return nothing and the portal reloads that response.
 *
 * Every teaching record keys on the course offering (course + session +
 * term + lecturer), so a department can review any session later.
 */
import type { AssessmentComponent, Scores } from "../assessment/scheme";
import type { SchoolModel } from "../cohorts/settings";

export type PortalRole = "Student" | "Teaching" | "NonTeaching";

export type PortalOrganization = { organizationId: string; name: string; model: SchoolModel };

export type PortalTerm = {
  sessionId: string;
  sessionName: string;
  termId: string;
  termName: string;
  startsOn: string;
  endsOn: string;
};

/** Monday = 1 … Friday = 5, matching Date.getDay(). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6;

export type TimetableEntry = {
  slotId: string;
  offeringId: string;
  code: string;
  title: string;
  day: Weekday;
  start: string; // "08:00"
  end: string; // "10:00"
  venue: string;
  /** Lecturer on a student timetable; level on a teacher timetable. */
  detail: string;
};

export type NotificationKind = "Coursework" | "Marks" | "Result" | "Class" | "Memo" | "Leave" | "Task";

export type PortalNotification = {
  notificationId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  /** Portal-relative path, e.g. "results". */
  link: string | null;
};

// ─── Student ────────────────────────────────────────────────────────────────

export type SheetStatus = "Not started" | "Partial" | "Submitted";

export type StudentCourse = {
  offeringId: string;
  code: string;
  title: string;
  units: number;
  isCompulsory: boolean;
  lecturer: string | null;
  termName: string;
};

export type CourseworkState = "Open" | "Submitted" | "Overdue" | "Marked" | "Scheduled" | "Awaiting marks";

export type StudentCoursework = {
  itemId: string;
  offeringId: string;
  code: string;
  title: string;
  kind: AssessmentComponent["kind"];
  componentKey: string;
  instructions: string;
  dueAt: string | null;
  max: number;
  postedAt: string;
  /** Tests are sat in class, so they have no hand-in. */
  acceptsSubmission: boolean;
  submission: { submittedAt: string; note: string; fileName: string | null } | null;
  mark: number | null;
  state: CourseworkState;
};

export type ResultRow = {
  offeringId: string;
  code: string;
  title: string;
  units: number;
  /** Only components the teacher has published. */
  scores: Scores;
  published: Record<string, string>; // componentKey → published at
  ca: number | null;
  total: number | null;
  grade: string | null;
  points: number | null;
  remark: string | null;
  status: SheetStatus;
  classAverage: number | null;
  position: number | null;
  classSize: number;
};

export type ResultPeriod = {
  sessionId: string;
  sessionName: string;
  termId: string;
  termName: string;
  level: string;
  closed: boolean;
  rows: ResultRow[];
  /** University: grade point average for the semester. */
  gpa: number | null;
  unitsTaken: number;
  unitsPassed: number;
  /** Secondary and primary: average of subject totals, and class position. */
  average: number | null;
  position: number | null;
  classSize: number;
  /** Form teacher or level adviser comment. */
  remark: string | null;
};

export type StudentPortal = {
  role: "Student";
  organization: PortalOrganization;
  profile: {
    studentProfileId: string;
    fullName: string;
    matriculationNumber: string;
    schoolEmail: string;
    status: string;
    facultyName: string | null;
    departmentName: string | null;
    level: string | null;
    adviser: string | null;
    entrySession: string | null;
  };
  term: PortalTerm | null;
  scheme: AssessmentComponent[];
  courses: StudentCourse[];
  timetable: TimetableEntry[];
  coursework: StudentCoursework[];
  results: ResultPeriod[];
  cgpa: number | null;
  notifications: PortalNotification[];
};

// ─── Teaching staff ─────────────────────────────────────────────────────────

export type TeacherClass = {
  offeringId: string;
  code: string;
  title: string;
  units: number;
  levelKey: string;
  departmentName: string;
  termName: string;
  termClosed: boolean;
  enrolled: number;
  status: SheetStatus;
  /** Marks entered / marks expected (students × components). */
  entered: number;
  expected: number;
  published: Record<string, string>;
  submittedAt: string | null;
  average: number | null;
  passRate: number | null;
  distribution: { grade: string; count: number }[];
};

export type TeacherCoursework = {
  itemId: string;
  offeringId: string;
  code: string;
  kind: AssessmentComponent["kind"];
  componentKey: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  max: number;
  postedAt: string;
  submissions: number;
  enrolled: number;
};

export type TeacherPortal = {
  role: "Teaching";
  organization: PortalOrganization;
  profile: StaffSummary;
  term: PortalTerm | null;
  scheme: AssessmentComponent[];
  classes: TeacherClass[];
  timetable: TimetableEntry[];
  coursework: TeacherCoursework[];
  notifications: PortalNotification[];
};

export type StaffSummary = {
  staffProfileId: string;
  title: string;
  fullName: string;
  staffNumber: string;
  schoolEmail: string;
  kind: string;
  rank: string | null;
  unitName: string | null;
  appointedOn: string;
  posts: string[];
};

export type SheetStudent = { studentProfileId: string; fullName: string; matriculationNumber: string; scores: Scores };

export type ResultSheet = {
  offeringId: string;
  code: string;
  title: string;
  units: number;
  levelKey: string;
  departmentName: string;
  sessionName: string;
  termName: string;
  lecturer: string | null;
  model: SchoolModel;
  scheme: AssessmentComponent[];
  status: SheetStatus;
  published: Record<string, string>;
  submittedAt: string | null;
  updatedAt: string | null;
  /** True once submitted, or when the term is closed. */
  locked: boolean;
  students: SheetStudent[];
};

// ─── Non-teaching staff ─────────────────────────────────────────────────────

export type LeaveType = "Annual" | "Casual" | "Sick" | "Study" | "Maternity" | "Compassionate";
export type LeaveStatus = "Pending" | "Approved" | "Declined";

export type LeaveRequest = {
  requestId: string;
  type: LeaveType;
  startsOn: string;
  endsOn: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  decidedBy: string | null;
};

export type DutyShift = {
  dutyId: string;
  day: Weekday;
  start: string;
  end: string;
  location: string;
  role: string;
};

export type TaskStatus = "Open" | "In progress" | "Done";

export type WorkTask = {
  taskId: string;
  title: string;
  detail: string;
  requestedBy: string;
  priority: "Low" | "Normal" | "Urgent";
  status: TaskStatus;
  dueOn: string | null;
  updatedAt: string;
};

export type Appraisal = {
  year: number;
  rating: "Outstanding" | "Very good" | "Good" | "Fair" | "Poor";
  score: number;
  appraiser: string;
  comment: string;
};

export type NonTeachingPortal = {
  role: "NonTeaching";
  organization: PortalOrganization;
  profile: StaffSummary & {
    cadre: string;
    salaryScale: string;
    gradeLevel: number;
    step: number;
    confirmedOn: string | null;
    nextPromotionDue: string | null;
    supervisor: string | null;
  };
  leave: {
    annualEntitlement: number;
    used: number;
    pending: number;
    remaining: number;
    requests: LeaveRequest[];
  };
  duties: DutyShift[];
  tasks: WorkTask[];
  appraisals: Appraisal[];
  notifications: PortalNotification[];
};

export type PortalPayload = StudentPortal | TeacherPortal | NonTeachingPortal;

// ─── Department (school side) ───────────────────────────────────────────────

export type DepartmentResultRow = {
  offeringId: string;
  code: string;
  title: string;
  levelKey: string;
  termName: string;
  lecturer: string | null;
  enrolled: number;
  status: SheetStatus;
  published: string[];
  submittedAt: string | null;
  average: number | null;
  passRate: number | null;
};

// ─── School admin: timetables, registration, staff operations ─────────────

export type AdminSlot = {
  slotId: string;
  offeringId: string;
  code: string;
  title: string;
  levelKey: string;
  lecturer: string | null;
  day: Weekday;
  start: string;
  end: string;
  venue: string;
};

export type DepartmentTimetable = {
  termId: string;
  termName: string;
  termClosed: boolean;
  offerings: { offeringId: string; code: string; title: string; levelKey: string; lecturer: string | null }[];
  slots: AdminSlot[];
};

export type RosterEntry = { studentProfileId: string; fullName: string; matriculationNumber: string; source: "Registered" | "Automatic"; hasMarks: boolean };

export type OfferingRoster = {
  offeringId: string;
  code: string;
  title: string;
  levelKey: string;
  locked: boolean;
  students: RosterEntry[];
  /** Active students who could be added (not on the roster now). */
  candidates: { studentProfileId: string; fullName: string; matriculationNumber: string; placement: string }[];
};

export type EmploymentRecord = {
  cadre: string;
  salaryScale: string;
  gradeLevel: number;
  step: number;
  confirmedOn: string | null;
  nextPromotionDue: string | null;
  supervisorId: string | null;
};

export type StaffOperations = {
  staffProfileId: string;
  fullName: string;
  kind: string;
  record: EmploymentRecord | null;
  duties: DutyShift[];
  tasks: WorkTask[];
  appraisals: Appraisal[];
  leave: LeaveRequest[];
  /** Who else could be this person's supervisor. */
  supervisors: { staffProfileId: string; name: string }[];
};

export type LeaveQueueRow = LeaveRequest & { staffProfileId: string; staffName: string; unitName: string | null; remaining: number };
