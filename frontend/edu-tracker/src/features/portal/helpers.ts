/* Plain helpers and hooks for the portal pages. Kept out of component files
   so React Fast Refresh keeps working. */
import { useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import type { PortalSession } from "./api";
import type { Tone } from "./components";
import type { NonTeachingPortal, PortalPayload, PortalRole, SheetStatus, StudentPortal, TeacherPortal, TimetableEntry } from "./types";

/**
 * The portals live outside the admin app, one address per school:
 * /portal/<school> is its sign-in page, and each role has its own area
 * under it. Only this file knows the shape, so moving the portal to its
 * own domain later means changing these two functions.
 */
const ROLE_SEGMENT: Record<PortalRole, string> = { Student: "student", Teaching: "teacher", NonTeaching: "staff" };
export const portalSignIn = (schoolId: string) => `/portal/${encodeURIComponent(schoolId)}`;
export const portalHome = (schoolId: string, role: PortalRole) => `${portalSignIn(schoolId)}/${ROLE_SEGMENT[role]}`;
/** Full address to share with students and staff. */
export const portalUrl = (schoolId: string) => `${window.location.origin}${portalSignIn(schoolId)}`;

export type PortalContext<T extends PortalPayload = PortalPayload> = {
  data: T;
  session: PortalSession;
  base: string;
  /** Ticks every 30 seconds so "next class" and countdowns stay current. */
  now: Date;
  refresh: () => Promise<void>;
  signOut: () => void;
  notify: (text: string, tone?: "success" | "error") => void;
};

export const useStudent = () => useOutletContext<PortalContext<StudentPortal>>();
export const useTeacher = () => useOutletContext<PortalContext<TeacherPortal>>();
export const useNonTeaching = () => useOutletContext<PortalContext<NonTeachingPortal>>();
export const usePortal = () => useOutletContext<PortalContext>();

export const SHEET_TONE: Record<SheetStatus, Tone> = { "Not started": "gray", Partial: "amber", Submitted: "green" };
export const sheetLabel = (status: SheetStatus) => (status === "Partial" ? "In progress" : status);

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "08:30" → 510 */
export const minutes = (time: string) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};
export const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Today, 10:00" · "Tomorrow, 09:00" · "Mon 5 Oct, 10:00" */
export function when(iso: string | null, now: Date, withTime = true): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const day = sameDay(date, now) ? "Today" : sameDay(date, tomorrow) ? "Tomorrow" : sameDay(date, yesterday) ? "Yesterday"
    : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
  return withTime ? `${day}, ${time}` : day;
}

