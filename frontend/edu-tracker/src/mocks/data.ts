/**
 * Seed data for the cohort mock backend.
 *
 * Two organizations on purpose, because the model has to serve both shapes:
 *
 *   Jewel Model Schools   secondary — JSS has no streaming, SS streams into
 *                         Science / Arts / Commercial
 *   Ridgeway University   university — Faculty > Department > levels
 *
 * Change these values freely. Do NOT change the SHAPES — those are the
 * contract in COHORT-MODEL.md, and the real backend returns the same ones.
 */

export const ORG_SCHOOL = "11111111-1111-1111-1111-111111111111";
export const ORG_UNIVERSITY = "22222222-2222-2222-2222-222222222222";

export const SESSION_2026 = "aaaaaaaa-0000-0000-0000-000000000001";

export type Stage = {
  id: string;
  organizationId: string;
  ordinal: number;
  name: string;
  shortName: string;
};

export type AcademicUnit = {
  id: string;
  organizationId: string;
  parentId: string | null;
  kind: "Faculty" | "Department" | "Programme" | "Stream";
  name: string;
  code: string;
};

export type Cohort = {
  id: string;
  organizationId: string;
  academicUnitId: string | null;
  academicUnitName: string | null;
  stageId: string;
  stageName: string;
  arm: string | null;
  displayName: string;
  sessionId: string;
  formTeacherId: string | null;
  formTeacherName: string | null;
  studentCount: number;
};

export type CohortStudent = {
  studentProfileId: string;
  userId: string;
  admissionNumber: string;
  fullName: string;
  status: "Active" | "Deferred" | "Suspended" | "Withdrawn" | "Graduated";
};

// ── Stages ──────────────────────────────────────────────────────────────
// Ordinal drives sort order, so the UI never hardcodes "JSS before SS".

export const stages: Stage[] = [
  { id: "st-jss1", organizationId: ORG_SCHOOL, ordinal: 1, name: "JSS 1", shortName: "JSS1" },
  { id: "st-jss2", organizationId: ORG_SCHOOL, ordinal: 2, name: "JSS 2", shortName: "JSS2" },
  { id: "st-jss3", organizationId: ORG_SCHOOL, ordinal: 3, name: "JSS 3", shortName: "JSS3" },
  { id: "st-ss1", organizationId: ORG_SCHOOL, ordinal: 4, name: "SS 1", shortName: "SS1" },
  { id: "st-ss2", organizationId: ORG_SCHOOL, ordinal: 5, name: "SS 2", shortName: "SS2" },
  { id: "st-ss3", organizationId: ORG_SCHOOL, ordinal: 6, name: "SS 3", shortName: "SS3" },

  { id: "st-100", organizationId: ORG_UNIVERSITY, ordinal: 1, name: "100 Level", shortName: "100L" },
  { id: "st-200", organizationId: ORG_UNIVERSITY, ordinal: 2, name: "200 Level", shortName: "200L" },
  { id: "st-300", organizationId: ORG_UNIVERSITY, ordinal: 3, name: "300 Level", shortName: "300L" },
  { id: "st-400", organizationId: ORG_UNIVERSITY, ordinal: 4, name: "400 Level", shortName: "400L" },
  { id: "st-500", organizationId: ORG_UNIVERSITY, ordinal: 5, name: "500 Level", shortName: "500L" },
];

// ── Academic units ──────────────────────────────────────────────────────
// Secondary: one level deep (streams). University: three (faculty > dept >
// programme). Primary would have none at all.

export const academicUnits: AcademicUnit[] = [
  { id: "au-sci", organizationId: ORG_SCHOOL, parentId: null, kind: "Stream", name: "Science", code: "SCI" },
  { id: "au-art", organizationId: ORG_SCHOOL, parentId: null, kind: "Stream", name: "Arts", code: "ART" },
  { id: "au-com", organizationId: ORG_SCHOOL, parentId: null, kind: "Stream", name: "Commercial", code: "COM" },

  { id: "au-eng", organizationId: ORG_UNIVERSITY, parentId: null, kind: "Faculty", name: "Faculty of Engineering", code: "ENG" },
  { id: "au-cpe", organizationId: ORG_UNIVERSITY, parentId: "au-eng", kind: "Department", name: "Computer Engineering", code: "CPE" },
  { id: "au-eee", organizationId: ORG_UNIVERSITY, parentId: "au-eng", kind: "Department", name: "Electrical Engineering", code: "EEE" },
  { id: "au-cve", organizationId: ORG_UNIVERSITY, parentId: "au-eng", kind: "Department", name: "Civil Engineering", code: "CVE" },
];

// ── Cohorts ─────────────────────────────────────────────────────────────
// displayName is composed by the SERVER, not the client, so every screen
// renders the same string. JSS cohorts carry no academic unit, because
// streaming has not started yet. That asymmetry is the point.

