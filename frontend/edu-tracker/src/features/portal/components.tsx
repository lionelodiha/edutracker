/* Building blocks shared by the student and staff portal pages. */
import { useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { monogramColour } from "../academics/helpers";
import { Segmented } from "../academics/ui";
import { portalApi } from "./api";
import { duration, minutes, minutesOf, relative, todaysAgenda, usePortal, WEEKDAYS } from "./helpers";
import type { PortalNotification, TimetableEntry, Weekday } from "./types";

export type Tone = "green" | "amber" | "red" | "gray" | "violet" | "cyan";
export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`pt-pill pt-pill-${tone}`}>{children}</span>;
}

export function Section({ title, action, children, flush }: { title: ReactNode; action?: ReactNode; children: ReactNode; flush?: boolean }) {
  return <section className={`dz-card pt-section${flush ? " pt-flush" : ""}`}>
    <header className="pt-section-head"><h2>{title}</h2>{action}</header>
    {children}
  </section>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="pt-empty">{children}</p>;
}

const PX_PER_MINUTE = 1.05;
const SCHOOL_DAYS: Weekday[] = [1, 2, 3, 4, 5];

/** Monday–Friday grid on wide screens; one day at a time on phones. */
export function WeekTimetable({ entries, now, empty }: { entries: TimetableEntry[]; now: Date; empty: string }) {
  const today = now.getDay();
  const [day, setDay] = useState<Weekday>(SCHOOL_DAYS.includes(today as Weekday) ? today as Weekday : 1);
  if (!entries.length) return <Empty>{empty}</Empty>;
  const first = Math.floor(Math.min(...entries.map(entry => minutes(entry.start))) / 60) * 60;
  const last = Math.ceil(Math.max(...entries.map(entry => minutes(entry.end))) / 60) * 60;
  const hours = Array.from({ length: (last - first) / 60 + 1 }, (_, index) => first + index * 60);
  const clock = minutesOf(now);
  const top = (value: number) => (value - first) * PX_PER_MINUTE;

  return <>
    <div className="pt-week" style={{ "--pt-height": `${(last - first) * PX_PER_MINUTE}px` } as CSSProperties}>
      <div className="pt-week-head">
        <span />
        {SCHOOL_DAYS.map(item => <span key={item} className={item === today ? "is-today" : ""}>{WEEKDAYS[item].slice(0, 3)}{item === today && <small>Today</small>}</span>)}
      </div>
      <div className="pt-week-body">
        <div className="pt-hours" aria-hidden="true">{hours.map(hour => <span key={hour} style={{ top: top(hour) }}>{String(hour / 60).padStart(2, "0")}:00</span>)}</div>
        {SCHOOL_DAYS.map(item => (
          <div key={item} className={`pt-day-col${item === today ? " is-today" : ""}`} aria-label={WEEKDAYS[item]}>
            {hours.map(hour => <span key={hour} className="pt-hour-line" style={{ top: top(hour) }} />)}
            {entries.filter(entry => entry.day === item).map(entry => (
              <div key={entry.slotId} className="pt-slot" style={{ top: top(minutes(entry.start)), height: (minutes(entry.end) - minutes(entry.start)) * PX_PER_MINUTE - 3, "--slot": monogramColour(entry.code) } as CSSProperties}>
                <strong>{entry.code}</strong>
                <span>{entry.start}–{entry.end}</span>
                <span>{entry.venue}</span>
              </div>
            ))}
            {item === today && clock >= first && clock <= last && <span className="pt-now-line" style={{ top: top(clock) }} aria-label="Now" />}
          </div>
        ))}
      </div>
    </div>
    <div className="pt-daylist">
      <Segmented label="Day" value={String(day)} onChange={next => setDay(Number(next) as Weekday)}
        options={SCHOOL_DAYS.map(item => ({ value: String(item), label: WEEKDAYS[item].slice(0, 3) }))} />
      <DayList entries={entries.filter(entry => entry.day === day).sort((a, b) => minutes(a.start) - minutes(b.start))} empty={`Nothing on ${WEEKDAYS[day]}.`} />
    </div>
  </>;
}

