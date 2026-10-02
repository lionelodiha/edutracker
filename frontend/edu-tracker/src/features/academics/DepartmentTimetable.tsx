/**
 * A level's week, shown inside the Levels tab ("Timetable" view).
 * Periods sit on a time grid, coloured by course. Students and lecturers see
 * these in their portals, and class reminders come from them. The server
 * refuses clashes: the same level, lecturer or venue booked twice at once.
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { adminApi, AdminApiError } from "../portal/adminApi";
import type { AdminSlot, DepartmentTimetable as Timetable } from "../portal/types";
import { monogramColour } from "./helpers";
import type { AcademicTerm } from "./types";
import { Drawer, Segmented } from "./ui";

type Props = { organizationId: string; departmentId: string; terms: AcademicTerm[]; level: string; university: boolean; readonly: boolean };

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PX = 0.9; // pixels per minute on the grid
const toMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

export default function LevelTimetable({ organizationId, departmentId, terms, level, university, readonly }: Props) {
  const [termId, setTermId] = useState(() => (terms.find(term => term.status === "Current") ?? terms[0])?.termId ?? "");
  const [data, setData] = useState<Timetable | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState<{ offeringId?: string; day?: number } | null>(null);
  const [open, setOpen] = useState<AdminSlot | null>(null);
  const [phoneDay, setPhoneDay] = useState(() => { const today = new Date().getDay(); return today >= 1 && today <= 5 ? today : 1; });

  const load = useCallback(async () => {
    if (!termId) return;
    try { setData(await adminApi.timetable(organizationId, departmentId, termId)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't load the timetable."); }
  }, [organizationId, departmentId, termId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() is async; state lands after the fetch.
  useEffect(() => { void load(); }, [load]);

  const slots = useMemo(() => (data?.slots ?? []).filter(slot => slot.levelKey === level), [data, level]);
  const courses = useMemo(() => (data?.offerings ?? []).filter(item => item.levelKey === level), [data, level]);
  const venues = useMemo(() => [...new Set((data?.slots ?? []).map(slot => slot.venue))].sort(), [data]);
  const locked = readonly || !!data?.termClosed;
  const noun = university ? "lecture" : "lesson";

  if (!terms.length) return <p className="ac-term-empty">Prepare a session first. The timetable is built from its courses.</p>;
  if (error && !data) return <p className="ac-notice ac-notice-warn" role="alert">{error} <button onClick={() => void load()}>Try again</button></p>;

  const days = [1, 2, 3, 4, 5, ...(slots.some(slot => slot.day === 6) ? [6] : [])];
  const first = Math.min(8 * 60, ...slots.map(slot => toMinutes(slot.start)));
  const last = Math.max(16 * 60, ...slots.map(slot => toMinutes(slot.end)));
  const startHour = Math.floor(first / 60) * 60;
  const endHour = Math.ceil(last / 60) * 60;
  const hours = Array.from({ length: (endHour - startHour) / 60 + 1 }, (_, index) => startHour + index * 60);
  const top = (minutes: number) => (minutes - startHour) * PX;
  const weekly = slots.reduce((sum, slot) => sum + toMinutes(slot.end) - toMinutes(slot.start), 0) / 60;
  const unscheduled = courses.filter(course => !slots.some(slot => slot.offeringId === course.offeringId));

  async function remove(slot: AdminSlot) {
    try { await adminApi.removeSlot(organizationId, slot.slotId); setOpen(null); await load(); }
    catch (cause) { setError(cause instanceof AdminApiError ? cause.message : "Couldn't remove that period."); }
  }

  const period = (slot: AdminSlot, style?: CSSProperties) => (
    <button key={slot.slotId} type="button" className="tt-slot" style={{ "--slot": monogramColour(slot.code), ...style } as CSSProperties}
      onClick={() => setOpen(slot)} aria-label={`${slot.code}, ${DAY_NAMES[slot.day]} ${slot.start} to ${slot.end}, ${slot.venue}`}>
      <strong>{slot.code}</strong>
      <span>{slot.start}–{slot.end}</span>
      <span>{slot.venue}</span>
    </button>
  );

  return <div className="tt">
    <div className="tt-bar">
      {terms.length > 1 && <Segmented label={university ? "Semester" : "Term"} value={termId} onChange={setTermId} options={terms.map(term => ({ value: term.termId, label: term.name }))} />}
      <span className="tt-summary">{slots.length} {noun}{slots.length === 1 ? "" : "s"} · {weekly} h a week</span>
      {!locked && courses.length > 0 && <button className="dz-btn-outline" onClick={() => setAdding({})}>+ Add period</button>}
    </div>
    {error && <p className="ac-notice ac-notice-warn" role="alert">{error}</p>}
    {data?.termClosed && <p className="ac-notice ac-notice-muted" role="status">{data.termName} is closed. Its timetable is read-only.</p>}

    {!data ? <div className="skeleton" style={{ height: 320 }} aria-busy="true" />
      : !courses.length ? <p className="ac-term-empty">No {university ? "courses" : "subjects"} for {level} this {university ? "semester" : "term"}. Add them in the Courses view first.</p>
      : <>
        {unscheduled.length > 0 && <div className="tt-unscheduled">
          <span>Not on the timetable yet</span>
          {unscheduled.map(course => (
            <button key={course.offeringId} type="button" className="tt-chip" style={{ "--slot": monogramColour(course.code) } as CSSProperties} disabled={locked}
              onClick={() => setAdding({ offeringId: course.offeringId })} title={locked ? undefined : `Schedule ${course.code}`}>
              {course.code}{!locked && <b aria-hidden="true">+</b>}
            </button>
          ))}
        </div>}

        <div className="dz-card tt-grid" style={{ "--tt-days": days.length, "--tt-height": `${(endHour - startHour) * PX}px` } as CSSProperties}>
          <div className="tt-head"><span />{days.map(day => <span key={day}>{DAY_NAMES[day].slice(0, 3)}</span>)}</div>
          <div className="tt-body">
            <div className="tt-hours" aria-hidden="true">{hours.map(hour => <span key={hour} style={{ top: top(hour) }}>{String(hour / 60).padStart(2, "0")}:00</span>)}</div>
            {days.map(day => (
              <div key={day} className="tt-col" aria-label={DAY_NAMES[day]}>
                {hours.map(hour => <span key={hour} className="tt-line" style={{ top: top(hour) }} />)}
                {!locked && <button type="button" className="tt-col-add" aria-label={`Add a period on ${DAY_NAMES[day]}`} onClick={() => setAdding({ day })} />}
                {slots.filter(slot => slot.day === day).map(slot => period(slot, { top: top(toMinutes(slot.start)), height: (toMinutes(slot.end) - toMinutes(slot.start)) * PX - 3 }))}
              </div>
            ))}
          </div>
        </div>

        {/* Phones: one day at a time. */}
        <div className="tt-phone">
          <Segmented label="Day" value={String(phoneDay)} onChange={value => setPhoneDay(Number(value))} options={days.map(day => ({ value: String(day), label: DAY_NAMES[day].slice(0, 3) }))} />
          <div className="tt-phone-list">
            {slots.filter(slot => slot.day === phoneDay).length
              ? slots.filter(slot => slot.day === phoneDay).map(slot => period(slot))
              : <p className="ac-term-empty">Nothing on {DAY_NAMES[phoneDay]}.</p>}
          </div>
        </div>
      </>}

    {open && <Drawer title={`${open.code} · ${DAY_NAMES[open.day]}`} onClose={() => setOpen(null)}
      footer={locked ? undefined : <><button className="dz-btn-outline" onClick={() => setOpen(null)}>Close</button><button className="ac-danger-link" onClick={() => void remove(open)}>Remove period</button></>}>
      <div><strong>{open.title}</strong><p className="ac-hint" style={{ margin: ".2rem 0 0" }}>{level}</p></div>
      <dl className="ac-dl">
        <dt>When</dt><dd>{DAY_NAMES[open.day]}, {open.start}–{open.end}</dd>
        <dt>Where</dt><dd>{open.venue}</dd>
        <dt>{university ? "Lecturer" : "Teacher"}</dt><dd>{open.lecturer ?? "Not assigned"}</dd>
      </dl>
      <p className="ac-hint">Students and the {university ? "lecturer" : "teacher"} see this period in their portals and get a reminder before it starts.</p>
    </Drawer>}
    {adding && data && <AddPeriod organizationId={organizationId} level={level} initial={adding} courses={courses} venues={venues}
      onClose={() => setAdding(null)} onAdded={async () => { setAdding(null); await load(); }} />}
  </div>;
}

