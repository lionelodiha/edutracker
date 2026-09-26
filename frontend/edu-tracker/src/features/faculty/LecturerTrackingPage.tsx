/**
 * FACULTY-BUILD §9 — lecturer tracking page.
 * Answers "what are they doing in school, right now?":
 * this session's courses first (why the page exists), then attendance,
 * posts held, then history.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { facultyApi, FacultyApiError } from "./api";
import type { StaffTracking } from "../../mocks/faculty";

export default function LecturerTrackingPage() {
  const { id: organizationId = "", facultyId = "", staffId = "" } = useParams<{
    id: string;
    facultyId: string;
    staffId: string;
  }>();
  const [tracking, setTracking] = useState<StaffTracking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const back = `/dashboard/organizations/${organizationId}/faculties/${facultyId}/lecturers`;

  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => { if (live) setLoading(true); });
    facultyApi
      .staffTracking(organizationId, staffId)
      .then((t) => {
        if (live) {
          setTracking(t);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e instanceof FacultyApiError ? e.message : "Could not load this lecturer.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [organizationId, staffId]);

  if (loading) {
    return (
      <div className="dz-card">
        <div className="skeleton" style={{ height: 24, width: 260, borderRadius: 8, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 14, width: 340, borderRadius: 6 }} />
      </div>
    );
  }
  if (error || !tracking) {
    return (
      <div className="dz-card dz-empty">
        <div className="dz-empty-title">Could not load this lecturer</div>
        <div className="dz-empty-text">{error || "Try again."}</div>
        <Link className="dz-btn-outline" style={{ marginTop: "1rem" }} to={back}>← Lecturers</Link>
      </div>
    );
  }

  const { profile, rankName, departmentName, courses, outstandingResults, attendance, posts, rankHistory } = tracking;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div>
        <Link className="dz-pill-btn" to={back}>← Lecturers</Link>
      </div>
      <div className="dz-card">
        <div className="dz-card-head">
          <span className="dz-card-title">
            {profile.title ? `${profile.title} ` : ""}{profile.fullName}
          </span>
          <span className={`dz-status ${profile.status === "Active" ? "dz-status-green" : "dz-status-amber"}`}>{profile.status}</span>
        </div>
        <p className="dz-reminder-meta">
          {rankName ?? "No rank"} · {departmentName ?? "No department"} · <span className="mono">{profile.staffNumber}</span>
        </p>
      </div>

      {/* This session's courses — first. It is why the page exists. */}
      <div className="dz-card">
        <div className="dz-card-head">
          <span className="dz-card-title">This session&apos;s courses</span>
          <span className="dz-reminder-meta">
            {outstandingResults > 0 ? `${outstandingResults} with results outstanding` : "All results submitted"}
          </span>
        </div>
        {courses.length === 0 ? (
          <p className="dz-reminder-meta">No course assignments this session.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Enrolment</th>
                  <th>Results</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.courseId}>
                    <td className="mono" style={{ fontWeight: 700 }}>{c.code}</td>
                    <td>{c.title}</td>
                    <td>{c.enrolment}</td>
                    <td>
                      <span
                        className={`dz-status ${
                          c.resultsState === "Submitted"
                            ? "dz-status-green"
                            : c.resultsState === "Partial"
                              ? "dz-status-amber"
                              : "dz-status-red"
                        }`}
                      >
                        {c.resultsState === "Submitted" ? "Submitted" : c.resultsState === "Partial" ? "Partial" : "Not started"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dz-card">
        <div className="dz-card-head"><span className="dz-card-title">Attendance</span></div>
        {attendance.length === 0 ? (
          <p className="dz-reminder-meta">No attendance recorded this session.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Taken</th>
                  <th>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.courseId}>
                    <td><span className="mono">{a.code}</span> · {a.title}</td>
                    <td>{a.taken}</td>
                    <td>{a.scheduled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dz-card">
        <div className="dz-card-head"><span className="dz-card-title">Posts held</span></div>
        {posts.length === 0 ? (
          <p className="dz-reminder-meta">No appointments on record.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Scope</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.appointmentId}>
                    <td style={{ fontWeight: 600 }}>{p.post}</td>
                    <td className="mono">{p.scopeId}</td>
                    <td>
                      {p.startsOn.slice(0, 10)} → {p.endsOn ? p.endsOn.slice(0, 10) : "open-ended"}{" "}
                      {p.expired && <span className="dz-status dz-status-amber">Expired</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dz-card">
        <div className="dz-card-head"><span className="dz-card-title">History</span></div>
        {rankHistory.length === 0 ? (
          <p className="dz-reminder-meta">No rank changes recorded.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
            {rankHistory.map((h) => (
              <li key={h.rankHistoryId} style={{ fontSize: "0.88rem" }}>
                <strong>{h.rankName ?? "Rank"}</strong> · from {h.effectiveFrom.slice(0, 10)}
                {h.effectiveTo ? ` to ${h.effectiveTo.slice(0, 10)}` : " (current)"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
