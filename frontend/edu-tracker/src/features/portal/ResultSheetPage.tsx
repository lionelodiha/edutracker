/**
 * The result sheet: one row per student, one column per assessment.
 *
 * Marks are typed in or uploaded from the CSV template and saved as a
 * draft. Publishing releases in-course components to students; submitting
 * releases everything, locks the sheet and sends it to the department.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { caLabel, checkScore, gradeFor, isComplete, sumOf, type Scores } from "../assessment/scheme";
import { Skeleton } from "../academics/ui";
import { portalApi } from "./api";
import { PageTitle, Pill } from "./components";
import { relative, SHEET_TONE, sheetLabel, useTeacher } from "./helpers";
import { importSheetCsv, sheetToCsv, templateFileName } from "./sheetCsv";
import type { ResultSheet } from "./types";

type Draft = Record<string, Record<string, string>>;

const toDraft = (sheet: ResultSheet): Draft => Object.fromEntries(sheet.students.map(student => [
  student.studentProfileId,
  Object.fromEntries(sheet.scheme.map(component => [component.key, typeof student.scores[component.key] === "number" ? String(student.scores[component.key]) : ""])),
]));

const parse = (value: string): number | null => (value.trim() === "" ? null : Number(value));

export default function ResultSheetPage() {
  const { offeringId = "" } = useParams();
  const { session, base, now, refresh, notify } = useTeacher();
  const [sheet, setSheet] = useState<ResultSheet | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "publish" | "submit">("");
  const [dialog, setDialog] = useState<"" | "publish" | "submit">("");
  const [importReport, setImportReport] = useState<{ filled: number; problems: string[] } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const next = await portalApi.sheet(session, offeringId);
      setSheet(next); setDraft(toDraft(next)); setLoadError("");
    } catch (cause) { setLoadError(cause instanceof Error ? cause.message : "Couldn't open this sheet."); }
  }, [session, offeringId]);
  useEffect(() => { void load(); }, [load]);

  const saved = useMemo(() => (sheet ? toDraft(sheet) : {}), [sheet]);
  const changed = useMemo(() => {
    const result: Record<string, Scores> = {};
    for (const [id, marks] of Object.entries(draft)) for (const [key, value] of Object.entries(marks)) {
      if (value !== saved[id]?.[key]) result[id] = { ...(result[id] ?? {}), [key]: parse(value) };
    }
    return result;
  }, [draft, saved]);
  const dirty = Object.keys(changed).length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loadError) return <section className="dz-card ac-empty" role="alert"><h2>Couldn't open this sheet</h2><p>{loadError}</p><div className="ac-actions"><Link className="dz-btn-outline" to={`${base}/results`}>Back to result upload</Link></div></section>;
  if (!sheet) return <Skeleton variant="department" />;

  const university = sheet.model === "University";
  const scheme = sheet.scheme;
  const numeric = (id: string): Scores => Object.fromEntries(scheme.map(component => [component.key, parse(draft[id]?.[component.key] ?? "")]));
  const errorOf = (key: string, value: string) => {
    if (!value.trim()) return null;
    return checkScore(scheme.find(component => component.key === key)!, Number(value));
  };
  const invalid = sheet.students.some(student => scheme.some(component => errorOf(component.key, draft[student.studentProfileId]?.[component.key] ?? "")));
  const caComponents = scheme.filter(component => component.part === "CA");
  const complete = sheet.students.filter(student => isComplete(scheme, numeric(student.studentProfileId)));
  const readOnly = sheet.locked;

  function setMark(studentId: string, key: string, value: string) {
    setDraft(current => ({ ...current, [studentId]: { ...current[studentId], [key]: value.replace(/[^0-9.]/g, "") } }));
  }

  async function save(quiet = false): Promise<boolean> {
    if (!dirty) return true;
    if (invalid) { notify("Fix the highlighted marks first.", "error"); return false; }
    setBusy("save");
    try {
      const next = await portalApi.saveScores(session, offeringId, changed);
      setSheet(next); setDraft(toDraft(next));
      if (!quiet) notify("Draft saved. Students can't see it until you publish.");
      void refresh();
      return true;
    } catch (cause) { notify(cause instanceof Error ? cause.message : "Couldn't save.", "error"); return false; }
    finally { setBusy(""); }
  }

  function download() {
    const blob = new Blob([sheetToCsv({ ...sheet!, students: sheet!.students.map(student => ({ ...student, scores: numeric(student.studentProfileId) })) })], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = templateFileName(sheet!);
    link.click();
    URL.revokeObjectURL(url);
  }

  async function upload(file: File) {
    const result = importSheetCsv(await file.text(), { ...sheet!, students: sheet!.students.map(student => ({ ...student, scores: numeric(student.studentProfileId) })) });
    setDraft(current => {
      const next = structuredClone(current);
      for (const [id, marks] of Object.entries(result.scores)) for (const [key, value] of Object.entries(marks)) next[id][key] = String(value);
      return next;
    });
    setImportReport({ filled: result.filled, problems: result.problems });
    if (fileInput.current) fileInput.current.value = "";
  }

  // Enter and arrow keys move down and up the column, like a spreadsheet.
  function onKey(event: React.KeyboardEvent<HTMLInputElement>, row: number, column: number) {
    const step = event.key === "Enter" || event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    document.querySelector<HTMLInputElement>(`[data-cell="${row + step}-${column}"]`)?.focus();
  }

  const columnAverage = (key: string) => {
    const values = sheet.students.map(student => parse(draft[student.studentProfileId]?.[key] ?? "")).filter((value): value is number => value !== null && Number.isFinite(value));
    return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : "—";
  };

  return <div className="ac-page">
    <nav className="ac-breadcrumb" aria-label="Breadcrumb"><Link to={`${base}/results`}>Result upload</Link><span className="ac-crumb-sep">/</span><span aria-current="page">{sheet.code}</span></nav>
    <PageTitle title={<>{sheet.title} <Pill tone={SHEET_TONE[sheet.status]}>{sheetLabel(sheet.status)}</Pill></>}
      meta={[university ? sheet.code : null, `${sheet.departmentName} ${sheet.levelKey}`, `${sheet.sessionName} · ${sheet.termName}`, `${sheet.students.length} students`,
        sheet.updatedAt ? `saved ${relative(sheet.updatedAt, now)}` : null].filter(Boolean).join(" · ")}
      actions={<>
        <button className="dz-btn-outline" onClick={download}>Download template</button>
        {!readOnly && <>
          <button className="dz-btn-outline" onClick={() => fileInput.current?.click()}>Upload CSV</button>
          <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          <button className="dz-btn-outline" disabled={!dirty || busy !== ""} onClick={() => void save()}>{busy === "save" ? "Saving…" : "Save draft"}</button>
          <button className="dz-btn-outline" disabled={busy !== "" || caComponents.every(component => sheet.published[component.key])} onClick={() => setDialog("publish")}>Publish {caLabel(sheet.model)}…</button>
          <button className="dz-btn-green" disabled={busy !== ""} onClick={() => setDialog("submit")}>Submit results…</button>
        </>}
      </>} />

    {sheet.status === "Submitted" && <p className="ac-notice ac-notice-muted" role="status">Submitted {relative(sheet.submittedAt, now)}. The department has these results and students can see their grades. The sheet is locked; ask your head of department if a mark needs correcting.</p>}
    {sheet.locked && sheet.status !== "Submitted" && <p className="ac-notice ac-notice-warn" role="status">This term is closed, so the sheet is read-only.</p>}
    {!readOnly && dirty && <p className="ac-notice ac-notice-warn" role="status"><span>You have unsaved marks.</span><button onClick={() => void save()}>Save draft</button></p>}
    {importReport && <div className={`ac-notice ${importReport.problems.length ? "ac-notice-warn" : "ac-notice-muted"} pt-import`} role="status">
      <div>
        <strong>{importReport.filled ? `Filled ${importReport.filled} mark${importReport.filled === 1 ? "" : "s"} from the file.` : "No marks were filled from the file."}</strong>
        {importReport.filled > 0 && " Check them, then save the draft."}
        {importReport.problems.length > 0 && <ul>{importReport.problems.slice(0, 8).map(problem => <li key={problem}>{problem}</li>)}{importReport.problems.length > 8 && <li>…and {importReport.problems.length - 8} more.</li>}</ul>}
      </div>
      <button onClick={() => setImportReport(null)}>Dismiss</button>
    </div>}

    <section className="dz-card pt-sheet-card">
      <div className="ac-table-wrap pt-sheet-wrap">
        <table className="ac-table pt-sheet">
          <thead><tr>
            <th className="pt-col-n">#</th>
            <th className="pt-col-matric">{university ? "Matric No" : "Adm. No"}</th>
            <th className="pt-name">Name</th>
            {scheme.map(component => <th key={component.key} className="num">
              {component.label}<small>/{component.max}</small>
              {sheet.published[component.key] && <span className="pt-published" title={`Published ${relative(sheet.published[component.key], now)}`}>Published</span>}
            </th>)}
            <th className="num">{caLabel(sheet.model)}<small>/30</small></th>
            <th className="num">Total<small>/100</small></th>
            <th>Grade</th>
          </tr></thead>
          <tbody>{sheet.students.map((student, row) => {
            const marks = numeric(student.studentProfileId);
            const done = isComplete(scheme, marks) && scheme.every(component => !errorOf(component.key, draft[student.studentProfileId]?.[component.key] ?? ""));
            const total = done ? sumOf(scheme, marks) : null;
            const band = total !== null ? gradeFor(sheet.model, total) : null;
            return <tr key={student.studentProfileId}>
              <td className="pt-col-n">{row + 1}</td>
              <td className="ac-mono pt-col-matric">{student.matriculationNumber}</td>
              <td className="pt-name">{student.fullName}<small className="pt-name-matric">{student.matriculationNumber}</small></td>
              {scheme.map((component, column) => {
                const value = draft[student.studentProfileId]?.[component.key] ?? "";
                const problem = errorOf(component.key, value);
                const locked = readOnly || !!sheet.published[component.key];
                return <td key={component.key} className="num">
                  {locked ? <span className="pt-cell-static">{value || "—"}</span> :
                    <input className={`pt-cell${problem ? " is-invalid" : ""}${value !== (saved[student.studentProfileId]?.[component.key] ?? "") ? " is-changed" : ""}`}
                      inputMode="decimal" value={value} data-cell={`${row}-${column}`}
                      aria-label={`${student.fullName}, ${component.label} out of ${component.max}`} aria-invalid={!!problem} title={problem ?? undefined}
                      onChange={event => setMark(student.studentProfileId, component.key, event.target.value)}
                      onKeyDown={event => onKey(event, row, column)} />}
                </td>;
              })}
              <td className="num">{sumOf(scheme, marks, "CA") || "—"}</td>
              <td className="num"><strong>{total ?? "—"}</strong></td>
              <td>{band ? <Pill tone={band.pass ? (band.grade.startsWith("A") ? "green" : "violet") : "red"}>{band.grade}</Pill> : ""}</td>
            </tr>;
          })}</tbody>
          <tfoot><tr>
            <td className="pt-col-n" /><td className="pt-col-matric" /><td className="pt-name">Average</td>
            {scheme.map(component => <td key={component.key} className="num">{columnAverage(component.key)}</td>)}
            <td /><td className="num">{complete.length ? (complete.reduce((sum, student) => sum + sumOf(scheme, numeric(student.studentProfileId)), 0) / complete.length).toFixed(1) : "—"}</td>
            <td>{complete.length}/{sheet.students.length} complete</td>
          </tr></tfoot>
        </table>
      </div>
    </section>

    {dialog === "publish" && <PublishDialog sheet={sheet} numeric={numeric} busy={busy === "publish"} onClose={() => setDialog("")}
      onPublish={async keys => {
        if (!(await save(true))) return;
        setBusy("publish");
        try {
          const next = await portalApi.publish(session, offeringId, keys);
          setSheet(next); setDraft(toDraft(next)); setDialog("");
          notify(`Published. ${next.students.length} students have been notified.`);
          void refresh();
        } catch (cause) { notify(cause instanceof Error ? cause.message : "Couldn't publish.", "error"); }
        finally { setBusy(""); }
      }} />}
    {dialog === "submit" && <SubmitDialog sheet={sheet} complete={complete.length} numeric={numeric} busy={busy === "submit"} onClose={() => setDialog("")}
      onSubmit={async () => {
        if (!(await save(true))) return;
        setBusy("submit");
        try {
          const next = await portalApi.submit(session, offeringId);
          setSheet(next); setDraft(toDraft(next)); setDialog("");
          notify(`Results submitted to ${next.departmentName}. Students can now see their grades.`);
          void refresh();
        } catch (cause) { notify(cause instanceof Error ? cause.message : "Couldn't submit.", "error"); }
        finally { setBusy(""); }
      }} />}
  </div>;
}

function PublishDialog({ sheet, numeric, busy, onClose, onPublish }: { sheet: ResultSheet; numeric: (id: string) => Scores; busy: boolean; onClose: () => void; onPublish: (keys: string[]) => void }) {
  const options = sheet.scheme.filter(component => component.part === "CA" && !sheet.published[component.key]).map(component => ({
    component, missing: sheet.students.filter(student => typeof numeric(student.studentProfileId)[component.key] !== "number").length,
  }));
  const [chosen, setChosen] = useState<string[]>(options.filter(option => !option.missing).map(option => option.component.key));
  return <Modal titleId="publish-title" onClose={onClose} maxWidth={480}>
    <h2 id="publish-title" className="dz-modal-title">Publish {caLabel(sheet.model)} marks</h2>
    <p className="dz-modal-sub">Students see published marks straight away and are notified. Published marks can't be changed.</p>
    <div className="pt-checks">{options.map(({ component, missing }) => (
      <label key={component.key} className={missing ? "is-disabled" : ""}>
        <input type="checkbox" disabled={missing > 0} checked={chosen.includes(component.key)}
          onChange={event => setChosen(current => event.target.checked ? [...current, component.key] : current.filter(key => key !== component.key))} />
        <span><strong>{component.label}</strong> <small>/{component.max}</small><small className="pt-check-sub">{missing ? `${missing} student${missing === 1 ? "" : "s"} still need a mark` : "Every student has a mark"}</small></span>
      </label>
    ))}</div>
    <p className="ac-hint">The exam is released when you submit the final result.</p>
    <div className="dz-form-actions">
      <button className="dz-btn-outline" onClick={onClose}>Cancel</button>
      <button className="dz-btn-green" disabled={busy || !chosen.length} onClick={() => onPublish(chosen)}>{busy ? "Publishing…" : `Publish ${chosen.length || ""}`.trim()}</button>
    </div>
  </Modal>;
}

function SubmitDialog({ sheet, complete, numeric, busy, onClose, onSubmit }: { sheet: ResultSheet; complete: number; numeric: (id: string) => Scores; busy: boolean; onClose: () => void; onSubmit: () => void }) {
  const ready = complete === sheet.students.length && sheet.students.length > 0;
  const totals = sheet.students.map(student => sumOf(sheet.scheme, numeric(student.studentProfileId)));
  const passed = totals.filter(total => gradeFor(sheet.model, total).pass).length;
  const average = totals.length ? (totals.reduce((sum, total) => sum + total, 0) / totals.length).toFixed(1) : "—";
  return <Modal titleId="submit-title" onClose={onClose} maxWidth={480}>
    <h2 id="submit-title" className="dz-modal-title">Submit {sheet.code} results?</h2>
    {ready ? <>
      <p className="dz-modal-sub">This sends the results to {sheet.departmentName}, releases every mark and grade to students, and locks the sheet.</p>
      <dl className="ac-dl pt-dl">
        <div><dt>Students</dt><dd>{sheet.students.length}</dd></div>
        <div><dt>Class average</dt><dd>{average}</dd></div>
        <div><dt>Passed</dt><dd>{passed} of {sheet.students.length}</dd></div>
      </dl>
    </> : <p className="ac-notice ac-notice-warn">{sheet.students.length - complete} student{sheet.students.length - complete === 1 ? " is" : "s are"} missing marks. Every student needs every mark, including the exam, before you can submit.</p>}
    <div className="dz-form-actions">
      <button className="dz-btn-outline" onClick={onClose}>{ready ? "Cancel" : "Back to the sheet"}</button>
      {ready && <button className="dz-btn-green" disabled={busy} onClick={onSubmit}>{busy ? "Submitting…" : "Submit results"}</button>}
    </div>
  </Modal>;
}
