import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { academicApi } from "../../features/academics/api";
import StructureScreens from "../../features/academics/StructureScreens";
import SessionsView from "../../features/academics/SessionsView";
import CurriculumView from "../../features/academics/CurriculumView";
import { AcHeader, SessionPicker, Skeleton, Tabs } from "../../features/academics/ui";
import type { AcademicSession, StructureResponse } from "../../features/academics/types";
import "../../features/academics/academics.css";

type Tab = "structure" | "sessions" | "curriculum";
const TABS: { value: Tab; label: string }[] = [
  { value: "structure", label: "Structure" },
  { value: "sessions", label: "Sessions" },
  { value: "curriculum", label: "Curriculum" },
];

export type SessionControl = {
  sessions: AcademicSession[];
  selected: AcademicSession | null;
  select: (sessionId: string) => void;
};

export default function AcademicStructurePage() {
  const { id: organizationId, facultyId, departmentId } = useParams<{ id: string; facultyId?: string; departmentId?: string }>();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const tab: Tab = requestedTab === "sessions" || requestedTab === "curriculum" ? requestedTab : "structure";
  const [structure, setStructure] = useState<StructureResponse | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!organizationId) return;
    try {
      const [tree, years] = await Promise.all([academicApi.structure(organizationId), academicApi.sessions(organizationId)]);
      setStructure(tree);
      setSessions(years.items);
      setCurrentSessionId(years.currentSessionId);
      setError("");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load academic structure.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { void refresh(); }, [refresh]);
  if (!organizationId) return null;

  const selected = sessions.find(item => item.sessionId === params.get("session"))
    ?? sessions.find(item => item.sessionId === currentSessionId)
    ?? sessions[0] ?? null;
  const session: SessionControl = {
    sessions,
    selected,
    select: sessionId => { const next = new URLSearchParams(params); next.set("session", sessionId); setParams(next); },
  };
  function selectTab(next: Tab) {
    const updated = new URLSearchParams(params);
    updated.set("tab", next);
    setParams(updated);
  }

  // Drill-down screens (a faculty, a department, the department form) own their
  // header and breadcrumb; the top tabs only belong on the landing screens.
  const drilled = Boolean(facultyId || departmentId || pathname.endsWith("/departments/new"));
  const content = loading
    ? <Skeleton variant={drilled ? "department" : "cards"} />
    : error || !structure
      ? <section className="dz-card ac-empty" role="alert"><h2>Couldn't load academic structure</h2><p>{error || "Please try again."}</p><div className="ac-actions"><button className="dz-btn-outline" onClick={() => void refresh()}>Try again</button></div></section>
      : drilled || tab === "structure"
        ? <StructureScreens organizationId={organizationId} structure={structure} session={session} onRefresh={() => void refresh()} />
        : tab === "sessions"
          ? <SessionsView organizationId={organizationId} model={structure.setup?.model ?? "University"} sessions={sessions} onRefresh={() => void refresh()} />
          : <CurriculumView organizationId={organizationId} structure={structure} selectedSession={selected} onRefresh={() => void refresh()} />;

  if (drilled) return <div className="dz-page ac-page">{content}</div>;

  return <div className="dz-page ac-page">
    <AcHeader
      title="Academic Structure"
      meta={["The permanent map of your school. Set it up once; each session builds on it."]}
      actions={tab === "curriculum" ? <SessionPicker sessions={sessions} value={selected?.sessionId ?? null} onChange={session.select} /> : undefined}
    />
    <Tabs tabs={TABS} value={tab} onChange={selectTab} label="Academic structure sections" />
    {content}
  </div>;
}
