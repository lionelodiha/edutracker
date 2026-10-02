/**
 * School invite links: one link per person, the person fills the form,
 * an admin approves and places them, and they can sign in to the portal.
 */
import { describe, expect, it } from "vitest";
import { readAcademics } from "../features/academics/store";
import { readSchoolSetup } from "../features/cohorts/schoolSetup";
import { makeCredential, type PasswordCredential } from "../features/onboarding/passwords";
import type { JoinRole } from "../features/onboarding/joinLinks";
import type { NonTeachingPortal, StudentPortal, TeacherPortal } from "../features/portal/types";
import { portalLogin } from "./faculty";
import { approveJoinRequest, createJoinLink, declineJoinRequest, joinBoard, revokeJoinLink, submitJoinRequest, viewJoinLink } from "./join";
import { portalFor } from "./portal";
import { seedDemoSchool } from "./portalDemo";

const NOW = new Date("2026-10-05T09:00:00.000Z");
let counter = 0;
let credential: PasswordCredential;

async function school() {
  counter += 1;
  const organizationId = `join-test-${counter}`;
  seedDemoSchool("university", organizationId, NOW);
  credential ??= await makeCredential("Welcome@123");
  const csc = readSchoolSetup(organizationId)!.structure.units.find(unit => unit.name === "Computer Science")!;
  return { organizationId, csc };
}

