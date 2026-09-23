import { createRoot } from "react-dom/client";
import { HashRouter, Link, Route, Routes, useParams, useLocation } from "react-router-dom";
import SchoolStructureEditor from "./features/cohorts/SchoolStructureEditor";
import CohortListPage from "./features/cohorts/CohortListPage";
import CohortDetailPage from "./features/cohorts/CohortDetailPage";
import { CohortWorkspaceProvider } from "./features/cohorts/workspace";
import { readSchoolSetup } from "./features/cohorts/schoolSetup";
import { getGroupSettings } from "./features/cohorts/settings";
import { fixtureId } from "./features/cohorts/fixtureId";
import { startMocks } from "./mocks/browser";
import { worker } from "./mocks/browser";
import { http, HttpResponse } from "msw";
import FacultyWorkspacePage from "./features/faculty/FacultyWorkspacePage";
import { AuthProvider } from "./context/AuthContext";
import { QA_FACULTY_ID, QA_FACULTY_ORG, seedFacultyQa } from "./qa-faculty";
import "./index.css";
import "./layouts/Dashboard.css";
import "./app-theme.css";

function Fixture() {
  const { model = "secondary" } = useParams();
  useLocation();
  const organizationId = "qa-only-" + model;
  const setup = readSchoolSetup(organizationId);
  const settings = getGroupSettings(organizationId);
  return <div className="dz-scope dz-shell"><aside className="dz-sidebar" style={{ padding: 24 }}><h2>EduTracker</h2><p className="school-overline" style={{ marginTop: 24 }}>LOCAL VERIFICATION</p><Link className="dz-nav-link" to={"/" + model}>Academic structure</Link><Link className="dz-nav-link" to={"/" + model + "/groups"}>Session records</Link><Link className="dz-nav-link" to="/secondary">Secondary flow</Link><Link className="dz-nav-link" to="/university">University flow</Link><Link className="dz-nav-link" to={`/dashboard/organizations/${QA_FACULTY_ORG}/faculties/${QA_FACULTY_ID}`}>Faculty tracker</Link></aside><main className="dz-main"><div className="dz-content"><div className="dz-page"><header className="dz-page-head"><div><span className="school-overline">SCHOOL WORKSPACE</span><h1 className="dz-page-title">A place to grow.</h1><p className="dz-page-sub">Temporary frontend verification · no real accounts or backend writes</p></div></header><CohortWorkspaceProvider value={{ organizationId, organizationName: "QA " + model, institutionType: setup?.model, singular: settings.singular, plural: settings.plural, sessionId: "qa-session", basePath: "/" + model + "/groups", academicUnits: setup?.structure.units.map(unit => ({ id: fixtureId(organizationId,"unit",unit.key), name: unit.name, parentId: unit.parent ? fixtureId(organizationId,"unit",unit.parent) : null })) ?? [], availableStudents: [], teachers: [], sessions: [{id:"qa-session",name:"2026 / 2027"}] }}><Routes><Route index element={<SchoolStructureEditor key={organizationId} organizationId={organizationId} />} /><Route path="groups" element={<CohortListPage key={organizationId} />} /><Route path="groups/:cohortId" element={<CohortDetailPage />} /></Routes></CohortWorkspaceProvider></div></div></main></div>;
}
export { Fixture };
await startMocks();
worker.use(http.get("*/api/users/me", () => HttpResponse.json({
  success: true, data: { id: "qa-dean-user", userName: "qa-dean", firstName: "Adaeze", middleName: null, lastName: "Okafor", role: "User" },
})));
seedFacultyQa();
createRoot(document.getElementById("root")!).render(<AuthProvider><HashRouter><Routes><Route path="/dashboard/organizations/:id/faculties/:facultyId/*" element={<FacultyWorkspacePage />} /><Route path="/:model/*" element={<Fixture />} /></Routes></HashRouter></AuthProvider>);
