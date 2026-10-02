/**
 * Non-teaching staff portal: registry, bursary, library, works, ICT and
 * laboratory staff. What they come to the portal for: where they are on
 * duty, their leave, the tasks assigned to them, notices from management,
 * and their service record (cadre, grade level, confirmation, promotion).
 */
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Drawer, Segmented } from "../academics/ui";
import { portalApi } from "./api";
import { Empty, NotificationList, PageTitle, Pill, Section, type Tone } from "./components";
import { dateOnly, duration, greeting, initialsOf, minutes, minutesOf, relative, useNonTeaching, WEEKDAYS, workingDays } from "./helpers";
import { Hero, NextUp, Ring, RingRow } from "./visuals";
import type { LeaveStatus, LeaveType, TaskStatus, WorkTask } from "./types";

const LEAVE_TONE: Record<LeaveStatus, Tone> = { Pending: "amber", Approved: "green", Declined: "red" };
const TASK_TONE: Record<TaskStatus, Tone> = { Open: "gray", "In progress": "violet", Done: "green" };
const PRIORITY_TONE: Record<WorkTask["priority"], Tone> = { Low: "gray", Normal: "cyan", Urgent: "red" };
const PRIORITY_COLOUR: Record<WorkTask["priority"], string> = { Low: "#94a3b8", Normal: "#22d3ee", Urgent: "#f87171" };

export function StaffHome() {
  const { data, now, base } = useNonTeaching();
  const { profile, leave } = data;
  const today = data.duties.filter(duty => duty.day === now.getDay()).sort((a, b) => a.start.localeCompare(b.start));
  const clock = minutesOf(now);
  const onDutyNow = today.find(duty => clock >= minutes(duty.start) && clock < minutes(duty.end));
  const nextShift = today.find(duty => minutes(duty.start) > clock);
  const shift = onDutyNow ?? nextShift ?? today[0];
  const openTasks = data.tasks.filter(task => task.status !== "Done");
  const doneTasks = data.tasks.length - openTasks.length;
  const pending = leave.requests.filter(request => request.status === "Pending").length;

  const countdown = onDutyNow ? { value: duration(minutes(onDutyNow.end) - clock), label: "left on shift" }
    : nextShift ? { value: duration(minutes(nextShift.start) - clock), label: "until your shift" } : undefined;

  return <div className="ac-page">
    <Hero eyebrow={[profile.cadre, profile.unitName].filter(Boolean).join(" · ")}
      title={`${greeting(now)}, ${profile.title} ${profile.fullName.split(" ").at(-1)}`.trim()}
      meta={`${profile.salaryScale} ${String(profile.gradeLevel).padStart(2, "0")}, step ${profile.step}`} initials={initialsOf(profile.fullName)}>
      {shift ? <NextUp to={`${base}/roster`} badge="DUTY" colourKey={shift.location}
        label={onDutyNow ? "On duty now" : nextShift ? "Today's duty" : "Shift finished"} title={shift.role}
        detail={`${shift.start}–${shift.end} · ${shift.location}`} countdown={countdown?.value} countdownLabel={countdown?.label} />
        : <NextUp to={`${base}/roster`} badge="OFF" colourKey="off" label="Today" title="You're not on the roster today" detail="See the week on your duty roster." />}
    </Hero>
    <RingRow>
      <Ring label="Annual leave left" value={leave.remaining} max={leave.annualEntitlement} display={`${leave.remaining}`} sub={`of ${leave.annualEntitlement} working days`} colour="var(--pt-green)" />
      <Ring label="Tasks done" value={doneTasks} max={Math.max(1, data.tasks.length)} display={`${doneTasks}/${data.tasks.length}`} sub={openTasks.some(task => task.priority === "Urgent") ? `${openTasks.filter(task => task.priority === "Urgent").length} urgent open` : `${openTasks.length} open`} />
      <Ring label="Leave requests" value={pending} max={Math.max(1, leave.requests.length)} display={`${pending}`} sub="awaiting approval" colour="var(--pt-amber)" />
      <Ring label="Grade level" value={profile.gradeLevel} max={17} display={String(profile.gradeLevel).padStart(2, "0")} sub={profile.nextPromotionDue ? `promotion ${dateOnly(profile.nextPromotionDue)}` : `step ${profile.step}`} colour="var(--pt-cyan)" />
    </RingRow>
    <div className="pt-split">
      <Section title="Your tasks" action={<Link className="ac-link-btn" to={`${base}/tasks`}>All →</Link>}>
        {openTasks.length ? <ul className="pt-list">{openTasks.slice(0, 5).map(task => (
          <li key={task.taskId} style={{ "--slot": PRIORITY_COLOUR[task.priority] } as CSSProperties}>
            <span className="pt-kind" aria-hidden="true">{task.priority === "Urgent" ? "!" : task.status === "In progress" ? "…" : "•"}</span>
            <span className="pt-list-main"><strong>{task.title}</strong><small>{task.requestedBy}{task.dueOn ? ` · due ${dateOnly(task.dueOn)}` : ""}</small></span>
            <Pill tone={task.priority === "Urgent" ? "red" : TASK_TONE[task.status]}>{task.priority === "Urgent" ? "Urgent" : task.status}</Pill>
          </li>
        ))}</ul> : <Empty>No open tasks.</Empty>}
      </Section>
      <Section title="Notices" action={<Link className="ac-link-btn" to={`${base}/notifications`}>All →</Link>} flush>
        <NotificationList items={data.notifications} limit={4} />
      </Section>
    </div>
    {profile.nextPromotionDue && <p className="ac-notice ac-notice-muted">Your next promotion review is due on {dateOnly(profile.nextPromotionDue)} ({relative(`${profile.nextPromotionDue}T00:00:00`, now)}). Keep your appraisal and certificates up to date with the registry.</p>}
  </div>;
}

