/**
 * FACULTY-BUILD §9 — student tracking page.
 * Header is the derived chain (never stored on the student), then
 * registered courses, attendance, results, level adviser, and the
 * session-by-session history that makes it a tracker, not a profile.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { facultyApi, FacultyApiError } from "./api";
import type { StudentTracking } from "../../mocks/faculty";

export default function StudentTrackingPage() {
  const { id: organizationId = "", facultyId = "", studentId = "" } = useParams<{
    id: string;
    facultyId: string;
    studentId: string;
  }>();
  const [tracking, setTracking] = useState<StudentTracking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const back = `/dashboard/organizations/${organizationId}/faculties/${facultyId}/students`;

  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => { if (live) setLoading(true); });
    facultyApi
      .studentTracking(organizationId, studentId)
      .then((t) => {
        if (live) {
          setTracking(t);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e instanceof FacultyApiError ? e.message : "Could not load this student.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [organizationId, studentId]);

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
        <div className="dz-empty-title">Could not load this student</div>
        <div className="dz-empty-text">{error || "Try again."}</div>
        <Link className="dz-btn-outline" style={{ marginTop: "1rem" }} to={back}>← Students</Link>
      </div>
    );
  }

  const { student, chain, courses, attendance, levelAdviser, history, standing } = tracking;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div>
        <Link className="dz-pill-btn" to={back}>← Students</Link>
      </div>
      <div className="dz-card">
        <div className="dz-card-head">
          <span className="dz-card-title">{student.fullName}</span>
          <span className={`dz-status ${student.status === "Active" ? "dz-status-green" : "dz-status-amber"}`}>{student.status}</span>
        </div>
        {/* Derived chain, read from the structure — never stored on the student. */}
        <p className="dz-reminder-meta" style={{ fontSize: "0.9rem" }}>{chain.join(" → ")}</p>
        <p className="dz-reminder-meta">
          <span className="mono">{student.matriculationNumber}</span> · {student.schoolEmail}
        </p>
        <p className="dz-reminder-meta">Level adviser: <strong>{levelAdviser ?? "Not assigned"}</strong></p>
        <p className="dz-reminder-meta">Academic standing: <strong>{standing}</strong></p>
      </div>

      <div className="dz-card">
        <div className="dz-card-head"><span className="dz-card-title">Registered courses this session</span></div>
        {courses.length === 0 ? (
          <p className="dz-reminder-meta">No registrations this session.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Credits</th>
                  <th>Lecturer</th>
                  <th>Requirement</th>
                  <th>Results</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.courseId}>
                    <td className="mono" style={{ fontWeight: 700 }}>{c.code}</td>
                    <td>{c.title}</td>
                    <td>{c.creditUnits}</td>
                    <td>{c.lecturer ?? "—"}</td>
                    <td>{c.requirement ?? "—"}</td>
                    <td>
                      <span
                        className={`dz-status ${
                          c.resultsState === "Submitted"
                            ? "dz-status-green"
                            : c.resultsState === "Partial"
                              ? "dz-status-amber"
                              : "dz-status-gray"
                        }`}
                      >
                        {c.grade ? `${c.grade} · ${c.resultsState}` : c.resultsState}
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
        <p className="dz-reminder-meta">
          Overall: {attendance.overall.taken} of {attendance.overall.scheduled} sessions.
        </p>
        {attendance.perCourse.length > 0 && (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Attended</th>
                  <th>Held</th>
                </tr>
              </thead>
              <tbody>
                {attendance.perCourse.map((a) => (
                  <tr key={a.courseId}>
                    <td className="mono">{a.code}</td>
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
        <div className="dz-card-head"><span className="dz-card-title">History</span></div>
        {history.length === 0 ? (
          <p className="dz-reminder-meta">No past sessions on record yet — one row appears per session.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Level</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={`${h.sessionId}-${i}`}>
                    <td>{h.sessionName}</td>
                    <td>{h.stageName}</td>
                    <td>
                      <span
                        className={`dz-status ${
                          h.outcome === "Promoted" || h.outcome === "Graduated"
                            ? "dz-status-green"
                            : h.outcome === "Repeated"
                              ? "dz-status-red"
                              : "dz-status-amber"
                        }`}
                      >
                        {h.outcome === "Promoted" ? "Moved up" : h.outcome === "Repeated" ? "Repeated" : h.outcome === "CarriedOver" ? "Carried over" : h.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
