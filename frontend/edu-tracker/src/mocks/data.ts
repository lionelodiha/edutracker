import type { Cohort, CohortStudent, Stage, AcademicUnitOption } from "../features/cohorts/types";
import type { SchoolModel } from "../features/cohorts/settings";
export type { Cohort, CohortStudent, Stage } from "../features/cohorts/types";

import type { SchoolStructure } from "../features/cohorts/schoolSetup";
import { fixtureId } from "../features/cohorts/fixtureId";

/** Depth of a unit key in a bare unit list (top level = 0). Local copy so mocks stay dependency-light. */
function unitDepthOf(units: SchoolStructure["units"], key: string | null): number {
  let depth = 0;
  let current = units.find(unit => unit.key === key);
  const seen = new Set<string>();
  while (current?.parent && !seen.has(current.key)) {
    seen.add(current.key);
    depth += 1;
    current = units.find(unit => unit.key === current!.parent);
  }
  return depth;
}
export { fixtureId } from "../features/cohorts/fixtureId";
export type { SchoolStructure } from "../features/cohorts/schoolSetup";

// Sample school setup values, not naming rules. Labels are stored independently
// of stages, streams and arms. Empty labels omit that placement.
export const structures: Record<SchoolModel, SchoolStructure> = {
  Primary: {
    stages: [1, 2, 3, 4, 5, 6].map(n => ({ key: `p${n}`, name: `Primary ${n}`, shortName: `P${n}` })),
    units: [],
    placements: [{ key: "main", unit: null, arm: null, labels: ["Acorns", "Willows", "Cedars", "Maples", "Oaks", "Sequoias"] }],
  },
  Secondary: {
    stages: ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"].map((name, i) => ({ key: `s${i}`, name, shortName: name.replace(" ", "") })),
    units: [{ key: "science", parent: null, name: "Science" }, { key: "arts", parent: null, name: "Arts" }, { key: "commercial", parent: null, name: "Commercial" }],
    placements: [
      { key: "junior-a", unit: null, arm: "A", labels: ["JSS 1A", "JSS 2A", "JSS 3A", "", "", ""] },
      { key: "junior-b", unit: null, arm: "B", labels: ["JSS 1B", "JSS 2B", "JSS 3B", "", "", ""] },
      { key: "science", unit: "science", arm: "H", labels: ["", "", "", "SS 1H", "SS 2H", "SS 3H"] },
      { key: "arts", unit: "arts", arm: "A", labels: ["", "", "", "SS 1A", "SS 2A", "SS 3A"] },
      { key: "commercial", unit: "commercial", arm: null, labels: ["", "", "", "Enterprise I", "Enterprise II", "Enterprise III"] },
    ],
  },
  University: {
    stages: [100, 200, 300, 400, 500].map(n => ({ key: String(n), name: `${n} Level`, shortName: `${n}L` })),
    units: [{ key: "engineering", parent: null, name: "Faculty of Engineering", kind: "Faculty" as const },
      { key: "cpe", parent: "engineering", name: "Computer Engineering", kind: "Department" as const, code: "CPE" },
      { key: "eee", parent: "engineering", name: "Electrical Engineering", kind: "Department" as const, code: "EEE" },
      { key: "cve", parent: "engineering", name: "Civil Engineering", kind: "Department" as const, code: "CVE" }],
    placements: [
      { key: "cpe", unit: "cpe", arm: null, labels: ["CPE Foundation", "CPE Year Two", "CPE Year Three", "CPE Year Four", "CPE Finalists"] },
      { key: "eee", unit: "eee", arm: null, labels: ["EEE Foundation", "EEE Year Two", "EEE Year Three", "EEE Year Four", "EEE Finalists"] },
      { key: "cve", unit: "cve", arm: null, labels: ["Civil Foundation", "Civil Year Two", "Civil Year Three", "Civil Year Four", "Civil Finalists"] },
    ],
  },
};

export function seedSchool(organizationId: string, sessionId: string, structure: SchoolStructure = structures.Secondary, studentCount = 12) {
  const stages: Stage[] = structure.stages.map((stage, index) => ({
    id: fixtureId(organizationId, "stage", stage.key), organizationId, ordinal: index + 1, name: stage.name, shortName: stage.shortName,
  }));
  const academicUnits: AcademicUnitOption[] = structure.units.map(unit => ({
    id: fixtureId(organizationId, "unit", unit.key), name: unit.name,
    parentId: unit.parent ? fixtureId(organizationId, "unit", unit.parent) : null,
    ...(unit.kind ? { kind: unit.kind } : {}),
    ...(unit.code ? { code: unit.code } : {}),
  }));
  const cohorts: Cohort[] = [];
  const studentsByCohort: Record<string, CohortStudent[]> = {};
  // PEOPLE-AND-COURSES §1 rule 4: only Programme units generate cohorts; faculties
  // and departments are containers. Transitional: a department with no programme
  // children still generates (it acts as its own programme until programmes exist).
  const generatesCohorts = (placementUnitKey: string | null): boolean => {
    if (!placementUnitKey) return true;
    const unit = structure.units.find(item => item.key === placementUnitKey);
    if (!unit) return true;
    const depth = unitDepthOf(structure.units, placementUnitKey);
    const kind = unit.kind ?? (depth === 0 ? "Faculty" : depth === 1 ? "Department" : "Programme");
    // Older Secondary fixtures use root units as streams. Explicit Faculty
    // nodes remain containers, while those legacy leaf units still generate.
    if (kind === "Faculty") return !unit.kind && !structure.units.some(child => child.parent === unit.key);
    if (kind === "Programme") return true;
    return !structure.units.some(child => child.parent === unit.key);
  };
  stages.forEach((stage, index) => structure.placements.forEach(placement => {
    const displayName = placement.labels[index];
    if (!displayName) return;
    if (!generatesCohorts(placement.unit)) return;
    const id = fixtureId(organizationId, sessionId, stage.id, placement.key);
    const unit = academicUnits.find(item => item.id === fixtureId(organizationId, "unit", placement.unit ?? ""));
    const students = Array.from({ length: studentCount }, (_, i): CohortStudent => ({
      studentProfileId: fixtureId(organizationId, stage.id, placement.key, "student", String(i)),
      userId: fixtureId(organizationId, stage.id, placement.key, "user", String(i)),
      admissionNumber: `ADM/${String(cohorts.length * 12 + i + 1).padStart(4, "0")}`,
      fullName: ["Chidera Okeke", "Aisha Adeyemi", "Tunde Bello", "Ngozi Chukwu", "Emeka Danjuma", "Fatima Eze", "Segun Falana", "Amara Garba", "Ibrahim Hassan", "Blessing Ibrahim", "Kunle Johnson", "Zainab Kalu"][i],
      status: i === 3 ? "Deferred" : i === 9 ? "Suspended" : "Active",
    }));
    cohorts.push({ id, organizationId, sessionId, stageId: stage.id, stageName: stage.name,
      academicUnitId: unit?.id ?? null, academicUnitName: unit?.name ?? null, arm: placement.arm, displayName,
      formTeacherId: studentCount ? fixtureId(organizationId, "teacher", placement.key) : null, formTeacherName: studentCount ? "Mrs. F. Adeyemi" : null, studentCount: students.length });
    studentsByCohort[id] = students;
  }));
  return { stages, academicUnits, cohorts, studentsByCohort };
}
