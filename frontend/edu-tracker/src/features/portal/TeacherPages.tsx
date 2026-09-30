/* Teaching staff portal: overview, classes, coursework and the result-upload index. */
import { useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { caLabel } from "../assessment/scheme";
import { Drawer, Meter } from "../academics/ui";
import { portalApi } from "./api";
import { Empty, NotificationList, PageTitle, Pill, Section, TodayAgenda } from "./components";
import { countdownFor, greeting, initialsOf, nextClass, relative, SHEET_TONE, sheetLabel, todaysAgenda, useTeacher, when, WEEKDAYS } from "./helpers";
import { CourseTile, Hero, NextUp, Ring, RingRow } from "./visuals";
import type { TeacherClass } from "./types";

const ATTENTION_BADGE: Record<string, string> = { mark: "MARK", hand: "IN", start: "NEW" };

export function TeacherHome() {
  const { data, now, base } = useTeacher();
  const university = data.organization.model === "University";
  const surname = data.profile.fullName.split(" ").at(-1);
  const upcoming = nextClass(data.timetable, now);
  const countdown = upcoming ? countdownFor(upcoming) : null;
  const today = todaysAgenda(data.timetable, now);
  const submitted = data.classes.filter(item => item.status === "Submitted").length;
  const entered = data.classes.reduce((sum, item) => sum + item.entered, 0);
  const expected = data.classes.reduce((sum, item) => sum + item.expected, 0);
  const handIns = data.coursework.reduce((sum, item) => sum + item.submissions, 0);
  const handInSlots = data.coursework.filter(item => item.kind !== "Test").reduce((sum, item) => sum + item.enrolled, 0);

  // Things only the lecturer can move forward.
  const attention: { key: string; kind: string; code: string; text: string; detail: string; to: string }[] = [];
  for (const item of data.coursework) {
    const due = item.dueAt ? Date.parse(item.dueAt) : Infinity;
    const cls = data.classes.find(entry => entry.offeringId === item.offeringId);
    if (!cls || cls.published[item.componentKey] || due > now.getTime()) continue;
    attention.push({ key: `mark-${item.itemId}`, kind: "mark", code: item.code, text: `Mark and publish ${item.code} ${item.kind.toLowerCase()}`, detail: item.kind === "Test" ? `${item.title} · held ${relative(item.dueAt, now)}` : `${item.submissions} of ${item.enrolled} handed in`, to: `${base}/results/${item.offeringId}` });
  }
  for (const item of data.coursework) {
    const cls = data.classes.find(entry => entry.offeringId === item.offeringId);
    if (!cls || cls.published[item.componentKey] || !item.submissions || (item.dueAt && Date.parse(item.dueAt) < now.getTime())) continue;
    attention.push({ key: `hand-${item.itemId}`, kind: "hand", code: item.code, text: `${item.submissions} hand-in${item.submissions === 1 ? "" : "s"} for ${item.code}`, detail: `${item.title} · due ${when(item.dueAt, now)}`, to: `${base}/classes/${item.offeringId}` });
  }
  for (const cls of data.classes) if (cls.status === "Not started" && cls.enrolled) {
    attention.push({ key: `start-${cls.offeringId}`, kind: "start", code: cls.code, text: `No marks yet for ${cls.code}`, detail: `${cls.enrolled} students waiting`, to: `${base}/results/${cls.offeringId}` });
  }

  return <div className="ac-page">
    <Hero eyebrow={[data.profile.rank, data.profile.unitName].filter(Boolean).join(" · ") || "Teaching staff"}
      title={`${greeting(now)}, ${data.profile.title} ${surname}`.replace("  ", " ")}
      meta={data.term ? `${data.term.sessionName} · ${data.term.termName}` : data.organization.name} initials={initialsOf(data.profile.fullName)}>
      {upcoming && countdown ? <NextUp to={`${base}/timetable`} badge={upcoming.entry.code.replace(/^SS\d-/, "").slice(0, 4)} colourKey={upcoming.entry.code}
        label={upcoming.daysAhead === 0 && upcoming.startsIn <= 15 ? "Starting soon" : "Next class"} title={`${upcoming.entry.code} · ${upcoming.entry.title}`}
        detail={`${upcoming.entry.start}–${upcoming.entry.end} · ${upcoming.entry.venue} · ${upcoming.entry.detail}`} countdown={countdown.value} countdownLabel={countdown.label} />
        : <NextUp to={`${base}/timetable`} badge="—" colourKey="none" label="Timetable" title="No classes scheduled" detail="Your classes appear here once they're on the timetable." />}
    </Hero>
    <RingRow>
      <Ring label="Results submitted" value={submitted} max={Math.max(1, data.classes.length)} display={`${submitted}/${data.classes.length}`} sub={university ? "courses" : "classes"} colour="var(--pt-green)" />
      <Ring label="Marks entered" value={entered} max={Math.max(1, expected)} display={`${expected ? Math.round((entered / expected) * 100) : 0}%`} sub={`${entered} of ${expected}`} />
      <Ring label="Hand-ins" value={handIns} max={Math.max(1, handInSlots)} display={`${handIns}`} sub="to look at" colour="var(--pt-cyan)" />
      <Ring label="Today" value={today.filter(item => item.state === "done").length} max={Math.max(1, today.length)} display={`${today.length}`} sub={today.length ? `${today.filter(item => item.state !== "done").length} still to teach` : "No classes"} colour="var(--pt-amber)" />
    </RingRow>
    <div className="pt-split">
      <Section title="Today" action={<Link className="ac-link-btn" to={`${base}/timetable`}>Timetable →</Link>}>
        <TodayAgenda entries={data.timetable} now={now} />
      </Section>
      <Section title="Needs your attention">
        {attention.length ? <ul className="pt-list">{attention.slice(0, 6).map(item => (
          <li key={item.key} style={{ "--slot": item.kind === "mark" ? "#fbbf24" : item.kind === "hand" ? "#a78bfa" : "#94a3b8" } as CSSProperties}><Link to={item.to} className="pt-list-link">
            <span className="pt-kind" aria-hidden="true">{ATTENTION_BADGE[item.kind]}</span>
            <span className="pt-list-main"><strong>{item.text}</strong><small>{item.detail}</small></span>
            <span aria-hidden="true" className="ac-arrow">→</span>
          </Link></li>
        ))}</ul> : <Empty>Nothing waiting on you.</Empty>}
      </Section>
    </div>
    <Section title={university ? "My courses" : "My classes"} action={<Link className="ac-link-btn" to={`${base}/classes`}>All →</Link>}>
      <ClassTiles />
    </Section>
    <div className="pt-desktop-only">
      <Section title="Notifications" action={<Link className="ac-link-btn" to={`${base}/notifications`}>All →</Link>} flush>
        <NotificationList items={data.notifications} limit={4} />
      </Section>
    </div>
  </div>;
}

/** Colour tiles for each class: status, how many marks are in, and the average once there is one. */
function ClassTiles() {
  const { data, base } = useTeacher();
  const university = data.organization.model === "University";
  if (!data.classes.length) return <Empty>When your head of department assigns you a {university ? "course" : "subject"}, it appears here.</Empty>;
  return <div className="pt-tile-grid">{data.classes.map(item => {
    const percent = item.expected ? Math.round((item.entered / item.expected) * 100) : 0;
    return <CourseTile key={item.offeringId} to={`${base}/classes/${item.offeringId}`} code={university ? item.code : `${item.departmentName} ${item.levelKey}`} title={item.title}
      sub={`${university ? `${item.levelKey} · ` : ""}${item.enrolled} students · ${item.termName}`}>
      <span className="pt-progress"><Meter value={item.entered} max={Math.max(1, item.expected)} label="Marks entered" /></span>
      <span className="pt-tile-foot">
        <span>{item.average !== null ? `Average ${item.average} · ${item.passRate}% pass` : `${percent}% of marks in`}</span>
        <Pill tone={SHEET_TONE[item.status]}>{sheetLabel(item.status)}</Pill>
      </span>
    </CourseTile>;
  })}</div>;
}

export function TeacherClassesPage() {
  const { data } = useTeacher();
  const university = data.organization.model === "University";
  return <div className="ac-page">
    <PageTitle eyebrow={data.term ? `${data.term.sessionName} · ${data.term.termName}` : undefined} title={university ? "My courses" : "My classes"} meta={`${data.classes.length} assigned to you`} />
    <ClassTiles />
  </div>;
}

export function TeacherClassPage() {
  const { offeringId = "" } = useParams();
  const { data, base, now } = useTeacher();
  const [posting, setPosting] = useState(false);
  const cls = data.classes.find(item => item.offeringId === offeringId);
  const university = data.organization.model === "University";
  if (!cls) return <section className="dz-card ac-empty"><h2>This class isn't yours</h2><p>It may belong to another lecturer or a past session.</p><div className="ac-actions"><Link className="dz-btn-outline" to={`${base}/classes`}>Back to classes</Link></div></section>;
  const work = data.coursework.filter(item => item.offeringId === offeringId);
  const slots = data.timetable.filter(item => item.offeringId === offeringId);

  return <div className="ac-page">
    <nav className="ac-breadcrumb" aria-label="Breadcrumb"><Link to={`${base}/classes`}>{university ? "My courses" : "My classes"}</Link><span className="ac-crumb-sep">/</span><span aria-current="page">{cls.code}</span></nav>
    <PageTitle title={cls.title}
      meta={[university ? cls.code : null, `${cls.departmentName} ${cls.levelKey}`, cls.termName, `${cls.enrolled} students`].filter(Boolean).join(" · ")}
      actions={<>
        {!cls.termClosed && cls.status !== "Submitted" && <button className="dz-btn-outline" onClick={() => setPosting(true)}>Post coursework</button>}
        <Link className="dz-btn-green" to={`${base}/results/${offeringId}`}>{cls.status === "Submitted" ? "View results" : "Open result sheet"}</Link>
      </>} />
    <ClassHealth cls={cls} />
    <div className="pt-split">
      <Section title="Coursework">
        {work.length ? <ul className="pt-list">{work.map(item => (
          <li key={item.itemId}>
            <span className="pt-list-main"><strong>{item.title}</strong><small>{item.kind} · {item.kind === "Test" ? "holds" : "due"} {when(item.dueAt, now)}{item.kind !== "Test" ? ` · ${item.submissions}/${item.enrolled} handed in` : ""}</small></span>
            {cls.published[item.componentKey] ? <Pill tone="green">Published</Pill> : item.dueAt && Date.parse(item.dueAt) < now.getTime() ? <Pill tone="amber">To mark</Pill> : <Pill tone="gray">{relative(item.dueAt, now)}</Pill>}
          </li>
        ))}</ul> : <Empty>Nothing posted yet. Students see coursework as soon as you post it.</Empty>}
      </Section>
      <Section title="When it meets">
        {slots.length ? <ul className="pt-list">{slots.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)).map(item => (
          <li key={item.slotId}><span className="pt-list-main"><strong>{WEEKDAYS[item.day]} {item.start}–{item.end}</strong><small>{item.venue}</small></span></li>
        ))}</ul> : <Empty>Not on the timetable this {university ? "semester" : "term"}.</Empty>}
      </Section>
    </div>
    {posting && <PostCourseworkDrawer cls={cls} onClose={() => setPosting(false)} />}
  </div>;
}

