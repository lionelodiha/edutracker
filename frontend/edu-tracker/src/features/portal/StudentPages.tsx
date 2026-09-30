/* Student portal: overview, coursework and results. */
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { caLabel, degreeClass, gradeScale, ordinal, sumOf } from "../assessment/scheme";
import { monogramColour } from "../academics/helpers";
import { Drawer, Segmented } from "../academics/ui";
import { portalApi } from "./api";
import { Empty, NotificationList, PageTitle, Pill, Section, TodayAgenda, type Tone } from "./components";
import { countdownFor, greeting, initialsOf, KIND_BADGE, nextClass, relative, todaysAgenda, useStudent, when } from "./helpers";
import { CourseTile, Hero, MarkBar, MarkLegend, NextUp, Ring, RingRow } from "./visuals";
import type { CourseworkState, ResultPeriod, ResultRow, StudentCoursework } from "./types";

const STATE_TONE: Record<CourseworkState, Tone> = {
  Open: "violet", Overdue: "red", Submitted: "cyan", Marked: "green", Scheduled: "gray", "Awaiting marks": "amber",
};

export function StudentHome() {
  const { data, now, base } = useStudent();
  const university = data.organization.model === "University";
  const week = now.getTime() + 7 * 86_400_000;
  const due = data.coursework.filter(item => item.state === "Overdue" || ((item.state === "Open" || item.state === "Scheduled") && item.dueAt && Date.parse(item.dueAt) <= week));
  const current = data.results.find(period => period.termId === data.term?.termId);
  const latestFinal = data.results.find(period => period.rows.length && period.rows.every(row => row.total !== null));
  const upcoming = nextClass(data.timetable, now);
  const today = todaysAgenda(data.timetable, now);
  const handedIn = data.coursework.filter(item => item.state === "Submitted" || item.state === "Marked" || item.state === "Awaiting marks").length;
  const marksOut = (current?.rows ?? []).reduce((sum, row) => sum + Object.keys(row.scores).length, 0);
  const marksExpected = (current?.rows.length ?? 0) * data.scheme.length;
  const where = university ? `${data.profile.level ?? ""} ${data.profile.departmentName ?? ""}`.trim() : `${data.profile.departmentName ?? ""}${data.profile.level ?? ""}`;
  const countdown = upcoming ? countdownFor(upcoming) : null;

  return <div className="ac-page">
    <Hero eyebrow={`Student · ${where}`} title={`${greeting(now)}, ${data.profile.fullName.split(" ")[0]}`}
      meta={data.term ? `${data.term.sessionName} · ${data.term.termName}` : data.organization.name} initials={initialsOf(data.profile.fullName)}>
      {upcoming && countdown ? <NextUp to={`${base}/timetable`} badge={upcoming.entry.code.replace(/^SS\d-/, "").slice(0, 4)} colourKey={upcoming.entry.code}
        label={upcoming.daysAhead === 0 && upcoming.startsIn <= 0 ? "Now" : "Next class"} title={upcoming.entry.title}
        detail={`${upcoming.entry.start}–${upcoming.entry.end} · ${upcoming.entry.venue}`} countdown={countdown.value} countdownLabel={countdown.label} />
        : <NextUp to={`${base}/timetable`} badge="—" colourKey="none" label="Timetable" title="No classes scheduled" detail="Your timetable appears once courses are scheduled." />}
    </Hero>
    <RingRow>
      {university
        ? <Ring label="CGPA" value={data.cgpa ?? 0} max={5} display={data.cgpa?.toFixed(2) ?? "—"} sub={data.cgpa !== null ? degreeClass(data.cgpa) : "No results yet"} />
        : <Ring label="Last term" value={latestFinal?.average ?? 0} max={100} display={latestFinal?.average != null ? `${Math.round(latestFinal.average)}%` : "—"} sub={latestFinal?.position ? `${ordinal(latestFinal.position)} of ${latestFinal.classSize}` : "Average"} />}
      <Ring label="Marks out" value={marksOut} max={Math.max(1, marksExpected)} display={`${marksOut}`} sub={`of ${marksExpected} this ${university ? "semester" : "term"}`} colour="var(--pt-cyan)" />
      <Ring label="Coursework" value={handedIn} max={Math.max(1, data.coursework.length)} display={`${handedIn}/${data.coursework.length}`} sub={due.length ? `${due.length} due this week` : "Nothing due"} colour="var(--pt-green)" />
      <Ring label="Today" value={today.filter(item => item.state === "done").length} max={Math.max(1, today.length)} display={`${today.length}`} sub={today.length ? `${today.filter(item => item.state !== "done").length} still to go` : "No classes"} colour="var(--pt-amber)" />
    </RingRow>
    <div className="pt-split">
      <Section title="Today" action={<Link className="ac-link-btn" to={`${base}/timetable`}>Timetable →</Link>}>
        <TodayAgenda entries={data.timetable} now={now} />
      </Section>
      <Section title="Due soon" action={<Link className="ac-link-btn" to={`${base}/coursework`}>All →</Link>}>
        {due.length ? <ul className="pt-list">{due.slice(0, 5).map(item => (
          <li key={item.itemId} style={{ "--slot": monogramColour(item.code) } as CSSProperties}>
            <span className="pt-kind" aria-hidden="true">{KIND_BADGE[item.kind]}</span>
            <span className="pt-list-main"><strong>{item.title}</strong><small>{item.code} · {when(item.dueAt, now)}</small></span>
            <Pill tone={STATE_TONE[item.state]}>{item.state === "Overdue" ? "Overdue" : relative(item.dueAt, now)}</Pill>
          </li>
        ))}</ul> : <Empty>Nothing due in the next seven days.</Empty>}
      </Section>
    </div>
    <Section title={university ? "My courses" : "My subjects"} action={<Link className="ac-link-btn" to={`${base}/results`}>Results →</Link>}>
      {current?.rows.length ? <div className="pt-tile-grid">{current.rows.map(row => {
        const course = data.courses.find(item => item.offeringId === row.offeringId);
        const out = Object.keys(row.scores).length;
        return <CourseTile key={row.offeringId} code={university ? row.code : row.title.slice(0, 3).toUpperCase()} title={row.title} sub={course?.lecturer ?? undefined} to={`${base}/results`}>
          <MarkBar scheme={data.scheme} scores={row.scores} />
          <span className="pt-tile-foot">
            <span>{row.total !== null ? `Total ${row.total}` : out ? `${caLabel(data.organization.model)} so far ${sumOf(data.scheme, row.scores, "CA")}/30` : "No marks yet"}</span>
            {row.grade ? <Pill tone={row.grade.startsWith("F") ? "red" : "green"}>{row.grade}</Pill> : <span className="pt-muted">{out}/{data.scheme.length} out</span>}
          </span>
        </CourseTile>;
      })}</div> : <Empty>Your {university ? "courses" : "subjects"} appear here once you're registered.</Empty>}
    </Section>
    <div className="pt-desktop-only">
      <Section title="Notifications" action={<Link className="ac-link-btn" to={`${base}/notifications`}>All →</Link>} flush>
        <NotificationList items={data.notifications} limit={4} />
      </Section>
    </div>
  </div>;
}

type Filter = "todo" | "handed" | "marked" | "all";

export function StudentCourseworkPage() {
  const { data, now } = useStudent();
  const [filter, setFilter] = useState<Filter>("todo");
  const [open, setOpen] = useState<StudentCoursework | null>(null);
  const match: Record<Filter, (item: StudentCoursework) => boolean> = {
    todo: item => ["Open", "Overdue", "Scheduled"].includes(item.state),
    handed: item => item.state === "Submitted" || item.state === "Awaiting marks",
    marked: item => item.state === "Marked",
    all: () => true,
  };
  const items = data.coursework.filter(match[filter]);
  const counts = (key: Filter) => data.coursework.filter(match[key]).length;

  return <div className="ac-page">
    <PageTitle title="Coursework" meta={`Tests, assignments and projects that make up your ${caLabel(data.organization.model).toLowerCase()} assessment`} />
    <div className="ac-toolbar">
      <Segmented label="Show" value={filter} onChange={setFilter} options={[
        { value: "todo", label: `To do · ${counts("todo")}` }, { value: "handed", label: `Waiting · ${counts("handed")}` },
        { value: "marked", label: `Marked · ${counts("marked")}` }, { value: "all", label: "All" },
      ]} />
    </div>
    {items.length ? <ul className="pt-work">{items.map(item => (
        <li key={item.itemId}>
          <button type="button" onClick={() => setOpen(item)} style={{ "--slot": monogramColour(item.code) } as CSSProperties}>
            <span className="pt-kind" aria-hidden="true">{KIND_BADGE[item.kind]}</span>
            <span className="pt-list-main"><strong>{item.title}</strong><small>{item.code} · {item.state === "Scheduled" || item.kind === "Test" ? "holds" : "due"} {when(item.dueAt, now)}</small></span>
            {item.mark !== null ? <span className="pt-score">{item.mark}<small>/{item.max}</small></span> : <Pill tone={STATE_TONE[item.state]}>{item.state === "Open" ? relative(item.dueAt, now).replace(/^in /, "Due in ") : item.state}</Pill>}
          </button>
        </li>
      ))}</ul> : <Section title="Nothing here"><Empty>{filter === "todo" ? "You're up to date. New coursework appears here as soon as it's posted." : "Nothing in this list yet."}</Empty></Section>}
    {open && <CourseworkDrawer item={data.coursework.find(entry => entry.itemId === open.itemId) ?? open} onClose={() => setOpen(null)} />}
  </div>;
}

function CourseworkDrawer({ item, onClose }: { item: StudentCoursework; onClose: () => void }) {
  const { session, refresh, notify, now } = useStudent();
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canHandIn = item.acceptsSubmission && (item.state === "Open" || item.state === "Submitted");

  async function handIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await portalApi.handIn(session, item.itemId, { note, fileName });
      await refresh();
      notify("Handed in. Your lecturer can see it now.");
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't hand this in."); }
    finally { setBusy(false); }
  }

  return <Drawer title={item.title} onClose={onClose} footer={canHandIn ? <>
    <button className="dz-btn-outline" onClick={onClose}>Cancel</button>
    <button className="dz-btn-green" form="hand-in" disabled={busy || (!note.trim() && !fileName)}>{busy ? "Handing in…" : item.submission ? "Hand in again" : "Hand in"}</button>
  </> : undefined}>
    <dl className="ac-dl pt-dl">
      <div><dt>Course</dt><dd>{item.code}</dd></div>
      <div><dt>Type</dt><dd>{item.kind} · counts for {item.max} marks</dd></div>
      <div><dt>{item.kind === "Test" ? "Holds" : "Due"}</dt><dd>{when(item.dueAt, now)} ({relative(item.dueAt, now)})</dd></div>
      <div><dt>Status</dt><dd><Pill tone={STATE_TONE[item.state]}>{item.state}</Pill></dd></div>
      {item.mark !== null && <div><dt>Mark</dt><dd><strong>{item.mark}</strong> / {item.max}</dd></div>}
    </dl>
    {item.instructions && <><h3 className="pt-h3">Instructions</h3><p className="pt-prose">{item.instructions}</p></>}
    {item.submission && <><h3 className="pt-h3">Your hand-in</h3>
      <p className="pt-prose">Handed in {when(item.submission.submittedAt, now)}{item.submission.fileName ? <> · <span className="ac-mono">{item.submission.fileName}</span></> : null}</p>
      {item.submission.note && <p className="pt-prose pt-quote">{item.submission.note}</p>}</>}
    {!item.acceptsSubmission && <p className="ac-hint">Tests are written in class. Your mark appears here once your lecturer publishes it.</p>}
    {item.state === "Overdue" && <p className="ac-notice ac-notice-warn">The deadline has passed. Speak to your lecturer if you have a good reason.</p>}
    {canHandIn && <form id="hand-in" className="pt-form" onSubmit={event => void handIn(event)}>
      {error && <p className="ac-error" role="alert">{error}</p>}
      <label className="ac-field"><span className="ac-label">File</span>
        <input className="input" type="file" onChange={event => setFileName(event.target.files?.[0]?.name ?? null)} />
        <small className="ac-hint">In this demo only the file name is kept.</small>
      </label>
      <label className="ac-field"><span className="ac-label">Answer or note to your lecturer <small>(optional with a file)</small></span>
        <textarea className="input" rows={5} value={note} onChange={event => setNote(event.target.value)} maxLength={4000} />
      </label>
    </form>}
  </Drawer>;
}

