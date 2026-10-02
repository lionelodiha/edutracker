/**
 * Staff operations, from the admin side: the forms behind a staff profile
 * (employment record, shifts, tasks, appraisals) and the leave approvals
 * list. What non-teaching staff see in their portal is set up here.
 */
import { useCallback, useEffect, useState } from "react";
import { adminApi, AdminApiError } from "../../features/portal/adminApi";
import type { EmploymentRecord, LeaveQueueRow, StaffOperations, WorkTask } from "../../features/portal/types";
import { formatDay, initials } from "../../features/academics/helpers";
import { Badge, Drawer, EmptyState, Segmented } from "../../features/academics/ui";

const message = (cause: unknown, fallback: string) => (cause instanceof AdminApiError ? cause.message : fallback);
const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type FormProps<T> = { onClose: () => void; onSave: (value: T) => Promise<string | null> };

/** Shared drawer shell: shows the server's error and keeps the drawer open until the save works. */
function FormDrawer({ title, submit, children, onClose, onSubmit }: { title: string; submit: string; children: React.ReactNode; onClose: () => void; onSubmit: () => Promise<string | null> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const problem = await onSubmit();
    if (problem) { setError(problem); setBusy(false); }
  }
  return <Drawer title={title} onClose={onClose} footer={<>
    <button className="dz-btn-outline" onClick={onClose}>Cancel</button>
    <button className="dz-btn-green" form="so-form" disabled={busy}>{busy ? "Saving…" : submit}</button>
  </>}>
    <form id="so-form" className="dz-form" onSubmit={event => void save(event)}>
      {error && <p className="ac-notice ac-notice-warn" role="alert">{error}</p>}
      {children}
    </form>
  </Drawer>;
}

export function EmploymentDrawer({ data, onClose, onSave }: { data: StaffOperations } & FormProps<EmploymentRecord>) {
  const current = data.record;
  const [form, setForm] = useState({
    cadre: current?.cadre ?? "", salaryScale: current?.salaryScale ?? "CONTISS",
    gradeLevel: String(current?.gradeLevel ?? 7), step: String(current?.step ?? 1),
    confirmedOn: current?.confirmedOn ?? "", nextPromotionDue: current?.nextPromotionDue ?? "", supervisorId: current?.supervisorId ?? "",
  });
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(value => ({ ...value, [key]: event.target.value }));
  return <FormDrawer title="Employment record" submit="Save record" onClose={onClose} onSubmit={() => onSave({
    cadre: form.cadre, salaryScale: form.salaryScale, gradeLevel: Number(form.gradeLevel), step: Number(form.step),
    confirmedOn: form.confirmedOn || null, nextPromotionDue: form.nextPromotionDue || null, supervisorId: form.supervisorId || null,
  })}>
    <label className="ac-field"><span className="ac-label">Cadre</span><input className="input" value={form.cadre} onChange={set("cadre")} placeholder="e.g. Registry · Executive Officer" required autoFocus /></label>
    <div className="ac-form-grid">
      <label className="ac-field"><span className="ac-label">Salary scale</span><input className="input" list="so-scales" value={form.salaryScale} onChange={set("salaryScale")} required /><datalist id="so-scales"><option value="CONTISS" /><option value="CONUASS" /><option value="CONPSS" /><option value="CONPCASS" /></datalist></label>
      <label className="ac-field"><span className="ac-label">Grade level</span><input className="input" type="number" min={1} max={17} value={form.gradeLevel} onChange={set("gradeLevel")} required /></label>
      <label className="ac-field"><span className="ac-label">Step</span><input className="input" type="number" min={1} max={15} value={form.step} onChange={set("step")} required /></label>
      <label className="ac-field"><span className="ac-label">Confirmed on</span><input className="input" type="date" value={form.confirmedOn} onChange={set("confirmedOn")} /></label>
    </div>
    <label className="ac-field"><span className="ac-label">Next promotion due</span><input className="input" type="date" value={form.nextPromotionDue} onChange={set("nextPromotionDue")} /></label>
    <label className="ac-field"><span className="ac-label">Reports to</span>
      <select className="input" value={form.supervisorId} onChange={set("supervisorId")}>
        <option value="">No supervisor</option>
        {data.supervisors.map(person => <option key={person.staffProfileId} value={person.staffProfileId}>{person.name}</option>)}
      </select>
      <span className="ac-hint">The supervisor is told when this person asks for leave.</span>
    </label>
    <p className="ac-hint">Grade level sets annual leave: 30 working days from GL 07, 21 below.</p>
  </FormDrawer>;
}

