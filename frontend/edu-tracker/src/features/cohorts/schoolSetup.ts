import { saveGroupSettings, type SchoolModel, type UnitKind } from "./settings";

export type AcademicUnitNode = {
  key: string;
  parent: string | null;
  name: string;
  /** PEOPLE-AND-COURSES §1 + FACULTY-BUILD §7. Optional so saved setups pre-dating kinds keep loading; inferred from depth when absent. */
  kind?: UnitKind;
  /** Short code used by identifier generation (max 6 chars, uppercase, unique among siblings). */
  code?: string;
};

export type SchoolStructure = {
  stages: { key: string; name: string; shortName: string }[];
  units: AcademicUnitNode[];
  placements: { key: string; unit: string | null; arm: string | null; labels: string[] }[];
};
export type SchoolSetup = { model: SchoolModel; structure: SchoolStructure };
const memory = new Map<string, SchoolSetup>();

export function readSchoolSetup(id: string): SchoolSetup | null {
  try {
    const saved = JSON.parse(localStorage.getItem(`edutracker.structure.${id}`) || "null");
    if (saved?.structure && Array.isArray(saved.structure.stages) && Array.isArray(saved.structure.units) && Array.isArray(saved.structure.placements)) return saved;
  } catch { /* Tests and restricted browsers use memory. */ }
  return memory.get(id) ?? null;
}

export function saveSchoolSetup(id: string, setup: SchoolSetup) {
  // A storage error must be surfaced before presenting a successful save.
  if (typeof localStorage !== "undefined") localStorage.setItem(`edutracker.structure.${id}`, JSON.stringify(setup));
  memory.set(id, structuredClone(setup));
}

export function initialSchoolSetup(model: SchoolModel): SchoolSetup {
  const names = model === "University" ? ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"]
    : model === "Secondary" ? ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"]
    : ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
  return { model, structure: {
    stages: names.map((name, i) => ({ key: `stage-${i}`, name, shortName: name })),
    units: [],
    placements: model === "University" ? [] : [{ key: "school", unit: null, arm: null, labels: [...names] }],
  } };
}

export function initializeSchool(id: string, model: SchoolModel) {
  if (!readSchoolSetup(id)) saveSchoolSetup(id, initialSchoolSetup(model));
  saveGroupSettings(id, { model, singular: model === "University" ? "Level" : "Class", plural: model === "University" ? "Levels" : "Classes" });
}

/** Depth of a unit in the tree (top-level units are depth 0). */
export function unitDepth(structure: SchoolStructure, key: string | null): number {
  let depth = 0;
  let current = structure.units.find(unit => unit.key === key);
  const seen = new Set<string>();
  while (current?.parent && !seen.has(current.key)) {
    seen.add(current.key);
    depth += 1;
    current = structure.units.find(unit => unit.key === current!.parent);
  }
  return depth;
}

/** PEOPLE-AND-COURSES §1: kind is structural. Inferred from depth when not stored. */
export function unitKindOf(structure: SchoolStructure, key: string | null): UnitKind | null {
  if (!key) return null;
  const unit = structure.units.find(item => item.key === key);
  if (!unit) return null;
  const stored = unit.kind;
  if (stored) return stored;
  const depth = unitDepth(structure, key);
  if (depth === 0) return "Faculty";
  if (depth === 1) return "Department";
  return "Programme";
}

/** Validate a unit code per FACULTY-BUILD §7. Returns the normalized code. */
export function normalizeUnitCode(code: string, siblings: AcademicUnitNode[], selfKey: string | null = null): string {
  const clean = code.trim().toUpperCase();
  if (!clean) throw new Error("Enter a unit code.");
  if (clean.length > 6) throw new Error("Unit codes hold at most 6 characters.");
  if (!/^[A-Z0-9]+$/.test(clean)) throw new Error("Unit codes use letters and digits only.");
  if (siblings.some(unit => unit.key !== selfKey && (unit.code ?? "").toUpperCase() === clean)) {
    throw new Error("That code is already used here. Codes must be unique among siblings.");
  }
  return clean;
}

/** Set (or clear with "") a unit's code, enforcing sibling uniqueness. */
export function setUnitCode(setup: SchoolSetup, key: string, code: string): SchoolSetup {
  const next = structuredClone(setup);
  const unit = next.structure.units.find(item => item.key === key);
  if (!unit) throw new Error("Choose an existing unit.");
  const siblings = next.structure.units.filter(item => item.parent === unit.parent);
  const clean = code.trim();
  unit.code = clean ? normalizeUnitCode(clean, siblings, key) : undefined;
  return next;
}

export function addAcademicUnit(setup: SchoolSetup, name: string, parent: string | null, stageKeys: string[]): SchoolSetup {
  const next = structuredClone(setup);
  const clean = name.trim();
  if (!clean) throw new Error("Enter a name.");
  if (next.structure.units.some(unit => unit.parent === parent && unit.name.toLowerCase() === clean.toLowerCase())) throw new Error("That name already exists here.");
  const parentUnit = next.structure.units.find(unit => unit.key === parent);
  if (parent && !parentUnit) throw new Error("Choose an existing parent.");
  if (setup.model !== "University" && parent) throw new Error("Streams belong directly to the school.");
  // PEOPLE-AND-COURSES §1 kind rules: Faculty → Department → Programme, programmes are leaves.
  // Kind is structural (derived from depth), so a faculty child is always a
  // department and can never be a programme: rule 2 holds by construction.
  if (setup.model === "University" && parent !== null) {
    const parentKind = unitKindOf(next.structure, parent);
    if (parentKind === "Programme" || unitDepth(next.structure, parent) >= 2) {
      throw new Error("A programme cannot be given a child.");
    }
  }
  const key = crypto.randomUUID();
  const kind: UnitKind | undefined = setup.model === "University"
    ? parent === null ? "Faculty" : unitDepth(next.structure, parent) === 0 ? "Department" : "Programme"
    : undefined;
  next.structure.units.push({ key, name: clean, parent, ...(kind ? { kind } : {}) });
  const createsPlacements = setup.model !== "University" || parent !== null;
  if (createsPlacements) {
    if (!stageKeys.length) throw new Error("Select at least one stage.");
    // Moving to a deeper programme leaves earlier department records intact.
    next.structure.placements.push({ key, unit: key, arm: null, labels: next.structure.stages.map(stage => stageKeys.includes(stage.key) ? stage.name : "") });
  }
  return next;
}

export function academicUnitPath(structure: SchoolStructure, key: string): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  let current = structure.units.find(unit => unit.key === key);
  while (current && !seen.has(current.key)) {
    seen.add(current.key);
    path.unshift(current.name);
    current = structure.units.find(unit => unit.key === current!.parent);
  }
  return path;
}
