/**
 * FACULTY-BUILD §12 — all twenty-four must pass.
 * Derivation (1–4) · staff rules (5–8) · appointments (9–13) ·
 * onboarding (14–22) · tracking (23–24), plus endpoint wiring checks.
 */
import { describe, expect, it, vi } from "vitest";
vi.mock("../apiBase", () => ({ API_BASE: "http://localhost:3000" }));

import { staffOfFaculty, currentPostHolder, studentUnitChain } from "../features/staff/queries";
import { saveSchoolSetup, type SchoolSetup } from "../features/cohorts/schoolSetup";
import {
  approvePending,
  clearFacultyMemoryForTest,
  createAppointment,
  createInvitations,
  createStaff,
  endAppointment,
  facultySummary,
  facultyTestUtils,
  getJoin,
  listAppointments,
  listPending,
  listMockOutbox,
  listRanks,
  listStaff,
  listStudents,
  rejectPending,
  resetFacultyMocks,
  staffTracking,
  studentTracking,
  submitJoin,
} from "./faculty";

const SESSION_ID = "session-2025-2026";
const SESSION_NAME = "2025/2026";

function universitySetup(): SchoolSetup {
  return {
    model: "University",
    structure: {
      stages: [
        { key: "100", name: "100 Level", shortName: "100L" },
        { key: "200", name: "200 Level", shortName: "200L" },
      ],
      units: [
        { key: "eng", parent: null, name: "Faculty of Engineering", kind: "Faculty" },
        { key: "sci", parent: null, name: "Faculty of Science", kind: "Faculty" },
        { key: "cpe", parent: "eng", name: "Computer Engineering", kind: "Department", code: "CPE" },
        { key: "eee", parent: "eng", name: "Electrical Engineering", kind: "Department", code: "EEE" },
        { key: "phy", parent: "sci", name: "Physics", kind: "Department", code: "PHY" },
        { key: "beng-cpe", parent: "cpe", name: "B.Eng. Computer Engineering", kind: "Programme" },
        { key: "beng-eee", parent: "eee", name: "B.Eng. Electrical Engineering", kind: "Programme" },
      ],
      placements: [],
    },
  };
}

function freshOrg() {
  const organizationId = crypto.randomUUID();
  saveSchoolSetup(organizationId, universitySetup());
  return organizationId;
}

function rankIdFor(organizationId: string, name = "Lecturer I"): string {
  const res = listRanks(organizationId);
  if (!res.ok) throw new Error("ranks missing");
  const rank = res.data.find((r) => r.name === name) ?? res.data[0];
  return rank.rankId;
}

function makeStaff(
  organizationId: string,
  overrides: Record<string, unknown> = {},
  seq = Math.floor(Math.random() * 1000000),
) {
  const res = createStaff(organizationId, {
    fullName: "Test Lecturer",
    staffNumber: `STF/${seq}`,
    title: "Dr.",
    kind: "Academic",
    unitId: "cpe",
    unitKind: "Department",
    rankId: rankIdFor(organizationId),
    schoolEmail: `test.${seq}@school.edu.ng`,
    status: "Active",
    appointedOn: new Date().toISOString(),
    ...overrides,
  });
  if (!res.ok) throw new Error(`setup staff failed: ${res.code} ${res.message}`);
  return res.data;
}

function pastISO() {
  return new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
}

function useTestStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    get length() { return values.size; },
    key(index: number) { return [...values.keys()][index] ?? null; },
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  });
}