/** How the course is doing: marks in, what's published, and the grade spread once final. */
function ClassHealth({ cls }: { cls: TeacherClass }) {
  const { data } = useTeacher();
  const peak = Math.max(1, ...cls.distribution.map(item => item.count));
  return <Section title="How the class is doing">
    <div className="pt-health">
      <div>
        <h3 className="pt-h3">{caLabel(data.organization.model)} and exam</h3>
        <ul className="pt-components">{data.scheme.map(component => (
          <li key={component.key}>
            <span>{component.label} <small>/{component.max}</small></span>
            {cls.published[component.key] ? <Pill tone="green">Published</Pill> : <Pill tone="gray">Not published</Pill>}
          </li>
        ))}</ul>
        <p className="ac-hint">{cls.entered} of {cls.expected} marks entered.</p>
      </div>
      <div>
        <h3 className="pt-h3">Outcome</h3>
        {cls.average !== null ? <>
          <p className="pt-big">{cls.average}<small> average</small></p>
          <p className="ac-hint">{cls.passRate}% passed{cls.status !== "Submitted" ? " so far (students with every mark)" : ""}</p>
          <div className="pt-bars" role="img" aria-label="Grade distribution">{cls.distribution.slice().sort((a, b) => a.grade.localeCompare(b.grade)).map(item => (
            <span key={item.grade} title={`${item.grade}: ${item.count}`}><i style={{ height: `${(item.count / peak) * 100}%` }} /><b>{item.grade}</b><small>{item.count}</small></span>
          ))}</div>
        </> : <Empty>Averages appear once students have every mark.</Empty>}
      </div>
    </div>
  </Section>;
}