export function StudentResultsPage() {
  const { data } = useStudent();
  const [termId, setTermId] = useState(() => data.results[0]?.termId ?? "");
  const period = data.results.find(item => item.termId === termId) ?? data.results[0];
  const university = data.organization.model === "University";

  if (!period) return <div className="ac-page">
    <PageTitle title="Results" />
    <Section title="Nothing yet"><Empty>Your results will appear here once your lecturers start publishing marks.</Empty></Section>
  </div>;

  return <div className="ac-page pt-printable">
    <PageTitle title={university ? "Results" : "Report card"}
      meta={`${data.profile.fullName} · ${data.profile.matriculationNumber}`}
      actions={<>
        <label className="ac-session-pill"><span className="sr-only">Period</span>
          <select value={period.termId} onChange={event => setTermId(event.target.value)} aria-label={university ? "Semester" : "Term"}>
            {data.results.map(item => <option key={item.termId} value={item.termId}>{item.sessionName} · {item.termName}</option>)}
          </select>
        </label>
        <button className="dz-btn-outline" onClick={() => window.print()}>Print</button>
      </>} />
    <PeriodSummary period={period} university={university} cgpa={data.cgpa} />
    <h2 className="pt-period-title">{period.sessionName} · {period.termName} · {university ? period.level : `${data.profile.departmentName ?? ""} ${period.level}`.trim()}</h2>
    <ResultCards period={period} />
    {period.remark && <Section title={university ? "Level adviser's comment" : "Form teacher's comment"}><p className="pt-prose pt-quote">{period.remark}</p></Section>}
    <GradeKey />
  </div>;
}

