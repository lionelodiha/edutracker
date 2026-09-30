/**
 * A school's own portal sign-in: /portal/<school>. This is the link a school
 * shares with its students and staff. It sits outside the admin app, so it
 * needs no admin account and knows which school it belongs to already.
 */
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Logo from "../../components/LogoLockup";
import { isDemoMode } from "../../demoMode";
import { API_BASE } from "../../apiBase";
import { clearDemo, DEMO_DOMAINS, DEMO_ORGS, DEMO_PEOPLE, ensureDemo, prepareDemoLogins, type DemoLogin, type DemoRole, type DemoSchool } from "../../mocks/portalDemo";
import { portalApi, readPortalSession, savePortalSession } from "./api";
import { portalHome, portalSignIn } from "./helpers";
import type { PortalOrganization, PortalRole } from "./types";
import "../../layouts/Dashboard.css";
import "./portal.css";

const ROLE_LABEL: Record<DemoRole, string> = { Student: "Student", Teaching: "Teaching staff", NonTeaching: "Non-teaching staff" };
const demoSchoolOf = (schoolId: string) => (Object.keys(DEMO_ORGS) as DemoSchool[]).find(key => DEMO_ORGS[key].organizationId === schoolId) ?? null;

export default function PortalSignInPage() {
  const { schoolId = "" } = useParams();
  const navigate = useNavigate();
  const demo = isDemoMode() ? demoSchoolOf(schoolId) : null;
  const [school, setSchool] = useState<PortalOrganization | null>(null);
  const [missing, setMissing] = useState(false);
  const [schoolEmail, setSchoolEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [logins, setLogins] = useState<DemoLogin[]>([]);
  // A demo account typed into another school's portal: point to the right one.
  const [elsewhere, setElsewhere] = useState<DemoSchool | null>(null);
  const existing = readPortalSession();

  // Demo schools get real email-and-password logins, shown below the form.
  useEffect(() => {
    if (!demo) return;
    let live = true;
    prepareDemoLogins(demo).then(found => { if (live) setLogins(found); }).catch(() => { /* One-click buttons still work. */ });
    return () => { live = false; };
  }, [demo]);

  useEffect(() => {
    if (demo) return; // The demo school is built when someone picks an account.
    let live = true;
    portalApi.school(schoolId)
      .then(found => { if (live) setSchool(found); })
      .catch(() => { if (live) setMissing(true); });
    return () => { live = false; };
  }, [schoolId, demo]);

  // Already signed in to this school: go straight in.
  if (existing?.organizationId === schoolId) return <Navigate to={portalHome(schoolId, existing.kind === "Student" ? "Student" : "Teaching")} replace />;

  const name = demo ? DEMO_ORGS[demo].name : school?.name;

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setElsewhere(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/portal-login`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: schoolId, schoolEmail: schoolEmail.trim(), password }),
      });
      const result = await response.json().catch(() => ({})) as { data?: { userId: string; kind: "Student" | "Staff"; schoolEmail: string }; title?: string };
      if (!response.ok || !result.data) throw new Error(result.title ?? "Sign-in failed.");
      savePortalSession({ ...result.data, organizationId: schoolId });
      // Staff land in the teaching area; non-teaching staff are sent on to theirs.
      navigate(portalHome(schoolId, result.data.kind === "Student" ? "Student" : "Teaching"));
    } catch (cause) {
      const domain = schoolEmail.trim().toLowerCase().split("@")[1];
      const home = (Object.keys(DEMO_DOMAINS) as DemoSchool[]).find(key => DEMO_DOMAINS[key] === domain && DEMO_ORGS[key].organizationId !== schoolId) ?? null;
      setElsewhere(home);
      setError(home ? `That account belongs to ${DEMO_ORGS[home].name}, not ${name ?? "this school"}. Each school's portal only accepts its own accounts.` : cause instanceof Error ? cause.message : "Could not sign in.");
    } finally { setBusy(false); }
  }

  function tryDemo(role: PortalRole) {
    if (!demo) return;
    try {
      const { organizationId, userId } = ensureDemo(demo, role);
      savePortalSession({ organizationId, userId, kind: role === "Student" ? "Student" : "Staff" });
      navigate(portalHome(organizationId, role));
    } catch {
      clearDemo(demo);
      setError("The demo data in this browser was out of date and has been cleared. Reloading…");
      window.setTimeout(() => window.location.reload(), 1200);
    }
  }

  return <main className="dz-scope pt-signin">
    <div className="pt-signin-frame">
      <aside className="pt-signin-intro">
        <Logo markSize={34} markFill="#a78bfa" fontSize="1.2rem" color="#ffffff" />
        <div className="pt-signin-intro-copy">
          <h2>Your school day, in one place.</h2>
          <p>Check your schedule, coursework, results and school updates from your own portal.</p>
        </div>
        <span className="pt-signin-intro-foot">For students and staff</span>
      </aside>
      <div className="pt-signin-card dz-card">
      {missing ? <>
        <h1 className="dz-page-title">Portal not found</h1>
        <p className="dz-reminder-meta">We couldn't find a school at this address. Check the link your school gave you.</p>
        <Link className="dz-btn-outline" to="/portal-login">Find your school's portal</Link>
      </> : <>
        <p className="pt-signin-school">{name ?? "Loading…"}</p>
        <h1 className="dz-page-title">Student &amp; staff portal</h1>
        <form className="dz-form" onSubmit={event => void signIn(event)}>
          {error && <p role="alert" className="cohort-error">{error}{elsewhere && <> <Link to={portalSignIn(DEMO_ORGS[elsewhere].organizationId)}>Go to the {DEMO_ORGS[elsewhere].name} portal →</Link></>}</p>}
          <label className="input-label">School email<input className="input" type="email" autoComplete="username" value={schoolEmail} onChange={event => setSchoolEmail(event.target.value)} required /></label>
          <label className="input-label">Password<input className="input" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
          <button className="dz-btn-green" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="dz-reminder-meta">Use the school email and password from your approval email. New here? Use the invitation link your school sent you.</p>
        {demo && <section className="pt-signin-demo" aria-label="Demo accounts">
          <p className="pt-demo-head">Demo accounts{logins[0] && <> · password <code>{logins[0].password}</code></>}</p>
          <ul className="pt-demo-list">{(["Student", "Teaching", "NonTeaching"] as DemoRole[]).map(role => {
            const login = logins.find(item => item.role === role);
            return <li key={role}>
              <span className="pt-demo-who">
                <strong>{ROLE_LABEL[role]}</strong>
                <small>{DEMO_PEOPLE[demo][role]}</small>
                {login && <small className="pt-demo-email">{login.schoolEmail}</small>}
              </span>
              <span className="pt-demo-actions">
                {login && <button type="button" className="dz-pill-btn" onClick={() => { setSchoolEmail(login.schoolEmail); setPassword(login.password); }}>Fill in</button>}
                <button type="button" className="dz-pill-btn pt-demo-go" data-demo-role={role} onClick={() => tryDemo(role)}>Sign in →</button>
              </span>
            </li>;
          })}</ul>
          <button type="button" className="pt-demo-reset" onClick={() => { clearDemo(demo); window.location.reload(); }}>Reset demo data</button>
        </section>}
      </>}
      </div>
    </div>
  </main>;
}

/** Old /student-portal, /teacher-portal and /staff-portal links: send people to their school's portal. */
export function LegacyPortalRedirect() {
  const session = readPortalSession();
  return <Navigate to={session ? portalSignIn(session.organizationId) : "/portal-login"} replace />;
}
