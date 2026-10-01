import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal";
import { academicApi } from "./api";
import type { AcademicOffering, AcademicSession, AcademicTerm, PrepareSessionInput } from "./types";
import { formatDay } from "./helpers";
import { EmptyState, StatusBadge, Stepper } from "./ui";

type Props = { organizationId: string; model: string; sessions: AcademicSession[]; onRefresh: () => void };
const DAY = 86_400_000;
const time = (iso: string) => Date.parse(`${iso}T00:00:00`);

/** How far through a term we are, for the progress bar. */
function termProgress(term: AcademicTerm, now = Date.now()): { ratio: number; label: string } {
  if (term.status === "Closed") return { ratio: 1, label: "Closed" };
  const start = time(term.startsOn), end = time(term.endsOn);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { ratio: 0, label: term.status };
  if (term.status === "Upcoming" || now < start) return { ratio: 0, label: `Starts ${formatDay(term.startsOn)}` };
  const weeks = Math.max(1, Math.ceil((end - start + DAY) / (7 * DAY)));
  const week = Math.min(weeks, Math.max(1, Math.ceil((now - start + DAY) / (7 * DAY))));
  return { ratio: Math.min(1, (now - start) / (end - start)), label: `Week ${week} of ${weeks}` };
}

export default function SessionsView({ organizationId, model, sessions, onRefresh }: Props) {
  const current = sessions.find(item => item.status === "Current") ?? null;
  const upcoming = sessions.filter(item => item.status === "Upcoming");
  const closed = sessions.filter(item => item.status === "Closed");
  const source = current ?? sessions[0] ?? null;
  const termWord = model === "University" ? "semester" : "term";
  const [offeringCounts, setOfferingCounts] = useState<Record<string, AcademicOffering[]>>({});
  const [wizard, setWizard] = useState(false);
  const [pending, setPending] = useState<{ kind: "start"; session: AcademicSession } | { kind: "close"; term: AcademicTerm } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    void Promise.all(sessions.map(item => academicApi.offerings(organizationId, item.sessionId).then(runs => [item.sessionId, runs] as const).catch(() => [item.sessionId, [] as AcademicOffering[]] as const)))
      .then(entries => { if (live) setOfferingCounts(Object.fromEntries(entries)); });
    return () => { live = false; };
  }, [organizationId, sessions]);

  async function confirm() {
    if (!pending) return;
    setError("");
    try {
      if (pending.kind === "start") await academicApi.start(organizationId, pending.session.sessionId);
      else await academicApi.closeTerm(organizationId, pending.term.termId);
      setPending(null); onRefresh();
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Something went wrong."); }
  }

  const runs = (session: AcademicSession) => offeringCounts[session.sessionId];
  const openTerm = current?.terms.find(term => term.status === "Current");

  return <>
    <div className="ac-toolbar"><span className="ac-count ac-grow">{sessions.length} session{sessions.length === 1 ? "" : "s"}</span><button className="dz-btn-green" onClick={() => { setError(""); setWizard(true); }}>{sessions.length ? "Prepare next session" : "Prepare first session"}</button></div>
    {error && !pending && <p role="alert" className="ac-notice ac-notice-warn">{error}</p>}

    {!sessions.length && <EmptyState title="No sessions yet" text={`A session is one academic year. Prepare the first one; its ${termWord}s start as upcoming until you start it.`} action={<button className="dz-btn-green" onClick={() => setWizard(true)}>Prepare first session</button>} />}

    {current && <section className="dz-card ac-session-current" aria-label={`Current session ${current.name}`}>
      <div className="ac-session-top">
        <h2>{current.name} <StatusBadge status="Current" /></h2>
        <span className="ac-count">{formatDay(current.startsOn)} – {formatDay(current.endsOn)}</span>
      </div>
      <div className="ac-segments">{current.terms.map(term => {
        const span = Math.max(1, time(term.endsOn) - time(term.startsOn));
        const progress = termProgress(term);
        return <div key={term.termId} className={`ac-segment ${term.status === "Closed" ? "is-closed" : ""}`} style={{ flex: span }}>
          <div className="ac-segment-bar" role="progressbar" aria-label={`${term.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.ratio * 100)}><span style={{ width: `${progress.ratio * 100}%` }} /></div>
          <div className="ac-segment-label"><strong>{term.name}</strong><span>{progress.label}</span></div>
        </div>;
      })}</div>
      <div className="ac-session-top">
        <span className="ac-count">{runs(current) ? <>{runs(current).length} offerings · {(() => { const n = runs(current).filter(run => !run.lecturerStaffProfileId).length; return n ? <Link to={`?tab=curriculum&session=${current.sessionId}&unassigned=1`} style={{ color: "var(--warn)" }}>{n} unassigned</Link> : "all assigned"; })()}</> : "Counting offerings…"}</span>
        <span className="ac-actions">
          {openTerm && <button className="dz-btn-outline" onClick={() => setPending({ kind: "close", term: openTerm })}>Close {openTerm.name.toLowerCase()}</button>}
          <Link className="dz-btn-green" to={`?tab=curriculum&session=${current.sessionId}`}>Open curriculum →</Link>
        </span>
      </div>
    </section>}

    {(upcoming.length > 0 || closed.length > 0) && <section className="dz-card ac-session-rows">
      {[...upcoming, ...closed].map(session => <div className="ac-session-row" key={session.sessionId}>
        <strong>{session.name}</strong>
        <StatusBadge status={session.status} />
        <span className="ac-muted">{formatDay(session.startsOn)} – {formatDay(session.endsOn)}</span>
        <span className="ac-muted">{runs(session) ? `${runs(session).length} offerings` : ""}</span>
        <span className="ac-actions">{session.status === "Upcoming"
          ? <button className="dz-btn-green" onClick={() => setPending({ kind: "start", session })}>Start session</button>
          : <Link className="dz-btn-outline" to={`?tab=curriculum&session=${session.sessionId}`}>View →</Link>}</span>
      </div>)}
    </section>}

    {wizard && <PrepareWizard organizationId={organizationId} model={model} source={source} sessions={sessions} sourceOfferings={source ? runs(source) ?? [] : []} onClose={() => setWizard(false)} onCreated={() => { setWizard(false); onRefresh(); }} />}

    {pending && <Modal titleId="ac-confirm-session" onClose={() => setPending(null)} maxWidth={460}><div className="dz-form" style={{ display: "grid", gap: ".8rem" }}>
      <h2 id="ac-confirm-session" style={{ margin: 0 }}>{pending.kind === "start" ? `Start ${pending.session.name}?` : `Close ${pending.term.name}?`}</h2>
      <p style={{ margin: 0, color: "var(--text-secondary)" }}>{pending.kind === "start"
        ? current ? `${current.name} will close and become read-only history.` : "It becomes the current session."
        : `${pending.term.name}'s offerings become read-only. The next ${termWord} becomes current.`}</p>
      {error && <p role="alert" className="ac-error">{error}</p>}
      <div className="ac-actions" style={{ justifyContent: "flex-end" }}><button className="dz-btn-outline" onClick={() => setPending(null)}>Cancel</button><button className="dz-btn-green" onClick={() => void confirm()}>{pending.kind === "start" ? "Start session" : `Close ${termWord}`}</button></div>
    </div></Modal>}
  </>;
}

function PrepareWizard({ organizationId, model, source, sessions, sourceOfferings, onClose, onCreated }: {
  organizationId: string; model: string; source: AcademicSession | null; sessions: AcademicSession[]; sourceOfferings: AcademicOffering[]; onClose: () => void; onCreated: () => void;
}) {
  const latest = Math.max(new Date().getFullYear() - 1, ...sessions.map(item => item.startYear));
  const first = sessions.length ? latest + 1 : new Date().getFullYear();
  const defaultTerms = source?.terms.map(term => term.name) ?? (model === "University" ? ["First semester", "Second semester"] : ["First term", "Second term", "Third term"]);
  const [step, setStep] = useState(0);
  const [startYear, setStartYear] = useState(first);
  const [startsOn, setStartsOn] = useState(`${first}-09-01`);
  const [endsOn, setEndsOn] = useState(`${first + 1}-07-31`);
  const [copyOfferings, setCopyOfferings] = useState(Boolean(source));
  const [copyLecturers, setCopyLecturers] = useState(Boolean(source));
  const [copyArms, setCopyArms] = useState(Boolean(source));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = `${startYear}/${startYear + 1}`;
  const assigned = sourceOfferings.filter(run => run.lecturerStaffProfileId).length;
  const datesValid = /^\d{4}-\d{2}-\d{2}$/.test(startsOn) && /^\d{4}-\d{2}-\d{2}$/.test(endsOn) && time(endsOn) > time(startsOn);
  const exists = sessions.some(item => item.startYear === startYear);

  async function create() {
    setError(""); setBusy(true);
    const input: PrepareSessionInput = { fromSessionId: source?.sessionId ?? null, name, startYear, endYear: startYear + 1, startsOn, endsOn, termNames: defaultTerms, copy: { courseOfferings: copyOfferings, lecturerAssignments: copyOfferings && copyLecturers, classArms: copyArms } };
    try { await academicApi.prepare(organizationId, input); onCreated(); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Could not prepare the session."); setBusy(false); }
  }

  return <Modal titleId="ac-prepare-title" onClose={onClose} maxWidth={640}><div className="dz-form" style={{ display: "grid", gap: "1.1rem" }}>
    <h2 id="ac-prepare-title" style={{ margin: 0 }}>Prepare {name}</h2>
    <Stepper steps={["Dates", "What to copy", "Review"]} current={step} onJump={setStep} />

    {step === 0 && <div className="ac-form-grid">
      <label className="ac-field"><span className="ac-label">Session starts in</span><input className="input" type="number" value={startYear} onChange={event => { const year = Number(event.target.value); setStartYear(year); setStartsOn(`${year}-09-01`); setEndsOn(`${year + 1}-07-31`); }} />
        {exists && <span className="ac-error">{name} already exists.</span>}</label>
      <div className="ac-field"><span className="ac-label">Name</span><span className="ac-chip" style={{ width: "fit-content" }}>{name}</span></div>
      <label className="ac-field"><span className="ac-label">First day</span><input className="input" type="date" value={startsOn} onChange={event => setStartsOn(event.target.value)} /></label>
      <label className="ac-field"><span className="ac-label">Last day</span><input className="input" type="date" value={endsOn} onChange={event => setEndsOn(event.target.value)} />{!datesValid && <span className="ac-error">The last day must come after the first.</span>}</label>
      <p className="ac-hint ac-span" style={{ margin: 0 }}>{defaultTerms.join(" · ")} — dates are split evenly; adjust them later.</p>
    </div>}

    {step === 1 && <div style={{ display: "grid", gap: ".6rem" }}>
      {!source && <p className="ac-hint" style={{ margin: 0 }}>This is the first session, so there's nothing to copy yet.</p>}
      <label className="ac-copy-row"><span className="ac-check"><input type="checkbox" checked={copyOfferings} disabled={!source} onChange={event => setCopyOfferings(event.target.checked)} />Course offerings</span><small>{source ? `${sourceOfferings.length} from ${source.name}` : "—"}</small></label>
      <label className="ac-copy-row"><span className="ac-check"><input type="checkbox" checked={copyOfferings && copyLecturers} disabled={!source || !copyOfferings} onChange={event => setCopyLecturers(event.target.checked)} />Lecturer assignments</span><small>{source ? `${assigned} of ${sourceOfferings.length}` : "—"}</small></label>
      <label className="ac-copy-row"><span className="ac-check"><input type="checkbox" checked={copyArms} disabled={!source} onChange={event => setCopyArms(event.target.checked)} />Class arms</span><small>{source ? "Same as now" : "—"}</small></label>
      <div className="ac-copy-row is-locked" aria-disabled="true"><span className="ac-check"><input type="checkbox" disabled />🔒 Promote students</span><small>Available once student records exist</small></div>
    </div>}

    {step === 2 && <dl className="ac-dl">
      <dt>Session</dt><dd>{name}</dd>
      <dt>Dates</dt><dd>{formatDay(startsOn)} – {formatDay(endsOn)}</dd>
      <dt>{model === "University" ? "Semesters" : "Terms"}</dt><dd>{defaultTerms.join(", ")}</dd>
      <dt>Offerings</dt><dd>{copyOfferings ? sourceOfferings.length : 0} will be created{copyOfferings && copyLecturers ? `, ${assigned} with a lecturer already assigned` : ""}</dd>
      <dt>Status</dt><dd>Starts as Upcoming. It becomes current when you click Start session.</dd>
    </dl>}

    {error && <p role="alert" className="ac-error">{error}</p>}
    <div className="ac-actions" style={{ justifyContent: "space-between" }}>
      <button className="dz-btn-outline" onClick={step === 0 ? onClose : () => setStep(step - 1)}>{step === 0 ? "Cancel" : "Back"}</button>
      {step < 2 ? <button className="dz-btn-green" disabled={step === 0 && (!datesValid || exists)} onClick={() => setStep(step + 1)}>Continue</button>
        : <button className="dz-btn-green" disabled={busy} onClick={() => void create()}>{busy ? "Creating…" : "Create session"}</button>}
    </div>
  </div></Modal>;
}
