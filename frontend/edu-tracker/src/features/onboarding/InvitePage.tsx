/**
 * The page a school's invite link opens: /invite/{token}. No account needed.
 *
 * The person fills in their own details and where they think they belong;
 * the school decides the placement when it approves. Reopening the link
 * shows where the request stands, and the sign-in details once approved.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Wordmark from "../../components/Wordmark";
import { AdminApiError } from "../portal/adminApi";
import { portalSignIn } from "../portal/helpers";
import { joinApi } from "./joinApi";
import { JOIN_ROLE_LABEL, type JoinLinkView } from "./joinLinks";
import "../../layouts/Dashboard.css";
import "../portal/portal.css";
import "./invite.css";

type Form = {
  fullName: string; email: string; phone: string; dateOfBirth: string; sex: string; homeAddress: string;
  nextOfKinName: string; nextOfKinPhone: string; departmentId: string; level: string; previousSchool: string;
  title: string; highestQualification: string; subjects: string; jobTitle: string; password: string; confirm: string;
};
const EMPTY: Form = {
  fullName: "", email: "", phone: "", dateOfBirth: "", sex: "", homeAddress: "", nextOfKinName: "", nextOfKinPhone: "",
  departmentId: "", level: "", previousSchool: "", title: "", highestQualification: "", subjects: "", jobTitle: "", password: "", confirm: "",
};
const day = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default function InvitePage() {
  const { token = "" } = useParams();
  const [view, setView] = useState<JoinLinkView | null>(null);
  const [missing, setMissing] = useState("");
  const [form, setForm] = useState<Form>(EMPTY);
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    joinApi.view(token)
      .then(found => { if (live) setView(found); })
      .catch(cause => { if (live) setMissing(cause instanceof AdminApiError ? cause.message : "Couldn't open this link."); });
    return () => { live = false; };
  }, [token]);

  const set = (key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(current => ({ ...current, [key]: event.target.value }));
  const department = view?.departments.find(item => item.departmentId === form.departmentId);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirm) { setError("The two passwords don't match."); return; }
    setBusy(true); setError("");
    try {
      const fields: Partial<Form> = { ...form };
      delete fields.confirm; // Checked here; the server only needs the password once.
      await joinApi.submit(token, { ...fields, photograph: photo || undefined });
      setView(await joinApi.view(token));
      window.scrollTo({ top: 0 });
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "Couldn't send your request. Try again.");
    } finally { setBusy(false); }
  }

  function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setError("Choose a photograph under 1 MB."); event.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  const role = view ? JOIN_ROLE_LABEL[view.role] : "";
  const request = view?.request ?? null;
  // Each step is done, the current one, or still ahead.
  const steps: ("done" | "now" | "")[] = !request ? ["now", "", ""]
    : request.status === "Pending" ? ["done", "now", ""]
    : request.status === "Approved" ? ["done", "done", "now"]
    : ["done", "done", ""];

  return <main className="dz-scope pt-signin iv-page">
    <div className="pt-signin-frame iv-frame">
      <aside className="pt-signin-intro iv-intro">
        <Wordmark fontSize="1.6rem" />
        <div className="pt-signin-intro-copy">
          <span className="pt-signin-kicker">{view ? "You're invited" : "Invitation"}</span>
          <h2>{view ? <>Join {view.schoolName}</> : "Join your school"}</h2>
          {view && <p>as {/^[AEIOU]/.test(role) ? "an" : "a"} <strong>{role.toLowerCase()}</strong>. Fill in your details and the school will place you and open your portal.</p>}
        </div>
        {view && <ol className="iv-steps" aria-label="Progress">
          {["Fill in your details", "The school reviews it", "Sign in to your portal"].map((label, index) => (
            <li key={label} className={steps[index]} aria-current={steps[index] === "now" ? "step" : undefined}>
              <span className="iv-step-dot" aria-hidden="true">{steps[index] === "done" ? "✓" : index + 1}</span>
              <span>{label}</span>
            </li>
          ))}
        </ol>}
        <span className="pt-signin-intro-foot">{view?.status === "Open" ? `This link works until ${day(view.expiresOn)} and only once.` : "One link, one person."}</span>
      </aside>

      <div className="pt-signin-card iv-card">
        {missing ? <Notice title="This link doesn't work" text={missing} />
          : !view ? <div aria-busy="true"><div className="skeleton" style={{ height: 28, width: "60%", borderRadius: 8 }} /><div className="skeleton" style={{ height: 320, marginTop: 16, borderRadius: 14 }} /></div>
          : request?.status === "Approved" && request.outcome ? <section className="iv-result" aria-live="polite">
            <span className="iv-badge iv-badge-ok">Approved</span>
            <h1 className="dz-page-title">Welcome, {request.fullName.split(" ")[0]}.</h1>
            <p className="iv-muted">{view.schoolName} has approved you. Sign in to your portal with this school email and the password you chose.</p>
            <dl className="iv-creds">
              <div><dt>School email</dt><dd className="iv-mono">{request.outcome.schoolEmail}<CopyButton value={request.outcome.schoolEmail} /></dd></div>
              <div><dt>{view.role === "Student" ? "Matric / admission no." : "Staff number"}</dt><dd className="iv-mono">{request.outcome.number}</dd></div>
              <div><dt>Placed in</dt><dd>{request.outcome.placement}</dd></div>
            </dl>
            <Link className="dz-btn-green iv-go" to={portalSignIn(view.organizationId)}>Go to portal sign-in →</Link>
          </section>
          : request?.status === "Declined" ? <section className="iv-result">
            <span className="iv-badge iv-badge-warn">Not approved</span>
            <h1 className="dz-page-title">The school sent your request back</h1>
            <blockquote className="iv-reason">{request.declineReason}</blockquote>
            <p className="iv-muted">Ask {view.schoolName} for a new link and send your details again.</p>
          </section>
          : request ? <section className="iv-result" aria-live="polite">
            <span className="iv-badge">Waiting for the school</span>
            <h1 className="dz-page-title">Request sent</h1>
            <p className="iv-muted">Thanks, {request.fullName.split(" ")[0]}. {view.schoolName} has your details from {day(request.submittedAt)}. Open this same link again to check: once you're approved, your school email and portal link will be here.</p>
            <button type="button" className="dz-btn-outline" onClick={() => void joinApi.view(token).then(setView).catch(() => undefined)}>Check again</button>
          </section>
          : view.status !== "Open" ? <Notice title="This link no longer works" text={`It ${view.status === "Expired" ? "expired" : "was cancelled by the school"}. Ask ${view.schoolName} for a new one.`} />
          : !view.departments.length ? <Notice title="Not ready yet" text={`${view.schoolName} hasn't set up its departments yet. Try again later.`} />
          : <form className="iv-form" onSubmit={event => void send(event)}>
            <header>
              <p className="pt-signin-school">{view.schoolName}</p>
              <h1 className="dz-page-title">Your details</h1>
              <p className="iv-muted">Use your real names, as on your documents. The school will check them.</p>
            </header>

            <fieldset>
              <legend>About you</legend>
              <div className="iv-photo">
                <span className="iv-avatar" aria-hidden="true">{photo ? <img src={photo} alt="" /> : initialsOf(form.fullName)}</span>
                <label className="dz-btn-outline iv-photo-btn">{photo ? "Change photo" : "Add a photo"}<input type="file" accept="image/*" onChange={choosePhoto} /></label>
                <small>Optional · under 1 MB</small>
              </div>
              <div className="iv-grid">
                {view.role !== "Student" && <Field label="Title" hint="Optional"><input className="input" value={form.title} onChange={set("title")} placeholder="Mr, Mrs, Dr" maxLength={20} /></Field>}
                <Field label="Full name" wide={view.role === "Student"}><input className="input" value={form.fullName} onChange={set("fullName")} placeholder="First, middle and surname" autoComplete="name" required maxLength={120} /></Field>
                <Field label="Date of birth"><input className="input" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required /></Field>
                <Field label="Sex"><select className="input" value={form.sex} onChange={set("sex")} required><option value="">Choose…</option><option>Female</option><option>Male</option></select></Field>
              </div>
            </fieldset>

            <fieldset>
              <legend>Contact</legend>
              <div className="iv-grid">
                <Field label="Email"><input className="input" type="email" value={form.email} onChange={set("email")} autoComplete="email" required /></Field>
                <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={set("phone")} placeholder="0803 123 4567" autoComplete="tel" required /></Field>
                <Field label="Home address" wide><input className="input" value={form.homeAddress} onChange={set("homeAddress")} autoComplete="street-address" required maxLength={200} /></Field>
                <Field label="Next of kin"><input className="input" value={form.nextOfKinName} onChange={set("nextOfKinName")} placeholder="Full name" required maxLength={120} /></Field>
                <Field label="Next of kin's phone"><input className="input" type="tel" value={form.nextOfKinPhone} onChange={set("nextOfKinPhone")} required /></Field>
              </div>
            </fieldset>

            <fieldset>
              <legend>{view.role === "Student" ? "Your class" : "Your work"}</legend>
              <p className="iv-muted iv-legend-note">Tell us where you think you belong. The school confirms it when it approves you.</p>
              <div className="iv-grid">
                <Field label="Department" wide={view.role !== "Student"}>
                  <select className="input" value={form.departmentId} onChange={event => setForm(current => ({ ...current, departmentId: event.target.value, level: "" }))} required>
                    <option value="">Choose…</option>
                    {view.departments.map(item => <option key={item.departmentId} value={item.departmentId}>{item.name}</option>)}
                  </select>
                </Field>
                {view.role === "Student" ? <>
                  <Field label="Level or class">
                    <select className="input" value={form.level} onChange={set("level")} required disabled={!department}>
                      <option value="">{department ? "Choose…" : "Pick a department first"}</option>
                      {department?.levels.map(level => <option key={level}>{level}</option>)}
                    </select>
                  </Field>
                  <Field label="Previous school" hint="Optional" wide><input className="input" value={form.previousSchool} onChange={set("previousSchool")} maxLength={120} /></Field>
                </> : <>
                  <Field label="Highest qualification" wide><input className="input" value={form.highestQualification} onChange={set("highestQualification")} placeholder={view.role === "Teaching" ? "e.g. M.Sc Computer Science" : "e.g. HND Accounting"} required maxLength={120} /></Field>
                  {view.role === "Teaching"
                    ? <Field label="Courses or subjects you can teach" wide><textarea className="input" rows={3} value={form.subjects} onChange={set("subjects")} placeholder="e.g. Mathematics, Further Mathematics, Physics" required maxLength={300} /></Field>
                    : <Field label="Post you're joining as" wide><input className="input" value={form.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Bursary clerk, Lab technician, Driver" required maxLength={80} /></Field>}
                </>}
              </div>
            </fieldset>

            <fieldset>
              <legend>Your password</legend>
              <p className="iv-muted iv-legend-note">You'll use it with the school email you get on approval.</p>
              <div className="iv-grid">
                <Field label="Password"><input className="input" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" /></Field>
                <Field label="Type it again"><input className="input" type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" minLength={8} required /></Field>
              </div>
            </fieldset>

            {error && <p role="alert" className="cohort-error">{error}</p>}
            <button className="dz-btn-green" disabled={busy}>{busy ? "Sending…" : `Send to ${view.schoolName}`}</button>
          </form>}
      </div>
    </div>
  </main>;
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`iv-field${wide ? " iv-wide" : ""}`}><span>{label}{hint && <small> · {hint}</small>}</span>{children}</label>;
}

function Notice({ title, text }: { title: string; text: string }) {
  return <section className="iv-result">
    <span className="iv-badge iv-badge-warn">Link unavailable</span>
    <h1 className="dz-page-title">{title}</h1>
    <p className="iv-muted">{text}</p>
    <Link className="dz-btn-outline" to="/">EduTracker home</Link>
  </section>;
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="iv-copy" onClick={() => { void navigator.clipboard?.writeText(value).then(() => { setDone(true); window.setTimeout(() => setDone(false), 1500); }); }}>{done ? "Copied" : "Copy"}</button>;
}

const initialsOf = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join("") || "?";
