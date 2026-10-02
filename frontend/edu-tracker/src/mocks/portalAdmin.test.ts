/**
 * School admin rules: timetable clashes, course registration, and
 * non-teaching staff operations (employment, roster, tasks, appraisals, leave).
 */
import { describe, expect, it } from "vitest";
import { addCourse, addOffering, readAcademics } from "../features/academics/store";
import { readSchoolSetup } from "../features/cohorts/schoolSetup";
import type { NonTeachingPortal, StudentPortal, TeacherPortal } from "../features/portal/types";
import { facultyRecords, facultyTestUtils } from "./faculty";
import {
  addAppraisal, addDuty, addSlot, assignTask, decideLeave, departmentTimetable, dropStudent, enrolStudent,
  leaveQueue, offeringRoster, portalFor, removeSlot, requestLeave, saveEmploymentRecord, staffOperations,
} from "./portal";
import { seedDemoSchool } from "./portalDemo";

// Monday morning, three weeks into the first semester.
const NOW = new Date("2026-10-05T09:00:00.000Z");
let counter = 0;
function university() {
  counter += 1;
  const organizationId = `admin-test-${counter}`;
  const { users } = seedDemoSchool("university", organizationId, NOW);
  const csc = readSchoolSetup(organizationId)!.structure.units.find(unit => unit.name === "Computer Science")!;
  const academics = readAcademics(organizationId);
  const current = academics.sessions.find(session => session.status === "Current")!;
  const courseId = (code: string) => academics.courses.find(course => course.code === code)!.courseId;
  const offeringOf = (code: string) => academics.offerings.find(item => item.courseId === courseId(code) && item.sessionId === current.sessionId)!;
  const staffNamed = (name: string) => facultyRecords(organizationId).staff.find(member => member.fullName === name)!.staffProfileId;
  return { organizationId, users, csc, current, term: current.terms[0], offeringOf, staffNamed };
}
function load<T>(organizationId: string, userId: string): T {
  const result = portalFor(organizationId, userId, NOW);
  if (!result.ok) throw new Error(result.message);
  return result.data as T;
}
/** A 300L course in the current first semester, taught by the given lecturer. */
function extraOffering(school: ReturnType<typeof university>, code: string, lecturer: string) {
  const course = addCourse(school.organizationId, { departmentId: school.csc.key, code, title: `Course ${code}`, units: 2, description: "", defaultLevel: "300L", defaultTermOrdinal: 1, defaultCompulsory: true });
  return addOffering(school.organizationId, { sessionId: school.current.sessionId, termId: school.term.termId, courseId: course.courseId, levelKey: "300L", units: 2, isCompulsory: true, lecturerStaffProfileId: school.staffNamed(lecturer) });
}

describe("timetable", () => {
  it("lists the department's periods for a term", () => {
    const school = university();
    const result = departmentTimetable(school.organizationId, school.csc.key, school.term.termId, NOW);
    if (!result.ok) throw new Error(result.message);
    expect(result.data.offerings.map(item => item.code)).toContain("CSC 201");
    expect(result.data.slots.some(slot => slot.code === "CSC 201" && slot.day === 1 && slot.start === "08:00")).toBe(true);
  });

  it("refuses a level, lecturer or venue clash, and accepts a free period", () => {
    const school = university();
    // 200L already has CSC 201 on Monday 08:00–10:00.
    const level = addSlot(school.organizationId, { offeringId: school.offeringOf("CSC 203").offeringId, day: 1, start: "09:00", end: "10:00", venue: "LT 9" }, NOW);
    expect(!level.ok && level.code).toBe("LEVEL_CLASH");
    // Dr. Ogunleye teaches CSC 201 then; a 300L course of his can't overlap it.
    const lecturer = addSlot(school.organizationId, { offeringId: extraOffering(school, "CSC 301", "Adebayo Ogunleye").offeringId, day: 1, start: "09:00", end: "10:00", venue: "LT 9" }, NOW);
    expect(!lecturer.ok && lecturer.code).toBe("LECTURER_CLASH");
    // LT 1 is booked for CSC 201 on Monday morning.
    const venue = addSlot(school.organizationId, { offeringId: extraOffering(school, "CSC 303", "Funke Adeyemi").offeringId, day: 1, start: "08:00", end: "09:00", venue: "lt 1" }, NOW);
    expect(!venue.ok && venue.code).toBe("VENUE_CLASH");
    // Friday afternoon is free for 200L.
    const free = addSlot(school.organizationId, { offeringId: school.offeringOf("CSC 203").offeringId, day: 5, start: "14:00", end: "16:00", venue: "LT 2" }, NOW);
    expect(free.ok).toBe(true);
    if (free.ok) expect(removeSlot(school.organizationId, free.data.slotId, NOW).ok).toBe(true);
  });

  it("validates times and days", () => {
    const school = university();
    const offeringId = school.offeringOf("CSC 203").offeringId;
    expect(addSlot(school.organizationId, { offeringId, day: 0, start: "08:00", end: "09:00", venue: "LT 2" }, NOW).ok).toBe(false);
    expect(addSlot(school.organizationId, { offeringId, day: 5, start: "10:00", end: "09:00", venue: "LT 2" }, NOW).ok).toBe(false);
    expect(addSlot(school.organizationId, { offeringId, day: 5, start: "06:00", end: "07:30", venue: "LT 2" }, NOW).ok).toBe(false);
  });
});

