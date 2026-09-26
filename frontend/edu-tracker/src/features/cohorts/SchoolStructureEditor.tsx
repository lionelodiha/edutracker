import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal";
import { academicUnitPath, addAcademicUnit, initializeSchool, readSchoolSetup, saveSchoolSetup, setUnitCode, unitKindOf, type SchoolSetup } from "./schoolSetup";
import { unitLabel, type SchoolModel } from "./settings";

export default function SchoolStructureEditor({ organizationId, editable = true }: { organizationId: string; editable?: boolean }) {
  const [setup, setSetup] = useState(() => readSchoolSetup(organizationId));
  const [model, setModel] = useState<SchoolModel>("Secondary");
  const [dialog, setDialog] = useState<{ kind: "Faculty" | "Department" | "Programme" | "Stream" | "Stage" | "Division"; parent: string | null } | null>(null);
  const [divisionNames, setDivisionNames] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  function commit(next: SchoolSetup) {
    try { saveSchoolSetup(organizationId, next); setSetup(next); setNotice("School structure saved in this browser."); setError(""); return true; }
    catch { setError("Your browser could not save this change. Check available storage and try again."); return false; }
  }
  function open(kind: NonNullable<typeof dialog>["kind"], parent: string | null = null) {
    setName(""); setError(""); setDivisionNames({}); setSelectedStages(kind === "Stream" || kind === "Division" ? [] : setup?.structure.stages.map(s => s.key) ?? []); setDialog({ kind, parent });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!setup || !dialog) return;
    try {
      let next: SchoolSetup;
      if (dialog.kind === "Division") {
        if (!selectedStages.length) throw new Error("Select the stages that use this division.");
        next = structuredClone(setup);
        next.structure.placements.push({ key: crypto.randomUUID(), unit: dialog.parent, arm: name.trim(), labels: next.structure.stages.map(stage => selectedStages.includes(stage.key) ? (divisionNames[stage.key] ?? "").trim() : "") });
      } else if (dialog.kind === "Stage") {
        if (setup.structure.stages.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) throw new Error("That stage already exists.");
        next = structuredClone(setup);
        next.structure.stages.push({ key: crypto.randomUUID(), name: name.trim(), shortName: name.trim() });
        next.structure.placements.forEach(placement => placement.labels.push(name.trim()));
      } else next = addAcademicUnit(setup, name, dialog.parent, selectedStages);
      if (commit(next)) setDialog(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save."); }
  }
  if (!setup) return <section className="dz-card school-setup-intro">
    <span className="school-overline">FIRST, YOUR SCHOOL</span><h2>Every school has its own shape.</h2>
    <p>Choose your institution type to set up the right academic structure.</p>
    <div className="school-type-grid">{(["Primary", "Secondary", "University"] as const).map(value => <button key={value} disabled={!editable} className={`school-type-option ${model === value ? "selected" : ""}`} aria-pressed={model === value} onClick={() => setModel(value)}><strong>{value}</strong><span>{value === "University" ? "Faculties → departments → levels" : value === "Secondary" ? "Stages → optional streams → classes" : "Stages → classes"}</span></button>)}</div>
    {error && <p role="alert" className="cohort-error">{error}</p>}
    {editable && <button className="dz-btn-green" onClick={() => { try { initializeSchool(organizationId, model); setSetup(readSchoolSetup(organizationId)); } catch { setError("Could not save school setup in this browser."); } }}>Set up {model.toLowerCase()} →</button>}
    <p className="dz-note">Frontend preview · school structure is stored in this browser.</p>
  </section>;

  const { structure } = setup;
  function saveCode(unitKey: string) {
    const draft = codeDrafts[unitKey] ?? "";
    try {
      const next = setUnitCode(setup!, unitKey, draft);
      if (commit(next)) setCodeDrafts(previous => ({ ...previous, [unitKey]: next.structure.units.find(item => item.key === unitKey)?.code ?? "" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save."); }
  }
  function unitTree(parent: string | null, depth = 0): React.ReactNode {
    return structure.units.filter(unit => unit.parent === parent).map(unit => {
      const kind = setup!.model !== "University" ? null : (unitKindOf(structure, unit.key) ?? "Department");
      const kindName = kind ? unitLabel(setup!.model, kind) : "Stream";
      const placements = structure.placements.filter(p => p.unit === unit.key);
      const crumb = academicUnitPath(structure, unit.key).join(" / ");
      const childKind = kind === "Faculty" ? "Department" : kind === "Department" ? "Programme" : null;
      return <article className="school-tree-node" key={unit.key}>
        <div className="school-tree-heading"><div><span className="school-overline">{kindName}</span><h3>{unit.name}</h3>
          <p className="dz-note" style={{ margin: "0.15rem 0 0" }}>{crumb}</p>
          {setup!.model === "University" && unit.code && <p className="dz-note mono" style={{ margin: "0.15rem 0 0" }}>Code: {unit.code}</p>}</div>
          {editable && setup!.model === "University" && childKind && <button className="dz-btn-outline" onClick={() => open(childKind, unit.key)}>+ {unitLabel(setup!.model, childKind).toLowerCase()}</button>}
          {editable && setup!.model !== "University" && <button className="dz-btn-outline" onClick={() => open("Division", unit.key)}>Configure division</button>}
        </div>
        {editable && setup!.model === "University" && kind !== "Faculty" && <form className="school-code-row" onSubmit={event => { event.preventDefault(); saveCode(unit.key); }}>
          <label>Unit code (max 6, used in ID numbers)<input className="input" style={{ maxWidth: 120 }} placeholder={unit.code ?? "e.g. CPE"} value={codeDrafts[unit.key] ?? unit.code ?? ""} maxLength={6} onChange={event => setCodeDrafts(previous => ({ ...previous, [unit.key]: event.target.value }))} /></label>
          <button className="dz-btn-outline" type="submit">Save code</button>
        </form>}
        {placements.map(placement => <div key={placement.key} className="school-stage-chips">{placement.labels.map((label, i) => label && <span key={structure.stages[i].key}>{label}</span>)}</div>)}
        {unitTree(unit.key, depth + 1)}
        {kind === "Faculty" && !structure.units.some(child => child.parent === unit.key) && <p className="dz-note">Add a department here. Its levels will be generated from your stages.</p>}
      </article>;
    });
  }
  return <section className="school-structure">
    <header className="school-structure-hero"><div><span className="school-overline">{setup.model} · ACADEMIC STRUCTURE</span><h2>A place for every student.</h2><p>{setup.model === "University" ? "Build your faculties, add departments, then follow each level to its student records." : "Define your stages and optional streams. Your classes follow the structure you choose."}</p></div>
      <Link className="dz-btn-green" to={`/dashboard/organizations/${organizationId}/sessions`}>Open sessions →</Link></header>
    <p className="dz-note">Frontend preview · saved in this browser. Student records are organized separately for each session.</p>
    {notice && <p role="status" className="school-saved">{notice}</p>}
    {error && !dialog && <p role="alert" className="cohort-error">{error}</p>}
    <div className="school-structure-grid"><section className="dz-card"><div className="school-tree-heading"><div><span className="school-overline">01 / PROGRESSION</span><h3>Academic stages</h3></div>{editable && <button className="dz-btn-outline" onClick={() => open("Stage")}>+ Stage</button>}</div>
      <ol className="school-stages">{structure.stages.map(stage => <li key={stage.key}>{stage.name}</li>)}</ol><p className="dz-note">Stages determine the order of study. Creating a stage generates its placements; student promotion remains separate until assessment is available.</p>
    </section><section className="dz-card"><div className="school-tree-heading"><div><span className="school-overline">02 / ORGANIZATION</span><h3>{setup.model === "University" ? "Faculties & departments" : "Streams & classes"}</h3></div>{editable && setup.model !== "Primary" && <button className="dz-btn-green" onClick={() => open(setup.model === "University" ? "Faculty" : "Stream")}>+ {setup.model === "University" ? "Faculty" : "Stream"}</button>}</div>
      {unitTree(null)}
      {!structure.units.length && <p className="school-empty">{setup.model === "University" ? "Start with a faculty, then add its departments. Levels appear automatically." : "Your classes belong directly to the school. Add streams only if your school uses them."}</p>}
      {structure.placements.filter(p => p.unit === null).map(p => <div className="school-stage-chips" key={p.key}>{p.labels.filter(Boolean).map(label => <span key={label}>{label}</span>)}</div>)}
      {editable && setup.model !== "University" && <button className="dz-btn-outline" style={{ marginTop: 18 }} onClick={() => open("Division")}>Configure school division</button>}
    </section></div>
    {editable && <details className="dz-card school-labels"><summary>Class and level names</summary><p className="dz-note">Use your school's own names. Clear a label to omit that placement. Existing student records are retained when names change.</p>
      <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); const next = structuredClone(setup); next.structure.placements.forEach(p => { p.labels = structure.stages.map(stage => String(form.get(`${p.key}:${stage.key}`) ?? "").trim()); }); commit(next); }}>
        {structure.placements.map(p => <fieldset key={p.key}><legend>{structure.units.find(u => u.key === p.unit)?.name ?? "School classes"}</legend><div className="school-label-grid">{structure.stages.map((stage, i) => <label key={stage.key}>{stage.name}<input name={`${p.key}:${stage.key}`} defaultValue={p.labels[i] ?? ""} maxLength={80} /></label>)}</div></fieldset>)}
        <button className="dz-btn-outline" type="submit">Save names</button>
      </form>
    </details>}
    {dialog && <Modal titleId="school-structure-dialog" onClose={() => setDialog(null)}><h2 id="school-structure-dialog" className="dz-modal-title">Add {dialog.kind.toLowerCase()}</h2><form className="dz-form" onSubmit={submit}>
      <label className="input-label">{dialog.kind} name<input className="input" autoFocus required maxLength={80} value={name} onChange={event => setName(event.target.value)} /></label>
      {!["Stage", "Faculty"].includes(dialog.kind) && <fieldset className="school-stage-select"><legend>Stages offered here</legend>{structure.stages.map(stage => <label key={stage.key}><input type="checkbox" checked={selectedStages.includes(stage.key)} onChange={event => setSelectedStages(previous => event.target.checked ? [...previous, stage.key] : previous.filter(key => key !== stage.key))} />{stage.name}</label>)}</fieldset>}
      {dialog.kind === "Division" && <><p className="dz-note">For example, division A. Enter the exact class name your school uses at each selected stage.</p>{structure.stages.filter(stage => selectedStages.includes(stage.key)).map(stage => <label className="input-label" key={stage.key}>Class name at {stage.name}<input className="input" required maxLength={80} value={divisionNames[stage.key] ?? ""} onChange={event => setDivisionNames(previous => ({ ...previous, [stage.key]: event.target.value }))} /></label>)}</>}
      {error && <p role="alert" className="cohort-error">{error}</p>}<div className="dz-form-actions"><button type="button" className="dz-btn-outline" onClick={() => setDialog(null)}>Cancel</button><button className="dz-btn-green">Save {dialog.kind.toLowerCase()}</button></div>
    </form></Modal>}
  </section>;
}
