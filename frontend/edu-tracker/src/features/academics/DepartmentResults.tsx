/**
 * Department results: every course offered this session, where its result
 * sheet stands, and the full broadsheet for any of them. This is where
 * marks uploaded in the staff portal reach the school.
 */
import { useCallback, useEffect, useState } from "react";
import { caLabel, gradeFor, isComplete, sumOf } from "../assessment/scheme";
import { portalApi } from "../portal/api";
import type { DepartmentResultRow, ResultSheet } from "../portal/types";
import { Badge, Drawer, EmptyState, StatCells } from "./ui";

type Props = { organizationId: string; departmentId: string; sessionId: string | null; university: boolean };

const TONE = { "Not started": "neutral", Partial: "warn", Submitted: "current" } as const;
const LABEL = { "Not started": "Not started", Partial: "In progress", Submitted: "Submitted" } as const;

export default function DepartmentResults({ organizationId, departmentId, sessionId, university }: Props) {
  const [rows, setRows] = useState<DepartmentResultRow[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) { setRows([]); return; }
    try { setRows(await portalApi.departmentResults(organizationId, departmentId, sessionId)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't load results."); }
  }, [organizationId, departmentId, sessionId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() is async; state lands after the fetch.
  useEffect(() => { void load(); }, [load]);

  if (error) return <p className="ac-notice ac-notice-warn" role="alert">{error} <button onClick={() => void load()}>Try again</button></p>;
  if (!rows) return <div className="skeleton" style={{ height: 220 }} aria-busy="true" />;
  if (!rows.length) return <EmptyState title="No results yet" text={`Results appear here once ${university ? "courses" : "subjects"} are scheduled for this session and ${university ? "lecturers" : "teachers"} start entering marks.`} />;

  const submitted = rows.filter(row => row.status === "Submitted").length;
  const started = rows.filter(row => row.status === "Partial").length;
  const averages = rows.filter(row => row.average !== null);
  return <>
    <StatCells label="Results this session" stats={[
      { label: "Submitted", value: `${submitted}/${rows.length}` },
      { label: "In progress", value: started },
      { label: "Not started", value: rows.length - submitted - started },
      { label: "Average score", value: averages.length ? (averages.reduce((sum, row) => sum + row.average!, 0) / averages.length).toFixed(1) : "—" },
    ]} />
    <section className="dz-card" style={{ padding: 0, overflow: "hidden" }}><div className="ac-table-wrap"><table className="ac-table">
      <thead><tr><th>{university ? "Course" : "Subject"}</th><th>{university ? "Level" : "Arm"}</th><th>Term</th><th>{university ? "Lecturer" : "Teacher"}</th><th className="num">Students</th><th>Published</th><th>Status</th><th className="num">Average</th><th className="num">Pass rate</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.offeringId} className="is-link" tabIndex={0} onClick={() => setOpen(row.offeringId)} onKeyDown={event => { if (event.key === "Enter") setOpen(row.offeringId); }}>
        <td>{university && <span className="ac-mono">{row.code} </span>}{row.title}</td>
        <td>{row.levelKey}</td><td>{row.termName}</td><td>{row.lecturer ?? <Badge tone="warn">Unassigned</Badge>}</td>
        <td className="num">{row.enrolled}</td><td>{row.published.join(", ") || "—"}</td>
        <td><Badge tone={TONE[row.status]}>{LABEL[row.status]}</Badge></td>
        <td className="num">{row.average ?? "—"}</td><td className="num">{row.passRate !== null ? `${row.passRate}%` : "—"}</td>
      </tr>)}</tbody>
    </table></div></section>
    <p className="ac-hint">Averages and pass rates show once the {university ? "lecturer" : "teacher"} submits. Open a row to see the full sheet, including marks not yet released to students.</p>
    {open && <Broadsheet organizationId={organizationId} offeringId={open} onClose={() => setOpen(null)} />}
  </>;
}

function Broadsheet({ organizationId, offeringId, onClose }: { organizationId: string; offeringId: string; onClose: () => void }) {
  const [sheet, setSheet] = useState<ResultSheet | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    portalApi.departmentSheet(organizationId, offeringId)
      .then(next => { if (live) setSheet(next); })
      .catch(cause => { if (live) setError(cause instanceof Error ? cause.message : "Couldn't load the sheet."); });
    return () => { live = false; };
  }, [organizationId, offeringId]);

  return <Drawer title={sheet ? `${sheet.code} · ${sheet.title}` : "Result sheet"} onClose={onClose}>
    {error && <p className="ac-error" role="alert">{error}</p>}
    {!sheet && !error && <div className="skeleton" style={{ height: 200 }} />}
    {sheet && <>
      <p className="ac-meta">{sheet.lecturer ?? "No lecturer"} · {sheet.sessionName} · {sheet.termName} · <Badge tone={TONE[sheet.status]}>{LABEL[sheet.status]}</Badge>
        {sheet.submittedAt ? ` · submitted ${new Date(sheet.submittedAt).toLocaleDateString("en-GB")}` : ""}</p>
      <div className="ac-table-wrap"><table className="ac-table">
        <thead><tr><th>No.</th><th>Name</th>{sheet.scheme.map(component => <th key={component.key} className="num" title={sheet.published[component.key] ? "Published" : "Draft"}>{component.label}{sheet.published[component.key] ? "" : "*"}</th>)}<th className="num">{caLabel(sheet.model)}</th><th className="num">Total</th><th>Grade</th></tr></thead>
        <tbody>{sheet.students.map(student => {
          const complete = isComplete(sheet.scheme, student.scores);
          const total = complete ? sumOf(sheet.scheme, student.scores) : null;
          return <tr key={student.studentProfileId}>
            <td className="ac-mono">{student.matriculationNumber}</td><td>{student.fullName}</td>
            {sheet.scheme.map(component => <td key={component.key} className="num">{student.scores[component.key] ?? "—"}</td>)}
            <td className="num">{sumOf(sheet.scheme, student.scores, "CA") || "—"}</td>
            <td className="num">{total ?? "—"}</td><td>{total !== null ? gradeFor(sheet.model, total).grade : ""}</td>
          </tr>;
        })}</tbody>
      </table></div>
      <p className="ac-hint">* Not yet released to students.</p>
    </>}
  </Drawer>;
}
