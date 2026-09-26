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
import { http, HttpResponse, passthrough } from "msw";
import FacultyWorkspacePage from "./features/faculty/FacultyWorkspacePage";
import OrganizationLayout from "./layouts/OrganizationLayout";
import OrganizationDetailsPage from "./pages/dashboard/OrganizationDetailsPage";
import AcademicStructurePage from "./pages/organization/AcademicStructurePage";
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
const overviewIds = new Set(["qa-overview-new", QA_FACULTY_ORG, "qa-overview-failed", "qa-overview-members-failed"]);
worker.use(
  http.get("*/api/organizations/:id", ({ params }) => {
    const id = String(params.id);
    if (!overviewIds.has(id)) return passthrough();
    return HttpResponse.json({ success: true, data: { id, name: id === QA_FACULTY_ORG ? "QA Faculty School" : id === "qa-overview-new" ? "New School" : "Partial School", ownerUserId: "qa-dean-user", createdAt: "2026-09-10T09:00:00Z" } });
  }),
  http.get("*/api/organizations/:id/members", ({ params }) => {
    const id = String(params.id);
    if (!overviewIds.has(id)) return passthrough();
    if (id === "qa-overview-members-failed") return HttpResponse.json({ success: false }, { status: 503 });
    const make = (id: string, firstName: string, lastName: string, role: string, joinedAt: string) => ({ id, userId: id, userName: `${firstName}.${lastName}`.toLowerCase(), firstName, lastName, role, status: "Active", joinedAt });
    const owner = make("owner", "Lionel", "Odiha", "Owner", "2026-09-10T09:00:00Z");
    return HttpResponse.json({ success: true, data: id === "qa-overview-new" ? [owner] : [owner,
      make("teacher", "Ada", "Bello", "Teacher", "2026-09-24T08:00:00Z"),
      make("admin", "Kay", "Eze", "Admin", "2026-09-20T09:00:00Z"),
      make("student", "Amara", "Nwosu", "Student", "2026-09-22T09:00:00Z"),
      make("moderator", "Femi", "Ojo", "Moderator", "2026-09-18T09:00:00Z"),
    ] });
  }),
  http.get("*/api/semesters", ({ request }) => {
    const id = new URL(request.url).searchParams.get("organizationId");
    if (!id || !overviewIds.has(id)) return passthrough();
    if (id === "qa-overview-failed") return HttpResponse.json({ success: false }, { status: 503 });
    return HttpResponse.json({ success: true, data: id === "qa-overview-new" ? [] : [
      { id: "session-old", organizationId: id, startYear: 2024, endYear: 2025, session: "2024 / 2025", createdAt: "2024-09-12T09:00:00Z" },
      { id: "session-current", organizationId: id, startYear: 2026, endYear: 2027, session: "2026 / 2027", createdAt: "2026-09-12T09:00:00Z" },
    ] });
  }),
);
seedFacultyQa();
createRoot(document.getElementById("root")!).render(<AuthProvider><HashRouter><Routes><Route path="/dashboard/organizations/:id" element={<div className="dz-scope"><OrganizationLayout /></div>}><Route index element={<OrganizationDetailsPage />} /><Route path="structure" element={<AcademicStructurePage />} /><Route path="structure/faculties/:facultyId" element={<AcademicStructurePage />} /><Route path="structure/departments/new" element={<AcademicStructurePage />} /><Route path="structure/departments/:departmentId" element={<AcademicStructurePage />} /></Route><Route path="/dashboard/organizations/:id/faculties/:facultyId/*" element={<FacultyWorkspacePage />} /><Route path="/:model/*" element={<Fixture />} /></Routes></HashRouter></AuthProvider>);
