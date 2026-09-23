/**
 * FACULTY-BUILD §8 — the faculty workspace shell and routing.
 *
 * A faculty is a place you go to work, not a tab. The organization page
 * lists faculties as cards that navigate INTO this workspace.
 * Tab routes are bookmarkable so a Dean can share a direct link.
 */
import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import { readSchoolSetup } from "../cohorts/schoolSetup";
import { facultyApi, FacultyApiError } from "./api";
import type { FacultySummary } from "../../mocks/faculty";
import LecturerDirectory from "./LecturerDirectory";
import LecturerTrackingPage from "./LecturerTrackingPage";
import StudentDirectory from "./StudentDirectory";
import StudentTrackingPage from "./StudentTrackingPage";
import OfficersPage from "./OfficersPage";
import PendingQueuePage from "./PendingQueuePage";
import { DocumentsStub, BoardStub } from "./FacultyStubs";

function useFacultyContext() {
  const { id: organizationId = "", facultyId = "" } = useParams<{ id: string; facultyId: string }>();
  return { organizationId, facultyId };
}

function Overview() {
  const { organizationId, facultyId } = useFacultyContext();
  const [summary, setSummary] = useState<FacultySummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => { if (live) setLoading(true); });
    facultyApi
      .facultySummary(organizationId, facultyId)
      .then((s) => {
        if (live) {
          setSummary(s);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e instanceof FacultyApiError ? e.message : "Could not load this faculty.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [organizationId, facultyId]);

  const base = `/dashboard/organizations/${organizationId}/faculties/${facultyId}`;

  if (loading) {
    return (
      <div className="dz-card">
        <div className="skeleton" style={{ height: 24, width: 240, borderRadius: 8, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 14, width: 320, borderRadius: 6 }} />
      </div>
    );
  }
  if (error || !summary) {
    return (
      <div className="dz-card dz-empty">
        <div className="dz-empty-title">Could not load this faculty</div>
        <div className="dz-empty-text">{error || "Try again."}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Dean, Sub-Dean and Faculty Officer by name at the top — the people everyone looks for. */}
      <div className="dz-grid-stats-3">
        <div className="dz-card dz-stat dz-stat-accent-top">
          <span className="dz-stat-label">Dean</span>
          <div className="dz-stat-value" style={{ fontSize: "1.15rem" }}>{summary.dean ?? "Vacant"}</div>
          <div className="dz-stat-sub">Head of faculty</div>
        </div>
        <div className="dz-card dz-stat dz-stat-cyan-top">
          <span className="dz-stat-label">Sub-Dean</span>
          <div className="dz-stat-value" style={{ fontSize: "1.15rem" }}>{summary.subDean ?? "Vacant"}</div>
          <div className="dz-stat-sub">Deputy to the Dean</div>
        </div>
        <div className="dz-card dz-stat dz-stat-amber-top">
          <span className="dz-stat-label">Faculty Officer</span>
          <div className="dz-stat-value" style={{ fontSize: "1.15rem" }}>{summary.facultyOfficer ?? "Vacant"}</div>
          <div className="dz-stat-sub">Runs the faculty office</div>
        </div>
      </div>

      <div className="dz-card">
        <div className="dz-card-head">
          <span className="dz-card-title">Departments</span>
          <span className="dz-reminder-meta">{summary.departments.length} departments · {summary.staffTotal} staff · {summary.studentTotal} students</span>
        </div>
        {summary.departments.length === 0 ? (
          <p className="dz-reminder-meta">No departments yet. Add them under Academic structure first.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Head of Department</th>
                  <th>Staff</th>
                </tr>
              </thead>
              <tbody>
                {summary.departments.map((d) => (
                  <tr key={d.departmentId}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.hod ?? <span className="dz-status dz-status-amber">Vacant</span>}</td>
                    <td>{d.staffCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <div className="dz-card">
          <div className="dz-card-head"><span className="dz-card-title">Staff by rank</span></div>
          {summary.staffByRank.length === 0 ? (
            <p className="dz-reminder-meta">No academic staff yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
              {summary.staffByRank.map((r) => (
                <li key={r.rankId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                  <span>{r.name}</span><strong>{r.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dz-card">
          <div className="dz-card-head"><span className="dz-card-title">Students by programme</span></div>
          {summary.studentsByProgramme.length === 0 ? (
            <p className="dz-reminder-meta">No students admitted yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
              {summary.studentsByProgramme.map((p) => (
                <li key={p.programmeId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                  <span>{p.name}</span><strong>{p.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dz-card">
          <div className="dz-card-head"><span className="dz-card-title">Needs action</span></div>
          <p style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0" }}>{summary.pendingApprovals}</p>
          <p className="dz-reminder-meta" style={{ marginBottom: "0.75rem" }}>Pending approvals waiting for review.</p>
          <Link className="dz-btn-outline" to={`${base}/pending`}>Open approval queue →</Link>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { to: "", label: "Overview", end: true },
  { to: "lecturers", label: "Lecturers", end: false },
  { to: "students", label: "Students", end: false },
  { to: "officers", label: "Officers", end: false },
  { to: "pending", label: "Approvals", end: false },
  { to: "documents", label: "Documents", end: false },
  { to: "board", label: "Board", end: false },
];

export default function FacultyWorkspacePage() {
  const { id: organizationId = "", facultyId = "" } = useParams<{ id: string; facultyId: string }>();
  const setup = readSchoolSetup(organizationId);
  const faculty = setup?.structure.units.find((u) => u.key === facultyId);
  const base = `/dashboard/organizations/${organizationId}/faculties/${facultyId}`;

  return (
    <div className="dz-page">
      <div className="dz-page-head">
        <div>
          <div className="dz-crumb">
            <Link className="dz-pill-btn" to={`/dashboard/organizations/${organizationId}`}>← School</Link>
          </div>
          <h1 className="dz-page-title">{faculty?.name ?? "Faculty workspace"}</h1>
          <p className="dz-page-sub">Faculty workspace · everything about this faculty is done from inside it.</p>
        </div>
      </div>

      <div className="dz-tabs" role="tablist" aria-label="Faculty sections">
        {TABS.map((t) => (
          <NavLink
            key={t.label}
            to={`${base}${t.to ? `/${t.to}` : ""}`}
            end={t.end}
            className={({ isActive }) => `dz-tab ${isActive ? "active" : ""}`}
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Overview />} />
        <Route path="lecturers" element={<LecturerDirectory />} />
        <Route path="lecturers/:staffId" element={<LecturerTrackingPage />} />
        <Route path="students" element={<StudentDirectory />} />
        <Route path="students/:studentId" element={<StudentTrackingPage />} />
        <Route path="officers" element={<OfficersPage />} />
        <Route path="pending" element={<PendingQueuePage />} />
        <Route path="documents" element={<DocumentsStub />} />
        <Route path="board" element={<BoardStub />} />
      </Routes>
    </div>
  );
}
