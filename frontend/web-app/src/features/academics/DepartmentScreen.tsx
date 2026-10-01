import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { SessionControl } from "../../pages/organization/AcademicStructurePage";
import { facultyApi } from "../faculty/api";
import { academicApi } from "./api";
import type { AcademicOffering, CatalogueCourse, StructureResponse } from "./types";
import { allCourses, count, initials, PAGE_SIZE, surname } from "./helpers";
import { AcHeader, Badge, Drawer, EmptyState, Meter, SessionPicker, Skeleton, StatCells, Tabs } from "./ui";

type Props = { organizationId: string; departmentId: string; structure: StructureResponse; session: SessionControl; onRefresh: () => void };
type View = "levels" | "catalogue" | "lecturers" | "students" | "admission";
type Person = { staffProfileId: string; fullName: string };
type Learner = { studentProfileId: string; fullName: string; matriculationNumber: string; entryStageId: string; entrySessionId: string; status: string };
const LOAD_RANGE = { min: 15, max: 24 };
const PAGE = PAGE_SIZE;

export default function DepartmentScreen({ organizationId, departmentId, structure, session, onRefresh }: Props) {
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState<CatalogueCourse[] | null>(null);
  const [offerings, setOfferings] = useState<AcademicOffering[]>([]);
  const [staff, setStaff] = useState<Person[]>([]);
  const [students, setStudents] = useState<Learner[] | null>(null);
  const [drawer, setDrawer] = useState<{ kind: "add" } | { kind: "edit"; offering: AcademicOffering } | null>(null);
  const [loadError, setLoadError] = useState("");
  const unit = structure.units.find(item => item.key === departmentId);
  const detail = structure.departments.find(item => item.unitKey === departmentId);
  const faculty = structure.units.find(item => item.key === unit?.parent);
  const model = structure.setup?.model ?? "University";
  const university = model === "University";
  const termWord = model === "University" ? "semester" : "term";
  const base = `/dashboard/organizations/${organizationId}/structure`;
  const selected = session.selected;
  const readonly = selected?.status === "Closed";
  const views: { value: View; label: string }[] = [
    { value: "levels", label: university ? "Levels" : "Arms" },
    { value: "catalogue", label: "Catalogue" },
    { value: "lecturers", label: university ? "Lecturers" : "Teachers" },
    { value: "students", label: "Students" },
    { value: "admission", label: university ? "Admission" : "Capacity" },
  ];
  const view = views.find(item => item.value === params.get("view"))?.value ?? "levels";
  const levels = detail?.levels ?? [];
  const level = levels.includes(params.get("level") ?? "") ? params.get("level")! : levels[0] ?? "";

  const load = useCallback(async () => {
    try {
      const [catalogue, runs, lecturers, roster] = await Promise.all([
        allCourses(organizationId, departmentId),
        selected ? academicApi.offerings(organizationId, selected.sessionId, departmentId) : Promise.resolve([]),
        facultyApi.staff(organizationId, { departmentId }).catch(() => ({ items: [], total: 0 })),
        facultyApi.students(organizationId).catch(() => null),
      ]);
      setCourses(catalogue); setOfferings(runs);
      setStaff(lecturers.items.map(person => ({ staffProfileId: person.staffProfileId, fullName: person.fullName })));
      const keys = new Set([departmentId, ...structure.units.filter(item => item.parent === departmentId).map(item => item.key)]);
      setStudents(roster ? roster.items.filter(person => keys.has(person.programmeId)).map(person => ({ studentProfileId: person.studentProfileId, fullName: person.fullName, matriculationNumber: person.matriculationNumber, entryStageId: person.entryStageId, entrySessionId: person.entrySessionId, status: person.status })) : null);
      setLoadError("");
    } catch { setLoadError("Could not load this department."); }
  }, [organizationId, departmentId, selected, structure.units]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() is async; state updates land after the fetch.
  useEffect(() => { void load(); }, [load]);

  if (!unit || !detail) return <EmptyState title={`This ${university ? "department" : "class"} doesn't exist`} text="It may have been archived or the link is out of date." action={<Link className="dz-btn-outline" to={base}>Back to Academic Structure</Link>} />;

  function setQuery(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); setParams(next, { replace: key === "level" }); }
  const courseById = new Map((courses ?? []).map(course => [course.courseId, course]));
  const staffById = new Map(staff.map(person => [person.staffProfileId, person.fullName]));
  const hod = detail.hodStaffProfileId ? staffById.get(detail.hodStaffProfileId) : undefined;
  const entryLevel = (stageId: string) => levels[Number(stageId.replace("stage-", ""))] ?? "—";
  const intake = students && selected ? students.filter(person => person.entrySessionId === selected.sessionId && person.entryStageId === "stage-0").length : null;
  const terms = selected?.terms ?? Array.from({ length: detail.semestersPerLevel }, (_, index) => ({ termId: `plan-${index}`, sessionId: "", ordinal: index + 1, name: `${university ? "Semester" : "Term"} ${index + 1}`, startsOn: "", endsOn: "", status: "Upcoming" as const }));
  const header = <AcHeader
    crumbs={[{ label: "Academic Structure", to: base }, ...(faculty ? [{ label: faculty.name, to: `${base}/faculties/${faculty.key}` }] : []), { label: unit.name }]}
    title={unit.name}
    badge={<>{unit.code && <Badge tone="code">{unit.code}</Badge>}{university && detail.award && <Badge>{detail.award}</Badge>}</>}
    meta={university
      ? [hod ? `HOD ${hod}` : <Badge tone="warn">No HOD yet</Badge>, `${detail.durationYears} year${detail.durationYears === 1 ? "" : "s"}`, `${levels[0]} – ${levels.at(-1)}`]
      : [`${levels.length} arm${levels.length === 1 ? "" : "s"}`, `Capacity ${detail.maxIntakePerSession}`]}
    actions={<><SessionPicker sessions={session.sessions} value={selected?.sessionId ?? null} onChange={session.select} /><Link className="dz-btn-outline" to={`${base}/departments/${departmentId}/edit`}>Edit</Link></>}
  />;
  if (!courses && !loadError) return <>{header}<Skeleton variant="department" /></>;

  return <>
    {header}
    {readonly && <p className="ac-notice ac-notice-muted" role="status">{selected?.name} is closed. Everything here is read-only history.</p>}
    {loadError && <p className="ac-notice ac-notice-warn" role="alert">{loadError} <button onClick={() => void load()}>Try again</button></p>}
    <StatCells label={`${unit.name} at a glance`} stats={[
      { label: "Students", value: count(students?.length) },
      { label: university ? "Lecturers" : "Teachers", value: staff.length },
      { label: university ? "Courses" : "Subjects", value: courses?.length ?? "—" },
      { label: `${levels[0] ?? "Entry"} intake`, value: <>{count(intake)} <small style={{ fontSize: ".9rem", color: "var(--text-muted)" }}>/ {detail.maxIntakePerSession}</small></>, extra: <Meter value={intake ?? 0} max={detail.maxIntakePerSession} label="Intake against maximum" /> },
    ]} />
    <Tabs tabs={views} value={view} onChange={next => setQuery("view", next)} label={`${unit.name} sections`} />

    {view === "levels" && <div className="ac-levels">
      <nav className="dz-card ac-rail" aria-label={university ? "Levels" : "Arms"}>{levels.map(item => {
        const courseCount = new Set(offerings.filter(run => run.levelKey === item).map(run => run.courseId)).size;
        const marks = [detail.industrialTraining?.level === item ? "◇" : "", detail.directEntryLevel === item ? "↑" : ""].join("");
        return <button key={item} type="button" className={level === item ? "active" : ""} aria-current={level === item ? "true" : undefined} onClick={() => setQuery("level", item)}>
          <span>{item} {marks && <span title={[detail.industrialTraining?.level === item ? "Industrial training" : "", detail.directEntryLevel === item ? "Direct Entry" : ""].filter(Boolean).join(", ")}>{marks}</span>}</span><small>{courseCount} {university ? "courses" : "subjects"}</small>
        </button>;
      })}</nav>
      <div>
        <div className="ac-level-head"><div><h2>{level}</h2><p>{selected ? selected.name : "No session yet — showing the plan"}</p></div>
          {!readonly && <button className="dz-btn-green" onClick={() => setDrawer({ kind: "add" })}>+ Add {university ? "course" : "subject"}</button>}</div>
        <div className="ac-term-grid">{terms.map(term => {
          const runs = offerings.filter(run => run.levelKey === level && run.termId === term.termId).sort((a, b) => (courseById.get(a.courseId)?.code ?? "").localeCompare(courseById.get(b.courseId)?.code ?? ""));
          const total = runs.reduce((sum, run) => sum + run.units, 0);
          const training = detail.industrialTraining?.level === level && detail.industrialTraining.termOrdinal === term.ordinal;
          const outOfRange = university && total > 0 && (total < LOAD_RANGE.min || total > LOAD_RANGE.max);
          return <section className="dz-card ac-term" key={term.termId}>
            <div className="ac-term-head"><span>{term.name}</span>{!training && <span className={outOfRange ? "is-warn" : ""} title={outOfRange ? `Outside the usual ${LOAD_RANGE.min}–${LOAD_RANGE.max} unit load` : undefined}>{total} unit{total === 1 ? "" : "s"}</span>}</div>
            {training ? <div className="ac-training">Industrial training (SIWES) — no courses this {termWord}.</div>
              : runs.length ? runs.map(run => <OfferingRow key={run.offeringId} run={run} course={courseById.get(run.courseId)} lecturer={run.lecturerStaffProfileId ? staffById.get(run.lecturerStaffProfileId) : undefined} onOpen={readonly || term.status === "Closed" ? undefined : () => setDrawer({ kind: "edit", offering: run })} />)
              : <p className="ac-term-empty">No {university ? "courses" : "subjects"} this {termWord} yet.</p>}
          </section>;
        })}</div>
      </div>
    </div>}

    {view === "catalogue" && <Catalogue courses={courses ?? []} levels={levels} terms={terms} university={university} />}

    {view === "lecturers" && (staff.length ? <section className="dz-card" style={{ padding: 0, overflow: "hidden" }}><div className="ac-table-wrap"><table className="ac-table">
      <thead><tr><th>{university ? "Lecturer" : "Teacher"}</th><th className="num">{university ? "Courses" : "Subjects"} this session</th><th className="num">Units</th><th style={{ width: "30%" }}>Load</th></tr></thead>
      <tbody>{(() => {
        const rows = staff.map(person => { const runs = offerings.filter(run => run.lecturerStaffProfileId === person.staffProfileId); return { person, runs: runs.length, units: runs.reduce((sum, run) => sum + run.units, 0) }; });
        const top = Math.max(1, ...rows.map(row => row.units));
        return rows.sort((a, b) => b.units - a.units).map(row => <tr key={row.person.staffProfileId}>
          <td><span className="ac-person"><span className="ac-avatar">{initials(row.person.fullName)}</span><strong style={{ color: "var(--text-primary)" }}>{row.person.fullName}</strong></span></td>
          <td className="num">{row.runs}</td><td className="num">{row.units}</td><td><Meter value={row.units} max={top} label={`${row.units} units`} /></td>
        </tr>);
      })()}</tbody></table></div></section>
      : <EmptyState title={`No ${university ? "lecturers" : "teachers"} attached yet`} text="Staff are attached to a department from Staff & Teachers." action={<Link className="dz-btn-outline" to={`/dashboard/organizations/${organizationId}/staff`}>Go to Staff & Teachers</Link>} />)}

    {view === "students" && (!students ? <EmptyState title="Student records aren't available" text="Once students are admitted, they'll be listed here by entry level." />
      : !students.length ? <EmptyState title="No students yet" text={`Students admitted into ${unit.name} will appear here.`} />
      : <><section className="dz-card ac-level-bars" aria-label="Students by entry level">{levels.map((item, index) => {
          const n = students.filter(person => person.entryStageId === `stage-${index}`).length;
          return <div className="ac-level-bar" key={item}><span>{item}</span><Meter value={n} max={Math.max(1, students.length)} label={`${n} students entered at ${item}`} /><span className="num">{n}</span></div>;
        })}</section>
        <section className="dz-card" style={{ padding: 0, overflow: "hidden" }}><div className="ac-table-wrap"><table className="ac-table">
          <thead><tr><th>Matric no.</th><th>Name</th><th>Entry level</th><th>Status</th></tr></thead>
          <tbody>{students.map(person => <tr key={person.studentProfileId}><td><span className="ac-mono">{person.matriculationNumber}</span></td><td>{person.fullName}</td><td>{entryLevel(person.entryStageId)}</td><td><Badge tone={person.status === "Active" ? "current" : "neutral"}>{person.status}</Badge></td></tr>)}</tbody>
        </table></div></section></>)}

    {view === "admission" && <section className="dz-card" style={{ display: "grid", gap: "1rem", padding: "1.3rem" }}>
      <div className="ac-review-head"><h2 style={{ margin: 0, fontSize: "1.05rem" }}>{university ? "Admission rules" : "Capacity"}</h2><Link className="dz-btn-outline" to={`${base}/departments/${departmentId}/edit?step=2`}>Edit</Link></div>
      <dl className="ac-dl">
        <dt>{university ? "Maximum intake" : "Capacity"}</dt><dd>{detail.maxIntakePerSession} per session</dd>
        {university && <><dt>Minimum UTME</dt><dd>{detail.minUtmeScore ?? "Not set"}</dd>
          <dt>UTME subjects</dt><dd>{detail.utmeSubjects.length ? <span className="ac-chip-row">{detail.utmeSubjects.map(subject => <Badge key={subject}>{subject}</Badge>)}</span> : "Not set"}</dd>
          <dt>O'Level</dt><dd>{detail.oLevelRequirement || "Not set"}</dd>
          <dt>Direct Entry</dt><dd>{detail.directEntryLevel ? `Into ${detail.directEntryLevel}` : "Not offered"}</dd>
          <dt>Industrial training</dt><dd>{detail.industrialTraining ? `${detail.industrialTraining.level}, ${termWord} ${detail.industrialTraining.termOrdinal}` : "None"}</dd>
          <dt>After graduation</dt><dd>{detail.postGraduationInternshipYears ? `${detail.postGraduationInternshipYears} year internship` : "None"}</dd></>}
        <dt>Other</dt><dd>{detail.otherRequirements || "None"}</dd>
      </dl>
    </section>}

    {drawer && selected && <OfferingDrawer organizationId={organizationId} departmentId={departmentId} departmentCode={unit.code ?? ""} sessionId={selected.sessionId}
      terms={selected.terms.filter(term => term.status !== "Closed")} level={level} university={university} staff={staff} existing={drawer.kind === "edit" ? drawer.offering : null}
      course={drawer.kind === "edit" ? courseById.get(drawer.offering.courseId) : undefined}
      onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); void load(); onRefresh(); }} />}
    {drawer && !selected && <Drawer title="No session yet" onClose={() => setDrawer(null)}><p>Prepare a session first — courses are scheduled into a session's {termWord}s.</p><Link className="dz-btn-green" to={`${base}?tab=sessions`}>Go to Sessions</Link></Drawer>}
  </>;
}