describe("course registration", () => {
  it("drops and re-registers a student, and refuses to drop someone with marks", () => {
    const school = university();
    const csc205 = school.offeringOf("CSC 205").offeringId;
    const csc201 = school.offeringOf("CSC 201").offeringId;
    const roster = offeringRoster(school.organizationId, csc205, NOW);
    if (!roster.ok) throw new Error(roster.message);
    expect(roster.data.students).toHaveLength(12);
    const first = roster.data.students[0].studentProfileId;

    expect(dropStudent(school.organizationId, csc205, first, NOW).ok).toBe(true);
    expect(load<StudentPortal>(school.organizationId, school.users.Student).courses.map(item => item.code)).not.toContain("CSC 205");
    expect(enrolStudent(school.organizationId, csc205, first, NOW).ok).toBe(true);
    const again = enrolStudent(school.organizationId, csc205, first, NOW);
    expect(!again.ok && again.code).toBe("ALREADY_ON_ROSTER");

    // CSC 201 already has test marks for everyone.
    const withMarks = dropStudent(school.organizationId, csc201, first, NOW);
    expect(!withMarks.ok && withMarks.code).toBe("DROP_HAS_MARKS");
  });

  it("keeps an automatically placed student off a course once dropped", () => {
    const school = university();
    const faculty = facultyTestUtils(school.organizationId);
    const programme = readSchoolSetup(school.organizationId)!.structure.units.find(unit => unit.parent === school.csc.key)!.key;
    // A newly approved 200L student with no registrations: placed automatically.
    faculty.db.students.push({
      studentProfileId: "new-student", organizationId: school.organizationId, userId: "new-user", fullName: "Zainab Musa",
      matriculationNumber: "CSC/2025/099", programmeId: programme, entryStageId: "stage-1", entrySessionId: school.current.sessionId,
      currentCohortId: "", schoolEmail: "zainab.musa@demouni.edu.ng", status: "Active",
    });
    faculty.persist();
    const csc205 = school.offeringOf("CSC 205").offeringId;
    const before = offeringRoster(school.organizationId, csc205, NOW);
    expect(before.ok && before.data.students.find(item => item.studentProfileId === "new-student")?.source).toBe("Automatic");

    expect(dropStudent(school.organizationId, csc205, "new-student", NOW).ok).toBe(true);
    const after = offeringRoster(school.organizationId, csc205, NOW);
    expect(after.ok && after.data.students.some(item => item.studentProfileId === "new-student")).toBe(false);
    // Still on their other 200L courses: the drop affects one course only.
    const csc207 = offeringRoster(school.organizationId, school.offeringOf("CSC 207").offeringId, NOW);
    expect(csc207.ok && csc207.data.students.some(item => item.studentProfileId === "new-student")).toBe(true);

    expect(enrolStudent(school.organizationId, csc205, "new-student", NOW).ok).toBe(true);
    const back = offeringRoster(school.organizationId, csc205, NOW);
    expect(back.ok && back.data.students.find(item => item.studentProfileId === "new-student")?.source).toBe("Registered");
  });
});