function link(organizationId: string, role: JoinRole, sentTo = "Ada") {
  const result = createJoinLink(organizationId, { role, sentTo }, NOW);
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

const base = (departmentId: string) => ({
  fullName: "Chiamaka Obi", email: "chiamaka@example.com", phone: "08031234567", dateOfBirth: "2006-03-14", sex: "Female",
  homeAddress: "12 Allen Avenue, Ikeja", nextOfKinName: "Ngozi Obi", nextOfKinPhone: "08039876543", departmentId, password: "Welcome@123",
});

describe("invite links", () => {
  it("gives every link its own random token", async () => {
    const { organizationId } = await school();
    const tokens = new Set(Array.from({ length: 20 }, (_, i) => link(organizationId, "Student", `Person ${i}`).token));
    expect(tokens.size).toBe(20);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it("shows the form only while the link is open, and only once", async () => {
    const { organizationId, csc } = await school();
    const made = link(organizationId, "Student");
    const view = viewJoinLink(made.token, NOW);
    expect(view.ok && view.data.departments.some(item => item.departmentId === csc.key)).toBe(true);

    const sent = submitJoinRequest(made.token, { ...base(csc.key), level: "100L" }, credential, NOW);
    expect(sent.ok).toBe(true);
    const again = submitJoinRequest(made.token, { ...base(csc.key), level: "100L", email: "other@example.com" }, credential, NOW);
    expect(again.ok ? "" : again.code).toBe("JOIN_LINK_UNUSABLE");
    const after = viewJoinLink(made.token, NOW);
    expect(after.ok && after.data.request?.status).toBe("Pending");
    expect(after.ok && after.data.departments).toEqual([]);
  });

  it("stops working after it expires or is cancelled", async () => {
    const { organizationId, csc } = await school();
    const old = link(organizationId, "Student");
    const later = new Date(NOW.getTime() + 15 * 86_400_000);
    const late = submitJoinRequest(old.token, { ...base(csc.key), level: "100L" }, credential, later);
    expect(late.ok ? "" : late.code).toBe("JOIN_LINK_UNUSABLE");

    const cancelled = link(organizationId, "Teaching");
    expect(revokeJoinLink(organizationId, cancelled.linkId).ok).toBe(true);
    const closed = viewJoinLink(cancelled.token, NOW);
    expect(closed.ok && closed.data.status).toBe("Revoked");
    expect(viewJoinLink("not-a-real-token", NOW).ok).toBe(false);
  });

  it("checks the form against the link's role", async () => {
    const { organizationId, csc } = await school();
    const student = link(organizationId, "Student");
    const noLevel = submitJoinRequest(student.token, base(csc.key), credential, NOW);
    expect(noLevel.ok ? "" : noLevel.message).toMatch(/level/);
    const teacher = link(organizationId, "Teaching");
    const noSubjects = submitJoinRequest(teacher.token, { ...base(csc.key), highestQualification: "MSc Computer Science" }, credential, NOW);
    expect(noSubjects.ok ? "" : noSubjects.message).toMatch(/subjects/);
  });
});

describe("approval", () => {
  it("places a student in the class the admin picks and lets them sign in", async () => {
    const { organizationId, csc } = await school();
    const made = link(organizationId, "Student");
    const sent = submitJoinRequest(made.token, { ...base(csc.key), level: "100L" }, credential, NOW);
    if (!sent.ok) throw new Error(sent.message);

    // They asked for 100L; the admin places them in 200L.
    const approved = approveJoinRequest(organizationId, sent.data.requestId, { departmentId: csc.key, level: "200L", decidedBy: "Registrar" }, NOW);
    if (!approved.ok) throw new Error(approved.message);
    expect(approved.data.outcome?.schoolEmail).toBe("chiamaka.obi@student.school.edu.ng");
    expect(approved.data.outcome?.placement).toBe("Computer Science · 200L");

    const login = await portalLogin(organizationId, approved.data.outcome!.schoolEmail, "Welcome@123");
    if (!login.ok) throw new Error(login.message);
    const portal = portalFor(organizationId, login.data.userId, NOW);
    if (!portal.ok) throw new Error(portal.message);
    const student = portal.data as StudentPortal;
    expect(student.role).toBe("Student");
    expect(student.profile.level).toBe("200L");
    expect(student.profile.departmentName).toBe("Computer Science");
    expect(student.courses.length).toBeGreaterThan(0);

    const view = viewJoinLink(made.token, NOW);
    expect(view.ok && view.data.request?.outcome?.number).toBe(approved.data.outcome?.number);
  });

  it("gives a teacher the courses the admin assigns", async () => {
    const { organizationId, csc } = await school();
    const made = link(organizationId, "Teaching");
    const sent = submitJoinRequest(made.token, { ...base(csc.key), fullName: "Emeka Nwosu", email: "emeka@example.com", title: "Dr.", highestQualification: "PhD Computer Science", subjects: "Databases, networks" }, credential, NOW);
    if (!sent.ok) throw new Error(sent.message);
    const board = joinBoard(organizationId, NOW);
    if (!board.ok) throw new Error(board.message);
    const picks = board.data.offerings.filter(item => item.departmentId === csc.key).slice(0, 2);

    const approved = approveJoinRequest(organizationId, sent.data.requestId, { departmentId: csc.key, offeringIds: picks.map(item => item.offeringId), decidedBy: "HOD" }, NOW);
    if (!approved.ok) throw new Error(approved.message);
    const offerings = readAcademics(organizationId).offerings.filter(item => picks.some(pick => pick.offeringId === item.offeringId));
    expect(new Set(offerings.map(item => item.lecturerStaffProfileId)).size).toBe(1);

    const login = await portalLogin(organizationId, approved.data.outcome!.schoolEmail, "Welcome@123");
    if (!login.ok) throw new Error(login.message);
    const portal = portalFor(organizationId, login.data.userId, NOW);
    if (!portal.ok) throw new Error(portal.message);
    expect((portal.data as TeacherPortal).classes.map(item => item.offeringId).sort()).toEqual(picks.map(item => item.offeringId).sort());
  });

  it("opens the non-teaching portal for non-teaching staff", async () => {
    const { organizationId, csc } = await school();
    const made = link(organizationId, "NonTeaching");
    const sent = submitJoinRequest(made.token, { ...base(csc.key), fullName: "Musa Bello", email: "musa@example.com", highestQualification: "HND Accounting", jobTitle: "Bursary clerk" }, credential, NOW);
    if (!sent.ok) throw new Error(sent.message);
    const approved = approveJoinRequest(organizationId, sent.data.requestId, { departmentId: csc.key, decidedBy: "Registrar" }, NOW);
    if (!approved.ok) throw new Error(approved.message);
    const login = await portalLogin(organizationId, approved.data.outcome!.schoolEmail, "Welcome@123");
    if (!login.ok) throw new Error(login.message);
    const portal = portalFor(organizationId, login.data.userId, NOW);
    expect(portal.ok && (portal.data as NonTeachingPortal).role).toBe("NonTeaching");
  });

  it("needs a reason to decline, and the person sees it", async () => {
    const { organizationId, csc } = await school();
    const made = link(organizationId, "Student");
    const sent = submitJoinRequest(made.token, { ...base(csc.key), level: "100L" }, credential, NOW);
    if (!sent.ok) throw new Error(sent.message);
    expect(declineJoinRequest(organizationId, sent.data.requestId, { reason: " " }, NOW).ok).toBe(false);
    expect(declineJoinRequest(organizationId, sent.data.requestId, { reason: "Use your admission letter name." }, NOW).ok).toBe(true);
    const view = viewJoinLink(made.token, NOW);
    expect(view.ok && view.data.request).toMatchObject({ status: "Declined", declineReason: "Use your admission letter name." });
    expect(approveJoinRequest(organizationId, sent.data.requestId, { departmentId: csc.key, level: "100L" }, NOW).ok).toBe(false);
  });
});
