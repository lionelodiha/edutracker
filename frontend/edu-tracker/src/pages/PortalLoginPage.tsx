import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../apiBase";
import ComingSoonPage from "./ComingSoonPage";

/** Local mock portal sign-in for accounts created through faculty approval. */
export default function PortalLoginPage() {
  const navigate = useNavigate();
  const [organizationId, setOrganizationId] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mockMode = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true";

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/portal-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organizationId.trim(), schoolEmail: schoolEmail.trim(), password }),
      });
      const result = await response.json() as { data?: { userId: string; kind: "Student" | "Staff"; schoolEmail: string }; title?: string };
      if (!response.ok || !result.data) throw new Error(result.title ?? "Sign-in failed.");
      sessionStorage.setItem("edutracker.mockPortalSession", JSON.stringify({ ...result.data, organizationId }));
      navigate(result.data.kind === "Student" ? "/student-portal" : "/teacher-portal");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  if (!mockMode) return <ComingSoonPage title="School Portal Sign In" description="School portal sign-in will be available when the real portal API is connected." backTo="/" />;

  return <main className="dz-scope" style={{ maxWidth: 520, margin: "3rem auto", padding: "0 1rem" }}>
    <div className="dz-card">
      <h1 className="dz-page-title">School portal sign in</h1>
      <p className="dz-reminder-meta">Use the school ID, generated email and password from your approved invitation.</p>
      <form className="dz-form" onSubmit={event => void signIn(event)}>
        {error && <p role="alert" className="cohort-error">{error}</p>}
        <label className="input-label">School ID<input className="input" value={organizationId} onChange={event => setOrganizationId(event.target.value)} required /></label>
        <label className="input-label">School email<input className="input" type="email" value={schoolEmail} onChange={event => setSchoolEmail(event.target.value)} required /></label>
        <label className="input-label">Password<input className="input" type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        <div className="dz-form-actions"><Link className="dz-btn-outline" to="/">Back</Link><button className="dz-btn-green" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></div>
      </form>
    </div>
  </main>;
}