export function DutyRosterPage() {
  const { data, now } = useNonTeaching();
  const days = [1, 2, 3, 4, 5, 6] as const;
  const hours = data.duties.reduce((sum, duty) => sum + minutes(duty.end) - minutes(duty.start), 0) / 60;
  return <div className="ac-page">
    <PageTitle title="Duty roster" meta={`${data.duties.length} shift${data.duties.length === 1 ? "" : "s"} · ${hours} hours a week`} />
    <Section title="This week" flush>
      {data.duties.length ? <ul className="pt-roster">{days.map(day => {
        const shifts = data.duties.filter(duty => duty.day === day).sort((a, b) => a.start.localeCompare(b.start));
        if (!shifts.length && day === 6) return null;
        return <li key={day} className={day === now.getDay() ? "is-today" : ""}>
          <span className="pt-roster-day">{WEEKDAYS[day]}{day === now.getDay() && <small>Today</small>}</span>
          <span className="pt-roster-shifts">{shifts.length ? shifts.map(duty => (
            <span key={duty.dutyId}><strong>{duty.start}–{duty.end}</strong> {duty.location} · {duty.role}</span>
          )) : <span className="pt-muted">Off</span>}</span>
        </li>;
      })}</ul> : <Empty>You haven't been put on the roster yet. Your supervisor sets it.</Empty>}
    </Section>
    <p className="ac-hint">Need to swap a shift? Ask {data.profile.supervisor ?? "your supervisor"}. Changes to the roster appear here.</p>
  </div>;
}

const LEAVE_TYPES: { value: LeaveType; hint: string }[] = [
  { value: "Annual", hint: "Comes out of your yearly entitlement." },
  { value: "Casual", hint: "Up to 7 working days for personal matters." },
  { value: "Sick", hint: "Attach a medical certificate from the school clinic when you return." },
  { value: "Study", hint: "Needs approval from the registry and proof of admission." },
  { value: "Maternity", hint: "16 weeks with full pay." },
  { value: "Compassionate", hint: "For bereavement or serious family emergencies." },
];

export function LeavePage() {
  const { data } = useNonTeaching();
  const [requesting, setRequesting] = useState(false);
  const { leave } = data;
  return <div className="ac-page">
    <PageTitle title="Leave" meta={`${new Date().getFullYear()} · grade level ${String(data.profile.gradeLevel).padStart(2, "0")}`}
      actions={<button className="dz-btn-green" onClick={() => setRequesting(true)}>Request leave</button>} />
    <RingRow>
      <Ring label="Left" value={leave.remaining} max={leave.annualEntitlement} display={`${leave.remaining}`} sub="working days" colour="var(--pt-green)" />
      <Ring label="Taken" value={leave.used} max={leave.annualEntitlement} display={`${leave.used}`} sub={`of ${leave.annualEntitlement}`} />
      <Ring label="Awaiting approval" value={leave.pending} max={leave.annualEntitlement} display={`${leave.pending}`} sub="days" colour="var(--pt-amber)" />
      <Ring label="Requests" value={leave.requests.length} max={Math.max(1, leave.requests.length)} display={`${leave.requests.length}`} sub="this year and before" colour="var(--pt-cyan)" />
    </RingRow>
    <Section title="Requests">
      {leave.requests.length ? <ul className="pt-leave-list">{leave.requests.map(request => (
        <li key={request.requestId}>
          <span className="pt-leave-days"><b>{request.days}</b><small>day{request.days === 1 ? "" : "s"}</small></span>
          <span className="pt-list-main">
            <strong>{request.type} leave</strong>
            <small>{dateOnly(request.startsOn)} – {dateOnly(request.endsOn)}</small>
            <small>{request.reason}</small>
          </span>
          <Pill tone={LEAVE_TONE[request.status]}>{request.status}</Pill>
        </li>
      ))}</ul> : <Empty>No leave requests yet.</Empty>}
    </Section>
    <p className="ac-hint">Annual leave is 30 working days a year from grade level 07, and 21 below it. Weekends aren't counted; public holidays inside your leave are added back by the registry.</p>
    {requesting && <LeaveDrawer onClose={() => setRequesting(false)} />}
  </div>;
}

function LeaveDrawer({ onClose }: { onClose: () => void }) {
  const { data, session, refresh, notify } = useNonTeaching();
  const [type, setType] = useState<LeaveType>("Annual");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const days = startsOn && endsOn ? workingDays(startsOn, endsOn) : 0;
  const over = type === "Annual" && days > data.leave.remaining;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await portalApi.requestLeave(session, { type, startsOn, endsOn, reason });
      await refresh();
      notify(`Leave requested. ${data.profile.supervisor ?? "Your supervisor"} has been notified.`);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't send this request."); }
    finally { setBusy(false); }
  }

  return <Drawer title="Request leave" onClose={onClose} footer={<>
    <button className="dz-btn-outline" onClick={onClose}>Cancel</button>
    <button className="dz-btn-green" form="leave-form" disabled={busy || !days || !reason.trim() || over}>{busy ? "Sending…" : "Send request"}</button>
  </>}>
    <form id="leave-form" className="pt-form" onSubmit={event => void submit(event)}>
      {error && <p className="ac-error" role="alert">{error}</p>}
      <label className="ac-field"><span className="ac-label">Type</span>
        <select className="input" value={type} onChange={event => setType(event.target.value as LeaveType)}>
          {LEAVE_TYPES.map(item => <option key={item.value} value={item.value}>{item.value} leave</option>)}
        </select>
        <small className="ac-hint">{LEAVE_TYPES.find(item => item.value === type)?.hint}</small>
      </label>
      <div className="ac-form-grid">
        <label className="ac-field"><span className="ac-label">First day</span><input className="input" type="date" value={startsOn} onChange={event => setStartsOn(event.target.value)} required /></label>
        <label className="ac-field"><span className="ac-label">Last day</span><input className="input" type="date" value={endsOn} min={startsOn || undefined} onChange={event => setEndsOn(event.target.value)} required /></label>
      </div>
      {startsOn && endsOn && <p className={`ac-notice ${over ? "ac-notice-warn" : "ac-notice-muted"}`}>
        {days ? `${days} working day${days === 1 ? "" : "s"}` : "Those dates fall on a weekend."}
        {type === "Annual" && days > 0 && (over ? ` — more than the ${data.leave.remaining} you have left.` : ` · ${data.leave.remaining - days} left afterwards.`)}
      </p>}
      <label className="ac-field"><span className="ac-label">Reason</span><textarea className="input" rows={3} value={reason} onChange={event => setReason(event.target.value)} maxLength={500} required /></label>
    </form>
  </Drawer>;
}

