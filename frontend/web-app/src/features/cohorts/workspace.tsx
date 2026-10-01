/* eslint-disable react-refresh/only-export-components -- shared workspace provider and hook */
import { createContext, useContext, type ReactNode } from "react";
import type { AcademicUnitOption, CohortStudent } from "./types";

export type CohortWorkspace = {
  organizationId: string;
  organizationName: string;
  sessionId: string;
  singular: string;
  plural: string;
  institutionType?: "Primary" | "Secondary" | "University";
  academicUnits: AcademicUnitOption[];
  sessions: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  availableStudents: CohortStudent[];
  basePath: string;
};
const Context = createContext<CohortWorkspace | null>(null);
export function CohortWorkspaceProvider({ value, children }: { value: CohortWorkspace; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCohortWorkspace() {
  const workspace = useContext(Context);
  if (!workspace) throw new Error("A cohort workspace is required.");
  return workspace;
}
