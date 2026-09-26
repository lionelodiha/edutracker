/**
 * FACULTY-BUILD §1 — the only code that decides faculty membership.
 *
 * Staff belong to a department. Faculty membership is calculated, never entered.
 * There must be no second place in the codebase that decides who is in a
 * faculty, and no stored faculty-membership field.
 */
import { isAppointmentLive, type Appointment } from "./appointments";
import type { StaffProfile } from "./types";

export type UnitRef = { key: string; parent: string | null };

/**
 * Every faculty staff list is derived:
 *   staff of a faculty =
 *       every StaffProfile whose unitId is a Department under that Faculty
 *     + every StaffProfile whose unitId IS that Faculty
 */
export function staffOfFaculty<T extends { unitId: string }>(staff: T[], units: UnitRef[], facultyId: string): T[] {
  const departmentKeys = new Set(units.filter(unit => unit.parent === facultyId).map(unit => unit.key));
  return staff.filter(member => member.unitId === facultyId || departmentKeys.has(member.unitId));
}

/** Everything else in the app asks through these two. */
export function currentPostHolder<T extends Pick<Appointment, "post" | "scopeId" | "startsOn" | "endsOn">>(
  appointments: T[],
  post: T["post"],
  scopeId: string,
  now: Date = new Date(),
): T | undefined {
  return appointments.find(item => item.post === post && item.scopeId === scopeId && isAppointmentLive(item, now));
}

export function postsHeldBy<T extends Pick<Appointment, "staffProfileId">>(appointments: T[], staffProfileId: string): T[] {
  return appointments.filter(item => item.staffProfileId === staffProfileId);
}

/** Live posts held by one person (open-ended or ending in the future). */
export function livePostsHeldBy<T extends Pick<Appointment, "staffProfileId" | "startsOn" | "endsOn">>(
  appointments: T[],
  staffProfileId: string,
  now: Date = new Date(),
): T[] {
  return postsHeldBy(appointments, staffProfileId).filter(item => isAppointmentLive(item, now));
}

export type ChainUnit = { key: string; parent: string | null; name: string };

/**
 * The student header chain, read from the structure and never stored:
 * Faculty of Engineering → Computer Engineering → B.Eng Computer Engineering → 200 Level → 2025/2026
 * Walk from the programme upward; the faculty is the root, the department its child.
 */
export function studentUnitChain(units: ChainUnit[], programmeKey: string): ChainUnit[] {
  const byKey = new Map(units.map(unit => [unit.key, unit]));
  const chain: ChainUnit[] = [];
  const seen = new Set<string>();
  let current = byKey.get(programmeKey);
  while (current && !seen.has(current.key)) {
    seen.add(current.key);
    chain.unshift(current);
    current = current.parent ? byKey.get(current.parent) : undefined;
  }
  return chain;
}

/** True when a staff member may be assigned to a course or an appointment. */
export function canAssignStaff(member: Pick<StaffProfile, "status">): boolean {
  return member.status === "Active";
}