function PeriodSummary({ period, university, cgpa }: { period: ResultPeriod; university: boolean; cgpa: number | null }) {
  const pending = period.rows.filter(row => row.total === null).length;
  const passed = period.rows.filter(row => row.grade && !row.grade.startsWith("F")).length;
  if (university) return <RingRow>
    <Ring label="Semester GPA" value={period.gpa ?? 0} max={5} display={period.gpa?.toFixed(2) ?? "—"} sub={pending ? `${pending} pending` : "Final"} />
    <Ring label="CGPA" value={cgpa ?? 0} max={5} display={cgpa?.toFixed(2) ?? "—"} sub={cgpa !== null ? degreeClass(cgpa) : "—"} colour="var(--pt-cyan)" />
    <Ring label="Units passed" value={period.unitsPassed} max={Math.max(1, period.unitsTaken)} display={pending ? "—" : `${period.unitsPassed}`} sub={`of ${period.unitsTaken} units`} colour="var(--pt-green)" />
    <Ring label="Courses" value={period.rows.length - pending} max={Math.max(1, period.rows.length)} display={`${period.rows.length}`} sub={pending ? `${period.rows.length - pending} graded` : "All graded"} colour="var(--pt-amber)" />
  </RingRow>;
  return <RingRow>
    <Ring label="Average" value={period.average ?? 0} max={100} display={period.average !== null ? `${Math.round(period.average)}%` : "—"} sub={pending ? `${pending} pending` : "All subjects"} />
    <Ring label="Position" value={period.position ? period.classSize - period.position + 1 : 0} max={Math.max(1, period.classSize)} display={period.position ? ordinal(period.position) : "—"} sub={period.classSize ? `out of ${period.classSize}` : "—"} colour="var(--pt-cyan)" />
    <Ring label="Passed" value={passed} max={Math.max(1, period.rows.length)} display={pending ? "—" : `${passed}/${period.rows.length}`} sub="subjects" colour="var(--pt-green)" />
    <Ring label="Subjects" value={period.rows.length - pending} max={Math.max(1, period.rows.length)} display={`${period.rows.length}`} sub={pending ? `${period.rows.length - pending} graded` : "All graded"} colour="var(--pt-amber)" />
  </RingRow>;
}

