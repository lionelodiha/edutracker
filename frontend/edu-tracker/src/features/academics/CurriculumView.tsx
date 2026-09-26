import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { facultyApi } from "../faculty/api";
import { academicApi } from "./api";
import { Catalogue } from "./DepartmentScreen";
import { allCourses, initials } from "./helpers";
import type { AcademicOffering, AcademicSession, CatalogueCourse, StructureResponse } from "./types";
import { Badge, Drawer, EmptyState, Segmented, Skeleton } from "./ui";

type Props = { organizationId: string; structure: StructureResponse; selectedSession: AcademicSession | null; onRefresh: () => void };
type Person = { staffProfileId: string; fullName: string };

export default function CurriculumView({ organizationId, structure, selectedSession, onRefresh }: Props) {
  const [params, setParams] = useSearchParams();
  const model = structure.setup?.model ?? "University";
  const university = model === "University";
  const termWord = university ? "semester" : "term";
  const departments = structure.units.filter(unit => structure.departments.some(detail => detail.unitKey === unit.key && !detail.archivedAt));
  const chosenId = departments.some(item => item.key === params.get("department")) ? params.get("department")! : departments[0]?.key ?? "";
  const department = departments.find(item => item.key === chosenId);
  const detail = structure.departments.find(item => item.unitKey === chosenId);
  const mode = params.get("view") === "catalogue" ? "catalogue" : "offerings";
  const levelFilter = params.get("level") ?? "";
  const onlyUnassigned = params.get("unassigned") === "1";
  const closed = selectedSession?.status === "Closed";
  // Results are tagged with the request they answer, so "loading" is derived
  // (key mismatch) instead of being reset synchronously inside the effect.
  const [data, setData] = useState<{ key: string; offerings: AcademicOffering[]; courses: CatalogueCourse[]; staff: Person[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [deptFilter, setDeptFilter] = useState("");
  const [drawer, setDrawer] = useState<{ kind: "add" } | { kind: "edit"; offering: AcademicOffering } | null>(null);
  const [error, setError] = useState("");

  const setQuery = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) { if (value) next.set(key, value); else next.delete(key); }
    setParams(next, { replace: true });
  };

  const sessionId = selectedSession?.sessionId ?? "";
  const requestKey = `${chosenId}|${sessionId}|${reload}`;
  useEffect(() => {
    if (!chosenId) return;
    let live = true;
    const key = `${chosenId}|${sessionId}|${reload}`;
    void Promise.all([
      sessionId ? academicApi.offerings(organizationId, sessionId, chosenId) : Promise.resolve([]),
      allCourses(organizationId, chosenId),
      facultyApi.staff(organizationId, { departmentId: chosenId }).catch(() => ({ items: [], total: 0 })),
    ]).then(([runs, catalogue, people]) => {
      if (!live) return;
      setData({ key, offerings: runs, courses: catalogue, staff: people.items.map(person => ({ staffProfileId: person.staffProfileId, fullName: person.fullName })) });
      setError("");
    }).catch(() => { if (live) { setError("Could not load the curriculum."); setData({ key, offerings: [], courses: [], staff: [] }); } });
    return () => { live = false; };
  }, [organizationId, chosenId, sessionId, reload]);
  const current = data?.key === requestKey ? data : null;
  const offerings = current?.offerings ?? null;
  const courses = current?.courses ?? data?.courses ?? [];
  const staff = current?.staff ?? data?.staff ?? [];
  const load = () => setReload(value => value + 1);

  if (!selectedSession) return <EmptyState title="No session yet" text={`Prepare and start a session before scheduling ${university ? "courses" : "subjects"}.`} action={<Link className="dz-btn-green" to="?tab=sessions">Go to Sessions</Link>} />;
  if (!departments.length) return <EmptyState title={`No ${university ? "departments" : "classes"} yet`} text={`Add a ${university ? "department" : "class"} under Structure first.`} action={<Link className="dz-btn-green" to="?tab=structure">Go to Structure</Link>} />;

  const courseById = new Map(courses.map(course => [course.courseId, course]));
  const staffById = new Map(staff.map(person => [person.staffProfileId, person.fullName]));
  const unassigned = (offerings ?? []).filter(run => !run.lecturerStaffProfileId).length;
  const levels = (detail?.levels ?? []).filter(level => !levelFilter || level === levelFilter);
  const cell = (level: string, termId: string) => (offerings ?? [])
    .filter(run => run.levelKey === level && run.termId === termId && (!onlyUnassigned || !run.lecturerStaffProfileId))
    .sort((a, b) => (courseById.get(a.courseId)?.code ?? "").localeCompare(courseById.get(b.courseId)?.code ?? ""));
  const load_ = (id: string) => (offerings ?? []).filter(run => run.lecturerStaffProfileId === id).reduce((sum, run) => sum + run.units, 0);

  // Group departments by their faculty for the picker.
  const groups = new Map<string, typeof departments>();
  for (const item of departments.filter(unit => `${unit.name} ${unit.code ?? ""}`.toLowerCase().includes(deptFilter.toLowerCase()) || unit.key === chosenId)) {
    const parent = structure.units.find(unit => unit.key === item.parent)?.name ?? "School";
    groups.set(parent, [...(groups.get(parent) ?? []), item]);
  }

  const chip = (run: AcademicOffering) => {
    const course = courseById.get(run.courseId);
    const lecturer = run.lecturerStaffProfileId ? staffById.get(run.lecturerStaffProfileId) : undefined;
    const term = selectedSession.terms.find(item => item.termId === run.termId);
    const locked = closed || term?.status === "Closed";
    return <button key={run.offeringId} type="button" className={`ac-chip-offering ${lecturer ? "" : "is-unassigned"}`} disabled={locked} onClick={() => setDrawer({ kind: "edit", offering: run })}
      title={`${course?.title ?? ""}${lecturer ? ` — ${lecturer}` : " — no lecturer"}`}>
      <span className="ac-mono">{course?.code ?? "Course"}</span>
      <span className="ac-grow ac-units">{run.units}u · {run.isCompulsory ? "C" : "E"}</span>
      {lecturer ? <span className="ac-avatar" aria-label={lecturer}>{initials(lecturer)}</span> : <span className="ac-warn-icon" aria-label="Unassigned">!</span>}
    </button>;
  };

  return <>
    <div className="ac-filters">
      <Segmented label="Show" value={mode} onChange={next => setQuery({ view: next === "catalogue" ? "catalogue" : null })} options={[{ value: "offerings", label: "Offerings" }, { value: "catalogue", label: "Catalogue" }]} />
      <div className="ac-field" style={{ minWidth: 260 }}><span className="ac-label">{university ? "Department" : "Class"}</span>
        <div style={{ display: "flex", gap: ".4rem" }}>
          {departments.length > 8 && <input className="input" style={{ maxWidth: 120 }} aria-label="Filter departments" placeholder="Filter…" value={deptFilter} onChange={event => setDeptFilter(event.target.value)} />}
          <select className="input" value={chosenId} onChange={event => setQuery({ department: event.target.value, level: null })} aria-label={university ? "Department" : "Class"}>
            {[...groups.entries()].map(([group, items]) => <optgroup key={group} label={group}>{items.map(item => <option key={item.key} value={item.key}>{item.code ? `${item.code} · ` : ""}{item.name}</option>)}</optgroup>)}
          </select>
        </div></div>
      {mode === "offerings" && <>
        <label className="ac-field" style={{ minWidth: 140 }}><span className="ac-label">{university ? "Level" : "Arm"}</span>
          <select className="input" value={levelFilter} onChange={event => setQuery({ level: event.target.value || null })}><option value="">All</option>{(detail?.levels ?? []).map(level => <option key={level}>{level}</option>)}</select></label>
        <label className="ac-check" style={{ paddingBottom: ".6rem" }}><input type="checkbox" checked={onlyUnassigned} onChange={event => setQuery({ unassigned: event.target.checked ? "1" : null })} />Only unassigned</label>
        <span className="ac-grow" style={{ flex: 1 }} />
        {!closed && <button className="dz-btn-green" onClick={() => setDrawer({ kind: "add" })} disabled={!courses.length} title={courses.length ? undefined : "Add courses to the catalogue first"}>+ Add offering</button>}
      </>}
    </div>

    {closed && <p className="ac-notice ac-notice-muted" role="status">{selectedSession.name} is closed. Its curriculum is read-only history.</p>}
    {error && <p className="ac-notice ac-notice-warn" role="alert">{error} <button onClick={() => load()}>Try again</button></p>}

    {mode === "catalogue" ? <Catalogue courses={courses} levels={detail?.levels ?? []} terms={selectedSession.terms} university={university} />
      : offerings === null ? <Skeleton variant="list" />
      : <>
        {unassigned > 0 && !onlyUnassigned && <p className="ac-notice ac-notice-warn" role="status"><span>{unassigned} offering{unassigned === 1 ? " has" : "s have"} no {university ? "lecturer" : "teacher"}.</span><button onClick={() => setQuery({ unassigned: "1" })}>Show them</button></p>}
        {!courses.length ? <EmptyState title={`${department?.name} has no ${university ? "courses" : "subjects"} yet`} text="Add them from the department page; they appear here to schedule." action={<Link className="dz-btn-outline" to={`/dashboard/organizations/${organizationId}/structure/departments/${chosenId}`}>Open {department?.name}</Link>} />
          : <>
            <div className="ac-grid-scroll"><table className="ac-grid">
              <thead><tr><th scope="col">{university ? "Level" : "Arm"}</th>{selectedSession.terms.map(term => <th scope="col" key={term.termId}>{term.name}{term.status === "Closed" ? " · closed" : ""}</th>)}</tr></thead>
              <tbody>{levels.map(level => <tr key={level}><th scope="row">{level}</th>{selectedSession.terms.map(term => {
                const training = detail?.industrialTraining?.level === level && detail.industrialTraining.termOrdinal === term.ordinal;
                const runs = cell(level, term.termId);
                return <td key={term.termId}>{training ? <span className="ac-badge ac-badge-warn">Industrial training</span> : <div className="ac-cell">{runs.map(chip)}{!runs.length && <span className="ac-hint">—</span>}</div>}</td>;
              })}</tr>)}</tbody>
            </table></div>
            <div className="ac-level-cards">{levels.map(level => <section className="dz-card ac-term" key={level}>
              <div className="ac-term-head"><span>{level}</span></div>
              <div style={{ display: "grid", gap: ".8rem", padding: ".9rem" }}>{selectedSession.terms.map(term => <div key={term.termId} style={{ display: "grid", gap: ".4rem" }}>
                <span className="ac-label">{term.name}</span>{cell(level, term.termId).map(chip)}{!cell(level, term.termId).length && <span className="ac-hint">Nothing scheduled.</span>}
              </div>)}</div>
            </section>)}</div>
          </>}
      </>}

    {drawer && !closed && <OfferingEditor organizationId={organizationId} session={selectedSession} levels={detail?.levels ?? []} courses={courses} staff={staff} loadOf={load_}
      existing={drawer.kind === "edit" ? drawer.offering : null} course={drawer.kind === "edit" ? courseById.get(drawer.offering.courseId) : undefined} termWord={termWord} university={university}
      defaultLevel={levelFilter || detail?.levels[0] || ""}
      onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); load(); onRefresh(); }} />}
  </>;
}