function OfferingRow({ run, course, lecturer, onOpen }: { run: AcademicOffering; course?: CatalogueCourse; lecturer?: string; onOpen?: () => void }) {
  const body = <>
    <span className="ac-mono">{course?.code ?? "Course"}</span>
    <span className="ac-course-title">{course?.title ?? ""}</span>
    <span className="ac-course-side"><span className="ac-units">{run.units}u</span><Badge tone={run.isCompulsory ? "code" : "neutral"}>{run.isCompulsory ? "C" : "E"}</Badge>
      {lecturer ? <span className="ac-person"><span className="ac-avatar">{initials(lecturer)}</span>{surname(lecturer)}</span> : <Badge tone="warn">Unassigned</Badge>}</span>
  </>;
  return onOpen ? <button type="button" className="ac-course-row" onClick={onOpen}>{body}</button> : <div className="ac-course-row">{body}</div>;
}

export function Catalogue({ courses, levels, terms, university }: { courses: CatalogueCourse[]; levels: string[]; terms: { ordinal: number; name: string }[]; university: boolean }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const term = query.trim().toLowerCase();
  const filtered = courses.filter(course => (!level || course.defaultLevel === level) && (!term || `${course.code} ${course.title}`.toLowerCase().includes(term))).sort((a, b) => a.code.localeCompare(b.code));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);
  const termName = (ordinal: number) => terms.find(item => item.ordinal === ordinal)?.name ?? `${ordinal}`;
  return <section className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
    <div className="ac-toolbar" style={{ padding: "1rem" }}>
      <input className="input" style={{ maxWidth: 320 }} aria-label="Search catalogue" placeholder="Search code or title" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />
      <select className="input" style={{ maxWidth: 160 }} aria-label="Filter by level" value={level} onChange={event => { setLevel(event.target.value); setPage(1); }}><option value="">All levels</option>{levels.map(item => <option key={item}>{item}</option>)}</select>
    </div>
    {!courses.length ? <p className="ac-term-empty">No {university ? "courses" : "subjects"} yet. Add one from the {university ? "Levels" : "Arms"} tab.</p>
      : <div className="ac-table-wrap"><table className="ac-table">
        <thead><tr><th>Code</th><th>Title</th><th className="num">Units</th><th>Level</th><th>{university ? "Semester" : "Term"}</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>{shown.length ? shown.map(course => <tr key={course.courseId}>
          <td><span className="ac-mono">{course.code}</span></td><td>{course.title}</td><td className="num">{course.units}</td><td>{course.defaultLevel}</td><td>{termName(course.defaultTermOrdinal)}</td>
          <td><Badge tone={course.defaultCompulsory ? "code" : "neutral"}>{course.defaultCompulsory ? "Compulsory" : "Elective"}</Badge></td>
          <td>{course.archivedAt ? <Badge tone="closed">Archived</Badge> : <Badge tone="current">Active</Badge>}</td>
        </tr>) : <tr><td colSpan={7} className="ac-term-empty">No courses match.</td></tr>}</tbody>
      </table></div>}
    {filtered.length > 0 && <div className="ac-pager"><span>{(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filtered.length)} of {filtered.length}</span>
      <span className="ac-actions"><button className="dz-btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="dz-btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></span></div>}
  </section>;
}

