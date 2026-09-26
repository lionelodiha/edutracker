import { describe, expect, it, vi } from "vitest";
vi.mock("../../apiBase", () => ({ API_BASE: "http://localhost:3000" }));
import { academicApi } from "./api";
import { resetAcademicsForTest } from "./store";

describe("academic API through MSW", () => {
  it("creates a school, starts a session, and closes a term", async () => {
    const org = `academic-api-${crypto.randomUUID()}`;
    resetAcademicsForTest(org);
    const empty = await academicApi.structure(org);
    expect(empty.setup).toBeNull();
    await academicApi.initialize(org, "University");
    const faculty = await academicApi.createFaculty(org, { name: "Engineering", code: "ENG", description: "", deanStaffProfileId: null });
    expect(faculty.key).toBeTruthy();
    const prepared = await academicApi.prepare(org, {
      fromSessionId: null, name: "2026/2027", startYear: 2026, endYear: 2027,
      startsOn: "2026-09-01", endsOn: "2027-07-31", termNames: ["First semester", "Second semester"],
      copy: { courseOfferings: true, lecturerAssignments: true, classArms: true },
    });
    expect(prepared.session.status).toBe("Upcoming");
    expect((await academicApi.start(org, prepared.session.sessionId)).status).toBe("Current");
    expect((await academicApi.closeTerm(org, prepared.session.terms[0].termId)).terms.map(term => term.status)).toEqual(["Closed", "Current"]);
    expect((await academicApi.sessions(org)).currentSessionId).toBe(prepared.session.sessionId);
  });
});
