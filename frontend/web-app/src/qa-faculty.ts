/** Disposable, browser-visible faculty fixture for the mock-only QA entry. */
import { fixtureId } from "./features/cohorts/fixtureId";
import { readSchoolSetup, saveSchoolSetup } from "./features/cohorts/schoolSetup";
import { approvePending, createAppointment, createInvitations, createStaff, facultyTestUtils, listRanks, listStaff, submitJoin } from "./mocks/faculty";

export const QA_FACULTY_ORG = "qa-only-faculty";
export const QA_FACULTY_ID = "qa-engineering";

export function seedFacultyQa(): void {
  const organizationId = QA_FACULTY_ORG;
  localStorage.setItem(`edutracker.organizationName.${organizationId}`, "QA Faculty School");
  if (!readSchoolSetup(organizationId)) saveSchoolSetup(organizationId, {
    model: "University",
    structure: {
      stages: ["100", "200", "300"].map(key => ({ key, name: `${key} Level`, shortName: `${key}L` })),
      units: [
        { key: QA_FACULTY_ID, parent: null, name: "Faculty of Engineering", kind: "Faculty" },
        { key: "qa-cpe", parent: QA_FACULTY_ID, name: "Computer Engineering", kind: "Department", code: "CPE" },
        { key: "qa-eee", parent: QA_FACULTY_ID, name: "Electrical Engineering", kind: "Department", code: "EEE" },
        { key: "qa-beng-cpe", parent: "qa-cpe", name: "B.Eng. Computer Engineering", kind: "Programme" },
      ],
      placements: [{ key: "qa-beng-cpe", unit: "qa-beng-cpe", arm: null, labels: ["100 Level", "200 Level", "300 Level"] }],
    },
  });
  const existing = listStaff(organizationId, {});
  if (existing.ok && existing.data.total > 0) {
    const dean = existing.data.items.find(member => member.staffNumber === "QA-001");
    if (dean && dean.userId !== "qa-dean-user") { dean.userId = "qa-dean-user"; facultyTestUtils(organizationId).persist(); }
    return;
  }
  const ranks = listRanks(organizationId);
  if (!ranks.ok) return;
  const rankId = ranks.data.find(rank => rank.name === "Senior Lecturer")?.rankId ?? ranks.data[0].rankId;
  const make = (fullName: string, staffNumber: string) => createStaff(organizationId, {
    fullName, staffNumber, title: "Dr.", kind: "Academic", unitId: "qa-cpe", unitKind: "Department",
    rankId, schoolEmail: `${staffNumber.toLowerCase()}@qa.example`, status: "Active", appointedOn: "2020-01-01",
    userId: staffNumber === "QA-001" ? "qa-dean-user" : null,
  });
  const dean = make("Adaeze Okafor", "QA-001");
  const lecturer = make("Tunde Bello", "QA-002");
  const secondHod = createStaff(organizationId, {
    fullName: "Chika Obi", staffNumber: "QA-003", title: "Dr.", kind: "Academic",
    unitId: "qa-eee", unitKind: "Department", rankId,
    schoolEmail: "qa-003@qa.example", status: "Active", appointedOn: "2020-01-01", userId: null,
  });
  if (!dean.ok || !lecturer.ok || !secondHod.ok) return;
  const startsOn = "2024-01-01T00:00:00.000Z";
  createAppointment(organizationId, { staffProfileId: dean.data.staffProfileId, post: "Dean", scopeId: QA_FACULTY_ID, scopeKind: "Faculty", startsOn });
  createAppointment(organizationId, { staffProfileId: lecturer.data.staffProfileId, post: "HOD", scopeId: "qa-cpe", scopeKind: "Department", startsOn });
  createAppointment(organizationId, { staffProfileId: secondHod.data.staffProfileId, post: "HOD", scopeId: "qa-eee", scopeKind: "Department", startsOn });
  const utils = facultyTestUtils(organizationId);
  utils.setSessionName("qa-entry", "2022/2023");
  utils.setSessionName("qa-current", "2025/2026");
  const invitations = createInvitations(organizationId, {
    kind: "Student", email: "sample.student@qa.example", programmeId: "qa-beng-cpe", entryStageId: "100",
    sessionId: "qa-entry", sessionName: "2022/2023", invitedBy: dean.data.staffProfileId,
  });
  if (!invitations.ok) return;
  const pending = submitJoin(invitations.data.created[0].token, {
    fullName: "Amara Nwosu", dateOfBirth: "2005-04-12", sex: "Female", phone: "08000000001",
    homeAddress: "QA test address", nextOfKinName: "QA Kin", nextOfKinPhone: "08000000002",
    photograph: "data:image/png;base64,iVBORw0KGgo=", password: "QA-password-only",
  });
  if (!pending.ok) return;
  const approval = approvePending(organizationId, pending.data.pendingRecordId, dean.data.staffProfileId);
  if (!approval.ok || approval.data.type !== "Student") return;
  const student = approval.data.student;
  student.currentCohortId = fixtureId(organizationId, "qa-current", fixtureId(organizationId, "stage", "300"), "qa-beng-cpe");
  utils.addStudentHistory({ studentProfileId: student.studentProfileId, sessionId: "qa-2022", sessionName: "2022/2023", stageName: "100 Level", outcome: "Promoted" });
  utils.addStudentHistory({ studentProfileId: student.studentProfileId, sessionId: "qa-2023", sessionName: "2023/2024", stageName: "200 Level", outcome: "Repeated" });
  utils.addStudentHistory({ studentProfileId: student.studentProfileId, sessionId: "qa-2024", sessionName: "2024/2025", stageName: "200 Level", outcome: "Promoted" });
  const course = utils.addCourse({ owningDepartmentId: "qa-cpe", code: "CPE 301", title: "Computer Networks" });
  const offering = utils.addOffering({ courseId: course.courseId, programmeId: "qa-beng-cpe", stageId: "300", requirement: "Core" });
  utils.assignCourse(course.courseId, "qa-current", lecturer.data.staffProfileId);
  utils.registerStudent(course.courseId, "qa-current", student.studentProfileId, offering.offeringId);
  utils.setAttendance("staff", lecturer.data.staffProfileId, course.courseId, "qa-current", 8, 10);
  utils.setAttendance("student", student.studentProfileId, course.courseId, "qa-current", 7, 8);
  utils.persist();
}
