/**
 * Portal rules: marking, publishing, submitting, what students can see,
 * coursework hand-ins, leave, and the department's view of results.
 */
import { describe, expect, it } from "vitest";
import { degreeClass, gpa, gradeFor, ordinal, rank } from "../features/assessment/scheme";
import type { StudentPortal, TeacherPortal, NonTeachingPortal } from "../features/portal/types";
import {
  departmentResults, departmentSheet, getSheet, markRead, portalFor, postCoursework, publishComponents,
  requestLeave, saveScores, schoolInfo, submitCoursework, submitSheet, updateTask, workingDays,
} from "./portal";
import { DEMO_PASSWORD, prepareDemoLogins, seedDemoSchool } from "./portalDemo";
import { portalLogin } from "./faculty";
import { portalSeedUtils } from "./portal";
import { facultyRecords } from "./faculty";
import { readSchoolSetup } from "../features/cohorts/schoolSetup";

// A Monday morning, three weeks into the first semester.
const NOW = new Date("2026-10-05T09:00:00.000Z");
let counter = 0;
function school(kind: "university" | "secondary") {
  counter += 1;
  const organizationId = `test-${kind}-${counter}`;
  const { users } = seedDemoSchool(kind, organizationId, NOW);
  return { organizationId, users };
}
function load<T>(organizationId: string, userId: string): T {
  const result = portalFor(organizationId, userId, NOW);
  if (!result.ok) throw new Error(result.message);
  return result.data as T;
}

describe("assessment scheme", () => {
  it("grades on each level's scale", () => {
    expect(gradeFor("University", 70).grade).toBe("A");
    expect(gradeFor("University", 44.5).grade).toBe("E");
    expect(gradeFor("University", 39).pass).toBe(false);
    expect(gradeFor("Secondary", 75).grade).toBe("A1");
    expect(gradeFor("Secondary", 64).grade).toBe("C4");
    expect(gradeFor("Secondary", 59).grade).toBe("C5");
    expect(gradeFor("Secondary", 39).grade).toBe("F9");
  });
  it("computes a unit-weighted GPA and degree class", () => {
    expect(gpa([{ units: 3, points: 5 }, { units: 2, points: 3 }])).toBe(4.2);
    expect(gpa([{ units: 3, points: null }])).toBeNull();
    expect(degreeClass(4.5)).toBe("First Class");
    expect(degreeClass(3.49)).toBe("Second Class Lower");
  });
  it("shares positions on ties", () => {
    const items = [{ s: 90 }, { s: 80 }, { s: 90 }];
    const positions = rank(items, item => item.s);
    expect(items.map(item => positions.get(item))).toEqual([1, 3, 1]);
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
  });
});

