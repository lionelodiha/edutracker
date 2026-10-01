import { describe, expect, it, vi } from "vitest";
vi.mock("../../apiBase", () => ({ API_BASE: "http://localhost:3000" }));
import { http, HttpResponse } from "msw";
import { cohortApi } from "./api";
import { seedSchool, structures } from "../../mocks/data";
import { cohortHandlers, resetCohortMocks } from "../../mocks/handlers";
import { server } from "../../mocks/server";
import { saveGroupSettings } from "./settings";

const organizationId = "8b30b524-c905-410f-9848-ae49ccdd2106";
const otherOrg = "2d0d7c72-6739-4130-bf47-bd09d3f9fa43";
const sessionId = "c6737679-36c8-4368-995d-bd2b36a09a77";
const list = () => cohortApi.list(organizationId, { sessionId });

describe("structure-generated school data", () => {
  it.each(["Primary", "Secondary", "University"] as const)("generates every configured %s placement across stages", model => {
    const structure = structures[model];
    const seed = seedSchool(organizationId, sessionId, structure);
    expect(seed.cohorts).toHaveLength(model === "Primary" ? 6 : 15);
    for (const placement of structure.placements) {
      for (const label of placement.labels.filter(Boolean)) {
        expect(seed.cohorts.filter(c => c.displayName === label)).toHaveLength(1);
      }
    }
    expect(new Set(seed.cohorts.map(c => c.id)).size).toBe(seed.cohorts.length);
    expect(seed.cohorts.every(c => c.studentCount === seed.studentsByCohort[c.id].length)).toBe(true);
    expect(seed.cohorts.every(c => /^[a-f0-9-]{36}$/.test(c.id))).toBe(true);
  });

  it("preserves school-controlled labels regardless of stage, unit or arm", () => {
    const custom = structuredClone(structures.Secondary);
    custom.placements[2].labels[4] = "The Innovators";
    const seed = seedSchool(organizationId, sessionId, custom);
    expect(seed.cohorts.find(c => c.displayName === "The Innovators")).toMatchObject({
      stageName: "SS 2", academicUnitName: "Science", arm: "H",
    });
    expect(structures.Secondary.placements[2].labels[4]).toBe("SS 2H");
  });

  it("generates stable scoped IDs and unique admission identities", () => {
    const seed = seedSchool(organizationId, sessionId);
    expect(seedSchool(organizationId, sessionId)).toEqual(seed);
    const foreign = seedSchool(otherOrg, sessionId);
    const ids = new Set(seed.cohorts.map(c => c.id));
    expect(foreign.cohorts.every(c => !ids.has(c.id))).toBe(true);
    const students = Object.values(seed.studentsByCohort).flat();
    expect(new Set(students.map(s => s.studentProfileId)).size).toBe(students.length);
    expect(new Set(students.map(s => s.admissionNumber)).size).toBe(students.length);
  });
});

