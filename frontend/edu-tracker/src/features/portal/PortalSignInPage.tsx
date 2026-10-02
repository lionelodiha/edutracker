/**
 * A school's own portal sign-in: /portal/<school>. This is the link a school
 * shares with its students and staff. It sits outside the admin app, so it
 * needs no admin account and knows which school it belongs to already.
 */
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Wordmark from "../../components/Wordmark";
import { API_BASE } from "../../apiBase";
import { portalApi, readPortalSession, savePortalSession } from "./api";
import { portalHome, portalSignIn } from "./helpers";
import type { PortalOrganization } from "./types";
import "../../layouts/Dashboard.css";
import "./portal.css";

export default function PortalSignInPage() {
  const { schoolId = "" } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<PortalOrganization | null>(null);
  const [missing, setMissing] = useState(false);
  const [schoolEmail, setSchoolEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const existing = readPortalSession();

  useEffect(() => {
    let live = true;
    portalApi.school(schoolId)
      .then(found => { if (live) setSchool(found); })
      .catch(() => { if (live) setMissing(true); });
    return () => { live = false; };
  }, [schoolId]);

  // Already signed in to this school: go straight in.
  if (existing?.organizationId === schoolId) return <Navigate to={portalHome(schoolId, existing.kind === "Student" ? "Student" : "Teaching")} replace />;

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
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
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally { setBusy(false); }
  }

  return <main className="dz-scope pt-signin">
    <div className="pt-signin-frame">
      <aside className="pt-signin-intro">
        <Wordmark fontSize="1.6rem" />
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
        <p className="pt-signin-school">{school?.name ?? "Loading…"}</p>
        <h1 className="dz-page-title">Student &amp; staff portal</h1>
        <form className="dz-form" onSubmit={event => void signIn(event)}>
          {error && <p role="alert" className="cohort-error">{error}</p>}
          <label className="input-label">School email<input className="input" type="email" autoComplete="username" value={schoolEmail} onChange={event => setSchoolEmail(event.target.value)} required /></label>
          <label className="input-label">Password<input className="input" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
          <button className="dz-btn-green" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="dz-reminder-meta">Use the school email and password from your approval email. New here? Use the invitation link your school sent you.</p>
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
