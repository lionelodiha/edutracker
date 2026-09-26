import { Link } from "react-router-dom";

type Props = { base: string; hasStructure: boolean; hasSession: boolean | null; hasTeachers: boolean | null; hasStudents: boolean | null };

/** Setup progress as one horizontal band. Only the next unfinished step gets the primary action. */
export default function SetupChecklist({ base, hasStructure, hasSession, hasTeachers, hasStudents }: Props) {
  const steps = [
    { label: "School created", done: true as boolean | null, to: "", action: "" },
    { label: "Academic structure", done: hasStructure as boolean | null, to: `${base}/structure`, action: "Set up structure" },
    { label: "First session", done: hasSession, to: `${base}/structure?tab=sessions`, action: "Open a session" },
    { label: "Teachers", done: hasTeachers, to: `${base}/staff`, action: "Add teachers" },
    { label: "Students", done: hasStudents, to: `${base}/staff`, action: "Add students" },
  ];
  const done = steps.filter(step => step.done).length;
  if (done === steps.length) return null;
  const next = steps.find(step => step.done === false);
  return <section className="ov-setup" aria-label="Get your school ready">
    <div className="ov-setup-head">
      <div><h2>Get your school ready</h2><p>{done} of {steps.length} done{next ? ` · next: ${next.label.toLowerCase()}` : ""}</p></div>
      {next && <Link className="dz-btn-green" to={next.to}>{next.action}</Link>}
    </div>
    <ol className="ov-steps">
      {steps.map(step => <li key={step.label} className={step.done ? "is-done" : step === next ? "is-next" : step.done === null ? "is-unknown" : ""}>
        <span className="ov-step-bar" aria-hidden="true" />
        <span className="ov-step-label">
          {step.done ? <span className="ov-check" aria-hidden="true">✓</span> : null}
          {step.label}
          <span className="sr-only">{step.done ? " (done)" : step.done === null ? " (status unavailable)" : " (to do)"}</span>
        </span>
      </li>)}
    </ol>
  </section>;
}