describe("student portal", () => {
  it("shows only published marks and final grades after submission", () => {
    const { organizationId, users } = school("university");
    const portal = load<StudentPortal>(organizationId, users.Student);
    expect(portal.role).toBe("Student");
    expect(portal.profile.level).toBe("200L");
    expect(portal.courses.map(course => course.code)).toEqual(["CSC 201", "CSC 203", "CSC 205", "CSC 207", "MTH 201"]);

    const current = portal.results.find(period => period.sessionName === "2026/2027")!;
    const csc201 = current.rows.find(row => row.code === "CSC 201")!;
    // Test is published; assignment is marked but still a draft.
    expect(Object.keys(csc201.scores)).toEqual(["test"]);
    expect(csc201.total).toBeNull();
    expect(csc201.status).toBe("Partial");

    const past = portal.results.filter(period => period.sessionName === "2025/2026");
    expect(past).toHaveLength(2);
    expect(past.every(period => period.rows.every(row => row.grade !== null && row.total !== null))).toBe(true);
    expect(portal.cgpa).not.toBeNull();
  });

  it("reports class position on secondary report cards", () => {
    const { organizationId, users } = school("secondary");
    const portal = load<StudentPortal>(organizationId, users.Student);
    const third = portal.results.find(period => period.termName === "Third Term" && period.sessionName === "2025/2026")!;
    expect(third.rows).toHaveLength(6);
    expect(third.average).not.toBeNull();
    expect(third.position).toBeGreaterThanOrEqual(1);
    expect(third.classSize).toBe(10);
    expect(third.remark).toMatch(/Promoted/);
  });

  it("works out coursework state", () => {
    const { organizationId, users } = school("university");
    const portal = load<StudentPortal>(organizationId, users.Student);
    const byTitle = (text: string) => portal.coursework.find(item => item.title.includes(text))!;
    expect(byTitle("control flow").state).toBe("Marked");
    expect(byTitle("calculator").state).toBe("Open");
    expect(byTitle("differential").state).toBe("Overdue");
    expect(byTitle("processes").state).toBe("Scheduled");
  });

  it("lets a student hand in before the deadline only", () => {
    const { organizationId, users } = school("university");
    const portal = load<StudentPortal>(organizationId, users.Student);
    const open = portal.coursework.find(item => item.state === "Open")!;
    const overdue = portal.coursework.find(item => item.state === "Overdue")!;
    expect(submitCoursework(organizationId, users.Student, open.itemId, {}, NOW).ok).toBe(false);
    expect(submitCoursework(organizationId, users.Student, open.itemId, { fileName: "calc.py" }, NOW).ok).toBe(true);
    const late = submitCoursework(organizationId, users.Student, overdue.itemId, { fileName: "late.pdf" }, NOW);
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.code).toBe("DEADLINE_PASSED");
    const after = load<StudentPortal>(organizationId, users.Student);
    expect(after.coursework.find(item => item.itemId === open.itemId)!.state).toBe("Submitted");
  });
});