/** "5 Oct 2026" */
export function dateOnly(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "in 3 days" · "2 hours ago" · "just now" */
export function relative(iso: string | null, now: Date): string {
  if (!iso) return "";
  const diff = Date.parse(iso) - now.getTime();
  const abs = Math.abs(diff);
  const unit = abs < 60_000 ? null : abs < 3_600_000 ? ["minute", 60_000] as const : abs < 86_400_000 ? ["hour", 3_600_000] as const : ["day", 86_400_000] as const;
  if (!unit) return "just now";
  const value = Math.round(abs / unit[1]);
  const text = `${value} ${unit[0]}${value === 1 ? "" : "s"}`;
  return diff > 0 ? `in ${text}` : `${text} ago`;
}

/** "25 min" · "1 h 10 min" */
export function duration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const rest = totalMinutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export type AgendaItem = TimetableEntry & { state: "done" | "now" | "next" | "later"; startsIn: number };

/** Today's classes in order, each marked done, now, next or later. */
export function todaysAgenda(entries: TimetableEntry[], now: Date): AgendaItem[] {
  const today = entries.filter(entry => entry.day === now.getDay()).sort((a, b) => minutes(a.start) - minutes(b.start));
  const clock = minutesOf(now);
  let nextMarked = false;
  return today.map(entry => {
    const start = minutes(entry.start);
    const end = minutes(entry.end);
    let state: AgendaItem["state"] = "later";
    if (clock >= end) state = "done";
    else if (clock >= start) state = "now";
    else if (!nextMarked) { state = "next"; nextMarked = true; }
    return { ...entry, state, startsIn: start - clock };
  });
}

/** The next class from now, looking up to a week ahead. */
export function nextClass(entries: TimetableEntry[], now: Date): { entry: TimetableEntry; daysAhead: number; startsIn: number } | null {
  const clock = minutesOf(now);
  for (let ahead = 0; ahead < 7; ahead++) {
    const day = (now.getDay() + ahead) % 7;
    const candidates = entries
      .filter(entry => entry.day === day && (ahead > 0 || minutes(entry.start) > clock))
      .sort((a, b) => minutes(a.start) - minutes(b.start));
    if (candidates[0]) return { entry: candidates[0], daysAhead: ahead, startsIn: ahead * 1440 + minutes(candidates[0].start) - clock };
  }
  return null;
}

// ─── Class reminders ────────────────────────────────────────────────────────

export type ReminderSettings = { enabled: boolean; lead: number };
const REMINDER_KEY = "edutracker.portal.reminders";

export function readReminderSettings(): ReminderSettings {
  try {
    const value = JSON.parse(localStorage.getItem(REMINDER_KEY) || "null");
    if (value && typeof value.enabled === "boolean" && [5, 10, 15, 30].includes(value.lead)) return value;
  } catch { /* Defaults. */ }
  return { enabled: true, lead: 15 };
}
export function saveReminderSettings(settings: ReminderSettings) {
  try { localStorage.setItem(REMINDER_KEY, JSON.stringify(settings)); } catch { /* Kept for this visit only. */ }
}

export function desktopAlertsState(): "unsupported" | NotificationPermission {
  return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
}

export function reminderText(entry: TimetableEntry, startsIn: number) {
  return {
    title: `${entry.code} ${startsIn <= 0 ? "is starting" : `starts in ${duration(startsIn)}`}`,
    body: `${entry.title} · ${entry.start}–${entry.end} · ${entry.venue}`,
  };
}

export function showDesktopAlert(title: string, body: string) {
  if (desktopAlertsState() !== "granted") return;
  try { new Notification(title, { body, tag: title }); } catch { /* Some browsers only allow this from a service worker. */ }
}

/**
 * Reminds the user shortly before each class: an in-page toast, plus a
 * desktop notification when they have allowed it. Each class is reminded
 * once per day, even across reloads.
 */
export function useClassReminders(entries: TimetableEntry[], now: Date, notify: (text: string) => void) {
  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; });
  useEffect(() => {
    const settings = readReminderSettings();
    if (!settings.enabled) return;
    const clock = minutesOf(now);
    const stamp = now.toISOString().slice(0, 10);
    for (const entry of entries) {
      if (entry.day !== now.getDay()) continue;
      const startsIn = minutes(entry.start) - clock;
      if (startsIn < 0 || startsIn > settings.lead) continue;
      const key = `edutracker.portal.reminded.${entry.slotId}.${stamp}`;
      try { if (localStorage.getItem(key)) continue; localStorage.setItem(key, "1"); } catch { /* Remind anyway. */ }
      const { title, body } = reminderText(entry, startsIn);
      notifyRef.current(`${title} · ${entry.venue}`);
      showDesktopAlert(title, body);
    }
  }, [entries, now]);
}

/** Working days (Monday–Friday) between two ISO dates, inclusive. Public holidays aren't counted out. */
export function workingDays(startsOn: string, endsOn: string): number {
  const start = Date.parse(`${startsOn}T00:00:00Z`);
  const end = Date.parse(`${endsOn}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  let days = 0;
  for (let time = start; time <= end; time += 86_400_000) {
    const day = new Date(time).getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return days;
}

/** Short badge text for a coursework kind. */
export const KIND_BADGE: Record<string, string> = { Test: "TEST", Assignment: "TASK", Project: "PROJ", Exam: "EXAM" };

/** Countdown for the hero: "25 min" today, "Tue 08:00" later in the week. */
export function countdownFor(next: { entry: TimetableEntry; daysAhead: number; startsIn: number }): { value: string; label: string } {
  if (next.daysAhead === 0) return next.startsIn < 60 ? { value: `${next.startsIn} min`, label: "to go" } : { value: duration(next.startsIn), label: "to go" };
  return { value: next.entry.start, label: next.daysAhead === 1 ? "tomorrow" : WEEKDAYS[next.entry.day].slice(0, 3) };
}

export const initialsOf = (fullName: string) => fullName.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
export const greeting = (now: Date) => (now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening");