describe("frontend API with MSW", () => {
  it("accepts actual caller organization IDs and returns ordered, isolated stages", async () => {
    const school = await cohortApi.stages(organizationId);
    expect(school.map(s => s.ordinal)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(school.every(s => s.organizationId === organizationId)).toBe(true);
    const foreign = await cohortApi.stages(otherOrg);
    expect(foreign.every(s => !school.some(original => original.id === s.id))).toBe(true);
    expect((await list()).every(c => c.organizationId === organizationId)).toBe(true);
  });

  it("uses the configured sample institution model for any organization", async () => {
    const org = "configured-university";
    saveGroupSettings(org, { singular: "Level", plural: "Levels", model: "University" });
    expect((await cohortApi.stages(org)).map(s => s.shortName)).toEqual(["100L", "200L", "300L", "400L", "500L"]);
    expect(await cohortApi.list(org, { sessionId })).toHaveLength(15);
  });

  it("combines session, stage and unit filters", async () => {
    const all = await list();
    const target = all.find(c => c.academicUnitName === "Science")!;
    expect(await cohortApi.list(organizationId, { sessionId, stageId: target.stageId, academicUnitId: target.academicUnitId! })).toEqual([target]);
    expect(await cohortApi.list(organizationId, { sessionId, academicUnitId: "foreign-unit" })).toEqual([]);
  });

  it("isolates sessions, includes them in unfiltered reads, and does not reseed writes", async () => {
    const first = await list();
    const second = await cohortApi.list(organizationId, { sessionId: "next-session" });
    expect(second.every(c => c.sessionId === "next-session" && !first.some(a => a.id === c.id))).toBe(true);
    await cohortApi.addStudents(first[0].id, ["test-student"]);
    expect((await list())[0].studentCount).toBe(first[0].studentCount + 1);
    expect(await cohortApi.list(organizationId)).toHaveLength(30);
    expect((await cohortApi.get(second[0].id)).studentCount).toBe(second[0].studentCount);
  });

  it.each(["http://localhost:3187", "http://127.0.0.1:3000"])("matches the configured API origin %s", async origin => {
    const response = await fetch(`${origin}/api/cohorts?organizationId=${organizationId}&sessionId=${sessionId}`);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toHaveLength(15);
  });

  it("has no create-group handler or client method", () => {
    expect("create" in cohortApi).toBe(false);
    expect(cohortHandlers.some(handler => handler.info.method === "POST" && handler.info.path === "*/api/cohorts")).toBe(false);
  });

  it("returns stored names and full roster records", async () => {
    const seed = seedSchool(organizationId, sessionId);
    await list();
    const target = seed.cohorts.find(c => c.displayName === "SS 2H")!;
    expect(await cohortApi.get(target.id)).toEqual(target);
    expect(await cohortApi.students(target.id)).toEqual(seed.studentsByCohort[target.id]);
  });

  it("preserves identity, deduplicates additions and updates list and detail counts", async () => {
    const [target, source] = await list();
    const student = (await cohortApi.students(source.id))[3];
    expect(await cohortApi.addStudents(target.id, [student.studentProfileId, student.studentProfileId])).toBe(1);
    expect(await cohortApi.addStudents(target.id, [student.studentProfileId])).toBe(0);
    expect((await cohortApi.students(target.id)).filter(s => s.studentProfileId === student.studentProfileId)).toEqual([student]);
    expect((await cohortApi.get(target.id)).studentCount).toBe(target.studentCount + 1);
    expect((await list()).find(c => c.id === target.id)?.studentCount).toBe(target.studentCount + 1);
    await cohortApi.removeStudent(target.id, student.studentProfileId);
    expect((await cohortApi.get(target.id)).studentCount).toBe(target.studentCount);
    await expect(cohortApi.removeStudent(target.id, student.studentProfileId)).rejects.toMatchObject({ status: 404 });
  });

  it("rejects empty and cross-organization membership changes atomically", async () => {
    const [target] = await list();
    const [foreign] = await cohortApi.list(otherOrg, { sessionId });
    const student = (await cohortApi.students(foreign.id))[0];
    await expect(cohortApi.addStudents(target.id, [])).rejects.toMatchObject({ status: 400 });
    await expect(cohortApi.addStudents(target.id, ["new-local", student.studentProfileId])).rejects.toMatchObject({ status: 400 });
    expect((await cohortApi.get(target.id)).studentCount).toBe(target.studentCount);
  });

  it("retains a new student's identity after removing and adding again", async () => {
    const [target] = await list();
    await cohortApi.addStudents(target.id, ["new-student"]);
    const before = (await cohortApi.students(target.id)).find(s => s.studentProfileId === "new-student");
    await cohortApi.removeStudent(target.id, "new-student");
    await cohortApi.addStudents(target.id, ["new-student"]);
    expect((await cohortApi.students(target.id)).find(s => s.studentProfileId === "new-student")).toEqual(before);
  });

  it("restores deterministic data after reset, supporting saved detail links", async () => {
    const [target] = await list();
    await cohortApi.addStudents(target.id, ["reset-me"]);
    resetCohortMocks();
    await list(); // Same initialization used before opening a saved detail link.
    expect(await cohortApi.get(target.id)).toEqual(target);
  });

  it("validates organization input and reports missing resources", async () => {
    await expect(cohortApi.list("")).rejects.toMatchObject({ status: 400 });
    await expect(cohortApi.stages(" ")).rejects.toMatchObject({ status: 400 });
    await expect(cohortApi.get("missing")).rejects.toMatchObject({ status: 404 });
    await expect(cohortApi.students("missing")).rejects.toMatchObject({ status: 404 });
    await expect(cohortApi.addStudents("missing", ["student"])).rejects.toMatchObject({ status: 404 });
    await expect(cohortApi.removeStudent("missing", "student")).rejects.toMatchObject({ status: 404 });
  });

  it.each([401, 403])("surfaces authorization failure %s from a real API envelope", async status => {
    server.use(http.get("*/api/cohorts", () => HttpResponse.json({ id: "ACCESS_DENIED", title: "Access denied.", details: [] }, { status })));
    await expect(list()).rejects.toMatchObject({ status, message: "Access denied." });
  });

  it("handles network, non-JSON and malformed success responses", async () => {
    server.use(http.get("*/api/cohorts", () => HttpResponse.error()));
    await expect(list()).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
    server.use(http.get("*/api/cohorts", () => new HttpResponse("Unavailable", { status: 503 })));
    await expect(list()).rejects.toMatchObject({ status: 503 });
    server.use(http.get("*/api/cohorts", () => HttpResponse.json([])));
    await expect(list()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});
