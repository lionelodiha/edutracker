/**
 * One staff member's profile in the school workspace:
 * /dashboard/organizations/:id/staff/:staffId
 *
 * For non-teaching staff this is where their portal is set up: employment
 * record, duty roster, tasks, appraisals and leave history. Teaching staff
 * get the record and appraisals; their classes come from the timetable.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { facultyApi } from "../../features/faculty/api";
import { adminApi, AdminApiError } from "../../features/portal/adminApi";
import type { StaffOperations } from "../../features/portal/types";
import type { StaffProfile } from "../../features/staff/types";
import { readSchoolSetup } from "../../features/cohorts/schoolSetup";
import { formatDay, initials } from "../../features/academics/helpers";
import { AcHeader, Badge, EmptyState, Meter, Skeleton, StatCells, Tabs } from "../../features/academics/ui";
import { AppraisalDrawer, EmploymentDrawer, LeaveBadge, ShiftDrawer, TaskDrawer } from "./StaffOperations";
import "../../features/academics/academics.css";
import "./staff.css";

type Tab = "roster" | "tasks" | "appraisals" | "leave";
type Panel = "record" | "shift" | "task" | "appraisal" | null;
const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PRIORITY_TONE = { Urgent: "warn", Normal: "neutral", Low: "closed" } as const;
const STATUS_TONE = { Open: "neutral", "In progress": "upcoming", Done: "current" } as const;

export default function StaffProfilePage() {
  const { id: organizationId = "", staffId = "" } = useParams();
  const { user } = useAuth();
  const adminName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "School admin";
  const [person, setPerson] = useState<StaffProfile | null>(null);
  const [rank, setRank] = useState<string | null>(null);
  const [data, setData] = useState<StaffOperations | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const units = useMemo(() => readSchoolSetup(organizationId)?.structure.units ?? [], [organizationId]);
  const nonTeaching = person ? person.kind !== "Academic" : true;
  const tabs: { value: Tab; label: string }[] = nonTeaching
    ? [{ value: "roster", label: "Duty roster" }, { value: "tasks", label: "Tasks" }, { value: "appraisals", label: "Appraisals" }, { value: "leave", label: "Leave" }]
    : [{ value: "appraisals", label: "Appraisals" }];
  const [tab, setTab] = useState<Tab>("roster");
  const activeTab = tabs.some(item => item.value === tab) ? tab : tabs[0].value;

  const load = useCallback(async () => {
    try {
      const [profile, operations] = await Promise.all([facultyApi.getStaff(organizationId, staffId), adminApi.staffOperations(organizationId, staffId)]);
      setPerson(profile); setData(operations); setError("");
      if (profile.rankId) facultyApi.ranks(organizationId).then(list => setRank(list.find(item => item.rankId === profile.rankId)?.name ?? null)).catch(() => {});
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't load this staff member."); }
  }, [organizationId, staffId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() is async; state lands after the fetch.
  useEffect(() => { void load(); }, [load]);

  const back = `/dashboard/organizations/${organizationId}/staff`;
  if (error && !person) return <EmptyState title="Couldn't load this staff member" text={error} action={<Link className="dz-btn-outline" to={back}>Back to Staff & Teachers</Link>} />;
  if (!person || !data) return <Skeleton variant="department" />;

  /** Save something, close the panel, show what happened and reload. Returns the error to show, if any. */
  async function save(action: () => Promise<unknown>, done: string): Promise<string | null> {
    try { await action(); setPanel(null); setNotice(done); await load(); return null; }
    catch (cause) { return cause instanceof AdminApiError ? cause.message : "Couldn't save that."; }
  }

  const record = data.record;
  const unit = units.find(item => item.key === person.unitId)?.name ?? "—";
  const supervisor = data.supervisors.find(item => item.staffProfileId === record?.supervisorId)?.name;
  const year = String(new Date().getFullYear());
  const entitlement = (record?.gradeLevel ?? 7) >= 7 ? 30 : 21;
  const used = data.leave.filter(item => item.type === "Annual" && item.status === "Approved" && item.startsOn.startsWith(year)).reduce((sum, item) => sum + item.days, 0);
  const openTasks = data.tasks.filter(task => task.status !== "Done");
  const lastAppraisal = data.appraisals[0];

  return <div className="dz-page ac-page sp-page">
    <AcHeader
      crumbs={[{ label: "Staff & Teachers", to: back }, { label: person.fullName }]}
      lead={<span className="sp-avatar" aria-hidden="true">{initials(person.fullName)}</span>}
      title={`${person.title ? `${person.title} ` : ""}${person.fullName}`}
      badge={<><Badge tone="neutral">{nonTeaching ? `Non-teaching · ${person.kind}` : "Teaching"}</Badge><Badge tone={person.status === "Active" ? "current" : "warn"}>{person.status}</Badge></>}
      meta={[<span className="ac-mono" key="no">{person.staffNumber}</span>, rank, unit, record?.cadre].filter(Boolean)}
      actions={<button className="dz-btn-outline" onClick={() => setPanel("record")}>{record ? "Edit record" : "Add employment record"}</button>}
    />
    {notice && <p className="ac-notice ac-notice-muted" role="status"><span>{notice}</span><button onClick={() => setNotice("")}>Dismiss</button></p>}
    {!record && <p className="ac-notice ac-notice-warn" role="status"><span>No employment record yet, so their portal can't show grade, leave allowance or supervisor.</span><button onClick={() => setPanel("record")}>Add it</button></p>}

    <StatCells label="At a glance" stats={nonTeaching ? [
      { label: "Grade level", value: record ? `${String(record.gradeLevel).padStart(2, "0")} / ${record.step}` : "—", extra: <small className="sp-sub">{record?.salaryScale ?? "Not set"}</small> },
      { label: "Annual leave left", value: <>{entitlement - used} <small className="sp-of">/ {entitlement}</small></>, extra: <Meter value={used} max={entitlement} label="Annual leave used" /> },
      { label: "Open tasks", value: openTasks.length, extra: <small className="sp-sub">{openTasks.filter(task => task.priority === "Urgent").length} urgent</small> },
      { label: "Last appraisal", value: lastAppraisal ? lastAppraisal.score : "—", extra: <small className="sp-sub">{lastAppraisal ? `${lastAppraisal.year} · ${lastAppraisal.rating}` : "None yet"}</small> },
    ] : [
      { label: "Grade level", value: record ? `${String(record.gradeLevel).padStart(2, "0")} / ${record.step}` : "—", extra: <small className="sp-sub">{record?.salaryScale ?? "Not set"}</small> },
      { label: "Rank", value: <span className="sp-text-stat">{rank ?? "—"}</span> },
      { label: "Last appraisal", value: lastAppraisal ? lastAppraisal.score : "—", extra: <small className="sp-sub">{lastAppraisal ? `${lastAppraisal.year} · ${lastAppraisal.rating}` : "None yet"}</small> },
    ]} />

    <div className="sp-layout">
      <div className="sp-main">
        <Tabs tabs={tabs} value={activeTab} onChange={setTab} label={`${person.fullName} sections`} />
        {activeTab === "roster" && <section className="dz-card sp-section">
          <header className="sp-section-head"><div><h2>Duty roster</h2><p>{data.duties.length ? `${data.duties.length} shift${data.duties.length === 1 ? "" : "s"} a week` : "Shown on their portal's duty roster"}</p></div>
            <button className="dz-btn-green" onClick={() => setPanel("shift")}>+ Add shift</button></header>
          {data.duties.length ? <ul className="sp-rows">{data.duties.map(duty => (
            <li key={duty.dutyId}>
              <span className="sp-day">{DAY_NAMES[duty.day]}</span>
              <span className="sp-time">{duty.start}–{duty.end}</span>
              <span className="sp-what"><strong>{duty.role}</strong><small>{duty.location}</small></span>
              <button type="button" className="sp-remove" aria-label={`Remove ${DAY_NAMES[duty.day]} shift`} onClick={() => void save(() => adminApi.removeDuty(organizationId, duty.dutyId), "Shift removed.")}>Remove</button>
            </li>
          ))}</ul> : <p className="sp-empty">No shifts yet.</p>}
        </section>}

        {activeTab === "tasks" && <section className="dz-card sp-section">
          <header className="sp-section-head"><div><h2>Tasks</h2><p>{openTasks.length} open · they update progress from their portal</p></div>
            <button className="dz-btn-green" onClick={() => setPanel("task")}>+ Assign task</button></header>
          {data.tasks.length ? <ul className="sp-rows">{data.tasks.map(task => (
            <li key={task.taskId} className={task.status === "Done" ? "is-done" : ""}>
              <span className={`sp-dot sp-dot-${task.priority.toLowerCase()}`} aria-hidden="true" />
              <span className="sp-what"><strong>{task.title}</strong><small>{task.dueOn ? `Due ${formatDay(task.dueOn)}` : "No due date"} · from {task.requestedBy}</small></span>
              <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
              <Badge tone={STATUS_TONE[task.status]}>{task.status}</Badge>
            </li>
          ))}</ul> : <p className="sp-empty">No tasks yet.</p>}
        </section>}

        {activeTab === "appraisals" && <section className="dz-card sp-section">
          <header className="sp-section-head"><div><h2>Appraisals</h2><p>One a year. The rating comes from the score.</p></div>
            <button className="dz-btn-green" onClick={() => setPanel("appraisal")}>+ Record appraisal</button></header>
          {data.appraisals.length ? <ul className="sp-rows">{data.appraisals.map(item => (
            <li key={item.year} className="sp-appraisal">
              <span className="sp-year">{item.year}</span>
              <span className="sp-what"><strong>{item.rating}</strong><small>{item.comment || "No comment"} · by {item.appraiser}</small></span>
              <span className="sp-score"><b>{item.score}</b><Meter value={item.score} max={100} label={`Score ${item.score} of 100`} /></span>
            </li>
          ))}</ul> : <p className="sp-empty">No appraisals recorded.</p>}
        </section>}

        {activeTab === "leave" && <section className="dz-card sp-section">
          <header className="sp-section-head"><div><h2>Leave</h2><p>{used} of {entitlement} annual days taken in {year}. Approve requests under Staff & Teachers → Leave requests.</p></div></header>
          {data.leave.length ? <ul className="sp-rows">{data.leave.map(item => (
            <li key={item.requestId}>
              <span className="sp-days"><b>{item.days}</b><small>days</small></span>
              <span className="sp-what"><strong>{item.type} leave</strong><small>{formatDay(item.startsOn)} – {formatDay(item.endsOn)} · {item.reason}</small></span>
              <LeaveBadge status={item.status} />
            </li>
          ))}</ul> : <p className="sp-empty">No leave requests yet.</p>}
        </section>}
      </div>

      <aside className="dz-card sp-details" aria-label="Details">
        <h2>Details</h2>
        <dl>
          <div><dt>{person.unitKind === "Faculty" ? "Faculty office" : "Department"}</dt><dd>{unit}</dd></div>
          <div><dt>School email</dt><dd>{person.schoolEmail || "—"}</dd></div>
          <div><dt>First appointed</dt><dd>{formatDay(person.appointedOn)}</dd></div>
          <div><dt>Confirmed</dt><dd>{record?.confirmedOn ? formatDay(record.confirmedOn) : "—"}</dd></div>
          <div><dt>Next promotion due</dt><dd>{record?.nextPromotionDue ? formatDay(record.nextPromotionDue) : "—"}</dd></div>
          <div><dt>Reports to</dt><dd>{supervisor ?? "—"}</dd></div>
          <div><dt>Portal login</dt><dd>{person.userId ? "Has an account" : <Badge tone="warn">No login yet</Badge>}</dd></div>
        </dl>
      </aside>
    </div>

    {panel === "record" && <EmploymentDrawer data={data} onClose={() => setPanel(null)} onSave={value => save(() => adminApi.saveEmployment(organizationId, staffId, value), "Employment record saved.")} />}
    {panel === "shift" && <ShiftDrawer onClose={() => setPanel(null)} onSave={value => save(() => adminApi.addDuty(organizationId, staffId, value), "Shift added. They've been notified.")} />}
    {panel === "task" && <TaskDrawer onClose={() => setPanel(null)} onSave={value => save(() => adminApi.assignTask(organizationId, staffId, { ...value, requestedBy: adminName }), "Task assigned. They've been notified.")} />}
    {panel === "appraisal" && <AppraisalDrawer adminName={adminName} onClose={() => setPanel(null)} onSave={value => save(() => adminApi.addAppraisal(organizationId, staffId, value), "Appraisal recorded.")} />}
  </div>;
}
