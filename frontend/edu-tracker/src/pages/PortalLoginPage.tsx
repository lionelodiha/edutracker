import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isDemoMode } from "../demoMode";
import { portalSignIn } from "../features/portal/helpers";
import ComingSoonPage from "./ComingSoonPage";
import "../layouts/Dashboard.css";
import "../features/portal/portal.css";

/**
 * For people who reach the portal from the EduTracker homepage rather than
 * their school's link. Each school's portal lives at /portal/<school>.
 */
export default function PortalLoginPage() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState("");
  const mockMode = isDemoMode();

  if (!mockMode) return <ComingSoonPage title="School Portal Sign In" description="School portal sign-in will be available when the real portal API is connected." backTo="/" />;

  return <main className="dz-scope pt-signin">
    <div className="pt-signin-card dz-card">
      <h1 className="dz-page-title">Find your school's portal</h1>
      <p className="dz-reminder-meta">Your school's portal has its own link. You'll find it in your approval email, or ask your school. You can also enter your school ID.</p>
      <form className="dz-form" onSubmit={event => { event.preventDefault(); if (schoolId.trim()) navigate(portalSignIn(schoolId.trim())); }}>
        <label className="input-label">School ID<input className="input" value={schoolId} onChange={event => setSchoolId(event.target.value)} required /></label>
        <button className="dz-btn-green">Go to portal</button>
      </form>
      <Link className="dz-reminder-meta" to="/">← EduTracker home</Link>
    </div>
  </main>;
}