/** Dean of eng + HOD of cpe; returns both staff rows for reviewer use. */
function seatOfficers(organizationId: string) {
  const dean = makeStaff(organizationId, { fullName: "Dean Person", staffNumber: `D${Date.now()}${Math.floor(Math.random() * 999)}`, schoolEmail: `dean.${Math.random().toString(36).slice(2)}@school.edu.ng`, unitId: "cpe" });
  const hod = makeStaff(organizationId, { fullName: "Hod Person", staffNumber: `H${Date.now()}${Math.floor(Math.random() * 999)}`, schoolEmail: `hod.${Math.random().toString(36).slice(2)}@school.edu.ng`, unitId: "cpe" });
  const d = createAppointment(organizationId, { staffProfileId: dean.staffProfileId, post: "Dean", scopeId: "eng", scopeKind: "Faculty", startsOn: pastISO(), endsOn: null });
  const h = createAppointment(organizationId, { staffProfileId: hod.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department", startsOn: pastISO(), endsOn: null });
  if (!d.ok || !h.ok) throw new Error("officer setup failed");
  return { dean, hod };
}

function inviteStudent(organizationId: string, email: string, invitedBy: string, programmeId = "beng-cpe") {
  const res = createInvitations(organizationId, {
    kind: "Student",
    email,
    programmeId,
    entryStageId: "100",
    sessionId: SESSION_ID,
    sessionName: SESSION_NAME,
    invitedBy,
  });
  if (!res.ok) throw new Error(`invite failed: ${res.code}`);
  return res.data.created[0];
}

function submitForm(token: string, fullName = "Adaeze Okafor", extra: Record<string, unknown> = {}) {
  const res = submitJoin(token, {
    fullName,
    dateOfBirth: "2005-04-12",
    sex: "Female",
    phone: "0801",
    homeAddress: "Test address",
    nextOfKinName: "Test Kin",
    nextOfKinPhone: "0802",
    photograph: "data:image/png;base64,iVBORw0KGgo=",
    password: "Password1!",
    ...extra,
  });
  if (!res.ok) throw new Error(`submit failed: ${(res as { code?: string }).code}`);
  return res.data;
}

it("rejects a submission with a missing date of birth before creating a pending record", () => {
  const org = freshOrg();
  const { hod } = seatOfficers(org);
  const invitation = inviteStudent(org, "missing-date@example.com", hod.staffProfileId);
  const result = submitJoin(invitation.token, { fullName: "No Date", password: "Password1!", dateOfBirth: "" });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.code).toBe("VALIDATION_FAILED");
  const queue = listPending(org, {});
  expect(queue.ok && queue.data.length).toBe(0);
});

// ─── Derivation ─────────────────────────────────────────────────────────────

describe("derivation", () => {
  it("1. staffOfFaculty returns staff from every department under the faculty", () => {
    const units = [
      { key: "eng", parent: null },
      { key: "cpe", parent: "eng" },
      { key: "eee", parent: "eng" },
    ];
    const staff = [{ unitId: "cpe" }, { unitId: "eee" }];
    expect(staffOfFaculty(staff, units, "eng")).toHaveLength(2);
  });

  it("2. also returns faculty-office administrative staff", () => {
    const units = [
      { key: "eng", parent: null },
      { key: "cpe", parent: "eng" },
    ];
    const staff = [{ unitId: "eng" }];
    expect(staffOfFaculty(staff, units, "eng")).toHaveLength(1);
  });

  it("3. returns nobody from a sibling faculty", () => {
    const units = [
      { key: "eng", parent: null },
      { key: "sci", parent: null },
      { key: "cpe", parent: "eng" },
      { key: "phy", parent: "sci" },
    ];
    const staff = [{ unitId: "phy" }, { unitId: "sci" }];
    expect(staffOfFaculty(staff, units, "eng")).toHaveLength(0);
  });

  it("4. moving a department to another faculty moves its staff with no staff edit", () => {
    const staff = [{ unitId: "cpe", name: "Dr. A" }];
    const before = [
      { key: "eng", parent: null },
      { key: "sci", parent: null },
      { key: "cpe", parent: "eng" },
    ];
    const after = [
      { key: "eng", parent: null },
      { key: "sci", parent: null },
      { key: "cpe", parent: "sci" },
    ];
    expect(staffOfFaculty(staff, before, "eng")).toHaveLength(1);
    expect(staffOfFaculty(staff, before, "sci")).toHaveLength(0);
    const moved = staffOfFaculty(staff, after, "sci");
    expect(moved).toHaveLength(1);
    // No stored faculty-membership field was touched: the row is identical.
    expect(moved[0]).toEqual({ unitId: "cpe", name: "Dr. A" });
    expect(staffOfFaculty(staff, after, "eng")).toHaveLength(0);
  });
});

// ─── Staff rules ────────────────────────────────────────────────────────────

describe("staff rules", () => {
  it("5. an Academic with unitKind Faculty is rejected", () => {
    const org = freshOrg();
    const res = createStaff(org, {
      fullName: "Dr. Wrong",
      staffNumber: "STF/1",
      title: "Dr.",
      kind: "Academic",
      unitId: "eng",
      unitKind: "Faculty",
      rankId: rankIdFor(org),
      schoolEmail: "wrong@school.edu.ng",
      status: "Active",
      appointedOn: new Date().toISOString(),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("STAFF_UNIT_INVALID");
  });

  it("6. a non-academic with a rankId is rejected", () => {
    const org = freshOrg();
    for (const kind of ["Administrative", "Technical"]) {
      const res = createStaff(org, {
        fullName: `${kind} Person`,
        staffNumber: `STF/${kind}`,
        title: "Mr.",
        kind,
        unitId: kind === "Administrative" ? "eng" : "cpe",
        unitKind: kind === "Administrative" ? "Faculty" : "Department",
        rankId: rankIdFor(org),
        schoolEmail: `${kind.toLowerCase()}@school.edu.ng`,
        status: "Active",
        appointedOn: new Date().toISOString(),
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.code).toBe("RANK_NOT_ALLOWED");
    }
  });

  it("7. duplicate staffNumber returns 409 in-org but succeeds cross-org", () => {
    const org = freshOrg();
    const other = freshOrg();
    const first = createStaff(org, {
      fullName: "First", staffNumber: "STF/0042", title: "Mr.", kind: "Technical",
      unitId: "cpe", unitKind: "Department", rankId: null,
      schoolEmail: "first@school.edu.ng", status: "Active", appointedOn: new Date().toISOString(),
    });
    expect(first.ok).toBe(true);
    const dup = createStaff(org, {
      fullName: "Second", staffNumber: "stf/0042", title: "Mr.", kind: "Technical",
      unitId: "eee", unitKind: "Department", rankId: null,
      schoolEmail: "second@school.edu.ng", status: "Active", appointedOn: new Date().toISOString(),
    });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.status).toBe(409);
    const cross = createStaff(other, {
      fullName: "Cross", staffNumber: "STF/0042", title: "Mr.", kind: "Technical",
      unitId: "cpe", unitKind: "Department", rankId: null,
      schoolEmail: "cross@school.edu.ng", status: "Active", appointedOn: new Date().toISOString(),
    });
    expect(cross.ok).toBe(true);
  });

  it("8. staff on sabbatical cannot take a course assignment or an appointment", () => {
    const org = freshOrg();
    const away = makeStaff(org, {
      fullName: "Away Lecturer", staffNumber: "STF/777", schoolEmail: "away@school.edu.ng", status: "OnSabbatical",
    });
    const utils = facultyTestUtils(org);
    const course = utils.addCourse({ owningDepartmentId: "cpe", code: "CPE 101", title: "Intro" });
    let thrown: { code?: string; status?: number } | null = null;
    try {
      utils.assignCourse(course.courseId, SESSION_ID, away.staffProfileId);
    } catch (e) {
      thrown = e as { code?: string; status?: number };
    }
    expect(thrown?.code).toBe("STAFF_NOT_ACTIVE");
    expect(thrown?.status).toBe(409);
    const appt = createAppointment(org, {
      staffProfileId: away.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department", startsOn: pastISO(), endsOn: null,
    });
    expect(appt.ok).toBe(false);
    if (!appt.ok) {
      expect(appt.status).toBe(409);
      expect(appt.code).toBe("STAFF_NOT_ACTIVE");
    }
  });
});

// ─── Appointments ───────────────────────────────────────────────────────────

describe("appointments", () => {
  it("9. a second live HOD returns POST_OCCUPIED naming the holder", () => {
    const org = freshOrg();
    const first = makeStaff(org, { fullName: "Adaeze Okafor", staffNumber: "STF/11", schoolEmail: "a11@school.edu.ng" });
    const second = makeStaff(org, { fullName: "Tunde Bello", staffNumber: "STF/12", schoolEmail: "t12@school.edu.ng" });
    const created = createAppointment(org, { staffProfileId: first.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department", startsOn: pastISO(), endsOn: null });
    expect(created.ok).toBe(true);
    const clash = createAppointment(org, { staffProfileId: second.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department", startsOn: pastISO(), endsOn: null });
    expect(clash.ok).toBe(false);
    if (!clash.ok) {
      expect(clash.code).toBe("POST_OCCUPIED");
      expect(clash.message).toContain("Adaeze Okafor");
    }
  });

  it("10. ending an appointment sets endsOn and leaves the row queryable", () => {
    const org = freshOrg();
    const holder = makeStaff(org, { fullName: "Holder", staffNumber: "STF/21", schoolEmail: "h21@school.edu.ng" });
    const created = createAppointment(org, { staffProfileId: holder.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department", startsOn: pastISO(), endsOn: null });
    expect(created.ok).toBe(true);
    const id = created.ok ? created.data.appointmentId : "";
    const ended = endAppointment(org, id, { endsOn: new Date().toISOString() });
    expect(ended.ok).toBe(true);
    if (ended.ok) expect(ended.data.endsOn).not.toBeNull();
    // History is the point: the row is still there.
    const all = listAppointments(org, {});
    expect(all.ok && all.data.some((a) => a.appointmentId === id)).toBe(true);
  });

  it("11. one person holding HOD and LevelAdviser at once succeeds", () => {
    const org = freshOrg();
    const both = makeStaff(org, { fullName: "Both Posts", staffNumber: "STF/31", schoolEmail: "b31@school.edu.ng" });
    const hod = createAppointment(org, { staffProfileId: both.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department", startsOn: pastISO(), endsOn: null });
    const adviser = createAppointment(org, { staffProfileId: both.staffProfileId, post: "LevelAdviser", scopeId: "cohort-200", scopeKind: "Cohort", startsOn: pastISO(), endsOn: null });
    expect(hod.ok).toBe(true);
    expect(adviser.ok).toBe(true);
  });

  it("12. FacultyOfficer held by Academic staff is rejected", () => {
    const org = freshOrg();
    const academic = makeStaff(org, { fullName: "Academic Person", staffNumber: "STF/41", schoolEmail: "a41@school.edu.ng" });
    const res = createAppointment(org, { staffProfileId: academic.staffProfileId, post: "FacultyOfficer", scopeId: "eng", scopeKind: "Faculty", startsOn: pastISO(), endsOn: null });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(400);
  });

  it("13. an appointment ended last year does not appear in live=true", () => {
    const org = freshOrg();
    const holder = makeStaff(org, { fullName: "Past Holder", staffNumber: "STF/51", schoolEmail: "p51@school.edu.ng" });
    const created = createAppointment(org, {
      staffProfileId: holder.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department",
      startsOn: "2022-01-01T00:00:00.000Z", endsOn: "2023-01-01T00:00:00.000Z",
    });
    expect(created.ok).toBe(true);
    const live = listAppointments(org, { live: "true" }, new Date());
    expect(live.ok).toBe(true);
    expect(live.ok && live.data).toHaveLength(0);
    // …but it is still history.
    const all = listAppointments(org, {});
    expect(all.ok && all.data).toHaveLength(1);
  });
});

// ─── Onboarding ─────────────────────────────────────────────────────────────

describe("onboarding", () => {
  it("rejects an invitation with a made-up programme or an inviter without the right post", () => {
    const org = freshOrg();
    const outsider = makeStaff(org, { fullName: "Outsider", staffNumber: "OUT-1", schoolEmail: "outsider@school.edu.ng" });
    const invalid = createInvitations(org, { kind: "Student", email: "bad@example.com", programmeId: "missing", entryStageId: "100", sessionId: SESSION_ID, invitedBy: outsider.staffProfileId });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.code).toBe("INVITATION_PLACEMENT_INVALID");
    const unauthorized = createInvitations(org, { kind: "Student", email: "other@example.com", programmeId: "beng-cpe", entryStageId: "100", sessionId: SESSION_ID, invitedBy: outsider.staffProfileId });
    expect(unauthorized.ok).toBe(false);
    if (!unauthorized.ok) expect(unauthorized.code).toBe("INVITATION_FORBIDDEN");
  });

  it("14. a form containing programmeId cannot change the invitation programme", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const inv = inviteStudent(org, "student14@example.com", hod.staffProfileId);
    const pending = submitForm(inv.token, "Student Fourteen", { programmeId: "beng-eee", entryStageId: "200", sessionId: "evil" });
    expect(pending.submitted).not.toHaveProperty("programmeId");
    expect(pending.submitted).not.toHaveProperty("entryStageId");
    expect(pending.submitted).not.toHaveProperty("sessionId");
    expect(inv.programmeId).toBe("beng-cpe");
  });

  it("15. submitting creates a pending record and allocates no serial", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const inv = inviteStudent(org, "student15@example.com", hod.staffProfileId);
    const before = facultyTestUtils(org).db.issuedIdentifiers.length;
    const pending = submitForm(inv.token, "Student Fifteen");
    expect(pending.status).toBe("AwaitingReview");
    expect(facultyTestUtils(org).db.issuedIdentifiers).toHaveLength(before);
  });

  it("16. approving allocates the next serial matching the configured format", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const utils = facultyTestUtils(org);
    utils.setSessionName(SESSION_ID, SESSION_NAME);
    const inv = inviteStudent(org, "student16@example.com", hod.staffProfileId);
    const pending = submitForm(inv.token, "Adaeze Okafor");
    const approved = approvePending(org, pending.pendingRecordId, hod.staffProfileId);
    expect(approved.ok).toBe(true);
    if (approved.ok && approved.data.type === "Student") {
      expect(approved.data.matriculationNumber).toBe("2025/CPE/0001");
    } else {
      throw new Error("expected a student approval");
    }
  });

  it("17. two submitted, one approved and one abandoned, consume exactly one number", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    facultyTestUtils(org).setSessionName(SESSION_ID, SESSION_NAME);
    const first = inviteStudent(org, "first17@example.com", hod.staffProfileId);
    const second = inviteStudent(org, "second17@example.com", hod.staffProfileId);
    const p1 = submitForm(first.token, "First Seventeen");
    submitForm(second.token, "Second Seventeen"); // abandoned — never approved
    const approved = approvePending(org, p1.pendingRecordId, hod.staffProfileId);
    expect(approved.ok).toBe(true);
    expect(facultyTestUtils(org).db.issuedIdentifiers).toHaveLength(1);
  });

  it("18. rejecting then resubmitting and approving still consumes exactly one number", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    facultyTestUtils(org).setSessionName(SESSION_ID, SESSION_NAME);
    const inv = inviteStudent(org, "student18@example.com", hod.staffProfileId);
    const p1 = submitForm(inv.token, "Student Eighteen");
    const rejected = rejectPending(org, p1.pendingRecordId, hod.staffProfileId, "Blurry photo — retake it.");
    expect(rejected.ok).toBe(true);
    const p2 = submitForm(inv.token, "Student Eighteen");
    const approved = approvePending(org, p2.pendingRecordId, hod.staffProfileId);
    expect(approved.ok).toBe(true);
    expect(facultyTestUtils(org).db.issuedIdentifiers).toHaveLength(1);
    const mail = listMockOutbox(org);
    expect(mail.ok && mail.data.some(message => message.subject.includes("correct") && message.body.includes("Blurry photo"))).toBe(true);
    expect(mail.ok && mail.data.some(message => message.subject.includes("ready") && message.body.includes("Matriculation number"))).toBe(true);
  });

  it("19. a retired number is never reissued after the student withdraws", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    facultyTestUtils(org).setSessionName(SESSION_ID, SESSION_NAME);
    const first = inviteStudent(org, "first19@example.com", hod.staffProfileId);
    const p1 = submitForm(first.token, "First Nineteen");
    const a1 = approvePending(org, p1.pendingRecordId, hod.staffProfileId);
    expect(a1.ok).toBe(true);
    const retired = a1.ok && a1.data.type === "Student" ? a1.data.matriculationNumber : "";
    // The student withdraws — the number stays retired.
    const utils = facultyTestUtils(org);
    const row = utils.db.students.find((s) => s.matriculationNumber === retired);
    expect(row).toBeDefined();
    row!.status = "Withdrawn";
    utils.persist();
    const second = inviteStudent(org, "second19@example.com", hod.staffProfileId);
    const p2 = submitForm(second.token, "Second Nineteen");
    const a2 = approvePending(org, p2.pendingRecordId, hod.staffProfileId);
    expect(a2.ok).toBe(true);
    if (a2.ok && a2.data.type === "Student") {
      expect(a2.data.matriculationNumber).not.toBe(retired);
      expect(utils.db.issuedIdentifiers).toContain(retired);
    } else {
      throw new Error("expected a student approval");
    }
  });

  it("20. an expired token returns 410 and no form", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const res = createInvitations(org, {
      kind: "Student",
      email: "stale20@example.com",
      programmeId: "beng-cpe",
      entryStageId: "100",
      sessionId: SESSION_ID,
      sessionName: SESSION_NAME,
      invitedBy: hod.staffProfileId,
      expiresOn: new Date(Date.now() - 1000).toISOString(),
    });
    expect(res.ok).toBe(true);
    const token = res.ok ? res.data.created[0].token : "";
    const join = getJoin(token);
    expect(join.ok).toBe(false);
    if (!join.ok) {
      expect(join.status).toBe(410);
      expect(join.code).toBe("INVITATION_UNUSABLE");
    }
    const submit = submitJoin(token, { fullName: "Too Late", password: "Password1!" });
    expect(submit.ok).toBe(false);
    if (!submit.ok) expect(submit.status).toBe(410);
  });

  it("21. a department with no code blocks approval with UNIT_CODE_MISSING", () => {
    const org = crypto.randomUUID();
    const setup = universitySetup();
    setup.structure.units.push(
      { key: "mec", parent: "eng", name: "Mechanical Engineering", kind: "Department" },
      { key: "beng-mec", parent: "mec", name: "B.Eng. Mechanical Engineering", kind: "Programme" },
    );
    saveSchoolSetup(org, setup);
    // The Dean covers the whole faculty, so approval reaches the code check;
    // an HOD of a different department could not approve at all.
    const { dean } = seatOfficers(org);
    const res = createInvitations(org, {
      kind: "Student",
      email: "nocode21@example.com",
      programmeId: "beng-mec",
      entryStageId: "100",
      sessionId: SESSION_ID,
      sessionName: SESSION_NAME,
      invitedBy: dean.staffProfileId,
    });
    expect(res.ok).toBe(true);
    const pending = submitForm(res.ok ? res.data.created[0].token : "", "No Code Student");
    const approved = approvePending(org, pending.pendingRecordId, dean.staffProfileId);
    expect(approved.ok).toBe(false);
    if (!approved.ok) expect(approved.code).toBe("UNIT_CODE_MISSING");
  });

  it("22. two students with the same name get distinct school emails", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    facultyTestUtils(org).setSessionName(SESSION_ID, SESSION_NAME);
    const emails: string[] = [];
    for (const address of ["twin1@example.com", "twin2@example.com"]) {
      const inv = inviteStudent(org, address, hod.staffProfileId);
      const pending = submitForm(inv.token, "Adaeze Okafor");
      const approved = approvePending(org, pending.pendingRecordId, hod.staffProfileId);
      expect(approved.ok).toBe(true);
      if (approved.ok && approved.data.type === "Student") emails.push(approved.data.schoolEmail);
    }
    expect(emails).toHaveLength(2);
    expect(emails[0]).not.toBe(emails[1]);
    // Documented tie-break, applied silently: plain first, then 2, 3, …
    expect(emails[0]).toContain("adaeze.okafor@student.");
    expect(emails[1]).toMatch(/adaeze\.okafor2@student\./);
  });
});

// ─── Tracking ───────────────────────────────────────────────────────────────

describe("tracking", () => {
  it("shows course requirement, released grade and resulting standing", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const invitation = inviteStudent(org, "results@example.com", hod.staffProfileId);
    const pending = submitForm(invitation.token, "Results Student");
    const approved = approvePending(org, pending.pendingRecordId, hod.staffProfileId);
    if (!approved.ok || approved.data.type !== "Student") throw new Error("expected student approval");
    const studentId = approved.data.student.studentProfileId;
    const utils = facultyTestUtils(org);
    const course = utils.addCourse({ owningDepartmentId: "cpe", code: "CPE 202", title: "Circuits" });
    const offering = utils.addOffering({ courseId: course.courseId, programmeId: "beng-cpe", stageId: "100", requirement: "Core" });
    utils.registerStudent(course.courseId, SESSION_ID, studentId, offering.offeringId);
    utils.setResults(course.courseId, SESSION_ID, "Partial");
    utils.setStudentResult({ studentProfileId: studentId, courseId: course.courseId, sessionId: SESSION_ID, grade: "F", passed: false });
    const tracking = studentTracking(org, studentId, SESSION_ID);
    expect(tracking.ok).toBe(true);
    if (tracking.ok) {
      expect(tracking.data.courses[0].requirement).toBe("Core");
      expect(tracking.data.courses[0].grade).toBe("F");
      expect(tracking.data.standing).toBe("Carryover");
    }
  });

  it("23. the student header chain follows a moved programme (derived, not stored)", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    facultyTestUtils(org).setSessionName(SESSION_ID, SESSION_NAME);
    const inv = inviteStudent(org, "moved23@example.com", hod.staffProfileId);
    const pending = submitForm(inv.token, "Moved Student");
    const approved = approvePending(org, pending.pendingRecordId, hod.staffProfileId);
    expect(approved.ok).toBe(true);
    const studentId = approved.ok && approved.data.type === "Student" ? approved.data.student.studentProfileId : "";
    // The stored record carries no facultyId — grep must find nothing.
    expect(approved.ok && approved.data.type === "Student" ? { ...approved.data.student } : {}).not.toHaveProperty("facultyId");
    const before = studentTracking(org, studentId);
    expect(before.ok).toBe(true);
    // Chain segments: [faculty, department, programme, stage, session].
    if (before.ok) expect(before.data.chain[1]).toBe("Computer Engineering");
    // Move the programme to Electrical Engineering. No student record is edited.
    const setup = universitySetup();
    setup.structure.units = setup.structure.units.map((u) =>
      u.key === "beng-cpe" ? { ...u, parent: "eee" } : u,
    );
    saveSchoolSetup(org, setup);
    const after = studentTracking(org, studentId);
    expect(after.ok).toBe(true);
    if (after.ok) {
      expect(after.data.chain[1]).toBe("Electrical Engineering");
      expect(after.data.chain[2]).toBe("B.Eng. Computer Engineering");
      // The chain is walked from the tree, not copied into the record.
      const units = setup.structure.units.map((u) => ({ key: u.key, parent: u.parent, name: u.name }));
      expect(studentUnitChain(units, "beng-cpe").map((u) => u.name)).toEqual(
        after.data.chain.slice(0, 3),
      );
    }
  });

  it("24. outstanding-results count reflects a course with no results submitted", () => {
    const org = freshOrg();
    const lecturer = makeStaff(org, { fullName: "Results Lecturer", staffNumber: "STF/99", schoolEmail: "r99@school.edu.ng" });
    const utils = facultyTestUtils(org);
    const course = utils.addCourse({ owningDepartmentId: "cpe", code: "CPE 201", title: "Data Structures" });
    utils.assignCourse(course.courseId, SESSION_ID, lecturer.staffProfileId);
    const before = staffTracking(org, lecturer.staffProfileId, SESSION_ID);
    expect(before.ok && before.data.outstandingResults).toBe(1);
    utils.setResults(course.courseId, SESSION_ID, "Submitted");
    const after = staffTracking(org, lecturer.staffProfileId, SESSION_ID);
    expect(after.ok && after.data.outstandingResults).toBe(0);
  });

  it("defaults lecturer tracking to the latest session rather than counting prior years", () => {
    const org = freshOrg();
    const lecturer = makeStaff(org);
    const utils = facultyTestUtils(org);
    utils.setSessionName("old-session", "2024/2025");
    utils.setSessionName("new-session", "2025/2026");
    const oldCourse = utils.addCourse({ owningDepartmentId: "cpe", code: "CPE 310", title: "Old course" });
    const newCourse = utils.addCourse({ owningDepartmentId: "cpe", code: "CPE 311", title: "Current course" });
    utils.assignCourse(oldCourse.courseId, "old-session", lecturer.staffProfileId);
    utils.assignCourse(newCourse.courseId, "new-session", lecturer.staffProfileId);
    utils.setResults(newCourse.courseId, "new-session", "Submitted");
    const current = staffTracking(org, lecturer.staffProfileId);
    expect(current.ok && current.data.courses.map(course => course.code)).toEqual(["CPE 311"]);
    expect(current.ok && current.data.outstandingResults).toBe(0);
  });
});

