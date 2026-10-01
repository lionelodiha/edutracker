import { describe, expect, it } from "vitest";
import {
  AcademicError, addCourse, addOffering, closeTerm, createDepartment, createFaculty,
  generatedLevels, getStructure, initializeStructure, listOfferings, prepareSession,
  startSession, updateDepartment, updateOffering,
} from "./store";
import type { DepartmentInput, PrepareSessionInput } from "./types";
import { initialSchoolSetup, saveSchoolSetup } from "../cohorts/schoolSetup";

const org = () => `academic-${crypto.randomUUID()}`;
const departmentInput = (facultyId: string, length = 5): DepartmentInput => ({
  facultyId, name: "Computer Engineering", code: "CPE", award: "B.Eng",
  description: "", hodStaffProfileId: null, durationYears: length,
  semestersPerLevel: 2, industrialTraining: length > 2 ? { level: "300L", termOrdinal: 2 } : null,
  postGraduationInternshipYears: null, directEntryLevel: length > 1 ? "200L" : null,
  maxIntakePerSession: 120, minUtmeScore: 200, utmeSubjects: ["English", "Maths"],
  oLevelRequirement: "5 credits", otherRequirements: "",
});
const prepare = (startYear: number, fromSessionId: string | null = null): PrepareSessionInput => ({
  fromSessionId, name: `${startYear}/${startYear + 1}`, startYear, endYear: startYear + 1,
  startsOn: `${startYear}-09-01`, endsOn: `${startYear + 1}-07-31`,
  termNames: ["First semester", "Second semester"],
  copy: { courseOfferings: true, lecturerAssignments: true, classArms: true },
});

describe("academic mock contract", () => {
  it("keeps departments from a previously saved school tree visible", () => {
    const id = org();
    const setup = initialSchoolSetup("University");
    setup.structure.units = [
      { key: "eng", parent: null, name: "Engineering", code: "ENG", kind: "Faculty" },
      { key: "cpe", parent: "eng", name: "Computer Engineering", code: "CPE", kind: "Department" },
      { key: "programme", parent: "cpe", name: "Computer Engineering", kind: "Programme" },
    ];
    setup.structure.placements.push({ key: "programme", unit: "programme", arm: null, labels: ["100L", "200L", "300L", "400L", "500L"] });
    saveSchoolSetup(id, setup);
    expect(getStructure(id).faculties.map(item => item.unitKey)).toEqual(["eng"]);
    expect(getStructure(id).departments.map(item => item.unitKey)).toEqual(["cpe"]);
  });

  it("uses class arms and terms for secondary schools", () => {
    const id = org(); initializeStructure(id, "Secondary");
    const section = createFaculty(id, { name: "Junior", code: "JUN" });
    const unit = createDepartment(id, { ...departmentInput(section.key, 3), name: "JSS 1", code: "JSS1", award: "", levels: ["A", "B", "C"], semestersPerLevel: 3, industrialTraining: null, directEntryLevel: null });
    expect(getStructure(id).departments.find(item => item.unitKey === unit.key)?.levels).toEqual(["A", "B", "C"]);
  });

  it("keeps the permanent faculty tree separate from sessions and enforces school-wide codes", () => {
    const id = org(); initializeStructure(id, "University");
    const faculty = createFaculty(id, { name: "Engineering", code: "eng" });
    const second = createFaculty(id, { name: "Science", code: "SCI" });
    const department = createDepartment(id, departmentInput(faculty.key));
    expect(getStructure(id).units.find(unit => unit.key === department.key)?.code).toBe("CPE");
    expect(getStructure(id).units.find(unit => unit.parent === department.key)?.kind).toBe("Programme");
    expect(() => createDepartment(id, { ...departmentInput(second.key), name: "Physics", code: "cpe" })).toThrowError(AcademicError);
    prepareSession(id, prepare(2026));
    expect(getStructure(id).units.filter(unit => unit.parent === null)).toHaveLength(2);
  });

  it("generates 100L–500L or 100L–600L and preserves SIWES and Direct Entry settings", () => {
    expect(generatedLevels(5)).toEqual(["100L", "200L", "300L", "400L", "500L"]);
    expect(generatedLevels(6).at(-1)).toBe("600L");
    const id = org(); initializeStructure(id, "University");
    const faculty = createFaculty(id, { name: "Medicine", code: "MED" });
    const unit = createDepartment(id, { ...departmentInput(faculty.key, 6), name: "Medicine", code: "MBBS", award: "MBBS" });
    const detail = getStructure(id).departments.find(item => item.unitKey === unit.key)!;
    expect(detail.levels).toHaveLength(6);
    expect(detail.industrialTraining).toEqual({ level: "300L", termOrdinal: 2 });
    expect(detail.directEntryLevel).toBe("200L");
  });

  it("saves renamed levels without a length change, but not over a level with history", () => {
    const id = org(); initializeStructure(id, "University");
    const faculty = createFaculty(id, { name: "Engineering", code: "ENG" });
    const unit = createDepartment(id, departmentInput(faculty.key, 3));
    const parts = ["Part 1", "Part 2", "Part 3"];
    expect(updateDepartment(id, unit.key, { levels: parts }).levels).toEqual(parts);

    const session = prepareSession(id, prepare(2026)).session;
    const course = addCourse(id, { departmentId: unit.key, code: "CPE 101", title: "Intro", units: 3, description: "", defaultLevel: "Part 1", defaultTermOrdinal: 1, defaultCompulsory: true });
    addOffering(id, { sessionId: session.sessionId, termId: session.terms[0].termId, courseId: course.courseId, levelKey: "Part 1", units: 3, isCompulsory: true, lecturerStaffProfileId: null });
    expect(() => updateDepartment(id, unit.key, { levels: ["Year 1", "Part 2", "Part 3"] })).toThrowError(AcademicError);
  });

  it("starts one current session, copies offerings and lecturers, and locks the closed one", () => {
    const id = org(); initializeStructure(id, "University");
    const faculty = createFaculty(id, { name: "Engineering", code: "ENG" });
    const dept = createDepartment(id, departmentInput(faculty.key));
    const first = prepareSession(id, prepare(2025)).session;
    expect(first.terms[0].endsOn < first.terms[1].startsOn).toBe(true);
    startSession(id, first.sessionId);
    const course = addCourse(id, { departmentId: dept.key, code: "CPE 101", title: "Intro", units: 3, description: "", defaultLevel: "100L", defaultTermOrdinal: 1, defaultCompulsory: true });
    const offering = addOffering(id, { sessionId: first.sessionId, termId: first.terms[0].termId, courseId: course.courseId, levelKey: "100L", units: 3, isCompulsory: true, lecturerStaffProfileId: "lecturer-1" });
    expect(() => addOffering(id, { sessionId: first.sessionId, termId: first.terms[0].termId, courseId: course.courseId, levelKey: "100L", units: 3, isCompulsory: true, lecturerStaffProfileId: null })).toThrowError(AcademicError);
    const next = prepareSession(id, prepare(2026, first.sessionId));
    expect(next.copiedOfferings).toBe(1);
    expect(next.copiedLecturers).toBe(1);
    expect(listOfferings(id, { sessionId: next.session.sessionId })[0].lecturerStaffProfileId).toBe("lecturer-1");
    startSession(id, next.session.sessionId);
    expect(() => updateOffering(id, offering.offeringId, { units: 4 })).toThrowError(AcademicError);
    expect(listOfferings(id, { sessionId: first.sessionId })).toHaveLength(1);
    expect(closeTerm(id, next.session.terms[0].termId).terms.map(term => term.status)).toEqual(["Closed", "Current"]);
  });
});