export function ShiftDrawer({ onClose, onSave }: FormProps<{ day: 1 | 2 | 3 | 4 | 5 | 6; start: string; end: string; location: string; role: string }>) {
  const [form, setForm] = useState({ day: "1", start: "08:00", end: "16:00", location: "", role: "" });
  return <FormDrawer title="Add a shift" submit="Add shift" onClose={onClose} onSubmit={() => onSave({ day: Number(form.day) as 1, start: form.start, end: form.end, location: form.location, role: form.role })}>
    <div className="ac-field"><span className="ac-label">Day</span>
      <Segmented label="Day" value={form.day} onChange={day => setForm(value => ({ ...value, day }))} options={[1, 2, 3, 4, 5, 6].map(day => ({ value: String(day), label: DAY_NAMES[day].slice(0, 3) }))} />
    </div>
    <div className="ac-form-grid">
      <label className="ac-field"><span className="ac-label">From</span><input className="input" type="time" value={form.start} onChange={event => setForm(value => ({ ...value, start: event.target.value }))} required /></label>
      <label className="ac-field"><span className="ac-label">To</span><input className="input" type="time" value={form.end} onChange={event => setForm(value => ({ ...value, end: event.target.value }))} required /></label>
    </div>
    <label className="ac-field"><span className="ac-label">Where</span><input className="input" value={form.location} onChange={event => setForm(value => ({ ...value, location: event.target.value }))} placeholder="e.g. Faculty Office, Room 12" required /></label>
    <label className="ac-field"><span className="ac-label">Duty</span><input className="input" value={form.role} onChange={event => setForm(value => ({ ...value, role: event.target.value }))} placeholder="e.g. Student records desk" required /></label>
    <p className="ac-hint">They'll be notified, and the shift appears on their duty roster.</p>
  </FormDrawer>;
}

export function TaskDrawer({ onClose, onSave }: FormProps<{ title: string; detail: string; priority: WorkTask["priority"]; dueOn: string | null }>) {
  const [form, setForm] = useState({ title: "", detail: "", priority: "Normal" as WorkTask["priority"], dueOn: "" });
  return <FormDrawer title="Assign a task" submit="Assign task" onClose={onClose} onSubmit={() => onSave({ title: form.title, detail: form.detail, priority: form.priority, dueOn: form.dueOn || null })}>
    <label className="ac-field"><span className="ac-label">Task</span><input className="input" value={form.title} onChange={event => setForm(value => ({ ...value, title: event.target.value }))} maxLength={120} placeholder="e.g. Collate 300L registration forms" required autoFocus /></label>
    <label className="ac-field"><span className="ac-label">Details <span className="ac-hint">(optional)</span></span><textarea className="input" rows={4} value={form.detail} onChange={event => setForm(value => ({ ...value, detail: event.target.value }))} /></label>
    <div className="ac-field"><span className="ac-label">Priority</span>
      <Segmented label="Priority" value={form.priority} onChange={priority => setForm(value => ({ ...value, priority }))} options={[{ value: "Low", label: "Low" }, { value: "Normal", label: "Normal" }, { value: "Urgent", label: "Urgent" }]} />
    </div>
    <label className="ac-field"><span className="ac-label">Due <span className="ac-hint">(optional)</span></span><input className="input" type="date" value={form.dueOn} onChange={event => setForm(value => ({ ...value, dueOn: event.target.value }))} /></label>
  </FormDrawer>;
}

export function AppraisalDrawer({ adminName, onClose, onSave }: { adminName: string } & FormProps<{ year: number; score: number; appraiser: string; comment: string }>) {
  const [form, setForm] = useState({ year: String(new Date().getFullYear()), score: "", appraiser: adminName, comment: "" });
  const score = Number(form.score);
  const rating = !form.score ? "" : score >= 85 ? "Outstanding" : score >= 70 ? "Very good" : score >= 55 ? "Good" : score >= 40 ? "Fair" : "Poor";
  return <FormDrawer title="Record an appraisal" submit="Save appraisal" onClose={onClose} onSubmit={() => onSave({ year: Number(form.year), score, appraiser: form.appraiser, comment: form.comment })}>
    <div className="ac-form-grid">
      <label className="ac-field"><span className="ac-label">Year</span><input className="input" type="number" value={form.year} onChange={event => setForm(value => ({ ...value, year: event.target.value }))} required /></label>
      <label className="ac-field"><span className="ac-label">Score <span className="ac-hint">(0–100)</span></span><input className="input" type="number" min={0} max={100} value={form.score} onChange={event => setForm(value => ({ ...value, score: event.target.value }))} required autoFocus /></label>
    </div>
    {rating && <p className="ac-hint">Rating: <strong>{rating}</strong></p>}
    <label className="ac-field"><span className="ac-label">Appraised by</span><input className="input" value={form.appraiser} onChange={event => setForm(value => ({ ...value, appraiser: event.target.value }))} required /></label>
    <label className="ac-field"><span className="ac-label">Comment</span><textarea className="input" rows={4} value={form.comment} onChange={event => setForm(value => ({ ...value, comment: event.target.value }))} /></label>
  </FormDrawer>;
}

