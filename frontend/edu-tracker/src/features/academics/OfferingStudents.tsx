/**
 * "Students on this course", inside a course's panel in the Levels tab.
 * Students in the department and level are on it automatically; this is
 * where an admin adds anyone else (carry-overs, electives, other
 * departments) or takes someone off this one course.
 */
import { useCallback, useEffect, useState } from "react";
import { adminApi, AdminApiError } from "../portal/adminApi";
import type { OfferingRoster } from "../portal/types";
import { initials } from "./helpers";

export default function OfferingStudents({ organizationId, offeringId, level }: { organizationId: string; offeringId: string; level: string }) {
  const [roster, setRoster] = useState<OfferingRoster | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try { setRoster(await adminApi.roster(organizationId, offeringId)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't load the students."); }
  }, [organizationId, offeringId]);
   
  useEffect(() => { void load(); }, [load]);

  async function act(kind: "add" | "drop", studentProfileId: string) {
    setBusy(studentProfileId); setError("");
    try {
      if (kind === "add") { await adminApi.enrol(organizationId, offeringId, studentProfileId); setQuery(""); }
      else await adminApi.drop(organizationId, offeringId, studentProfileId);
      await load();
    } catch (cause) { setError(cause instanceof AdminApiError ? cause.message : "Couldn't update the list."); }
    finally { setBusy(""); }
  }

  if (!roster) return <section className="os"><h3 className="os-title">Students</h3>{error ? <p className="ac-error">{error}</p> : <div className="skeleton" style={{ height: 120 }} />}</section>;

  const q = query.trim().toLowerCase();
  const matches = q.length >= 2 ? roster.candidates.filter(item => `${item.fullName} ${item.matriculationNumber}`.toLowerCase().includes(q)).slice(0, 5) : [];
  const added = roster.students.filter(item => item.source === "Registered").length;

  return <section className="os" aria-label="Students on this course">
    <div className="os-head">
      <h3 className="os-title">Students <span>{roster.students.length}</span></h3>
      <small>{level} students are on it automatically{added ? ` · ${added} added by hand` : ""}</small>
    </div>
    {error && <p className="ac-notice ac-notice-warn" role="alert">{error}</p>}
    {roster.locked
      ? <p className="ac-hint">The list is locked: the term is closed or results are submitted.</p>
      : <div className="os-add">
        <input className="input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Add a student: name or matric number" aria-label="Add a student" />
        {q.length >= 2 && (matches.length
          ? <ul className="os-matches">{matches.map(item => (
            <li key={item.studentProfileId}>
              <button type="button" disabled={busy === item.studentProfileId} onClick={() => void act("add", item.studentProfileId)}>
                <span className="ac-avatar" aria-hidden="true">{initials(item.fullName)}</span>
                <span className="os-who"><strong>{item.fullName}</strong><small>{item.matriculationNumber} · {item.placement}</small></span>
                <span className="os-add-label">Add</span>
              </button>
            </li>
          ))}</ul>
          : <p className="ac-hint">No one else matches “{query}”.</p>)}
      </div>}
    <ul className="os-list">{roster.students.map(item => (
      <li key={item.studentProfileId}>
        <span className="ac-avatar" aria-hidden="true">{initials(item.fullName)}</span>
        <span className="os-who"><strong>{item.fullName}</strong><small>{item.matriculationNumber}{item.source === "Registered" ? " · added by hand" : ""}</small></span>
        {!roster.locked && (item.hasMarks
          ? <span className="os-note" title="Marks have been entered. The lecturer must clear them first.">Has marks</span>
          : <button type="button" className="os-remove" disabled={busy === item.studentProfileId} aria-label={`Take ${item.fullName} off this course`} onClick={() => void act("drop", item.studentProfileId)}>Remove</button>)}
      </li>
    ))}</ul>
    {!roster.students.length && <p className="ac-hint">No one on this course yet.</p>}
  </section>;
}
