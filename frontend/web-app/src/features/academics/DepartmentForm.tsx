import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { academicApi } from "./api";
import type { DepartmentInput, StructureResponse } from "./types";
import { AcHeader, Badge, LevelTimeline, Stepper, TagInput } from "./ui";

const AWARDS = ["B.Sc", "B.Eng", "B.A.", "LL.B", "MBBS", "B.Ed", "B.Pharm", "HND", "ND", "Certificate", "Other"];
const SUBJECTS = ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government", "Literature in English", "Geography", "Agricultural Science", "Further Mathematics", "Commerce", "Accounting", "CRS", "IRS", "History", "Civic Education", "Technical Drawing"];

type Props = {
  organizationId: string;
  structure: StructureResponse;
  departmentId: string | null;   // null = create, otherwise edit
  facultyId: string | null;
  staff: { staffProfileId: string; fullName: string }[];
  onSaved: () => void;
};

type Draft = {
  name: string; code: string; award: string; otherAward: string; description: string; hod: string;
  length: number; levels: string[]; terms: number;
  trainingOn: boolean; trainingLevel: string; trainingTerm: number;
  internshipOn: boolean; internship: number;
  directOn: boolean; directLevel: string;
  maxIntake: number; minUtme: string; utmeSubjects: string[];
  oLevelCredits: number; oLevelSubjects: string[]; otherRequirements: string;
};

const defaultLevel = (index: number, classMode: boolean) => classMode ? String.fromCharCode(65 + index) : `${(index + 1) * 100}L`;
/** Resize the level list at the end only, so names the school typed survive a length change. */
function resize(levels: string[], length: number, classMode: boolean): string[] {
  return length <= levels.length ? levels.slice(0, length) : [...levels, ...Array.from({ length: length - levels.length }, (_, i) => defaultLevel(levels.length + i, classMode))];
}
function parseOLevel(text: string): { credits: number; subjects: string[] } {
  const match = /^(\d+)\s+credits?(?:\s+incl(?:uding|\.)?\s+(.*))?$/i.exec(text.trim());
  if (match) return { credits: Number(match[1]), subjects: (match[2] ?? "").split(",").map(item => item.trim()).filter(Boolean) };
  return { credits: 5, subjects: text.split(",").map(item => item.trim()).filter(Boolean) };
}
function oLevelText(credits: number, subjects: string[]): string {
  return subjects.length ? `${credits} credits incl. ${subjects.join(", ")}` : `${credits} credits`;
}
function suggestCode(name: string): string {
  const words = name.split(/\s+/).filter(word => word.length > 2);
  const letters = words.length > 1 ? words.map(word => word[0]).join("") : (words[0] ?? "").slice(0, 3);
  return letters.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
}