function AddPeriod({ organizationId, level, initial, courses, venues, onClose, onAdded }: {
  organizationId: string; level: string; initial: { offeringId?: string; day?: number }; courses: Timetable["offerings"]; venues: string[];
  onClose: () => void; onAdded: () => Promise<void>;
}) {
  const [offeringId, setOfferingId] = useState(initial.offeringId ?? courses[0]?.offeringId ?? "");
  const [day, setDay] = useState(String(initial.day ?? 1));
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");
  const [venue, setVenue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const course = courses.find(item => item.offeringId === offeringId);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await adminApi.addSlot(organizationId, { offeringId, day: Number(day), start, end, venue });
      await onAdded();
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "Couldn't add the period.");
      setBusy(false);
    }
  }

  return <Drawer title={`Add a period · ${level}`} onClose={onClose} footer={<>
    <button className="dz-btn-outline" onClick={onClose}>Cancel</button>
    <button className="dz-btn-green" form="add-period" disabled={busy || !offeringId || !venue.trim()}>{busy ? "Adding…" : "Add period"}</button>
  </>}>
    <form id="add-period" className="dz-form" onSubmit={event => void save(event)}>
      {error && <p className="ac-notice ac-notice-warn" role="alert">{error}</p>}
      <label className="ac-field"><span className="ac-label">Course</span>
        <select className="input" value={offeringId} onChange={event => setOfferingId(event.target.value)}>
          {courses.map(item => <option key={item.offeringId} value={item.offeringId}>{item.code} · {item.title}</option>)}
        </select>
        <span className="ac-hint">{course?.lecturer ? `Taught by ${course.lecturer}.` : "No lecturer assigned yet."}</span>
      </label>
      <div className="ac-field"><span className="ac-label">Day</span>
        <Segmented label="Day" value={day} onChange={setDay} options={[1, 2, 3, 4, 5, 6].map(value => ({ value: String(value), label: DAY_NAMES[value].slice(0, 3) }))} />
      </div>
      <div className="ac-form-grid">
        <label className="ac-field"><span className="ac-label">Starts</span><input className="input" type="time" value={start} min="07:00" max="19:00" onChange={event => setStart(event.target.value)} required /></label>
        <label className="ac-field"><span className="ac-label">Ends</span><input className="input" type="time" value={end} min="07:00" max="19:00" onChange={event => setEnd(event.target.value)} required /></label>
      </div>
      <label className="ac-field"><span className="ac-label">Venue</span>
        <input className="input" list="tt-venues" value={venue} onChange={event => setVenue(event.target.value)} placeholder="e.g. LT 1, Computer Lab 2" required />
        <datalist id="tt-venues">{venues.map(item => <option key={item} value={item} />)}</datalist>
      </label>
      <p className="ac-hint">Clashes are checked when you add: this level, the {course?.lecturer ? "lecturer" : "teacher"} and the venue can each be in only one place at a time.</p>
    </form>
  </Drawer>;
}