describe("result sheet", () => {
  function setup() {
    const { organizationId, users } = school("university");
    const teacher = load<TeacherPortal>(organizationId, users.Teaching);
    const csc205 = teacher.classes.find(item => item.code === "CSC 205")!;
    return { organizationId, users, teacher, offeringId: csc205.offeringId };
  }

  it("only the assigned lecturer can open or mark a sheet", () => {
    const { organizationId, users, offeringId } = setup();
    expect(getSheet(organizationId, users.Teaching, offeringId, NOW).ok).toBe(true);
    const student = getSheet(organizationId, users.Student, offeringId, NOW);
    expect(student.ok).toBe(false);
    if (!student.ok) expect(student.status).toBe(403);
    const unknown = getSheet(organizationId, users.Teaching, "not-an-offering", NOW);
    if (!unknown.ok) expect(unknown.status).toBe(404);
  });

  it("rejects marks above the maximum", () => {
    const { organizationId, users, offeringId } = setup();
    const sheet = getSheet(organizationId, users.Teaching, offeringId, NOW);
    if (!sheet.ok) throw new Error(sheet.message);
    const first = sheet.data.students[0].studentProfileId;
    const result = saveScores(organizationId, users.Teaching, offeringId, { [first]: { test: 16 } }, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/out of 15/);
  });

  it("publishes a component only when everyone has a mark, then locks it", () => {
    const { organizationId, users, offeringId } = setup();
    const sheet = getSheet(organizationId, users.Teaching, offeringId, NOW);
    if (!sheet.ok) throw new Error(sheet.message);
    const [first, ...rest] = sheet.data.students;
    saveScores(organizationId, users.Teaching, offeringId, { [first.studentProfileId]: { test: 12 } }, NOW);
    const early = publishComponents(organizationId, users.Teaching, offeringId, ["test"], NOW);
    expect(early.ok).toBe(false);
    saveScores(organizationId, users.Teaching, offeringId, Object.fromEntries(rest.map(person => [person.studentProfileId, { test: 10 }])), NOW);
    expect(publishComponents(organizationId, users.Teaching, offeringId, ["test"], NOW).ok).toBe(true);
    const change = saveScores(organizationId, users.Teaching, offeringId, { [first.studentProfileId]: { test: 14 } }, NOW);
    expect(change.ok).toBe(false);
    // Re-sending the same published value (e.g. a full-sheet save) is fine.
    expect(saveScores(organizationId, users.Teaching, offeringId, { [first.studentProfileId]: { test: "12" } }, NOW).ok).toBe(true);
    // The first student by matriculation number is the demo student.
    const student = load<StudentPortal>(organizationId, users.Student);
    expect(student.notifications[0].title).toBe("CSC 205: Test marks are out");
    expect(student.results[0].rows.find(row => row.offeringId === offeringId)!.scores).toEqual({ test: 12 });
  });

  it("submits only a complete sheet, then shows grades to students and the department", () => {
    const { organizationId, users, offeringId } = setup();
    const sheet = getSheet(organizationId, users.Teaching, offeringId, NOW);
    if (!sheet.ok) throw new Error(sheet.message);
    expect(submitSheet(organizationId, users.Teaching, offeringId, NOW).ok).toBe(false);
    const full = Object.fromEntries(sheet.data.students.map((person, index) => [person.studentProfileId, { test: 12, assignment: 8, project: 4, exam: 30 + index }]));
    expect(saveScores(organizationId, users.Teaching, offeringId, full, NOW).ok).toBe(true);
    const submitted = submitSheet(organizationId, users.Teaching, offeringId, NOW);
    expect(submitted.ok).toBe(true);
    if (submitted.ok) expect(submitted.data.locked).toBe(true);
    expect(saveScores(organizationId, users.Teaching, offeringId, full, NOW).ok).toBe(false);

    const student = load<StudentPortal>(organizationId, users.Student);
    const row = student.results[0].rows.find(item => item.offeringId === offeringId)!;
    expect(row.total).toBe(54); // Chiamaka is the first student: 12 + 8 + 4 + 30
    expect(row.grade).toBe("C");
    expect(row.classAverage).not.toBeNull();

    const view = departmentSheet(organizationId, offeringId, NOW);
    expect(view.ok && view.data.status).toBe("Submitted");
  });

  it("notifies the HOD when results are submitted", () => {
    const { organizationId, users, offeringId } = setup();
    const sheet = getSheet(organizationId, users.Teaching, offeringId, NOW);
    if (!sheet.ok) throw new Error(sheet.message);
    saveScores(organizationId, users.Teaching, offeringId, Object.fromEntries(sheet.data.students.map(person => [person.studentProfileId, { test: 10, assignment: 5, project: 3, exam: 40 }])), NOW);
    expect(submitSheet(organizationId, users.Teaching, offeringId, NOW).ok).toBe(true);
    const hod = facultyRecords(organizationId).staff.find(member => member.fullName === "Grace Nwachukwu")!;
    const inbox = portalSeedUtils(organizationId).db.notifications.filter(item => item.recipientId === hod.staffProfileId);
    expect(inbox.some(item => item.title === "CSC 205 results submitted")).toBe(true);
  });

  it("lets a lecturer post coursework that students then see", () => {
    const { organizationId, users, offeringId } = setup();
    const due = new Date(NOW.getTime() + 7 * 86_400_000).toISOString();
    expect(postCoursework(organizationId, users.Teaching, { offeringId, componentKey: "exam", title: "Exam", dueAt: due }, NOW).ok).toBe(false);
    expect(postCoursework(organizationId, users.Teaching, { offeringId, componentKey: "assignment", title: "", dueAt: due }, NOW).ok).toBe(false);
    expect(postCoursework(organizationId, users.Teaching, { offeringId, componentKey: "assignment", title: "Shell scripting", dueAt: due }, NOW).ok).toBe(true);
    const student = load<StudentPortal>(organizationId, users.Student);
    expect(student.coursework.some(item => item.title === "Shell scripting" && item.state === "Open")).toBe(true);
    expect(student.notifications[0].title).toMatch(/New assignment in CSC 205/);
    expect(markRead(organizationId, users.Student, "all", NOW).ok).toBe(true);
    expect(load<StudentPortal>(organizationId, users.Student).notifications.every(item => item.readAt)).toBe(true);
  });
});

