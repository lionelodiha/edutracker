/**
 * FACULTY-BUILD §8 — student directory.
 * Every student in the faculty, by programme and level,
 * searchable by name and matriculation number.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { readSchoolSetup, unitKindOf } from "../cohorts/schoolSetup";
import { facultyApi, FacultyApiError } from "./api";
import type { StudentProfile } from "../cohorts/courses";

export default function StudentDirectory() {
  const { id: organizationId = "", facultyId = "" } = useParams<{ id: string; facultyId: string }>();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [programmeFilter, setProgrammeFilter] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const setup = readSchoolSetup(organizationId);
  const units = useMemo(() => setup?.structure.units ?? [], [setup]);
  const programmes = useMemo(() => {
    if (!setup) return [];
    if (setup.model !== "University") return units.filter((u) => u.parent !== null);
    const facultyKeys = new Set([facultyId]);
    const deptKeys = new Set(units.filter((u) => u.parent === facultyId).map((u) => u.key));
    return units.filter(
      (u) => unitKindOf(setup.structure, u.key) === "Programme" && u.parent !== null && (deptKeys.has(u.parent) || facultyKeys.has(u.parent)),
    );
  }, [setup, units, facultyId]);
  const programmeName = useMemo(() => new Map(programmes.map((p) => [p.key, p.name])), [programmes]);

  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => { if (live) setLoading(true); });
    facultyApi
      .students(organizationId, { facultyId })
      .then((list) => {
        if (live) {
          setStudents(list.items);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e instanceof FacultyApiError ? e.message : "Could not load students.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [organizationId, facultyId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => !programmeFilter || s.programmeId === programmeFilter)
      .filter(
        (s) =>
          !q ||
          s.fullName.toLowerCase().includes(q) ||
          s.matriculationNumber.toLowerCase().includes(q),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [students, programmeFilter, query]);

  const base = `/dashboard/organizations/${organizationId}/faculties/${facultyId}/students`;

  return (
    <div className="dz-card">
      <div className="dz-card-head">
        <span className="dz-card-title">Students</span>
        <span className="dz-reminder-meta">{rows.length} students in this faculty</span>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Search name or matriculation number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search students"
        />
        <select
          className="input"
          style={{ maxWidth: 260 }}
          value={programmeFilter}
          onChange={(e) => setProgrammeFilter(e.target.value)}
          aria-label="Filter by programme"
        >
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="dz-reminder-meta">Loading students…</p>
      ) : error ? (
        <p role="alert" className="cohort-error">{error}</p>
      ) : rows.length === 0 ? (
        <div className="dz-empty">
          <div className="dz-empty-title">No students found</div>
          <div className="dz-empty-text">Invite students into a programme under this faculty.</div>
        </div>
      ) : (
        <div className="dz-table-wrap">
          <table className="dz-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Matriculation no.</th>
                <th>Programme</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.studentProfileId}>
                  <td>
                    <Link to={`${base}/${encodeURIComponent(s.studentProfileId)}`} style={{ fontWeight: 600 }}>
                      {s.fullName}
                    </Link>
                  </td>
                  <td className="mono">{s.matriculationNumber}</td>
                  <td>{programmeName.get(s.programmeId) ?? s.programmeId}</td>
                  <td>
                    <span className={`dz-status ${s.status === "Active" ? "dz-status-green" : "dz-status-amber"}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
