/**
 * The result sheet as a CSV template: download it, fill it in a
 * spreadsheet, upload it back. Students are matched on matriculation
 * (or admission) number, never on name.
 */
import { checkScore, type Scores } from "../assessment/scheme";
import type { ResultSheet } from "./types";

const quote = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export function sheetToCsv(sheet: ResultSheet): string {
  const header = ["Matric No", "Full name", ...sheet.scheme.map(component => `${component.label} (${component.max})`)];
  const rows = sheet.students.map(student => [
    student.matriculationNumber, student.fullName,
    ...sheet.scheme.map(component => {
      const value = student.scores[component.key];
      return typeof value === "number" ? String(value) : "";
    }),
  ]);
  return [header, ...rows].map(row => row.map(quote).join(",")).join("\r\n") + "\r\n";
}

export function templateFileName(sheet: ResultSheet): string {
  return `${sheet.code}-${sheet.sessionName}-${sheet.termName}-results.csv`.replace(/[^A-Za-z0-9._-]+/g, "-");
}

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, ""); // Excel adds a byte-order mark
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(cells => cells.some(cell => cell.trim()));
}

const normal = (value: string) => value.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");

export type CsvImport = { scores: Record<string, Scores>; filled: number; problems: string[] };

/**
 * Read an uploaded CSV into marks keyed by student. Blank cells leave a mark
 * unchanged. Anything that can't be used is reported, not guessed at.
 */
export function importSheetCsv(text: string, sheet: ResultSheet): CsvImport {
  const rows = parseCsv(text);
  const problems: string[] = [];
  const scores: Record<string, Scores> = {};
  let filled = 0;
  if (rows.length < 2) return { scores, filled, problems: ["The file has no rows of marks."] };

  const header = rows[0].map(normal);
  const idColumn = header.findIndex(cell => /matric|admission|regno|registration|studentid/.test(cell));
  if (idColumn < 0) return { scores, filled, problems: ['Add a "Matric No" column so each row can be matched to a student.'] };
  const columns = sheet.scheme.map(component => ({
    component,
    index: header.findIndex(cell => cell === normal(component.label) || cell === normal(component.key)),
  }));
  const missing = columns.filter(column => column.index < 0).map(column => column.component.label);
  if (missing.length === sheet.scheme.length) return { scores, filled, problems: [`No mark columns found. Expected: ${sheet.scheme.map(component => component.label).join(", ")}.`] };

  const byNumber = new Map(sheet.students.map(student => [student.matriculationNumber.trim().toLowerCase(), student]));
  const seen = new Set<string>();
  rows.slice(1).forEach((cells, offset) => {
    const line = offset + 2;
    const id = (cells[idColumn] ?? "").trim();
    if (!id) { problems.push(`Row ${line}: no matric number.`); return; }
    const student = byNumber.get(id.toLowerCase());
    if (!student) { problems.push(`Row ${line}: ${id} isn't on this course's roster.`); return; }
    if (seen.has(student.studentProfileId)) { problems.push(`Row ${line}: ${id} appears more than once; the first row was used.`); return; }
    seen.add(student.studentProfileId);
    for (const { component, index } of columns) {
      if (index < 0) continue;
      const raw = (cells[index] ?? "").trim();
      if (!raw) continue;
      const mark = Number(raw);
      const problem = checkScore(component, mark);
      if (problem) { problems.push(`Row ${line} (${id}): ${problem}`); continue; }
      if (sheet.published[component.key] && student.scores[component.key] !== mark) {
        problems.push(`Row ${line} (${id}): ${component.label} is already published and was left as ${student.scores[component.key] ?? "blank"}.`);
        continue;
      }
      scores[student.studentProfileId] = { ...(scores[student.studentProfileId] ?? {}), [component.key]: mark };
      filled += 1;
    }
  });
  if (missing.length) problems.unshift(`No column for ${missing.join(", ")}; those marks were left as they were.`);
  return { scores, filled, problems };
}
