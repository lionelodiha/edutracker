import { academicApi } from "./api";
import type { CatalogueCourse } from "./types";

/* Plain helpers shared by the academic screens. Kept out of the component
   files so React Fast Refresh keeps working. */

export const PAGE_SIZE = 50;

export function formatDay(iso: string): string {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export const count = (value: number | null | undefined) => (value === null || value === undefined ? "—" : value.toLocaleString());

const MONOGRAM_COLOURS = ["#8b5cf6", "#22d3ee", "#fbbf24", "#34d399", "#fb7185", "#60a5fa"];
/** Same code → same colour everywhere, so a faculty is recognisable at a glance. */
export function monogramColour(code: string): string {
  let hash = 0;
  for (const char of code) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return MONOGRAM_COLOURS[hash % MONOGRAM_COLOURS.length];
}

const CODE_STOPWORDS = new Set(["faculty", "school", "college", "department", "dept", "institute", "of", "the", "and", "&", "for", "in"]);
/**
 * A unit's short code: the stored code if it has one, otherwise an acronym of the
 * meaningful words ("Faculty of Engineering" → ENG, "Computer Science" → CS).
 */
export function unitCode(unit: { name: string; code?: string | null }): string {
  if (unit.code) return unit.code.toUpperCase();
  const words = unit.name.split(/\s+/).filter(word => word && !CODE_STOPWORDS.has(word.toLowerCase()));
  if (!words.length) return unit.name.slice(0, 3).toUpperCase();
  return (words.length === 1 ? words[0].slice(0, 3) : words.slice(0, 3).map(word => word[0]).join("")).toUpperCase();
}

export function initials(name: string): string {
  return name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.|Engr\.)\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
}

export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

/** The courses API pages at 50; screens that map offerings to courses need all of them. */
export async function allCourses(organizationId: string, departmentId: string): Promise<CatalogueCourse[]> {
  const first = await academicApi.courses(organizationId, departmentId, undefined, 1);
  const pages = Math.ceil(first.total / PAGE_SIZE);
  if (pages <= 1) return first.items;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => academicApi.courses(organizationId, departmentId, undefined, index + 2)));
  return [...first.items, ...rest.flatMap(page => page.items)];
}
