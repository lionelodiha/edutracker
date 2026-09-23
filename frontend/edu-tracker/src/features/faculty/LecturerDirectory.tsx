/**
 * FACULTY-BUILD §8 — lecturer directory.
 * staffOfFaculty() filtered to Academic, grouped by department,
 * filterable by rank and status, searchable by name and staff number.
 * Outstanding-results column sorts descending by default: a Dean opens
 * this page to find who has not submitted.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { readSchoolSetup } from "../cohorts/schoolSetup";
import { facultyApi, FacultyApiError } from "./api";
import type { AcademicRank } from "../staff/ranks";
import type { StaffProfile } from "../staff/types";

type Row = StaffProfile & { departmentName: string; rankName: string | null; outstanding: number | null; courseCount: number | null };

export default function LecturerDirectory() {
  const { id: organizationId = "", facultyId = "" } = useParams<{ id: string; facultyId: string }>();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [ranks, setRanks] = useState<AcademicRank[]>([]);
  const [trackingCounts, setTrackingCounts] = useState<Record<string, { outstanding: number | null; courses: number | null }>>({});
  const [rankFilter, setRankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const setup = readSchoolSetup(organizationId);
  const units = useMemo(() => setup?.structure.units ?? [], [setup]);
  const departments = useMemo(() => units.filter((u) => u.parent === facultyId), [units, facultyId]);
  const deptName = useMemo(() => new Map(departments.map((d) => [d.key, d.name])), [departments]);
  const rankName = useMemo(() => new Map(ranks.map((r) => [r.rankId, r.name])), [ranks]);

  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => { if (live) setLoading(true); });
    Promise.all([facultyApi.staff(organizationId, { facultyId, kind: "Academic" }), facultyApi.ranks(organizationId)])
      .then(async ([list, rankList]) => {
        if (!live) return;
        setStaff(list.items);
        setRanks(rankList);
        setError("");
        // Outstanding results per lecturer — one tracking call each.
        // Keep the count tied to the same tracking response as the lecturer page.
        const entries = await Promise.all(
          list.items.map(async (s) => {
            try {
              const t = await facultyApi.staffTracking(organizationId, s.staffProfileId);
              return [s.staffProfileId, { outstanding: t.outstandingResults, courses: t.courses.length }] as const;
            } catch {
              return [s.staffProfileId, { outstanding: null, courses: null }] as const;
            }
          }),
        );
        if (live) setTrackingCounts(Object.fromEntries(entries));
      })
      .catch((e) => {
        if (live) setError(e instanceof FacultyApiError ? e.message : "Could not load lecturers.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [organizationId, facultyId]);

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((s) => (!rankFilter || s.rankId === rankFilter) && (!statusFilter || s.status === statusFilter))
      .filter(
        (s) =>
          !q ||
          s.fullName.toLowerCase().includes(q) ||
          s.staffNumber.toLowerCase().includes(q),
      )
      .map((s) => ({
        ...s,
        departmentName: deptName.get(s.unitId) ?? "Faculty office",
        rankName: s.rankId ? (rankName.get(s.rankId) ?? "—") : "—",
        outstanding: trackingCounts[s.staffProfileId]?.outstanding ?? null,
        courseCount: trackingCounts[s.staffProfileId]?.courses ?? null,
      }))
      .sort((a, b) => (b.outstanding ?? -1) - (a.outstanding ?? -1) || a.fullName.localeCompare(b.fullName));
  }, [staff, rankFilter, statusFilter, query, deptName, rankName, trackingCounts]);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const key = row.departmentName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return [...map.entries()];
  }, [rows]);

  const base = `/dashboard/organizations/${organizationId}/faculties/${facultyId}/lecturers`;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div className="dz-card">
        <div className="dz-card-head">
          <span className="dz-card-title">Lecturers</span>
          <span className="dz-reminder-meta">{rows.length} academic staff · sorted by outstanding results</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <input
            className="input"
            style={{ maxWidth: 260 }}
            placeholder="Search name or staff number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search lecturers"
          />
          <select className="input" style={{ maxWidth: 220 }} value={rankFilter} onChange={(e) => setRankFilter(e.target.value)} aria-label="Filter by rank">
            <option value="">All ranks</option>
            {ranks.map((r) => (
              <option key={r.rankId} value={r.rankId}>{r.name}</option>
            ))}
          </select>
          <select className="input" style={{ maxWidth: 200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">Any status</option>
            {["Active", "OnSabbatical", "OnStudyLeave", "Suspended", "Retired", "Resigned"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="dz-reminder-meta">Loading lecturers…</p>
        ) : error ? (
          <p role="alert" className="cohort-error">{error}</p>
        ) : rows.length === 0 ? (
          <div className="dz-empty">
            <div className="dz-empty-title">No lecturers found</div>
            <div className="dz-empty-text">Invite academic staff into a department under this faculty.</div>
          </div>
        ) : (
          grouped.map(([dept, members]) => (
            <section key={dept} style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>{dept}</h3>
              <div className="dz-table-wrap">
                <table className="dz-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Rank</th>
                      <th>Staff no.</th>
                      <th>Status</th>
                      <th>Outstanding results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.staffProfileId}>
                        <td>
                          <Link to={`${base}/${encodeURIComponent(m.staffProfileId)}`} style={{ fontWeight: 600 }}>
                            {m.title ? `${m.title} ` : ""}{m.fullName}
                          </Link>
                        </td>
                        <td>{m.rankName}</td>
                        <td className="mono">{m.staffNumber}</td>
                        <td>
                          <span className={`dz-status ${m.status === "Active" ? "dz-status-green" : "dz-status-amber"}`}>{m.status}</span>
                        </td>
                        <td>
                          {m.outstanding === null ? (
                            "…"
                          ) : m.courseCount === 0 ? (
                            <span className="dz-status dz-status-gray">No courses</span>
                          ) : m.outstanding > 0 ? (
                            <span className="dz-status dz-status-red">{m.outstanding} outstanding</span>
                          ) : (
                            <span className="dz-status dz-status-green">Submitted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
