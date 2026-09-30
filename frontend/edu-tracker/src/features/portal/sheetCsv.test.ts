import { describe, expect, it } from "vitest";
import { schemeFor } from "../assessment/scheme";
import { importSheetCsv, parseCsv, sheetToCsv } from "./sheetCsv";
import type { ResultSheet } from "./types";

const sheet: ResultSheet = {
  offeringId: "o1", code: "CSC 201", title: "Computer Programming I", units: 3, levelKey: "200L", departmentName: "Computer Science",
  sessionName: "2026/2027", termName: "First Semester", lecturer: "Dr. A", model: "University", scheme: schemeFor("University"),
  status: "Partial", published: { test: "2026-10-01T00:00:00.000Z" }, submittedAt: null, updatedAt: null, locked: false,
  students: [
    { studentProfileId: "s1", fullName: "Obi, Chiamaka", matriculationNumber: "CSC/2025/001", scores: { test: 12 } },
    { studentProfileId: "s2", fullName: "Yusuf Abdulrahman", matriculationNumber: "CSC/2025/002", scores: { test: 9 } },
  ],
};

describe("result sheet CSV", () => {
  it("round-trips the template", () => {
    const csv = sheetToCsv(sheet);
    expect(csv.split("\r\n")[0]).toBe("Matric No,Full name,Test (15),Assignment (10),Project (5),Exam (70)");
    expect(parseCsv(csv)[1]).toEqual(["CSC/2025/001", "Obi, Chiamaka", "12", "", "", ""]);
    const result = importSheetCsv(csv, sheet);
    expect(result.problems).toEqual([]);
    expect(result.scores).toEqual({ s1: { test: 12 }, s2: { test: 9 } });
  });

  it("fills marks, skips blanks and reports problems by row", () => {
    const csv = [
      "matric no,name,Test,Assignment,Project,Exam",
      "csc/2025/001,,12,8,4,55",
      "CSC/2025/002,,10,11,,",
      "CSC/2025/999,,1,1,1,1",
    ].join("\n");
    const result = importSheetCsv(csv, sheet);
    expect(result.scores.s1).toEqual({ test: 12, assignment: 8, project: 4, exam: 55 });
    expect(result.scores.s2).toBeUndefined();
    expect(result.problems).toEqual([
      "Row 3 (CSC/2025/002): Test is already published and was left as 9.",
      "Row 3 (CSC/2025/002): Assignment is out of 10.",
      "Row 4: CSC/2025/999 isn't on this course's roster.",
    ]);
    expect(result.filled).toBe(4);
  });

  it("needs a matric column", () => {
    expect(importSheetCsv("Name,Test\nA,1", sheet).problems[0]).toMatch(/Matric No/);
  });
});

describe("Excel exports", () => {
  it("ignores the byte-order mark Excel adds", () => {
    expect(parseCsv("\uFEFFMatric No,Test\nX,1")[0][0]).toBe("Matric No");
  });
});
