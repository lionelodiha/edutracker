import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../../apiBase", () => ({ API_BASE: "http://localhost:3000" }));
import { addAcademicUnit, initialSchoolSetup, initializeSchool, readSchoolSetup, saveSchoolSetup } from "./schoolSetup";
import { cohortApi } from "./api";
import { resetCohortMocks } from "../../mocks/handlers";

afterEach(() => vi.unstubAllGlobals());
function university() {
  let setup = initialSchoolSetup("University");
  setup = addAcademicUnit(setup, "Faculty of Engineering", null, []);
  setup = addAcademicUnit(setup, "Computer Engineering", setup.structure.units[0].key, setup.structure.stages.map(s => s.key));
  return setup;
}

describe("institution setup and student records", () => {
  it("gives secondary schools stages and direct classes without faculties", () => {
    const setup = initialSchoolSetup("Secondary");
    expect(setup.structure.units).toEqual([]);
    expect(setup.structure.stages.map(s => s.name)).toEqual(["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"]);
    expect(setup.structure.placements[0].unit).toBeNull();
  });
  it("creates university faculties before departments and excludes faculty placements", () => {
    const setup = university();
    expect(setup.structure.units[1].parent).toBe(setup.structure.units[0].key);
    expect(setup.structure.placements).toHaveLength(1);
    expect(setup.structure.placements[0].unit).toBe(setup.structure.units[1].key);
    expect(setup.structure.placements[0].labels).toHaveLength(5);
  });
  it("allows secondary streams at selected stages only", () => {
    const initial = initialSchoolSetup("Secondary");
    const selected = initial.structure.stages.slice(3).map(s => s.key);
    const setup = addAcademicUnit(initial, "Science", null, selected);
    expect(setup.structure.placements[1].labels).toEqual(["", "", "", "SS 1", "SS 2", "SS 3"]);
    expect(initial.structure.units).toEqual([]);
  });
  it("rejects duplicate departments under the same faculty and missing parents", () => {
    const setup = university();
    expect(() => addAcademicUnit(setup, " computer engineering ", setup.structure.units[0].key, ["stage-0"])).toThrow("already exists");
    expect(() => addAcademicUnit(setup, "Civil", "missing", ["stage-0"])).toThrow("existing parent");
    expect(() => addAcademicUnit(initialSchoolSetup("Secondary"), "Science", null, [])).toThrow("Select at least");
  });
  it("remembers institution type without overwriting its saved structure", () => {
    const org = crypto.randomUUID();
    const setup = university();
    saveSchoolSetup(org, setup);
    initializeSchool(org, "University");
    expect(readSchoolSetup(org)).toEqual(setup);
  });
  it("generates actual configured departments with empty records, not invented sample students", async () => {
    const org = crypto.randomUUID();
    saveSchoolSetup(org, university());
    const groups = await cohortApi.list(org, { sessionId: "year-one" });
    expect(groups).toHaveLength(5);
    expect(groups.every(group => group.academicUnitName === "Computer Engineering" && group.studentCount === 0)).toBe(true);
    expect(await cohortApi.students(groups[0].id)).toEqual([]);
  });
  it("keeps student records across refreshes, naming edits and structure expansion", async () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    const org = crypto.randomUUID();
    const setup = university();
    saveSchoolSetup(org, setup);
    const [group] = await cohortApi.list(org, { sessionId: "year-one" });
    const student = await cohortApi.admitStudent(group.id, { fullName: "Test Student", admissionNumber: "ENG/001" });
    resetCohortMocks();
    await cohortApi.list(org, { sessionId: "year-one" });
    expect(await cohortApi.students(group.id)).toEqual([student]);
    setup.structure.placements[0].labels[0] = "Foundation Engineers";
    const expanded = addAcademicUnit(setup, "Civil Engineering", setup.structure.units[0].key, setup.structure.stages.map(s => s.key));
    saveSchoolSetup(org, expanded);
    const groups = await cohortApi.list(org, { sessionId: "year-one" });
    expect(groups).toHaveLength(10);
    expect(groups.find(c => c.id === group.id)).toMatchObject({ displayName: "Foundation Engineers", studentCount: 1 });
    expect(await cohortApi.students(group.id)).toEqual([student]);
    const [nextYear] = await cohortApi.list(org, { sessionId: "year-two" });
    expect(await cohortApi.students(nextYear.id)).toEqual([]);
    await expect(cohortApi.admitStudent(group.id, { fullName: "Duplicate", admissionNumber: "eng/001" })).rejects.toMatchObject({ status: 409 });
    await expect(cohortApi.admitStudent(group.id, { fullName: " ", admissionNumber: "002" })).rejects.toMatchObject({ status: 400 });
  });
});
