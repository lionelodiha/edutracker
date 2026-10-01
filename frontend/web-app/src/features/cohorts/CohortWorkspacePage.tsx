import { readSchoolSetup } from "./schoolSetup";
import { isDemoMode } from "../../demoMode";
import { fixtureId } from "./fixtureId";
import { useState, type FormEvent } from "react";
import { getGroupSettings, saveGroupSettings } from "./settings";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useDashboardData } from "../../layouts/DashboardData";
import CohortListPage from "./CohortListPage";
import CohortDetailPage from "./CohortDetailPage";
import { CohortWorkspaceProvider } from "./workspace";
import "./cohorts.css";

function SchoolPreferences({ organizationId }: { organizationId: string }) {
  const [settings, setSettings] = useState(() => getGroupSettings(organizationId));
  function save(event: FormEvent) {
    event.preventDefault();
    saveGroupSettings(organizationId, settings);
    window.location.reload();
  }
  return <details className="cohort-card" style={{ marginBottom: "1rem" }}>
    <summary>School terminology</summary>
    <form onSubmit={save} className="cohort-toolbar" style={{ marginTop: "1rem" }}>
      <label className="cohort-field">One student group<input required maxLength={40} value={settings.singular} onChange={event => setSettings({ ...settings, singular: event.target.value })} /></label>
      <label className="cohort-field">Several student groups<input required maxLength={40} value={settings.plural} onChange={event => setSettings({ ...settings, plural: event.target.value })} /></label>
      <button className="dz-btn-outline" type="submit">Save preferences</button>
      <p className="cohort-muted">Saved in this browser for this school.</p>
    </form>
  </details>;
}

export default function CohortWorkspacePage() {
  const { id: organizationId, semesterId } = useParams();
  const location = useLocation();
  const sessionName = typeof location.state?.sessionName === "string" ? location.state.sessionName : "Selected session";
  const { orgs, orgsLoading } = useDashboardData();
  const org = orgs.find((item) => item.organizationId === organizationId);
  const settings = getGroupSettings(organizationId ?? "");
  const setup = readSchoolSetup(organizationId ?? "");
  const basePath = `/dashboard/organizations/${organizationId}/sessions/${semesterId}/groups`;

  if (!organizationId || !semesterId) {
    return (
      <div className="cohort-page">
        <div className="cohort-empty">
          <h1>Groups unavailable</h1>
          <p>Choose a school and session to view its student groups.</p>
          <Link to="/dashboard/organizations" className="dz-btn-green">
            Manage organizations
          </Link>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="cohort-page">
        <div className="cohort-empty">
          <h1>{orgsLoading ? "Loading schools…" : "School unavailable"}</h1>
          <p>
            {orgsLoading
              ? "Loading the school for these groups…"
              : "Choose a school you belong to."}
          </p>
          {!orgsLoading && !orgs.length && (
            <Link to="/dashboard/organizations" className="dz-btn-green">
              Manage organizations
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!setup) return <div className="dz-card school-setup-intro"><span className="school-overline">START WITH YOUR SCHOOL</span><h1>Define your academic structure.</h1><p>Choose the institution type and its stages before opening student records.</p><Link className="dz-btn-green" to={`/dashboard/organizations/${organizationId}?tab=structure`}>Set up school →</Link></div>;

  return (
    <div>
      <nav className="cohort-path" aria-label="School and session">
        <Link to={`/dashboard/organizations/${org.organizationId}`}>{org.name}</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/dashboard/organizations/${org.organizationId}/sessions/${semesterId}`}>
          {sessionName}
        </Link>
        <span aria-current="page">
          <span aria-hidden="true"> / </span>{settings.plural}
        </span>
      </nav>
      {isDemoMode() && (
        <div className="cohort-preview-banner"><strong>Frontend preview</strong><span>Your school structure and student records are saved in this browser. Automatic promotion is not active yet.</span></div>
      )}
      <SchoolPreferences key={org.organizationId} organizationId={org.organizationId} />
      <CohortWorkspaceProvider
        key={`${org.organizationId}:${semesterId}`}
        value={{
          organizationId: org.organizationId,
          organizationName: org.name,
          sessionId: semesterId,
          singular: settings.singular,
          plural: settings.plural,
          institutionType: setup.model,
          academicUnits: setup.structure.units.map(unit => ({ id: fixtureId(organizationId, "unit", unit.key), name: unit.name, parentId: unit.parent ? fixtureId(organizationId, "unit", unit.parent) : null })),
          sessions: [{ id: semesterId, name: sessionName }],
          teachers: [],
          availableStudents: [],
          basePath,
        }}
      >
        <Routes>
          <Route index element={<CohortListPage />} />
          <Route path=":cohortId" element={<CohortDetailPage />} />
        </Routes>
      </CohortWorkspaceProvider>
    </div>
  );
}