export default function DepartmentForm({ organizationId, structure, departmentId, facultyId, staff, onSaved }: Props) {
  const navigate = useNavigate();
  const model = structure.setup?.model ?? "University";
  const classMode = model !== "University";
  const editing = departmentId !== null;
  const unit = editing ? structure.units.find(item => item.key === departmentId) : undefined;
  const detail = editing ? structure.departments.find(item => item.unitKey === departmentId) : undefined;
  const parentKey = editing ? unit?.parent ?? null : facultyId;
  const parent = structure.units.find(item => item.key === parentKey);
  const base = `/dashboard/organizations/${organizationId}/structure`;
  const draftKey = `edutracker.departmentDraft.${organizationId}.${parentKey ?? "root"}`;
  const noun = classMode ? "class" : "department";
  const steps = classMode ? ["Basics", "Arms and terms", "Capacity", "Review"] : ["Basics", "Duration and levels", "Admission", "Review"];

  const initial = useMemo<Draft>(() => {
    if (editing && unit && detail) {
      const o = parseOLevel(detail.oLevelRequirement);
      const known = AWARDS.includes(detail.award);
      return {
        name: unit.name, code: unit.code ?? "", award: known ? detail.award : "Other", otherAward: known ? "" : detail.award, description: detail.description, hod: detail.hodStaffProfileId ?? "",
        length: detail.levels.length, levels: detail.levels, terms: detail.semestersPerLevel,
        trainingOn: Boolean(detail.industrialTraining), trainingLevel: detail.industrialTraining?.level ?? detail.levels[2] ?? detail.levels[0] ?? "", trainingTerm: detail.industrialTraining?.termOrdinal ?? detail.semestersPerLevel,
        internshipOn: Boolean(detail.postGraduationInternshipYears), internship: detail.postGraduationInternshipYears ?? 1,
        directOn: Boolean(detail.directEntryLevel), directLevel: detail.directEntryLevel ?? detail.levels[1] ?? "",
        maxIntake: detail.maxIntakePerSession, minUtme: detail.minUtmeScore === null ? "" : String(detail.minUtmeScore), utmeSubjects: detail.utmeSubjects,
        oLevelCredits: o.credits, oLevelSubjects: o.subjects, otherRequirements: detail.otherRequirements,
      };
    }
    const length = classMode ? 3 : 4;
    const levels = resize([], length, classMode);
    const fresh: Draft = {
      name: "", code: "", award: "B.Sc", otherAward: "", description: "", hod: "",
      length, levels, terms: model === "University" ? 2 : 3,
      trainingOn: false, trainingLevel: levels[2] ?? levels[0], trainingTerm: 2,
      internshipOn: false, internship: 1, directOn: false, directLevel: levels[1] ?? levels[0],
      maxIntake: classMode ? 40 : 120, minUtme: "", utmeSubjects: ["English Language"], oLevelCredits: 5, oLevelSubjects: ["English Language", "Mathematics"], otherRequirements: "",
    };
    try { const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null"); if (saved && typeof saved === "object") return { ...fresh, ...saved }; } catch { /* Start fresh. */ }
    return fresh;
  }, [editing, unit, detail, classMode, model, draftKey]);

  const [draft, setDraft] = useState<Draft>(initial);
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(() => Math.max(0, Math.min(3, Number(searchParams.get("step")) || 0)));
  const [editLevels, setEditLevels] = useState(false);
  const [codeTouched, setCodeTouched] = useState(editing);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(previous => ({ ...previous, [key]: value }));

  useEffect(() => {
    if (editing) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* Draft only lives in memory. */ }
  }, [draft, draftKey, editing]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (editing && (!unit || !detail)) return <section className="dz-card ac-empty"><h2>{noun} not found</h2><div className="ac-actions"><Link className="dz-btn-outline" to={base}>Back to Academic Structure</Link></div></section>;

  const award = draft.award === "Other" ? draft.otherAward.trim() : draft.award;
  const codeTaken = draft.code !== "" && structure.units.some(item => item.key !== departmentId && (item.code ?? "").toUpperCase() === draft.code.toUpperCase());
  const levelNames = draft.levels.map(level => level.trim());
  const duplicateLevels = new Set(levelNames).size !== levelNames.length || levelNames.some(level => !level);
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = `Enter the ${noun} name.`;
  if (!draft.code) errors.code = "Enter a code.";
  else if (codeTaken) errors.code = "Another unit already uses this code.";
  if (!classMode && draft.award === "Other" && !draft.otherAward.trim()) errors.award = "Enter the award.";
  if (duplicateLevels) errors.levels = `Every ${classMode ? "arm" : "level"} needs a unique name.`;
  if (!Number.isFinite(draft.maxIntake) || draft.maxIntake < 1) errors.maxIntake = "Enter a number above 0.";
  if (draft.minUtme && (Number(draft.minUtme) < 0 || Number(draft.minUtme) > 400)) errors.minUtme = "UTME scores run from 0 to 400.";
  const stepFields = [["name", "code", "award"], ["levels"], ["maxIntake", "minUtme"], []];
  const stepValid = (index: number) => stepFields[index].every(field => !errors[field]);
  const fieldError = (field: string) => showErrors && errors[field] ? <span className="ac-error" role="alert">{errors[field]}</span> : null;

  function next() {
    if (!stepValid(step)) { setShowErrors(true); return; }
    setShowErrors(false); setStep(step + 1);
  }
  function changeLength(value: number) {
    const length = Math.max(1, Math.min(classMode ? 12 : 7, value));
    const levels = resize(draft.levels, length, classMode);
    setDraft(previous => ({ ...previous, length, levels, trainingLevel: levels.includes(previous.trainingLevel) ? previous.trainingLevel : levels[0], directLevel: levels.includes(previous.directLevel) ? previous.directLevel : levels[Math.min(1, levels.length - 1)] }));
  }
  function cancel() {
    if (dirty && !window.confirm("Discard your changes?")) return;
    try { sessionStorage.removeItem(draftKey); } catch { /* Nothing saved. */ }
    navigate(editing ? `${base}/departments/${departmentId}` : parentKey ? `${base}/faculties/${parentKey}` : base);
  }
  async function submit() {
    if (!stepFields.every((_, index) => stepValid(index))) { setShowErrors(true); setStep(stepFields.findIndex((_, index) => !stepValid(index))); return; }
    setError(""); setSaving(true);
    const input: DepartmentInput = {
      facultyId: parentKey, name: draft.name.trim(), code: draft.code, award: classMode ? "" : award, description: draft.description,
      hodStaffProfileId: classMode ? null : draft.hod || null,
      // The store keys level count to durationYears; for classes that's the number of arms.
      durationYears: draft.length, levels: levelNames, semestersPerLevel: draft.terms,
      industrialTraining: !classMode && draft.trainingOn ? { level: draft.trainingLevel, termOrdinal: draft.trainingTerm } : null,
      postGraduationInternshipYears: !classMode && draft.internshipOn ? draft.internship : null,
      directEntryLevel: !classMode && draft.directOn ? draft.directLevel : null,
      maxIntakePerSession: draft.maxIntake, minUtmeScore: !classMode && draft.minUtme ? Number(draft.minUtme) : null,
      utmeSubjects: classMode ? [] : draft.utmeSubjects,
      oLevelRequirement: classMode ? "" : oLevelText(draft.oLevelCredits, draft.oLevelSubjects),
      otherRequirements: draft.otherRequirements,
    };
    try {
      let key = departmentId;
      if (editing && departmentId) await academicApi.editDepartment(organizationId, departmentId, input);
      else key = (await academicApi.createDepartment(organizationId, input)).key;
      try { sessionStorage.removeItem(draftKey); } catch { /* Nothing saved. */ }
      onSaved();
      navigate(`${base}/departments/${key}`);
    } catch (issue) { setError(issue instanceof Error ? issue.message : `Could not save ${noun}.`); }
    finally { setSaving(false); }
  }

  const summaryLine = classMode
    ? `${draft.levels.length} arm${draft.levels.length === 1 ? "" : "s"} · ${draft.terms} terms`
    : `${draft.length} year${draft.length === 1 ? "" : "s"} · ${draft.levels[0]} → ${draft.levels.at(-1)} · ${draft.terms} semesters per level`;
  const crumbs = [{ label: "Academic Structure", to: base }, ...(parent ? [{ label: parent.name, to: `${base}/faculties/${parent.key}` }] : []), ...(editing && unit ? [{ label: unit.name, to: `${base}/departments/${unit.key}` }] : []), { label: editing ? "Edit" : `New ${noun}` }];

  return <>
    <AcHeader crumbs={crumbs} title={editing ? `Edit ${unit?.name}` : `New ${noun}`} meta={[parent ? `${model === "University" ? "Faculty" : "Section"}: ${parent.name}` : null]} />
    <div className="ac-wizard">
      <Stepper steps={steps} current={step} onJump={index => { setShowErrors(false); setStep(index); }} />

      <section className="dz-card ac-step-panel" aria-labelledby="ac-step-title">
        <h2 id="ac-step-title">Step {step + 1} of {steps.length} · {steps[step]}</h2>

        {step === 0 && <>
          <p>{classMode ? "Name the class and give it a short code." : "The course of study this department runs."}</p>
          <div className="ac-form-grid">
            <label className="ac-field ac-span"><span className="ac-label">{classMode ? "Class" : "Department"} name</span>
              <input className="input" value={draft.name} autoFocus placeholder={classMode ? "e.g. SS1" : "e.g. Computer Engineering"} onChange={event => setDraft(previous => ({ ...previous, name: event.target.value, code: codeTouched ? previous.code : suggestCode(event.target.value) }))} />{fieldError("name")}</label>
            <label className="ac-field"><span className="ac-label">Code</span>
              <input className="input" value={draft.code} maxLength={6} onChange={event => { setCodeTouched(true); set("code", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); }} />
              {fieldError("code") ?? <span className={codeTaken ? "ac-error" : "ac-hint"}>{codeTaken ? "Another unit already uses this code." : "Up to 6 characters. Prefixes course codes and matric numbers."}</span>}</label>
            {!classMode && <label className="ac-field"><span className="ac-label">Award</span><select className="input" value={draft.award} onChange={event => set("award", event.target.value)}>{AWARDS.map(item => <option key={item}>{item}</option>)}</select></label>}
            {!classMode && draft.award === "Other" && <label className="ac-field"><span className="ac-label">Other award</span><input className="input" value={draft.otherAward} onChange={event => set("otherAward", event.target.value)} />{fieldError("award")}</label>}
            {!classMode && <label className="ac-field"><span className="ac-label">Head of Department</span><select className="input" value={draft.hod} onChange={event => set("hod", event.target.value)}><option value="">Set later</option>{staff.map(person => <option key={person.staffProfileId} value={person.staffProfileId}>{person.fullName}</option>)}</select></label>}
            <label className="ac-field ac-span"><span className="ac-label">Description <span className="ac-hint">(optional)</span></span><textarea className="input" rows={3} value={draft.description} onChange={event => set("description", event.target.value)} /></label>
          </div>
        </>}

        {step === 1 && <>
          <p>{classMode ? "How many arms this class runs, and how many terms in a session." : "How long the programme runs. Levels are created from the length; rename them if your school uses different names."}</p>
          <div className="ac-form-grid">
            <div className="ac-field"><span className="ac-label">{classMode ? "Number of arms" : "Programme length"}</span>
              <div className="ac-number"><button type="button" aria-label="Fewer" disabled={draft.length <= 1} onClick={() => changeLength(draft.length - 1)}>−</button><span aria-live="polite">{draft.length} {classMode ? (draft.length === 1 ? "arm" : "arms") : (draft.length === 1 ? "year" : "years")}</span><button type="button" aria-label="More" disabled={draft.length >= (classMode ? 12 : 7)} onClick={() => changeLength(draft.length + 1)}>+</button></div></div>
            <label className="ac-field"><span className="ac-label">{model === "University" ? "Semesters" : "Terms"} per {classMode ? "session" : "level"}</span><select className="input" value={draft.terms} onChange={event => set("terms", Number(event.target.value))}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          </div>
          <div className="ac-field"><span className="ac-label" style={{ display: "flex", justifyContent: "space-between" }}>{classMode ? "Arms" : "Levels"}<button type="button" className="ac-link-btn" onClick={() => setEditLevels(!editLevels)}>{editLevels ? "Done" : "✎ Rename"}</button></span>
            <div className="ac-chip-row">{draft.levels.map((level, index) => editLevels
              ? <input key={index} className="input ac-chip-input" aria-label={`${classMode ? "Arm" : "Level"} ${index + 1} name`} value={level} onChange={event => set("levels", draft.levels.map((item, i) => i === index ? event.target.value : item))} />
              : <span key={index} className="ac-chip">{level}</span>)}</div>{fieldError("levels")}</div>
          {!classMode && <>
            <div className="ac-option"><label className="ac-check"><input type="checkbox" checked={draft.trainingOn} onChange={event => set("trainingOn", event.target.checked)} />Industrial training (e.g. SIWES) replaces a semester</label>
              {draft.trainingOn && <div className="ac-option-body">
                <label className="ac-field"><span className="ac-label">Level</span><select className="input" value={draft.trainingLevel} onChange={event => set("trainingLevel", event.target.value)}>{draft.levels.map(level => <option key={level}>{level}</option>)}</select></label>
                <label className="ac-field"><span className="ac-label">Semester</span><select className="input" value={draft.trainingTerm} onChange={event => set("trainingTerm", Number(event.target.value))}>{Array.from({ length: draft.terms }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
              </div>}</div>
            <div className="ac-option"><label className="ac-check"><input type="checkbox" checked={draft.directOn} onChange={event => set("directOn", event.target.checked)} />Direct Entry students join above the first level</label>
              {draft.directOn && <div className="ac-option-body"><label className="ac-field"><span className="ac-label">Joins at</span><select className="input" value={draft.directLevel} onChange={event => set("directLevel", event.target.value)}>{draft.levels.slice(1).map(level => <option key={level}>{level}</option>)}</select></label></div>}</div>
            <div className="ac-option"><label className="ac-check"><input type="checkbox" checked={draft.internshipOn} onChange={event => set("internshipOn", event.target.checked)} />Internship or house job after graduation</label>
              {draft.internshipOn && <div className="ac-option-body"><label className="ac-field"><span className="ac-label">Years</span><select className="input" value={draft.internship} onChange={event => set("internship", Number(event.target.value))}>{[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}</select></label></div>}</div>
          </>}
        </>}

        {step === 2 && <>
          <p>{classMode ? "How many students this class can take each session." : "Who can be admitted, and how many each session."}</p>
          <div className="ac-form-grid">
            <label className="ac-field"><span className="ac-label">{classMode ? "Capacity per session" : "Maximum intake per session"}</span><input className="input" type="number" min={1} value={draft.maxIntake} onChange={event => set("maxIntake", Number(event.target.value))} />{fieldError("maxIntake")}</label>
            {!classMode && <label className="ac-field"><span className="ac-label">Minimum UTME score <span className="ac-hint">(optional)</span></span><input className="input" type="number" min={0} max={400} value={draft.minUtme} onChange={event => set("minUtme", event.target.value)} placeholder="e.g. 200" />{fieldError("minUtme")}</label>}
            {!classMode && <div className="ac-span"><TagInput label="Required UTME subjects" value={draft.utmeSubjects} onChange={value => set("utmeSubjects", value)} suggestions={SUBJECTS} placeholder="Type a subject and press Enter" /></div>}
            {!classMode && <label className="ac-field"><span className="ac-label">O'Level credits required</span><select className="input" value={draft.oLevelCredits} onChange={event => set("oLevelCredits", Number(event.target.value))}>{[3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n} credits</option>)}</select></label>}
            {!classMode && <div className="ac-span"><TagInput label="O'Level subjects that must be among the credits" value={draft.oLevelSubjects} onChange={value => set("oLevelSubjects", value)} suggestions={SUBJECTS} placeholder="Type a subject and press Enter" /></div>}
            <label className="ac-field ac-span"><span className="ac-label">Other requirements <span className="ac-hint">(optional)</span></span><textarea className="input" rows={3} value={draft.otherRequirements} onChange={event => set("otherRequirements", event.target.value)} placeholder={classMode ? "e.g. Entrance exam" : "e.g. Post-UTME screening"} /></label>
          </div>
        </>}

        {step === 3 && <div className="ac-review">
          <section><div className="ac-review-head"><h3>{steps[0]}</h3><button type="button" className="ac-link-btn" onClick={() => setStep(0)}>Edit</button></div>
            <dl className="ac-dl"><dt>Name</dt><dd>{draft.name || "—"}</dd><dt>Code</dt><dd>{draft.code || "—"}</dd>{!classMode && <><dt>Award</dt><dd>{award || "—"}</dd><dt>HOD</dt><dd>{staff.find(person => person.staffProfileId === draft.hod)?.fullName ?? "Set later"}</dd></>}</dl></section>
          <section><div className="ac-review-head"><h3>{steps[1]}</h3><button type="button" className="ac-link-btn" onClick={() => setStep(1)}>Edit</button></div>
            <p style={{ margin: 0 }}>{summaryLine}</p>
            {!classMode && <LevelTimeline levels={draft.levels} training={draft.trainingOn ? draft.trainingLevel : null} directEntry={draft.directOn ? draft.directLevel : null} internshipYears={draft.internshipOn ? draft.internship : null} />}</section>
          <section><div className="ac-review-head"><h3>{steps[2]}</h3><button type="button" className="ac-link-btn" onClick={() => setStep(2)}>Edit</button></div>
            <dl className="ac-dl"><dt>{classMode ? "Capacity" : "Max intake"}</dt><dd>{draft.maxIntake} per session</dd>
              {!classMode && <><dt>Min UTME</dt><dd>{draft.minUtme || "Not set"}</dd><dt>UTME subjects</dt><dd>{draft.utmeSubjects.join(", ") || "Not set"}</dd><dt>O'Level</dt><dd>{oLevelText(draft.oLevelCredits, draft.oLevelSubjects)}</dd></>}
              {draft.otherRequirements && <><dt>Other</dt><dd>{draft.otherRequirements}</dd></>}</dl></section>
        </div>}

        {error && <p role="alert" className="ac-error">{error}</p>}
        <div className="ac-step-nav">
          <button type="button" className="dz-btn-outline" onClick={step === 0 ? cancel : () => { setShowErrors(false); setStep(step - 1); }}>{step === 0 ? "Cancel" : "Back"}</button>
          {step < steps.length - 1
            ? <button type="button" className="dz-btn-green" onClick={next}>Continue</button>
            : <button type="button" className="dz-btn-green" disabled={saving} onClick={() => void submit()}>{saving ? "Saving…" : editing ? "Save changes" : `Create ${noun}`}</button>}
        </div>
      </section>

      <aside className="dz-card ac-summary" aria-label="Summary">
        <h3>Summary</h3>
        <div>{!classMode && award && <Badge>{award}</Badge>}<div className="ac-summary-title" style={{ marginTop: ".4rem" }}>{draft.name || `New ${noun}`}</div>
          <div className="ac-hint">{[draft.code, parent?.name].filter(Boolean).join(" · ")}</div></div>
        {classMode ? <div className="ac-chip-row">{draft.levels.map((level, index) => <span key={index} className="ac-chip">{level}</span>)}</div>
          : <LevelTimeline levels={draft.levels} training={draft.trainingOn ? draft.trainingLevel : null} directEntry={draft.directOn ? draft.directLevel : null} internshipYears={draft.internshipOn ? draft.internship : null} />}
        <dl className="ac-dl"><dt>{classMode ? "Terms" : "Semesters"}</dt><dd>{draft.terms} per {classMode ? "session" : "level"}</dd><dt>{classMode ? "Capacity" : "Max intake"}</dt><dd>{draft.maxIntake}</dd></dl>
      </aside>
    </div>
  </>;
}