/** One card per course: grade badge, the mark bar, and each assessment's mark. */
function ResultCards({ period }: { period: ResultPeriod }) {
  const { data } = useStudent();
  const university = data.organization.model === "University";
  const gradeClass = (row: ResultRow) => !row.grade ? "is-pending" : row.grade.startsWith("F") ? "is-fail" : row.grade.startsWith("A") ? "is-top" : "is-pass";
  const detail = (row: ResultRow) => row.total === null
    ? (row.status === "Not started" ? "Awaiting marks" : "Marks coming in")
    : [row.remark, row.position ? `${ordinal(row.position)} of ${row.classSize}` : null, row.classAverage !== null ? `class average ${row.classAverage}` : null].filter(Boolean).join(" · ");
  return <div className="pt-result-list">
    <MarkLegend scheme={data.scheme} />
    {period.rows.map(row => <article key={row.offeringId} className="pt-result" style={{ "--slot": monogramColour(university ? row.code : row.title) } as CSSProperties}>
      <div className="pt-result-top">
        <div className="pt-result-name">
          <strong>{university ? `${row.code} · ` : ""}{row.title}</strong>
          <small>{university ? `${row.units} units · ` : ""}{detail(row)}</small>
        </div>
        <span className={`pt-grade ${gradeClass(row)}`}>{row.grade ?? "Not final"}</span>
      </div>
      <MarkBar scheme={data.scheme} scores={row.scores} />
      <div className="pt-result-parts">
        {data.scheme.map(component => <span key={component.key}>{component.label} <b>{typeof row.scores[component.key] === "number" ? row.scores[component.key] : "—"}</b>/{component.max}</span>)}
        <span>{caLabel(data.organization.model)} <b>{row.ca ?? "—"}</b>/30</span>
        <span>Total <b>{row.total ?? "—"}</b>/100</span>
      </div>
    </article>)}
  </div>;
}

function GradeKey() {
  const { data } = useStudent();
  const university = data.organization.model === "University";
  const scale = gradeScale(data.organization.model);
  return <details className="dz-card pt-key">
    <summary>How grades work</summary>
    <p className="ac-hint">{caLabel(data.organization.model)} is {data.scheme.filter(item => item.part === "CA").map(item => `${item.label.toLowerCase()} (${item.max})`).join(", ")} = 30 marks. The exam is 70. Marks show here as soon as your {university ? "lecturer" : "teacher"} publishes them; your grade appears once the final result is submitted.</p>
    <div className="pt-key-grid">{scale.map((band, index) => <span key={band.grade}><strong>{band.grade}</strong> {band.min}–{index === 0 ? 100 : scale[index - 1].min - 1}{university ? ` · ${band.points} pts` : ""} · {band.remark}</span>)}</div>
  </details>;
}