export const cohorts: Cohort[] = [
  {
    id: "co-jss2a", organizationId: ORG_SCHOOL,
    academicUnitId: null, academicUnitName: null,
    stageId: "st-jss2", stageName: "JSS 2", arm: "A",
    displayName: "JSS 2A", sessionId: SESSION_2026,
    formTeacherId: "u-adeyemi", formTeacherName: "Mrs. F. Adeyemi",
    studentCount: 34,
  },
  {
    id: "co-jss2b", organizationId: ORG_SCHOOL,
    academicUnitId: null, academicUnitName: null,
    stageId: "st-jss2", stageName: "JSS 2", arm: "B",
    displayName: "JSS 2B", sessionId: SESSION_2026,
    formTeacherId: "u-bello", formTeacherName: "Mr. K. Bello",
    studentCount: 31,
  },
  {
    id: "co-ss2sciA", organizationId: ORG_SCHOOL,
    academicUnitId: "au-sci", academicUnitName: "Science",
    stageId: "st-ss2", stageName: "SS 2", arm: "A",
    displayName: "SS 2 Science A", sessionId: SESSION_2026,
    formTeacherId: "u-okonkwo", formTeacherName: "Mrs. C. Okonkwo",
    studentCount: 31,
  },
  {
    id: "co-ss2artA", organizationId: ORG_SCHOOL,
    academicUnitId: "au-art", academicUnitName: "Arts",
    stageId: "st-ss2", stageName: "SS 2", arm: "A",
    displayName: "SS 2 Arts A", sessionId: SESSION_2026,
    formTeacherId: null, formTeacherName: null,
    studentCount: 27,
  },
  {
    // University cohorts usually have no arm — one group per level.
    id: "co-cpe100", organizationId: ORG_UNIVERSITY,
    academicUnitId: "au-cpe", academicUnitName: "Computer Engineering",
    stageId: "st-100", stageName: "100 Level", arm: null,
    displayName: "100L Computer Engineering", sessionId: SESSION_2026,
    formTeacherId: "u-okafor", formTeacherName: "Dr. E. Okafor",
    studentCount: 52,
  },
  {
    id: "co-cpe200", organizationId: ORG_UNIVERSITY,
    academicUnitId: "au-cpe", academicUnitName: "Computer Engineering",
    stageId: "st-200", stageName: "200 Level", arm: null,
    displayName: "200L Computer Engineering", sessionId: SESSION_2026,
    formTeacherId: null, formTeacherName: null,
    studentCount: 47,
  },
];

// ── Students ────────────────────────────────────────────────────────────
// Admission numbers follow the structured pattern schools actually use:
// entry year / institution / serial. Not every student is Active — the UI
// has to handle Deferred and Withdrawn without falling over.

const SURNAMES = [
  "Okeke", "Adeyemi", "Bello", "Chukwu", "Danjuma", "Eze", "Falana", "Garba",
  "Hassan", "Ibrahim", "Johnson", "Kalu", "Lawal", "Mohammed", "Nwosu",
  "Obi", "Peters", "Quadri", "Raji", "Sanni", "Tijani", "Uche", "Vincent",
  "Williams", "Yakubu", "Zubair", "Abiodun", "Balogun", "Chidi", "Dada",
  "Emeka", "Femi",
];

const FIRST_NAMES = [
  "Chidera", "Aisha", "Tunde", "Ngozi", "Emeka", "Fatima", "Segun", "Amara",
  "Ibrahim", "Blessing", "Kunle", "Zainab", "Obinna", "Halima", "Yusuf",
  "Chioma", "Musa", "Adaeze", "Bashir", "Temitope",
];

function makeStudents(cohortId: string, prefix: string, count: number): CohortStudent[] {
  return Array.from({ length: count }, (_, i) => {
    const serial = String(i + 1).padStart(4, "0");
    // Deterministic, so a refresh shows the same people. Random names would
    // make "did my change work?" impossible to answer by eye.
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last = SURNAMES[(i * 11) % SURNAMES.length];

    // A realistic sprinkle of non-Active students.
    let status: CohortStudent["status"] = "Active";
    if (i === 3) status = "Deferred";
    else if (i === 9) status = "Suspended";

    return {
      studentProfileId: `${cohortId}-sp-${serial}`,
      userId: `${cohortId}-u-${serial}`,
      admissionNumber: `${prefix}/${serial}`,
      fullName: `${first} ${last}`,
      status,
    };
  });
}

export const studentsByCohort: Record<string, CohortStudent[]> = {
  "co-jss2a": makeStudents("co-jss2a", "JMS/2025/JSS", 34),
  "co-jss2b": makeStudents("co-jss2b", "JMS/2025/JSS", 31),
  "co-ss2sciA": makeStudents("co-ss2sciA", "JMS/2023", 31),
  "co-ss2artA": makeStudents("co-ss2artA", "JMS/2023", 27),
  "co-cpe100": makeStudents("co-cpe100", "20/ENG/CPE", 52),
  "co-cpe200": makeStudents("co-cpe200", "19/ENG/CPE", 47),
};
