export type SchoolModel = "Primary" | "Secondary" | "University";
export type GroupSettings = { singular: string; plural: string; model: SchoolModel };

/** PEOPLE-AND-COURSES §1 — the single academic-unit tree has exactly these kinds. */
export type UnitKind = "Faculty" | "Department" | "Programme";

/** Every user-facing unit string comes from this map. No model ternaries in JSX. */
export const unitLabels: Record<SchoolModel, Record<UnitKind, string>> = {
  University: { Faculty: "Faculty", Department: "Department", Programme: "Programme" },
  Secondary: { Faculty: "Section", Department: "Stage", Programme: "Arm" },
  Primary: { Faculty: "Section", Department: "Stage", Programme: "Arm" },
};

export function unitLabel(model: SchoolModel, kind: UnitKind): string {
  return unitLabels[model][kind];
}
const memory = new Map<string, GroupSettings>();
export const defaultSettings: GroupSettings = { singular: "Class", plural: "Classes", model: "Secondary" };

/** Browser-local preferences; no backend configuration is changed. */
export function getGroupSettings(organizationId: string): GroupSettings {
  try {
    const value = JSON.parse(localStorage.getItem(`edutracker.groups.${organizationId}`) || "null");
    if (value && typeof value.singular === "string" && value.singular.trim() &&
        typeof value.plural === "string" && value.plural.trim() &&
        ["Primary", "Secondary", "University"].includes(value.model)) return value;
  } catch { /* Storage can be unavailable. */ }
  return memory.get(organizationId) ?? defaultSettings;
}
export function saveGroupSettings(organizationId: string, settings: GroupSettings) {
  const value = { ...settings, singular: settings.singular.trim() || "Group", plural: settings.plural.trim() || "Groups" };
  memory.set(organizationId, value);
  try { localStorage.setItem(`edutracker.groups.${organizationId}`, JSON.stringify(value)); } catch { /* Use memory for this visit. */ }
}