function PostCourseworkDrawer({ cls, onClose }: { cls: TeacherClass; onClose: () => void }) {
  const { data, session, refresh, notify } = useTeacher();
  const components = data.scheme.filter(item => item.part === "CA" && !cls.published[item.key]);
  const [componentKey, setComponentKey] = useState(components.find(item => item.kind !== "Test")?.key ?? components[0]?.key ?? "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const component = data.scheme.find(item => item.key === componentKey);

  async function post(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await portalApi.postCoursework(session, { offeringId: cls.offeringId, componentKey, title, instructions, dueAt: new Date(dueAt).toISOString() });
      await refresh();
      notify(`Posted. ${cls.enrolled} students have been notified.`);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't post this."); }
    finally { setBusy(false); }
  }

  return <Drawer title={`Post coursework · ${cls.code}`} onClose={onClose} footer={<>
    <button className="dz-btn-outline" onClick={onClose}>Cancel</button>
    <button className="dz-btn-green" form="post-work" disabled={busy || !title.trim() || !dueAt || !componentKey}>{busy ? "Posting…" : "Post and notify students"}</button>
  </>}>
    {components.length ? <form id="post-work" className="pt-form" onSubmit={event => void post(event)}>
      {error && <p className="ac-error" role="alert">{error}</p>}
      <label className="ac-field"><span className="ac-label">Counts toward</span>
        <select className="input" value={componentKey} onChange={event => setComponentKey(event.target.value)}>
          {components.map(item => <option key={item.key} value={item.key}>{item.label} ({item.max} marks)</option>)}
        </select>
      </label>
      <label className="ac-field"><span className="ac-label">Title</span>
        <input className="input" value={title} onChange={event => setTitle(event.target.value)} maxLength={120} placeholder={component?.kind === "Test" ? "e.g. Test 1: chapters 1–3" : "e.g. Assignment 2: linked lists"} required />
      </label>
      <label className="ac-field"><span className="ac-label">{component?.kind === "Test" ? "Date and time of the test" : "Due"}</span>
        <input className="input" type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} required />
      </label>
      <label className="ac-field"><span className="ac-label">Instructions <small>(optional)</small></span>
        <textarea className="input" rows={5} value={instructions} onChange={event => setInstructions(event.target.value)} maxLength={2000} />
      </label>
      <p className="ac-hint">{component?.kind === "Test" ? "Students are told when and where the test holds." : "Students hand in through their portal before the deadline."} The mark goes in the {component?.label} column of your result sheet.</p>
    </form> : <p className="ac-hint">Every in-course component for this class is already published.</p>}
  </Drawer>;
}