function OfferingEditor({ organizationId, session, levels, courses, staff, loadOf, existing, course, termWord, university, defaultLevel, onClose, onSaved }: {
  organizationId: string; session: AcademicSession; levels: string[]; courses: CatalogueCourse[]; staff: Person[]; loadOf: (id: string) => number;
  existing: AcademicOffering | null; course?: CatalogueCourse; termWord: string; university: boolean; defaultLevel: string; onClose: () => void; onSaved: () => void;
}) {
  const openTerms = session.terms.filter(term => term.status !== "Closed");
  const [courseId, setCourseId] = useState(existing?.courseId ?? "");
  const [level, setLevel] = useState(existing?.levelKey ?? defaultLevel);
  const [termId, setTermId] = useState(existing?.termId ?? openTerms[0]?.termId ?? "");
  const [lecturer, setLecturer] = useState(existing?.lecturerStaffProfileId ?? "");
  const [units, setUnits] = useState(existing?.units ?? 3);
  const [compulsory, setCompulsory] = useState(existing?.isCompulsory ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const person = university ? "Lecturer" : "Teacher";

  function pickCourse(id: string) {
    setCourseId(id);
    const picked = courses.find(item => item.courseId === id);
    if (picked) {
      setUnits(picked.units); setCompulsory(picked.defaultCompulsory);
      if (levels.includes(picked.defaultLevel)) setLevel(picked.defaultLevel);
      const term = openTerms.find(item => item.ordinal === picked.defaultTermOrdinal);
      if (term) setTermId(term.termId);
    }
  }
  async function save() {
    setError("");
    if (!existing && (!courseId || !termId || !level)) { setError(`Choose a ${university ? "course" : "subject"}, level and ${termWord}.`); return; }
    setSaving(true);
    try {
      if (existing) await academicApi.editOffering(organizationId, existing.offeringId, { lecturerStaffProfileId: lecturer || null, units, isCompulsory: compulsory });
      else await academicApi.addOffering(organizationId, session.sessionId, { termId, courseId, levelKey: level, units, isCompulsory: compulsory, lecturerStaffProfileId: lecturer || null });
      onSaved();
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Could not save the offering."); setSaving(false); }
  }

  return <Drawer title={existing ? `${course?.code ?? "Offering"} · ${existing.levelKey}` : "Add offering"} onClose={onClose}
    footer={<><button className="dz-btn-outline" onClick={onClose}>Cancel</button><button className="dz-btn-green" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</button></>}>
    {existing ? <div><strong>{course?.title}</strong><p className="ac-hint" style={{ margin: ".2rem 0 0" }}>{session.terms.find(term => term.termId === existing.termId)?.name} · {session.name}</p></div>
      : <>
        <label className="ac-field"><span className="ac-label">{university ? "Course" : "Subject"}</span><select className="input" value={courseId} onChange={event => pickCourse(event.target.value)} autoFocus><option value="">Choose…</option>{courses.map(item => <option key={item.courseId} value={item.courseId}>{item.code} · {item.title}</option>)}</select></label>
        <div className="ac-form-grid">
          <label className="ac-field"><span className="ac-label">{university ? "Level" : "Arm"}</span><select className="input" value={level} onChange={event => setLevel(event.target.value)}>{levels.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="ac-field"><span className="ac-label">{university ? "Semester" : "Term"}</span><select className="input" value={termId} onChange={event => setTermId(event.target.value)}>{openTerms.map(term => <option key={term.termId} value={term.termId}>{term.name}</option>)}</select></label>
        </div>
      </>}
    <label className="ac-field"><span className="ac-label">{person}</span>
      <select className="input" value={lecturer} onChange={event => setLecturer(event.target.value)}><option value="">Unassigned</option>{staff.map(item => <option key={item.staffProfileId} value={item.staffProfileId}>{item.fullName} · {loadOf(item.staffProfileId)} units</option>)}</select>
      <span className="ac-hint">Units shown are each {person.toLowerCase()}'s load this session in this {university ? "department" : "class"}.</span></label>
    {university && <label className="ac-field"><span className="ac-label">Units</span><input className="input" type="number" min={1} max={12} value={units} onChange={event => setUnits(Number(event.target.value))} /></label>}
    <label className="ac-check"><input type="checkbox" checked={compulsory} onChange={event => setCompulsory(event.target.checked)} />Compulsory</label>
    {existing && !existing.lecturerStaffProfileId && <Badge tone="warn">No {person.toLowerCase()} yet</Badge>}
    {error && <p role="alert" className="ac-error">{error}</p>}
  </Drawer>;
}
