import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cohortApi } from "./api";
import type { Cohort, Stage } from "./types";
import { useCohortWorkspace } from "./workspace";
import "./cohorts.css";

export default function CohortListPage() {
  const workspace = useCohortWorkspace();
  const [data, setData] = useState<{ stages: Stage[]; cohorts: Cohort[] } | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([cohortApi.stages(workspace.organizationId), cohortApi.list(workspace.organizationId, { sessionId: workspace.sessionId })])
      .then(([stages, cohorts]) => { if (active) setData({ stages: [...stages].sort((a,b) => a.ordinal-b.ordinal), cohorts }); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load student groups."); });
    return () => { active = false; };
  }, [workspace.organizationId, workspace.sessionId, version]);
  const cohorts = data?.cohorts ?? [];
  const university = workspace.institutionType === "University";
  const selectedUnit = workspace.academicUnits.find(unit => unit.id === unitFilter);
  const children = workspace.academicUnits.filter(unit => unit.parentId === (unitFilter || null));
  const browsingUnits = university && (!unitFilter || (children.length > 0 && !cohorts.some(c => c.academicUnitId === unitFilter)));
  function isWithin(unitId: string | null, ancestorId: string): boolean {
    const seen = new Set<string>();
    while (unitId && !seen.has(unitId)) {
      if (unitId === ancestorId) return true;
      seen.add(unitId);
      unitId = workspace.academicUnits.find(unit => unit.id === unitId)?.parentId ?? null;
    }
    return false;
  }
  const query = search.trim().toLowerCase();
  const filtered = cohorts.filter(cohort => (!stageFilter || cohort.stageId === stageFilter)
    && (!unitFilter || (unitFilter === "none" ? !cohort.academicUnitId : cohort.academicUnitId === unitFilter))
    && (cohort.displayName + " " + (cohort.formTeacherName ?? "")).toLowerCase().includes(query));
  const title = university && browsingUnits ? selectedUnit?.name ?? "Faculties" : selectedUnit?.name ?? workspace.plural;
  return <div className="cohort-page">
    <header className="cohort-heading"><div><span className="cohort-eyebrow">{workspace.organizationName} / ACADEMICS</span><h1>{title}</h1><p className="cohort-muted">{university ? "Faculty to department. Level to student. Everything has a place." : "Every stage, every class, and the students who belong there."}</p></div>
      <Link className="dz-btn-outline" to={"/dashboard/organizations/" + workspace.organizationId + "?tab=structure"}>Academic structure ↗</Link>
    </header>
    <div className="cohort-stats"><div><span>{workspace.plural}</span><strong>{data ? cohorts.length : "—"}</strong></div><div><span>Student memberships</span><strong>{data ? cohorts.reduce((sum, c) => sum + c.studentCount, 0) : "—"}</strong></div><div><span>Academic stages</span><strong>{data?.stages.length ?? "—"}</strong></div></div>
    {unitFilter && university && <button className="cohort-back-link" onClick={() => setUnitFilter(selectedUnit?.parentId ?? "")}>← {selectedUnit?.parentId ? "Parent academic unit" : "All faculties"}</button>}
    {error ? <div className="cohort-error" role="alert"><p>{error}</p><button className="dz-btn-outline" onClick={() => { setError(""); setVersion(v => v + 1); }}>Try again</button></div>
      : !data ? <div className="cohort-empty" role="status">Loading your academic structure…</div>
      : <>
        {university && children.length > 0 && <div className="school-unit-grid">{children.map(unit => {
          const records = cohorts.filter(c => isWithin(c.academicUnitId, unit.id));
          return <button className="school-unit-card" key={unit.id} onClick={() => setUnitFilter(unit.id)}><span className="school-overline">{!unit.parentId ? "FACULTY" : workspace.academicUnits.find(parent => parent.id === unit.parentId)?.parentId ? "PROGRAMME" : "DEPARTMENT"}</span><h2>{unit.name}</h2><p>{records.length} levels · {records.reduce((sum, c) => sum + c.studentCount, 0)} students</p><span aria-hidden="true">Explore →</span></button>;
        })}</div>}
        {!browsingUnits && <>
          <div className="cohort-toolbar"><label className="cohort-field cohort-search">Find a {workspace.singular.toLowerCase()}<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or teacher…" /></label>
            <label className="cohort-field">Stage<select value={stageFilter} onChange={e => setStageFilter(e.target.value)}><option value="">All stages</option>{data.stages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
            {!university && <label className="cohort-field">Stream<select value={unitFilter} onChange={e => setUnitFilter(e.target.value)}><option value="">All classes</option><option value="none">Unstreamed</option>{workspace.academicUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>}
          </div>
          {data.stages.map(stage => {
            const items = filtered.filter(c => c.stageId === stage.id);
            return items.length > 0 && <section className="cohort-stage" key={stage.id}><div className="cohort-stage-heading"><h2>{stage.name}</h2><span>{items.length} {items.length === 1 ? workspace.singular.toLowerCase() : workspace.plural.toLowerCase()}</span></div><div className="cohort-grid">{items.map(cohort => <Link className="cohort-card cohort-link-card" key={cohort.id} to={workspace.basePath + "/" + encodeURIComponent(cohort.id)} state={{ sessionName: workspace.sessions[0]?.name }}><div className="cohort-card-top"><span className="cohort-monogram">{cohort.stageName.slice(0,3)}</span><span aria-hidden="true">↗</span></div><span className="cohort-eyebrow">{cohort.academicUnitName || "SCHOOL CLASS"}</span><h3>{cohort.displayName}</h3><div className="cohort-card-bottom"><span><strong>{cohort.studentCount}</strong> student records</span><span>{cohort.formTeacherName || "Unassigned"}</span></div></Link>)}</div></section>;
          })}
        </>}
        {((browsingUnits && !children.length) || (!browsingUnits && !filtered.length)) && <div className="cohort-empty"><h2>{cohorts.length ? "No matching results" : "Your structure starts here"}</h2><p>Define the academic units and stages your school runs, then open their student records here.</p><Link className="dz-btn-outline" to={"/dashboard/organizations/" + workspace.organizationId + "?tab=structure"}>Open academic structure</Link></div>}
      </>}
  </div>;
}