export function TeacherResultsPage() {
  const { data, base } = useTeacher();
  const university = data.organization.model === "University";
  const scheme = data.scheme.map(item => `${item.label} ${item.max}`).join(" · ");
  return <div className="ac-page">
    <PageTitle title="Result upload" meta={`${data.term?.sessionName ?? ""} · ${scheme}`} />
    <p className="ac-notice ac-notice-muted">Enter marks on the sheet or upload the CSV template. Publish {caLabel(data.organization.model).toLowerCase()} marks as you finish them; submit the final result once the exam is marked. Submitted results go to your department and students see their grades.</p>
    <div className="pt-tile-grid">{data.classes.map(item => {
      const published = data.scheme.filter(component => item.published[component.key]).map(component => component.label);
      return <CourseTile key={item.offeringId} to={`${base}/results/${item.offeringId}`} code={university ? item.code : `${item.departmentName} ${item.levelKey}`} title={item.title}
        sub={`${university ? `${item.levelKey} · ` : ""}${item.enrolled} students · ${item.termName}`}>
        <span className="pt-progress"><Meter value={item.entered} max={Math.max(1, item.expected)} label="Marks entered" /><small>{item.expected ? Math.round((item.entered / item.expected) * 100) : 0}% of marks in · {published.length ? `published: ${published.join(", ")}` : "nothing published yet"}</small></span>
        <span className="pt-tile-foot">
          <Pill tone={SHEET_TONE[item.status]}>{sheetLabel(item.status)}</Pill>
          <span className="ac-link-btn">{item.status === "Submitted" ? "View results" : "Open sheet"} →</span>
        </span>
      </CourseTile>;
    })}</div>
    {!data.classes.length && <Section title="Nothing assigned"><Empty>No courses assigned this session.</Empty></Section>}
  </div>;
}
