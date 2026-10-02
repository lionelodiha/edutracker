/**
 * How a course or subject is assessed, graded and summarised.
 *
 * Every school in the app uses a 30 / 70 split: 30 marks of in-course
 * (continuous) assessment and a 70-mark exam. What makes up the 30 differs:
 *
 * - University: one test, an assignment and a project.
 * - Secondary and primary: a first test, a second test and an assignment.
 *
 * Grading follows the Nigerian scales each level already uses: the NUC
 * five-point scale for universities, the WAEC A1–F9 scale for secondary
 * schools and a plain A–F scale for primary schools.
 */
import type { SchoolModel } from "../cohorts/settings";

export type ComponentKind = "Test" | "Assignment" | "Project" | "Exam";

export type AssessmentComponent = {
  key: string;
  label: string;
  kind: ComponentKind;
  max: number;
  /** "CA" counts toward in-course assessment; "Exam" is the final paper. */
  part: "CA" | "Exam";
};

export const SCHEMES: Record<SchoolModel, AssessmentComponent[]> = {
  University: [
    { key: "test", label: "Test", kind: "Test", max: 15, part: "CA" },
    { key: "assignment", label: "Assignment", kind: "Assignment", max: 10, part: "CA" },
    { key: "project", label: "Project", kind: "Project", max: 5, part: "CA" },
    { key: "exam", label: "Exam", kind: "Exam", max: 70, part: "Exam" },
  ],
  Secondary: [
    { key: "test1", label: "1st Test", kind: "Test", max: 10, part: "CA" },
    { key: "test2", label: "2nd Test", kind: "Test", max: 10, part: "CA" },
    { key: "assignment", label: "Assignment", kind: "Assignment", max: 10, part: "CA" },
    { key: "exam", label: "Exam", kind: "Exam", max: 70, part: "Exam" },
  ],
  Primary: [
    { key: "test1", label: "1st Test", kind: "Test", max: 10, part: "CA" },
    { key: "test2", label: "2nd Test", kind: "Test", max: 10, part: "CA" },
    { key: "assignment", label: "Assignment", kind: "Assignment", max: 10, part: "CA" },
    { key: "exam", label: "Exam", kind: "Exam", max: 70, part: "Exam" },
  ],
};

export function schemeFor(model: SchoolModel): AssessmentComponent[] {
  return SCHEMES[model];
}

/** What the in-course part is called at each level. */
export function caLabel(model: SchoolModel): string {
  return model === "University" ? "In-course" : "CA";
}

export type GradeBand = { grade: string; min: number; points: number; remark: string; pass: boolean };

const UNIVERSITY_SCALE: GradeBand[] = [
  { grade: "A", min: 70, points: 5, remark: "Excellent", pass: true },
  { grade: "B", min: 60, points: 4, remark: "Very good", pass: true },
  { grade: "C", min: 50, points: 3, remark: "Good", pass: true },
  { grade: "D", min: 45, points: 2, remark: "Fair", pass: true },
  { grade: "E", min: 40, points: 1, remark: "Pass", pass: true },
  { grade: "F", min: 0, points: 0, remark: "Fail", pass: false },
];

const SECONDARY_SCALE: GradeBand[] = [
  { grade: "A1", min: 75, points: 1, remark: "Excellent", pass: true },
  { grade: "B2", min: 70, points: 2, remark: "Very good", pass: true },
  { grade: "B3", min: 65, points: 3, remark: "Good", pass: true },
  { grade: "C4", min: 60, points: 4, remark: "Credit", pass: true },
  { grade: "C5", min: 55, points: 5, remark: "Credit", pass: true },
  { grade: "C6", min: 50, points: 6, remark: "Credit", pass: true },
  { grade: "D7", min: 45, points: 7, remark: "Pass", pass: true },
  { grade: "E8", min: 40, points: 8, remark: "Pass", pass: true },
  { grade: "F9", min: 0, points: 9, remark: "Fail", pass: false },
];

const PRIMARY_SCALE: GradeBand[] = [
  { grade: "A", min: 70, points: 5, remark: "Excellent", pass: true },
  { grade: "B", min: 60, points: 4, remark: "Very good", pass: true },
  { grade: "C", min: 50, points: 3, remark: "Good", pass: true },
  { grade: "D", min: 45, points: 2, remark: "Fair", pass: true },
  { grade: "E", min: 40, points: 1, remark: "Pass", pass: true },
  { grade: "F", min: 0, points: 0, remark: "Fail", pass: false },
];

export function gradeScale(model: SchoolModel): GradeBand[] {
  return model === "University" ? UNIVERSITY_SCALE : model === "Secondary" ? SECONDARY_SCALE : PRIMARY_SCALE;
}

export function gradeFor(model: SchoolModel, total: number): GradeBand {
  const scale = gradeScale(model);
  return scale.find(band => total >= band.min) ?? scale[scale.length - 1];
}

export type Scores = Record<string, number | null | undefined>;

/** Sum of whichever components have a mark. */
export function sumOf(scheme: AssessmentComponent[], scores: Scores, part?: "CA" | "Exam"): number {
  return scheme
    .filter(component => !part || component.part === part)
    .reduce((sum, component) => sum + (typeof scores[component.key] === "number" ? (scores[component.key] as number) : 0), 0);
}

/** True when every component has a mark. */
export function isComplete(scheme: AssessmentComponent[], scores: Scores): boolean {
  return scheme.every(component => typeof scores[component.key] === "number");
}

/** Returns an error message, or null when the mark is acceptable. */
export function checkScore(component: AssessmentComponent, value: number): string | null {
  if (!Number.isFinite(value)) return `${component.label} must be a number.`;
  if (value < 0) return `${component.label} can't be below 0.`;
  if (value > component.max) return `${component.label} is out of ${component.max}.`;
  if (Math.round(value * 2) !== value * 2) return `${component.label} takes whole or half marks.`;
  return null;
}

/** Weighted grade point average on the five-point scale. Null with no graded units. */
export function gpa(rows: { units: number; points: number | null }[]): number | null {
  const graded = rows.filter(row => row.points !== null && row.units > 0);
  const units = graded.reduce((sum, row) => sum + row.units, 0);
  if (!units) return null;
  const weighted = graded.reduce((sum, row) => sum + row.units * (row.points as number), 0);
  return Math.round((weighted / units) * 100) / 100;
}

/** NUC class of degree for a cumulative GPA. */
export function degreeClass(cgpa: number): string {
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa >= 1.0) return "Pass";
  return "Below pass";
}

/** "1st", "2nd", "3rd", "11th" — for class positions on a report card. */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/**
 * Competition ranking: equal scores share a position and the next
 * position skips (90, 90, 80 → 1st, 1st, 3rd).
 */
export function rank<T>(items: T[], score: (item: T) => number): Map<T, number> {
  const sorted = [...items].sort((a, b) => score(b) - score(a));
  const positions = new Map<T, number>();
  sorted.forEach((item, index) => {
    const previous = sorted[index - 1];
    positions.set(item, previous !== undefined && score(previous) === score(item) ? positions.get(previous)! : index + 1);
  });
  return positions;
}
