import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import type { SessionControl } from "../../pages/organization/AcademicStructurePage";
import { facultyApi } from "../faculty/api";
import { academicApi } from "./api";
import DepartmentForm from "./DepartmentForm";
import DepartmentScreen from "./DepartmentScreen";
import type { CatalogueCourse, StructureResponse } from "./types";
import { count, unitCode } from "./helpers";
import { AcHeader, Badge, EmptyState, LevelPips, Meter, Monogram, Segmented, StatCells } from "./ui";

type Props = { organizationId: string; structure: StructureResponse; session: SessionControl; onRefresh: () => void };
type Person = { staffProfileId: string; fullName: string; unitId: string; kind: string };
type Learner = { programmeId: string; entryStageId: string; entrySessionId: string };
const base = (org: string) => `/dashboard/organizations/${org}/structure`;
const VIEW_KEY = "edutracker.structure.view";

function readView(): "grid" | "list" | null {
  try { const saved = localStorage.getItem(VIEW_KEY); return saved === "grid" || saved === "list" ? saved : null; } catch { return null; }
}
function saveView(view: "grid" | "list") {
  try { localStorage.setItem(VIEW_KEY, view); } catch { /* Preference only lasts this visit. */ }
}
function suggestCode(name: string): string {
  const words = name.replace(/^(faculty|department|school|college)\s+of\s+/i, "").split(/\s+/).filter(word => word.length > 2 || /^[A-Z]/.test(word));
  const letters = words.length > 1 ? words.map(word => word[0]).join("") : (words[0] ?? "").slice(0, 3);
  return letters.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
}

