/** FACULTY-BUILD §2 — academic ranks are records, not an enum. */

export type AcademicRank = {
  rankId: string;
  organizationId: string;
  name: string; // "Senior Lecturer"
  order: number; // 1 = most junior; used for sorting, never for permissions
};

const UNIVERSITY_RANKS = [
  "Graduate Assistant",
  "Assistant Lecturer",
  "Lecturer II",
  "Lecturer I",
  "Senior Lecturer",
  "Reader / Associate Professor",
  "Professor",
];

const SCHOOL_RANKS = ["Assistant Teacher", "Teacher", "Senior Teacher", "Principal Teacher"];

export function seedRankNames(model: "University" | "Secondary" | "Primary"): string[] {
  return model === "University" ? [...UNIVERSITY_RANKS] : [...SCHOOL_RANKS];
}

/** Build rank rows for a fresh organization. IDs are derived so fixtures stay stable. */
export function buildSeedRanks(organizationId: string, model: "University" | "Secondary" | "Primary", idFor: (name: string) => string): AcademicRank[] {
  return seedRankNames(model).map((name, index) => ({
    rankId: idFor(name),
    organizationId,
    name,
    order: index + 1,
  }));
}