function OfferingDrawer({ organizationId, departmentId, departmentCode, sessionId, terms, level, university, staff, existing, course, onClose, onSaved }: {
  organizationId: string; departmentId: string; departmentCode: string; sessionId: string; terms: { termId: string; ordinal: number; name: string }[]; level: string; university: boolean;
  staff: Person[]; existing: AcademicOffering | null; course?: CatalogueCourse; onClose: () => void; onSaved: () => void;
}) {
  const [code, setCode] = useState(departmentCode ? `${departmentCode} ` : "");
  const [title, setTitle] = useState("");
  const [units, setUnits] = useState(existing?.units ?? 3);
  const [termId, setTermId] = useState(existing?.termId ?? terms[0]?.termId ?? "");
  const [compulsory, setCompulsory] = useState(existing?.isCompulsory ?? true);
  const [lecturer, setLecturer] = useState(existing?.lecturerStaffProfileId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const noun = university ? "course" : "subject";

  async function save() {
    setError("");
    if (!existing && (!code.trim() || !title.trim())) { setError(`Enter the ${noun} code and title.`); return; }
    if (!existing && !termId) { setError(`No open ${university ? "semester" : "term"} in this session.`); return; }
    setSaving(true);
    try {
      if (existing) await academicApi.editOffering(organizationId, existing.offeringId, { lecturerStaffProfileId: lecturer || null, units, isCompulsory: compulsory });
      else {
        const ordinal = terms.find(item => item.termId === termId)?.ordinal ?? 1;
        const created = await academicApi.addCourse(organizationId, { departmentId, code: code.trim().toUpperCase(), title: title.trim(), units, description: "", defaultLevel: level, defaultTermOrdinal: ordinal, defaultCompulsory: compulsory });
        await academicApi.addOffering(organizationId, sessionId, { termId, courseId: created.courseId, levelKey: level, units, isCompulsory: compulsory, lecturerStaffProfileId: lecturer || null });
      }
      onSaved();
    } catch (issue) { setError(issue instanceof Error ? issue.message : `Could not save ${noun}.`); setSaving(false); }
  }

  return <Drawer title={existing ? `${course?.code ?? "Course"} · ${level}` : `Add ${noun} to ${level}`} onClose={onClose}
    footer={<><button className="dz-btn-outline" onClick={onClose}>Cancel</button><button className="dz-btn-green" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : existing ? "Save" : `Add ${noun}`}</button></>}>
    {existing ? <div><strong>{course?.title ?? "Course"}</strong><p className="ac-hint" style={{ margin: ".2rem 0 0" }}>{terms.find(item => item.termId === existing.termId)?.name}</p></div>
      : <>
        <label className="ac-field"><span className="ac-label">Code</span><input className="input" value={code} onChange={event => setCode(event.target.value.toUpperCase())} autoFocus /></label>
        <label className="ac-field"><span className="ac-label">Title</span><input className="input" value={title} onChange={event => setTitle(event.target.value)} placeholder={university ? "e.g. Introduction to Computing" : "e.g. Basic Science"} /></label>
        <label className="ac-field"><span className="ac-label">{university ? "Semester" : "Term"}</span><select className="input" value={termId} onChange={event => setTermId(event.target.value)}>{terms.map(item => <option key={item.termId} value={item.termId}>{item.name}</option>)}</select></label>
      </>}
    <label className="ac-field"><span className="ac-label">{university ? "Lecturer" : "Teacher"}</span><select className="input" value={lecturer} onChange={event => setLecturer(event.target.value)}><option value="">Unassigned</option>{staff.map(person => <option key={person.staffProfileId} value={person.staffProfileId}>{person.fullName}</option>)}</select></label>
    {university && <label className="ac-field"><span className="ac-label">Units</span><input className="input" type="number" min={1} max={12} value={units} onChange={event => setUnits(Number(event.target.value))} /></label>}
    <label className="ac-check"><input type="checkbox" checked={compulsory} onChange={event => setCompulsory(event.target.checked)} />Compulsory</label>
    {!existing && <p className="ac-hint">Adds it to the department catalogue and schedules it for this session.</p>}
    {error && <p role="alert" className="ac-error">{error}</p>}
  </Drawer>;
}