describe("staff operations", () => {
  it("saves the employment record and it shows in the staff portal", () => {
    const school = university();
    const clerk = school.staffNamed("Ngozi Eze");
    const bad = saveEmploymentRecord(school.organizationId, clerk, { cadre: "Registry", salaryScale: "CONTISS", gradeLevel: 18, step: 1 }, NOW);
    expect(bad.ok).toBe(false);
    const good = saveEmploymentRecord(school.organizationId, clerk, { cadre: "Registry · Principal Executive Officer", salaryScale: "CONTISS", gradeLevel: 9, step: 1, confirmedOn: "2019-03-01", supervisorId: school.staffNamed("Samuel Okon") }, NOW);
    expect(good.ok).toBe(true);
    const portal = load<NonTeachingPortal>(school.organizationId, school.users.NonTeaching);
    expect(portal.profile.gradeLevel).toBe(9);
    expect(portal.profile.cadre).toBe("Registry · Principal Executive Officer");
  });

  it("refuses overlapping shifts and duplicate appraisals, and notifies on new tasks", () => {
    const school = university();
    const clerk = school.staffNamed("Ngozi Eze");
    const overlap = addDuty(school.organizationId, clerk, { day: 1, start: "12:00", end: "14:00", location: "Senate Building", role: "Exams" }, NOW);
    expect(!overlap.ok && overlap.code).toBe("DUTY_OVERLAP");
    expect(addDuty(school.organizationId, clerk, { day: 6, start: "09:00", end: "13:00", location: "Senate Building", role: "Exams" }, NOW).ok).toBe(true);

    const duplicate = addAppraisal(school.organizationId, clerk, { year: 2025, score: 80, appraiser: "Mr. Samuel Okon" }, NOW);
    expect(!duplicate.ok && duplicate.code).toBe("APPRAISAL_EXISTS");
    const fresh = addAppraisal(school.organizationId, clerk, { year: 2026, score: 88, appraiser: "Mr. Samuel Okon" }, NOW);
    expect(fresh.ok && fresh.data.rating).toBe("Outstanding");

    expect(assignTask(school.organizationId, clerk, { title: "File the 300L forms", priority: "Urgent", requestedBy: "Registrar" }, NOW).ok).toBe(true);
    const portal = load<NonTeachingPortal>(school.organizationId, school.users.NonTeaching);
    expect(portal.tasks.some(task => task.title === "File the 300L forms")).toBe(true);
    expect(portal.notifications[0].title).toBe("Urgent task assigned");
    const operations = staffOperations(school.organizationId, clerk, NOW);
    expect(operations.ok && operations.data.duties.some(duty => duty.day === 6)).toBe(true);
  });

  it("approves or declines leave once, and tells the staff member", () => {
    const school = university();
    const requested = requestLeave(school.organizationId, school.users.NonTeaching, { type: "Annual", startsOn: "2026-10-12", endsOn: "2026-10-16", reason: "Rest" }, NOW);
    if (!requested.ok) throw new Error(requested.message);
    const queue = leaveQueue(school.organizationId, NOW);
    expect(queue.ok && queue.data[0].status).toBe("Pending");
    expect(queue.ok && queue.data[0].remaining).toBe(20);

    const noReason = decideLeave(school.organizationId, requested.data.requestId, { decision: "Declined" }, NOW);
    expect(noReason.ok).toBe(false);
    expect(decideLeave(school.organizationId, requested.data.requestId, { decision: "Approved", decidedBy: "Registrar" }, NOW).ok).toBe(true);
    const twice = decideLeave(school.organizationId, requested.data.requestId, { decision: "Declined", note: "Too late" }, NOW);
    expect(!twice.ok && twice.code).toBe("LEAVE_DECIDED");

    const portal = load<NonTeachingPortal>(school.organizationId, school.users.NonTeaching);
    expect(portal.leave.requests.find(item => item.requestId === requested.data.requestId)?.status).toBe("Approved");
    expect(portal.notifications[0].title).toBe("Annual leave approved");
  });
});

describe("the teacher portal reflects admin changes", () => {
  it("shows a new period on the lecturer's timetable", () => {
    const school = university();
    const added = addSlot(school.organizationId, { offeringId: school.offeringOf("CSC 205").offeringId, day: 2, start: "14:00", end: "15:00", venue: "LT 4" }, NOW);
    expect(added.ok).toBe(true);
    const teacher = load<TeacherPortal>(school.organizationId, school.users.Teaching);
    expect(teacher.timetable.some(entry => entry.code === "CSC 205" && entry.day === 2 && entry.venue === "LT 4")).toBe(true);
  });
});