export default function StructureScreens({ organizationId, structure, session, onRefresh }: Props) {
  const { facultyId, departmentId } = useParams<{ facultyId?: string; departmentId?: string }>();
  const location = useLocation();
  const [staff, setStaff] = useState<Person[] | null>(null);
  const [students, setStudents] = useState<Learner[] | null>(null);
  const [facultyModal, setFacultyModal] = useState<"new" | "edit" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const model = structure.setup?.model;
  const university = model === "University";
  const rootWord = university ? "faculty" : "section";
  const childWord = university ? "department" : "class";
  const isNew = location.pathname.endsWith("/departments/new");
  const isEdit = Boolean(departmentId) && location.pathname.endsWith("/edit");

  useEffect(() => {
    let live = true;
    void facultyApi.staff(organizationId).then(result => { if (live) setStaff(result.items.map(person => ({ staffProfileId: person.staffProfileId, fullName: person.fullName, unitId: person.unitId, kind: person.kind }))); }).catch(() => { if (live) setStaff(null); });
    void facultyApi.students(organizationId).then(result => { if (live) setStudents(result.items.map(person => ({ programmeId: person.programmeId, entryStageId: person.entryStageId, entrySessionId: person.entrySessionId }))); }).catch(() => { if (live) setStudents(null); });
    return () => { live = false; };
  }, [organizationId]);

  const units = structure.units;
  const isDepartment = (key: string) => structure.departments.some(detail => detail.unitKey === key && !detail.archivedAt);
  const departmentsOf = (parent: string) => units.filter(unit => unit.parent === parent && isDepartment(unit.key));
  const studentsIn = (key: string): number | null => {
    if (!students) return null;
    const keys = new Set([key, ...units.filter(unit => unit.parent === key).map(unit => unit.key)]);
    return students.filter(person => keys.has(person.programmeId)).length;
  };
  const lecturersIn = (key: string): number | null => staff ? staff.filter(person => person.unitId === key && person.kind === "Academic").length : null;
  const sum = (values: (number | null)[]) => values.some(value => value === null) ? null : values.reduce<number>((total, value) => total + (value ?? 0), 0);
  const intakeFor = (key: string): number | null => {
    if (!students || !session.selected) return null;
    const keys = new Set([key, ...units.filter(unit => unit.parent === key).map(unit => unit.key)]);
    return students.filter(person => keys.has(person.programmeId) && person.entrySessionId === session.selected?.sessionId && person.entryStageId === "stage-0").length;
  };
  const staffName = (id: string | null | undefined) => staff?.find(person => person.staffProfileId === id)?.fullName;

  async function initialize(next: "University" | "Secondary" | "Primary") {
    setError(""); setBusy(true);
    try { await academicApi.initialize(organizationId, next); onRefresh(); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Could not start school structure."); }
    finally { setBusy(false); }
  }

  if (!model) return <section className="ac-page">
    <AcHeader title="Set up your school" meta={["Choose the model that matches your school. You set this once; every session builds on it."]} />
    <div className="ac-choice-grid">
      {([
        ["University", "Faculties → Departments → Levels", "Engineering → Computer Engineering → 100L–500L"],
        ["Secondary", "Sections → Classes → Arms", "Senior → SS1 → A, B, C"],
        ["Primary", "Classes → Arms", "Primary 3 → A, B"],
      ] as const).map(([value, shape, example]) => <button key={value} type="button" className="ac-choice" disabled={busy} onClick={() => void initialize(value)}>
        <strong>{value}</strong><span>{shape}</span><code>{example}</code>
      </button>)}
    </div>
    {error && <p role="alert" className="ac-error">{error}</p>}
  </section>;

  if (isNew || isEdit) return <DepartmentForm organizationId={organizationId} structure={structure} departmentId={isEdit ? departmentId! : null} facultyId={new URLSearchParams(location.search).get("facultyId")} staff={staff ?? []} onSaved={onRefresh} />;

  if (departmentId) return <DepartmentScreen organizationId={organizationId} structure={structure} session={session} departmentId={departmentId} onRefresh={onRefresh} />;

  const modal = facultyModal && <FacultyModal organizationId={organizationId} structure={structure} mode={facultyModal} facultyKey={facultyId ?? null} rootWord={rootWord} university={university} staff={staff ?? []} onClose={() => setFacultyModal(null)} onSaved={() => { setFacultyModal(null); onRefresh(); }} />;

  /* ─── Screen B — one faculty ─── */
  if (facultyId) {
    const faculty = units.find(unit => unit.key === facultyId && unit.parent === null);
    if (!faculty) return <EmptyState title={`This ${rootWord} doesn't exist`} text="It may have been archived or the link is out of date." action={<Link className="dz-btn-outline" to={base(organizationId)}>Back to Academic Structure</Link>} />;
    const detail = structure.faculties.find(item => item.unitKey === faculty.key);
    const children = departmentsOf(faculty.key);
    const dean = staffName(detail?.deanStaffProfileId);
    const newChild = `${base(organizationId)}/departments/new?facultyId=${faculty.key}`;
    return <>
      <AcHeader
        crumbs={[{ label: "Academic Structure", to: base(organizationId) }, { label: faculty.name }]}
        lead={<Monogram code={unitCode(faculty)} size={44} />}
        title={faculty.name}
        badge={faculty.code ? <Badge tone="code">{faculty.code}</Badge> : undefined}
        meta={[
          university ? (dean ? `Dean ${dean}` : <Badge tone="warn">No Dean yet</Badge>) : null,
          university ? <Link to={`/dashboard/organizations/${organizationId}/faculties/${faculty.key}`}>Faculty workspace →</Link> : null,
        ]}
        actions={<><button className="dz-btn-outline" onClick={() => setFacultyModal("edit")}>Edit</button><Link className="dz-btn-green" to={newChild}>+ New {childWord}</Link></>}
      />
      <StatCells label={`${faculty.name} at a glance`} stats={[
        { label: university ? "Departments" : "Classes", value: children.length },
        { label: "Lecturers", value: count(sum(children.map(child => lecturersIn(child.key)))) },
        { label: "Students", value: count(sum(children.map(child => studentsIn(child.key)))) },
      ]} />
      {children.length ? <DepartmentCards organizationId={organizationId} structure={structure} items={children} university={university} studentsIn={studentsIn} lecturersIn={lecturersIn} intakeFor={intakeFor} staffName={staffName} />
        : <EmptyState title={`No ${childWord}s yet`} text={`Add the first ${childWord} under ${faculty.name}. You'll set its length, levels and admission rules.`} action={<Link className="dz-btn-green" to={newChild}>+ New {childWord}</Link>} />}
      {modal}
    </>;
  }

  /* ─── Primary: classes sit at the top ─── */
  if (model === "Primary") {
    const classes = units.filter(unit => unit.parent === null && isDepartment(unit.key));
    const newClass = `${base(organizationId)}/departments/new`;
    return <>
      <div className="ac-toolbar"><span className="ac-count ac-grow">{classes.length} class{classes.length === 1 ? "" : "es"}</span><Link className="dz-btn-green" to={newClass}>+ New class</Link></div>
      {classes.length ? <DepartmentCards organizationId={organizationId} structure={structure} items={classes} university={false} studentsIn={studentsIn} lecturersIn={lecturersIn} intakeFor={intakeFor} staffName={staffName} />
        : <EmptyState title="Create your first class" text="Classes are permanent. Each session reuses them." action={<Link className="dz-btn-green" to={newClass}>+ New class</Link>} />}
    </>;
  }

  /* ─── Screen A — faculties ─── */
  const roots = units.filter(unit => unit.parent === null && !structure.faculties.find(item => item.unitKey === unit.key)?.archivedAt);
  return <FacultiesLanding organizationId={organizationId} structure={structure} roots={roots} rootWord={rootWord} childWord={childWord} university={university}
    departmentsOf={departmentsOf} studentsIn={studentsIn} lecturersIn={lecturersIn} staffName={staffName} sum={sum} onNew={() => setFacultyModal("new")} modal={modal} />;
}

/* ─── Screen A pieces ─── */

type LandingProps = {
  organizationId: string; structure: StructureResponse; roots: StructureResponse["units"]; rootWord: string; childWord: string; university: boolean;
  departmentsOf: (key: string) => StructureResponse["units"]; studentsIn: (key: string) => number | null; lecturersIn: (key: string) => number | null;
  staffName: (id: string | null | undefined) => string | undefined; sum: (values: (number | null)[]) => number | null; onNew: () => void; modal: React.ReactNode;
};

function FacultiesLanding({ organizationId, structure, roots, rootWord, childWord, university, departmentsOf, studentsIn, lecturersIn, staffName, sum, onNew, modal }: LandingProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">(() => readView() ?? (roots.length > 12 ? "list" : "grid"));
  const plural = university ? "faculties" : "sections";
  const stats = (key: string) => {
    const children = departmentsOf(key);
    return { departments: children.length, lecturers: sum(children.map(child => lecturersIn(child.key))), students: sum(children.map(child => studentsIn(child.key))) };
  };
  const open = (key: string) => navigate(`${base(organizationId)}/faculties/${key}`);

  return <>
    <div className="ac-toolbar">
      <SearchBox organizationId={organizationId} structure={structure} />
      <span className="ac-count ac-grow">{roots.length} {roots.length === 1 ? rootWord : plural}</span>
      {roots.length > 0 && <Segmented label="Layout" value={view} onChange={next => { setView(next); saveView(next); }} options={[{ value: "grid", label: "Cards" }, { value: "list", label: "List" }]} />}
      <button className="dz-btn-green" onClick={onNew}>+ New {rootWord}</button>
    </div>
    {!roots.length ? <EmptyState title={`Create your first ${rootWord}`} text={`${university ? "Faculties" : "Sections"} hold your ${childWord}s. The permanent structure only needs to be set up once.`} action={<button className="dz-btn-green" onClick={onNew}>+ New {rootWord}</button>} />
      : view === "grid" ? <div className="ac-card-grid">{roots.map(unit => {
        const s = stats(unit.key);
        const detail = structure.faculties.find(item => item.unitKey === unit.key);
        const dean = staffName(detail?.deanStaffProfileId);
        return <Link className="dz-card ac-unit-card" key={unit.key} to={`${base(organizationId)}/faculties/${unit.key}`}>
          <span className="ac-arrow" aria-hidden="true">→</span>
          <Monogram code={unitCode(unit)} />
          <div><h3>{unit.name}</h3>{unit.code && <div style={{ marginTop: ".35rem" }}><Badge tone="code">{unit.code}</Badge></div>}</div>
          <div className="ac-mini-stats">
            <div><strong>{s.departments}</strong><span>{university ? "Depts" : "Classes"}</span></div>
            <div><strong>{count(s.lecturers)}</strong><span>Lecturers</span></div>
            <div><strong>{count(s.students)}</strong><span>Students</span></div>
          </div>
          {university && <div className="ac-card-foot">{dean ? `Dean ${dean}` : <Badge tone="warn">No Dean yet</Badge>}</div>}
        </Link>;
      })}</div>
      : <section className="dz-card" style={{ padding: 0, overflow: "hidden" }}><div className="ac-table-wrap"><table className="ac-table">
        <thead><tr><th>Code</th><th>{university ? "Faculty" : "Section"}</th><th className="num">{university ? "Departments" : "Classes"}</th><th className="num">Lecturers</th><th className="num">Students</th>{university && <th>Dean</th>}</tr></thead>
        <tbody>{roots.map(unit => {
          const s = stats(unit.key);
          const dean = staffName(structure.faculties.find(item => item.unitKey === unit.key)?.deanStaffProfileId);
          return <tr key={unit.key} className="is-link" tabIndex={0} onClick={() => open(unit.key)} onKeyDown={event => { if (event.key === "Enter") open(unit.key); }}>
            <td><span className="ac-mono">{unit.code ?? "—"}</span></td><td><strong>{unit.name}</strong></td>
            <td className="num">{s.departments}</td><td className="num">{count(s.lecturers)}</td><td className="num">{count(s.students)}</td>
            {university && <td>{dean ?? <Badge tone="warn">No Dean yet</Badge>}</td>}
          </tr>;
        })}</tbody>
      </table></div></section>}
    {modal}
  </>;
}

type Result = { kind: "Departments" | "Courses"; key: string; code: string; label: string; parent: string; to: string };

function SearchBox({ organizationId, structure }: { organizationId: string; structure: StructureResponse }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [courses, setCourses] = useState<CatalogueCourse[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const term = query.trim().toLowerCase();

  useEffect(() => {
    if (!term) return;
    let live = true;
    const timer = window.setTimeout(() => {
      void academicApi.courses(organizationId, undefined, term).then(result => { if (live) setCourses(result.items.slice(0, 8)); }).catch(() => { if (live) setCourses([]); });
    }, 180);
    return () => { live = false; window.clearTimeout(timer); };
  }, [organizationId, term]);
  useEffect(() => {
    const onDown = (event: MouseEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const results = useMemo<Result[]>(() => {
    if (!term) return [];
    const nameOf = (key: string | null) => structure.units.find(unit => unit.key === key)?.name ?? "";
    const departments = structure.units
      .filter(unit => structure.departments.some(detail => detail.unitKey === unit.key && !detail.archivedAt))
      .filter(unit => `${unit.name} ${unit.code ?? ""}`.toLowerCase().includes(term))
      .slice(0, 8)
      .map(unit => ({ kind: "Departments" as const, key: unit.key, code: unit.code ?? "", label: unit.name, parent: nameOf(unit.parent), to: `${base(organizationId)}/departments/${unit.key}` }));
    const found = (term ? courses : []).map(course => ({ kind: "Courses" as const, key: course.courseId, code: course.code, label: course.title, parent: nameOf(course.departmentId), to: `${base(organizationId)}/departments/${course.departmentId}?view=catalogue` }));
    return [...departments, ...found];
  }, [term, courses, structure, organizationId]);

  function go(result: Result) { setOpen(false); setQuery(""); navigate(result.to); }
  function onKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive(index => Math.min(results.length - 1, index + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => Math.max(0, index - 1)); }
    else if (event.key === "Enter" && results[active]) { event.preventDefault(); go(results[active]); }
    else if (event.key === "Escape") setOpen(false);
  }

  return <div className="ac-search" ref={wrap}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
    <input className="input" role="combobox" aria-expanded={open && Boolean(term)} aria-controls="ac-search-results" aria-autocomplete="list" aria-label="Search departments or courses" placeholder="Search departments or courses…"
      value={query} onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0); }} onFocus={() => setOpen(true)} onKeyDown={onKey} />
    {open && term && <div className="ac-search-pop" id="ac-search-results" role="listbox">
      {!results.length && <div className="ac-search-empty">No departments or courses match “{query}”.</div>}
      {(["Departments", "Courses"] as const).map(kind => {
        const group = results.filter(result => result.kind === kind);
        if (!group.length) return null;
        return <div key={kind}><div className="ac-search-group">{kind}</div>{group.map(result => {
          const index = results.indexOf(result);
          return <button key={`${kind}-${result.key}`} type="button" role="option" aria-selected={index === active} className={`ac-search-item ${index === active ? "active" : ""}`} onMouseEnter={() => setActive(index)} onClick={() => go(result)}>
            {result.code && <Badge tone="code">{result.code}</Badge>}<span>{result.label}</span>{result.parent && <small>{result.parent}</small>}
          </button>;
        })}</div>;
      })}
    </div>}
  </div>;
}

/* ─── Department cards (Screen B, and Primary landing) ─── */

function DepartmentCards({ organizationId, structure, items, university, studentsIn, lecturersIn, intakeFor, staffName }: {
  organizationId: string; structure: StructureResponse; items: StructureResponse["units"]; university: boolean;
  studentsIn: (key: string) => number | null; lecturersIn: (key: string) => number | null; intakeFor: (key: string) => number | null; staffName: (id: string | null | undefined) => string | undefined;
}) {
  const [sort, setSort] = useState<"name" | "students" | "code">("name");
  const sorted = [...items].sort((a, b) => sort === "code" ? (a.code ?? "").localeCompare(b.code ?? "") : sort === "students" ? (studentsIn(b.key) ?? 0) - (studentsIn(a.key) ?? 0) : a.name.localeCompare(b.name));
  return <>
    <div className="ac-toolbar"><h2 className="ac-grow" style={{ margin: 0, fontSize: "1.05rem" }}>{university ? "Departments" : "Classes"}</h2>
      <label className="ac-count">Sort{" "}<select className="input" style={{ width: "auto", display: "inline-block", padding: ".4rem .6rem" }} value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="name">Name</option><option value="students">Students</option><option value="code">Code</option></select></label>
    </div>
    <div className="ac-card-grid">{sorted.map(unit => {
      const detail = structure.departments.find(item => item.unitKey === unit.key);
      const levels = detail?.levels ?? [];
      const intake = intakeFor(unit.key);
      const max = detail?.maxIntakePerSession ?? 0;
      const hod = staffName(detail?.hodStaffProfileId);
      return <Link className="dz-card ac-unit-card" key={unit.key} to={`${base(organizationId)}/departments/${unit.key}`}>
        <span className="ac-arrow" aria-hidden="true">→</span>
        <div className="ac-card-top">{unit.code && <Badge tone="code">{unit.code}</Badge>}{university && detail?.award && <Badge>{detail.award}</Badge>}</div>
        <h3>{unit.name}</h3>
        <div className="ac-card-line">
          {university ? <>{detail?.durationYears ?? "—"} years <LevelPips levels={levels} training={detail?.industrialTraining?.level} /> {levels[0] ?? "—"} – {levels.at(-1) ?? "—"}</> : <>{levels.length} arm{levels.length === 1 ? "" : "s"} · {levels.join(", ")}</>}
        </div>
        <div className="ac-card-line">{count(studentsIn(unit.key))} students · {count(lecturersIn(unit.key))} lecturers</div>
        {max > 0 && <div className="ac-intake"><div className="ac-intake-row"><span>{university ? `${levels[0] ?? "Entry"} intake` : "Capacity"}</span><span>{count(intake)} / {max}</span></div><Meter value={intake ?? 0} max={max} label={`Intake ${intake ?? 0} of ${max}`} /></div>}
        {university && <div className="ac-card-foot">{hod ? `HOD ${hod}` : <Badge tone="warn">No HOD yet</Badge>}</div>}
      </Link>;
    })}</div>
  </>;
}

/* ─── New / edit faculty ─── */

function FacultyModal({ organizationId, structure, mode, facultyKey, rootWord, university, staff, onClose, onSaved }: {
  organizationId: string; structure: StructureResponse; mode: "new" | "edit"; facultyKey: string | null; rootWord: string; university: boolean;
  staff: Person[]; onClose: () => void; onSaved: () => void;
}) {
  const unit = mode === "edit" ? structure.units.find(item => item.key === facultyKey) : undefined;
  const detail = structure.faculties.find(item => item.unitKey === facultyKey);
  const [name, setName] = useState(unit?.name ?? "");
  const [code, setCode] = useState(unit?.code ?? "");
  const [codeTouched, setCodeTouched] = useState(Boolean(unit?.code));
  const [dean, setDean] = useState(detail?.deanStaffProfileId ?? "");
  const [description, setDescription] = useState(detail?.description ?? "");
  const [showDescription, setShowDescription] = useState(Boolean(detail?.description));
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const taken = structure.units.some(item => item.key !== facultyKey && (item.code ?? "").toUpperCase() === code.toUpperCase() && code !== "");
  const title = `${mode === "edit" ? "Edit" : "New"} ${rootWord}`;

  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    const input = { name: name.trim(), code, description, deanStaffProfileId: dean || null };
    try {
      if (mode === "edit" && facultyKey) await academicApi.editFaculty(organizationId, facultyKey, input);
      else await academicApi.createFaculty(organizationId, input);
      onSaved();
    } catch (issue) { setError(issue instanceof Error ? issue.message : `Could not save ${rootWord}.`); }
    finally { setBusy(false); }
  }
  async function archive() {
    if (!facultyKey) return;
    setBusy(true);
    try { await academicApi.editFaculty(organizationId, facultyKey, { archive: true }); onSaved(); navigate(base(organizationId)); }
    catch (issue) { setError(issue instanceof Error ? issue.message : `Could not archive ${rootWord}.`); setBusy(false); }
  }

  return <Modal titleId="ac-faculty-title" onClose={onClose} maxWidth={520}>
    <form className="dz-form" onSubmit={event => void save(event)} style={{ display: "grid", gap: "1rem" }}>
      <h2 id="ac-faculty-title" style={{ margin: 0 }}>{title}</h2>
      <label className="ac-field"><span className="ac-label">Name</span><input className="input" value={name} autoFocus onChange={event => { setName(event.target.value); if (!codeTouched) setCode(suggestCode(event.target.value)); }} placeholder={university ? "e.g. Engineering" : "e.g. Senior Secondary"} required /></label>
      <label className="ac-field"><span className="ac-label">Code</span><input className="input" style={{ maxWidth: 160 }} value={code} onChange={event => { setCodeTouched(true); setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); }} required maxLength={6} aria-describedby="ac-fac-code-hint" />
        <span id="ac-fac-code-hint" className={taken ? "ac-error" : "ac-hint"}>{taken ? "Another unit already uses this code." : "Up to 6 letters. Used in course codes and ID numbers."}</span></label>
      {university && <label className="ac-field"><span className="ac-label">Dean</span><select className="input" value={dean} onChange={event => setDean(event.target.value)}><option value="">Set later</option>{staff.map(person => <option key={person.staffProfileId} value={person.staffProfileId}>{person.fullName}</option>)}</select></label>}
      {showDescription ? <label className="ac-field"><span className="ac-label">Description</span><textarea className="input" value={description} onChange={event => setDescription(event.target.value)} rows={3} /></label>
        : <button type="button" className="ac-link-btn" style={{ justifySelf: "start" }} onClick={() => setShowDescription(true)}>+ Add description</button>}
      {error && <p role="alert" className="ac-error">{error}</p>}
      <div className="ac-actions" style={{ justifyContent: "space-between" }}>
        <span>{mode === "edit" && (confirmArchive
          ? <span className="ac-actions"><span className="ac-hint">Archive {name}?</span><button type="button" className="ac-danger-link" onClick={() => void archive()} disabled={busy}>Yes, archive</button><button type="button" className="ac-link-btn" onClick={() => setConfirmArchive(false)}>Keep</button></span>
          : <button type="button" className="ac-danger-link" onClick={() => setConfirmArchive(true)}>Archive {rootWord}</button>)}</span>
        <span className="ac-actions"><button type="button" className="dz-btn-outline" onClick={onClose}>Cancel</button><button className="dz-btn-green" disabled={busy || taken || !name.trim() || !code}>{busy ? "Saving…" : mode === "edit" ? "Save" : `Create ${rootWord}`}</button></span>
      </div>
    </form>
  </Modal>;
}