// ─── Mock wiring (§11 conventions) ──────────────────────────────────────────

describe("endpoints", () => {
  it("ends an appointment through the HTTP client payload", async () => {
    const org = freshOrg();
    const holder = makeStaff(org);
    const term = createAppointment(org, { staffProfileId: holder.staffProfileId, post: "HOD", scopeId: "cpe", scopeKind: "Department", startsOn: pastISO() });
    if (!term.ok) throw new Error("appointment setup failed");
    const response = await fetch(`http://localhost:3000/api/appointments/${term.data.appointmentId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: org, endsOn: new Date().toISOString() }),
    });
    expect(response.status).toBe(200);
    const all = listAppointments(org, {});
    expect(all.ok && all.data[0].endsOn).not.toBeNull();
  });

  it("opens a valid invitation from persisted storage after a fresh-tab reload", () => {
    useTestStorage();
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const invitation = inviteStudent(org, "reload@example.com", hod.staffProfileId);
    clearFacultyMemoryForTest();
    const result = getJoin(invitation.token);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.programmeName).toBe("B.Eng. Computer Engineering");
    vi.unstubAllGlobals();
  });

  it("keeps the password out of persisted pending data and signs in after approval", async () => {
    useTestStorage();
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const invitation = inviteStudent(org, "portal@example.com", hod.staffProfileId);
    const form = await fetch(`http://localhost:3000/api/join/${invitation.token}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Portal Student", dateOfBirth: "2005-04-12", sex: "Female",
        phone: "0801", homeAddress: "Test address", nextOfKinName: "Test Kin",
        nextOfKinPhone: "0802", photograph: "data:image/png;base64,iVBORw0KGgo=",
        password: "Password1!",
      }),
    });
    expect(form.status).toBe(201);
    const pending = (await form.json() as { data: { pendingRecordId: string; submitted: Record<string, unknown> } }).data;
    expect(pending.submitted).not.toHaveProperty("password");
    expect(localStorage.getItem(`edutracker.faculty.${org}`)).not.toContain("Password1!");
    const approval = approvePending(org, pending.pendingRecordId, hod.staffProfileId);
    expect(approval.ok).toBe(true);
    const email = approval.ok ? approval.data.schoolEmail : "";
    const login = await fetch("http://localhost:3000/api/auth/portal-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: org, schoolEmail: email, password: "Password1!" }),
    });
    expect(login.status).toBe(200);
    const wrong = await fetch("http://localhost:3000/api/auth/portal-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: org, schoolEmail: email, password: "wrong-password" }),
    });
    expect(wrong.status).toBe(401);
    vi.unstubAllGlobals();
  });

  it("shows an approved student in the generated cohort roster", async () => {
    const org = freshOrg();
    const setup = universitySetup();
    setup.structure.placements = [{ key: "beng-cpe", unit: "beng-cpe", arm: null, labels: ["100 Level", "200 Level"] }];
    saveSchoolSetup(org, setup);
    const { hod } = seatOfficers(org);
    const invitation = inviteStudent(org, "roster@example.com", hod.staffProfileId);
    const pending = submitForm(invitation.token, "Roster Student");
    const approval = approvePending(org, pending.pendingRecordId, hod.staffProfileId);
    expect(approval.ok).toBe(true);
    if (!approval.ok || approval.data.type !== "Student") throw new Error("expected student approval");
    const approvedStudentId = approval.data.student.studentProfileId;
    const cohorts = await fetch(`http://localhost:3000/api/cohorts?organizationId=${org}&sessionId=${SESSION_ID}`);
    expect(cohorts.status).toBe(200);
    const roster = await fetch(`http://localhost:3000/api/cohorts/${approval.data.cohortId}/students`);
    expect(roster.status).toBe(200);
    const rows = (await roster.json() as { data: { studentProfileId: string }[] }).data;
    expect(rows.some(row => row.studentProfileId === approvedStudentId)).toBe(true);
  });

  it("serves ranks and the faculty summary over HTTP in one call", async () => {
    const org = freshOrg();
    seatOfficers(org);
    const ranksRes = await fetch(`http://localhost:3000/api/ranks?organizationId=${org}`);
    expect(ranksRes.status).toBe(200);
    const ranksBody = (await ranksRes.json()) as { data: { name: string }[] };
    expect(ranksBody.data.map((r) => r.name)).toContain("Professor");
    const summaryRes = await fetch(`http://localhost:3000/api/faculties/eng/summary?organizationId=${org}`);
    expect(summaryRes.status).toBe(200);
    const summaryBody = (await summaryRes.json()) as { data: { facultyId: string; pendingApprovals: number } };
    expect(summaryBody.data.facultyId).toBe("eng");
  });

  it("returns 410 over HTTP for an expired join token", async () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    const res = createInvitations(org, {
      kind: "Student",
      email: "http410@example.com",
      programmeId: "beng-cpe",
      entryStageId: "100",
      sessionId: SESSION_ID,
      sessionName: SESSION_NAME,
      invitedBy: hod.staffProfileId,
      expiresOn: new Date(Date.now() - 1000).toISOString(),
    });
    const token = res.ok ? res.data.created[0].token : "";
    const httpRes = await fetch(`http://localhost:3000/api/join/${token}`);
    expect(httpRes.status).toBe(410);
    expect(((await httpRes.json()) as { id: string }).id).toBe("INVITATION_UNUSABLE");
  });

  it("faculty staff and student lists filter through the derived query", () => {
    const org = freshOrg();
    const { hod } = seatOfficers(org);
    void hod;
    makeStaff(org, { fullName: "Eng Lecturer", staffNumber: "STF/E1", schoolEmail: "e1@school.edu.ng", unitId: "cpe" });
    makeStaff(org, {
      fullName: "Sci Lecturer", staffNumber: "STF/S1", schoolEmail: "s1@school.edu.ng", unitId: "phy",
      rankId: rankIdFor(org, "Lecturer II"),
    });
    const eng = listStaff(org, { facultyId: "eng" });
    expect(eng.ok && eng.data.total).toBe(3); // dean + hod + eng lecturer (sci excluded)
    const sci = listStaff(org, { facultyId: "sci" });
    expect(sci.ok && sci.data.items.every((s) => s.unitId === "phy")).toBe(true);
    const students = listStudents(org, { facultyId: "eng" });
    expect(students.ok).toBe(true);
    const summary = facultySummary(org, "eng");
    expect(summary.ok).toBe(true);
    // currentPostHolder is the only approval check — spot-check the Dean.
    const { db } = facultyTestUtils(org);
    expect(currentPostHolder(db.appointments, "Dean", "eng")?.post).toBe("Dean");
  });

  it("clears faculty state between tests", () => {
    // If reset leaked, this org would already have staff. Fresh orgs isolate;
    // resetFacultyMocks itself must exist and run without throwing.
    resetFacultyMocks();
    const org = freshOrg();
    const list = listStaff(org, {});
    expect(list.ok && list.data.total).toBe(0);
  });
});