function DayList({ entries, empty }: { entries: TimetableEntry[]; empty: string }) {
  if (!entries.length) return <Empty>{empty}</Empty>;
  return <ul className="pt-agenda">{entries.map(entry => (
    <li key={entry.slotId} style={{ "--slot": monogramColour(entry.code) } as CSSProperties}>
      <span className="pt-agenda-time">{entry.start}<small>{entry.end}</small></span>
      <span className="pt-agenda-main"><strong>{entry.code} · {entry.title}</strong><small>{entry.venue} · {entry.detail}</small></span>
    </li>
  ))}</ul>;
}

/** Today's classes with where each one stands right now. */
export function TodayAgenda({ entries, now }: { entries: TimetableEntry[]; now: Date }) {
  const [showDone, setShowDone] = useState(false);
  const agenda = todaysAgenda(entries, now);
  if (!agenda.length) return <Empty>{now.getDay() === 0 || now.getDay() === 6 ? "It's the weekend. No classes today." : "No classes today."}</Empty>;
  // Finished classes fold away so what's still to come stays on screen.
  const done = agenda.filter(entry => entry.state === "done").length;
  const shown = showDone ? agenda : agenda.filter(entry => entry.state !== "done");
  return <>
    {done > 0 && <button type="button" className="pt-agenda-toggle" aria-expanded={showDone} onClick={() => setShowDone(value => !value)}>
      {showDone ? "Hide finished classes" : done === agenda.length ? (done === 1 ? "Today's class is done · Show" : `All ${done} of today's classes are done · Show`) : `${done} earlier class${done === 1 ? "" : "es"} done · Show`}
    </button>}
    {shown.length > 0 && <AgendaList agenda={shown} />}
  </>;
}

function AgendaList({ agenda }: { agenda: ReturnType<typeof todaysAgenda> }) {
  return <ul className="pt-agenda">{agenda.map(entry => (
    <li key={entry.slotId} className={`is-${entry.state}`} style={{ "--slot": monogramColour(entry.code) } as CSSProperties}>
      <span className="pt-agenda-time">{entry.start}<small>{entry.end}</small></span>
      <span className="pt-agenda-main"><strong>{entry.code} · {entry.title}</strong><small>{entry.venue} · {entry.detail}</small></span>
      {entry.state === "now" && <Pill tone="green">In progress</Pill>}
      {entry.state === "next" && <Pill tone="violet">In {duration(entry.startsIn)}</Pill>}
      {entry.state === "done" && <Pill tone="gray">Done</Pill>}
    </li>
  ))}</ul>;
}

const KIND_TONE: Record<PortalNotification["kind"], Tone> = {
  Coursework: "violet", Marks: "cyan", Result: "green", Class: "amber", Memo: "gray", Leave: "amber", Task: "violet",
};

/** Notifications; opening one marks it read and follows its link. */
export function NotificationList({ items, limit }: { items: PortalNotification[]; limit?: number }) {
  const { session, base, now, refresh } = usePortal();
  const navigate = useNavigate();
  const shown = limit ? items.slice(0, limit) : items;
  if (!shown.length) return <Empty>You're all caught up.</Empty>;
  async function open(item: PortalNotification) {
    if (!item.readAt) { try { await portalApi.markRead(session, item.notificationId); await refresh(); } catch { /* Still follow the link. */ } }
    if (item.link) navigate(`${base}/${item.link}`);
  }
  return <ul className="pt-notes">{shown.map(item => (
    <li key={item.notificationId} className={item.readAt ? "" : "is-unread"}>
      <button type="button" onClick={() => void open(item)}>
        <span className={`pt-note-dot pt-dot-${KIND_TONE[item.kind]}`} aria-hidden="true" />
        <span className="pt-note-main">
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </span>
        <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString("en-GB")}>{relative(item.createdAt, now)}</time>
        {!item.readAt && <span className="sr-only">Unread</span>}
      </button>
    </li>
  ))}</ul>;
}

/** Heading block used at the top of every portal page. */
export function PageTitle({ title, meta, actions, eyebrow }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return <header className="pt-page-head">
    {eyebrow && <span className="pt-page-eyebrow">{eyebrow}</span>}
    <h1 className="dz-page-title">{title}</h1>
    {meta && <p className="ac-meta">{meta}</p>}
    {actions && <div className="pt-page-actions">{actions}</div>}
  </header>;
}
