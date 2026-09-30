/* Pages every portal has: timetable, notifications and profile. */
import { useState, type CSSProperties } from "react";
import { Segmented } from "../academics/ui";
import { portalApi } from "./api";
import { Empty, NotificationList, PageTitle, Pill, Section, WeekTimetable } from "./components";
import {
  dateOnly, desktopAlertsState, duration, initialsOf, nextClass, readReminderSettings, reminderText,
  saveReminderSettings, showDesktopAlert, usePortal, WEEKDAYS, type ReminderSettings,
} from "./helpers";

export function TimetablePage() {
  const { data, now } = usePortal();
  if (data.role === "NonTeaching") return null;
  const upcoming = nextClass(data.timetable, now);
  const weekly = data.timetable.reduce((sum, entry) => {
    const [sh, sm] = entry.start.split(":").map(Number);
    const [eh, em] = entry.end.split(":").map(Number);
    return sum + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
  const noun = data.organization.model === "University" ? "lecture" : "lesson";
  return <div className="ac-page">
    <PageTitle title="Timetable"
      meta={[data.term ? `${data.term.sessionName} · ${data.term.termName}` : "No current term",
        `${data.timetable.length} ${noun}${data.timetable.length === 1 ? "" : "s"} a week`,
        weekly ? `${duration(weekly)} of contact time` : null].filter(Boolean).join(" · ")} />
    {upcoming && <p className="ac-notice ac-notice-muted pt-next" role="status">
      <span>Next: <strong>{upcoming.entry.code}</strong> {upcoming.daysAhead === 0 ? `today at ${upcoming.entry.start}` : upcoming.daysAhead === 1 ? `tomorrow at ${upcoming.entry.start}` : `${WEEKDAYS[upcoming.entry.day]} at ${upcoming.entry.start}`} · {upcoming.entry.venue}</span>
      {upcoming.daysAhead === 0 && <Pill tone="violet">in {duration(upcoming.startsIn)}</Pill>}
    </p>}
    <Section title="This week">
      <WeekTimetable entries={data.timetable} now={now} empty={data.role === "Student" ? "Your timetable appears once your courses have been scheduled." : "None of your classes have been scheduled yet."} />
    </Section>
  </div>;
}

export function NotificationsPage() {
  const { data, session, refresh, notify } = usePortal();
  const unread = data.notifications.filter(item => !item.readAt).length;
  async function readAll() {
    try { await portalApi.markRead(session, "all"); await refresh(); }
    catch (cause) { notify(cause instanceof Error ? cause.message : "Couldn't update notifications.", "error"); }
  }
  return <div className="ac-page">
    <PageTitle title={data.role === "NonTeaching" ? "Notices" : "Notifications"}
      meta={unread ? `${unread} unread` : "All read"}
      actions={unread ? <button className="dz-btn-outline" onClick={() => void readAll()}>Mark all as read</button> : null} />
    <div className="pt-split">
      <Section title="Latest" flush><NotificationList items={data.notifications} /></Section>
      {data.role !== "NonTeaching" && <ReminderSettingsCard />}
    </div>
  </div>;
}

function ReminderSettingsCard() {
  const { data, notify } = usePortal();
  const [settings, setSettings] = useState<ReminderSettings>(readReminderSettings);
  const [permission, setPermission] = useState(desktopAlertsState);
  const timetable = data.role === "NonTeaching" ? [] : data.timetable;
  const noun = data.organization.model === "University" ? "lecture" : "lesson";

  function change(next: ReminderSettings) { setSettings(next); saveReminderSettings(next); }
  async function allowDesktop() {
    if (permission === "unsupported") return;
    setPermission(await Notification.requestPermission());
  }
  function test() {
    const sample = timetable[0];
    const { title, body } = sample ? reminderText(sample, settings.lead) : { title: `Class starts in ${settings.lead} min`, body: "This is what a reminder looks like." };
    notify(`${title} · ${sample?.venue ?? ""}`.trim());
    showDesktopAlert(title, body);
  }

  return <Section title="Class reminders">
    <div className="pt-settings">
      <label className="pt-switch">
        <input type="checkbox" checked={settings.enabled} onChange={event => change({ ...settings, enabled: event.target.checked })} />
        <span>Remind me before each {noun}</span>
      </label>
      <div className="ac-field">
        <span className="ac-label">How early</span>
        <Segmented label="How early" value={String(settings.lead)} onChange={next => change({ ...settings, lead: Number(next) })}
          options={[5, 10, 15, 30].map(value => ({ value: String(value), label: `${value} min` }))} />
      </div>
      <div className="pt-setting-row">
        <span><strong>Desktop alerts</strong><small>{permission === "granted" ? "On. Reminders also appear outside the browser." : permission === "denied" ? "Blocked in your browser settings." : permission === "unsupported" ? "This browser doesn't support them." : "Get reminders even when this tab is in the background."}</small></span>
        {permission === "default" && <button className="dz-btn-outline" onClick={() => void allowDesktop()}>Allow</button>}
      </div>
      <p className="ac-hint">Reminders come from your timetable while the portal is open.</p>
      <div><button className="dz-btn-outline" onClick={test} disabled={!settings.enabled}>Send a test reminder</button></div>
    </div>
  </Section>;
}

export function ProfilePage() {
  const { data, signOut } = usePortal();
  const rows: [string, string | null | undefined][] = data.role === "Student" ? [
    ["Full name", data.profile.fullName],
    [data.organization.model === "University" ? "Matriculation number" : "Admission number", data.profile.matriculationNumber],
    ["School email", data.profile.schoolEmail],
    [data.organization.model === "University" ? "Faculty" : "Section", data.profile.facultyName],
    [data.organization.model === "University" ? "Department" : "Class", data.profile.departmentName],
    [data.organization.model === "University" ? "Level" : "Arm", data.profile.level],
    [data.organization.model === "University" ? "Level adviser" : "Form teacher", data.profile.adviser ?? "Not assigned"],
    ["Admitted", data.profile.entrySession],
    ["Status", data.profile.status],
  ] : data.role === "Teaching" ? [
    ["Full name", `${data.profile.title} ${data.profile.fullName}`.trim()],
    ["Staff number", data.profile.staffNumber],
    ["School email", data.profile.schoolEmail],
    ["Category", "Teaching staff"],
    ["Rank", data.profile.rank],
    [data.organization.model === "University" ? "Department" : "Unit", data.profile.unitName],
    ["Posts held", data.profile.posts.join("; ") || "None"],
    ["First appointment", dateOnly(data.profile.appointedOn)],
  ] : [
    ["Full name", `${data.profile.title} ${data.profile.fullName}`.trim()],
    ["Staff number", data.profile.staffNumber],
    ["School email", data.profile.schoolEmail],
    ["Category", `Non-teaching · ${data.profile.kind}`],
    ["Cadre", data.profile.cadre],
    ["Posted to", data.profile.unitName],
    ["Salary grade", `${data.profile.salaryScale} ${String(data.profile.gradeLevel).padStart(2, "0")}, step ${data.profile.step}`],
    ["Reports to", data.profile.supervisor ?? "—"],
    ["First appointment", dateOnly(data.profile.appointedOn)],
    ["Confirmed", dateOnly(data.profile.confirmedOn)],
    ["Next promotion due", dateOnly(data.profile.nextPromotionDue)],
  ];
  // Name, number and email go in the identity card; the rest is the record.
  const [nameRow, numberRow, emailRow, ...record] = rows;
  const role = data.role === "Student" ? `Student · ${data.profile.departmentName ?? ""} ${data.profile.level ?? ""}`.trim()
    : data.role === "Teaching" ? [data.profile.rank, data.profile.unitName].filter(Boolean).join(" · ")
    : data.profile.cadre;
  return <div className="ac-page">
    <section className="pt-identity">
      <span className="pt-identity-avatar" aria-hidden="true">{initialsOf(data.profile.fullName)}</span>
      <div className="pt-identity-copy">
        <h1>{nameRow[1]}</h1>
        <p>{role}</p>
        <p className="pt-identity-ids"><span className="ac-mono">{numberRow[1]}</span><span>{emailRow[1]}</span></p>
      </div>
      <span className="pt-identity-school">{data.organization.name}</span>
    </section>
    <Section title="Your record">
      <dl className="pt-dl pt-record">{record.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>
      <p className="ac-hint">Something wrong? Ask the {data.role === "Student" ? "registry or your level adviser" : "registry"} to correct it. Records are kept by the school.</p>
    </Section>
    {data.role === "NonTeaching" && <Section title="Performance appraisals">
      {data.appraisals.length ? <ul className="pt-appraisals">{data.appraisals.map(item => (
        <li key={item.year}>
          <span className="pt-appraisal-score" style={{ "--slot": item.score >= 70 ? "#4ade80" : item.score >= 50 ? "#fbbf24" : "#f87171" } as CSSProperties}>{item.score}</span>
          <span className="pt-list-main"><strong>{item.year} · {item.rating}</strong><small>{item.comment}</small><small>Appraised by {item.appraiser}</small></span>
        </li>
      ))}</ul> : <Empty>No appraisals on record yet.</Empty>}
    </Section>}
    <button type="button" className="dz-btn-outline pt-signout" onClick={signOut}>Sign out</button>
  </div>;
}