export function LeaveBadge({ status }: { status: string }) {
  return <Badge tone={status === "Approved" ? "current" : status === "Declined" ? "closed" : "warn"}>{status}</Badge>;
}

/** Staff & Teachers → Leave requests: requests waiting for a decision, then recent decisions. */
export function LeaveRequestsView({ organizationId, adminName }: { organizationId: string; adminName: string }) {
  const [rows, setRows] = useState<LeaveQueueRow[] | null>(null);
  const [error, setError] = useState("");
  const [declining, setDeclining] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try { setRows(await adminApi.leaveQueue(organizationId)); setError(""); }
    catch (cause) { setError(message(cause, "Couldn't load leave requests.")); }
  }, [organizationId]);
   
  useEffect(() => { void load(); }, [load]);

  async function decide(requestId: string, decision: "Approved" | "Declined") {
    setBusy(requestId); setError("");
    try {
      await adminApi.decideLeave(organizationId, requestId, { decision, note: decision === "Declined" ? note : "", decidedBy: adminName });
      setDeclining(null); setNote("");
      await load();
    } catch (cause) { setError(message(cause, "Couldn't save the decision.")); }
    finally { setBusy(""); }
  }

  if (error && !rows) return <EmptyState title="Couldn't load leave requests" text={error} />;
  if (!rows) return <div className="skeleton" style={{ height: 220 }} aria-busy="true" />;
  const pending = rows.filter(row => row.status === "Pending");
  const decided = rows.filter(row => row.status !== "Pending");

  return <div className="lv">
    {error && <p className="ac-notice ac-notice-warn" role="alert">{error}</p>}
    <section className="lv-section" aria-label="Waiting for a decision">
      <h2 className="lv-title">Waiting for a decision <span>{pending.length}</span></h2>
      {pending.length ? <div className="lv-cards">{pending.map(row => (
        <article key={row.requestId} className="dz-card lv-card">
          <header className="lv-card-head">
            <span className="ac-avatar" aria-hidden="true">{initials(row.staffName)}</span>
            <span className="lv-who"><strong>{row.staffName}</strong><small>{row.unitName ?? "—"}</small></span>
            <Badge tone={row.type === "Annual" ? "code" : "neutral"}>{row.type}</Badge>
          </header>
          <div className="lv-when">
            <span className="lv-days"><b>{row.days}</b><small>working day{row.days === 1 ? "" : "s"}</small></span>
            <span className="lv-dates"><strong>{formatDay(row.startsOn)} – {formatDay(row.endsOn)}</strong><small>{row.reason}</small></span>
          </div>
          {row.type === "Annual" && <p className="lv-balance">Annual leave left: <strong>{row.remaining}</strong> → <strong className={row.remaining - row.days < 0 ? "is-bad" : ""}>{row.remaining - row.days}</strong> after this</p>}
          {declining === row.requestId
            ? <div className="lv-decline">
              <input className="input" value={note} onChange={event => setNote(event.target.value)} placeholder="Why it's declined (they'll see this)" autoFocus />
              <div className="ac-actions"><button className="dz-btn-outline" onClick={() => { setDeclining(null); setNote(""); }}>Back</button><button className="dz-btn-outline lv-danger" disabled={!note.trim() || busy === row.requestId} onClick={() => void decide(row.requestId, "Declined")}>Decline request</button></div>
            </div>
            : <div className="lv-actions">
              <button className="dz-btn-outline" disabled={busy === row.requestId} onClick={() => { setDeclining(row.requestId); setNote(""); }}>Decline</button>
              <button className="dz-btn-green" disabled={busy === row.requestId} onClick={() => void decide(row.requestId, "Approved")}>Approve</button>
            </div>}
        </article>
      ))}</div> : <p className="lv-empty">Nothing waiting. New requests from the staff portal appear here.</p>}
    </section>
    {decided.length > 0 && <section className="lv-section" aria-label="Decided">
      <h2 className="lv-title">Decided</h2>
      <div className="dz-card lv-decided">{decided.map(row => (
        <div key={row.requestId} className="lv-row">
          <span className="ac-avatar" aria-hidden="true">{initials(row.staffName)}</span>
          <span className="lv-who"><strong>{row.staffName}</strong><small>{row.type} · {row.days} day{row.days === 1 ? "" : "s"} · {formatDay(row.startsOn)} – {formatDay(row.endsOn)}</small></span>
          <span className="lv-by"><LeaveBadge status={row.status} />{row.decidedBy && <small>by {row.decidedBy}</small>}</span>
        </div>
      ))}</div>
    </section>}
  </div>;
}

