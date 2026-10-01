import type { SemesterResponse } from "../../../api";

export function sessionLabel(session: SemesterResponse): string {
  return session.session || `${session.startYear} / ${session.endYear ?? Number(session.startYear) + 1}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days <= 30 ? `${days}d` : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