export function TasksPage() {
  const { data, session, refresh, notify, now } = useNonTeaching();
  const [filter, setFilter] = useState<"open" | "done">("open");
  const [saving, setSaving] = useState("");
  const tasks = data.tasks.filter(task => (filter === "open" ? task.status !== "Done" : task.status === "Done"));

  async function move(task: WorkTask, status: TaskStatus) {
    setSaving(task.taskId);
    try { await portalApi.updateTask(session, task.taskId, status); await refresh(); if (status === "Done") notify("Marked as done."); }
    catch (cause) { notify(cause instanceof Error ? cause.message : "Couldn't update the task.", "error"); }
    finally { setSaving(""); }
  }

  return <div className="ac-page">
    <PageTitle title="Tasks" meta="Work assigned to you by your unit" />
    <div className="ac-toolbar">
      <Segmented label="Show" value={filter} onChange={setFilter} options={[
        { value: "open", label: `Open · ${data.tasks.filter(task => task.status !== "Done").length}` },
        { value: "done", label: `Done · ${data.tasks.filter(task => task.status === "Done").length}` },
      ]} />
    </div>
    {tasks.length ? <ul className="pt-tasks">{tasks.map(task => {
      const late = task.status !== "Done" && task.dueOn && task.dueOn < now.toISOString().slice(0, 10);
      return <li key={task.taskId} style={{ "--slot": PRIORITY_COLOUR[task.priority] } as CSSProperties}>
        <div className="pt-task-main">
          <span className="pt-task-top"><Pill tone={PRIORITY_TONE[task.priority]}>{task.priority}</Pill>{late && <Pill tone="red">Overdue</Pill>}{task.dueOn && <small>due {dateOnly(task.dueOn)}</small>}</span>
          <strong className="pt-task-title">{task.title}</strong>
          <p>{task.detail}</p>
          <small>From {task.requestedBy} · updated {relative(task.updatedAt, now)}</small>
        </div>
        <div className="pt-steps" role="radiogroup" aria-label={`Status of ${task.title}`}>
          {(["Open", "In progress", "Done"] as TaskStatus[]).map(status => (
            <button key={status} type="button" role="radio" aria-checked={task.status === status} className={task.status === status ? "active" : ""}
              disabled={saving === task.taskId} onClick={() => { if (task.status !== status) void move(task, status); }}>
              {status === "Done" ? "✓ Done" : status}
            </button>
          ))}
        </div>
      </li>;
    })}</ul> : <Section title="Nothing here"><Empty>{filter === "open" ? "Nothing open. Well done." : "No finished tasks yet."}</Empty></Section>}
  </div>;
}