describe("department results", () => {
  it("lists every offering in the session with its sheet status", () => {
    const { organizationId, users } = school("university");
    const student = load<StudentPortal>(organizationId, users.Student);
    const csc = readSchoolSetup(organizationId)!.structure.units.find(unit => unit.name === "Computer Science")!;
    const rows = departmentResults(organizationId, csc.key, student.term!.sessionId, NOW);
    if (!rows.ok) throw new Error(rows.message);
    expect(rows.data.map(row => `${row.code}:${row.status}`)).toEqual([
      "CSC 201:Partial", "CSC 203:Partial", "CSC 205:Not started", "CSC 207:Not started",
    ]);
    // Averages stay hidden until the lecturer submits.
    expect(rows.data.every(row => row.average === null)).toBe(true);
    expect(departmentResults(organizationId, "nope", student.term!.sessionId, NOW).ok).toBe(false);
  });
});

describe("non-teaching portal", () => {
  it("counts working days and enforces the leave balance", () => {
    expect(workingDays("2026-10-05", "2026-10-11")).toBe(5);
    const { organizationId, users } = school("university");
    const portal = load<NonTeachingPortal>(organizationId, users.NonTeaching);
    expect(portal.role).toBe("NonTeaching");
    expect(portal.leave.annualEntitlement).toBe(30); // grade level 08
    expect(portal.leave.used).toBe(10);
    const tooLong = requestLeave(organizationId, users.NonTeaching, { type: "Annual", startsOn: "2026-10-12", endsOn: "2026-11-30", reason: "Rest" }, NOW);
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.code).toBe("LEAVE_EXCEEDS_BALANCE");
    const fine = requestLeave(organizationId, users.NonTeaching, { type: "Annual", startsOn: "2026-10-12", endsOn: "2026-10-16", reason: "Rest" }, NOW);
    expect(fine.ok).toBe(true);
    const overlap = requestLeave(organizationId, users.NonTeaching, { type: "Casual", startsOn: "2026-10-14", endsOn: "2026-10-14", reason: "Errand" }, NOW);
    expect(overlap.ok).toBe(false);
    const after = load<NonTeachingPortal>(organizationId, users.NonTeaching);
    expect(after.leave.pending).toBe(5);
    expect(after.leave.remaining).toBe(15);
  });

  it("updates only the staff member's own tasks", () => {
    const { organizationId, users } = school("secondary");
    const portal = load<NonTeachingPortal>(organizationId, users.NonTeaching);
    const task = portal.tasks.find(item => item.status === "Open")!;
    expect(updateTask(organizationId, users.NonTeaching, task.taskId, "Done", NOW).ok).toBe(true);
    expect(updateTask(organizationId, users.NonTeaching, task.taskId, "Finished", NOW).ok).toBe(false);
    expect(updateTask(organizationId, users.Teaching, task.taskId, "Open", NOW).ok).toBe(false);
  });
});

describe("school portal link", () => {
  it("finds a school by the id in its portal link, and 404s otherwise", () => {
    const { organizationId } = school("secondary");
    const found = schoolInfo(organizationId);
    expect(found.ok && found.data.model).toBe("Secondary");
    const missing = schoolInfo("no-such-school");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.status).toBe(404);
  });

  it("rejects a session for a school the user doesn't belong to", () => {
    const { users } = school("university");
    const result = portalFor("no-such-school", users.Student, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });
});

describe("demo logins", () => {
  it("signs every demo person in with their email and the demo password", async () => {
    const logins = await prepareDemoLogins("university");
    expect(logins.map(login => login.schoolEmail)).toEqual([
      "chiamaka.obi@demouni.edu.ng", "adebayo.ogunleye@demouni.edu.ng", "ngozi.eze@demouni.edu.ng",
    ]);
    for (const login of logins) {
      const result = await portalLogin("demo-university", login.schoolEmail, DEMO_PASSWORD);
      expect(result.ok).toBe(true);
    }
    expect((await portalLogin("demo-university", logins[0].schoolEmail, "wrong")).ok).toBe(false);
    const secondary = await prepareDemoLogins("secondary");
    expect(secondary.map(login => login.schoolEmail)).toEqual([
      "tobi.adeyemi@demosec.sch.ng", "chinedu.okeke@demosec.sch.ng", "halima.sani@demosec.sch.ng",
    ]);
    expect((await portalLogin("demo-secondary", secondary[2].schoolEmail, DEMO_PASSWORD)).ok).toBe(true);
  }, 30_000);
});
