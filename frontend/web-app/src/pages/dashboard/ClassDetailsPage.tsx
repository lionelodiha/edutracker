import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getMockRoster } from "./attendanceMocks";

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}

export default function ClassDetailsPage() {
    const { id, classId } = useParams();
    const [tab, setTab] = useState<"overview" | "roster" | "assignments" | "attendance">("overview");

    // Roster comes from the frontend-first seam (attendanceMocks.ts) so the
    // register page and this tab share one mock shaped like GetClassRoster.
    const roster = useMemo(() => getMockRoster(), []);

    // --- MOCK DATA (still waiting on Assignments backend slice) ---
    const classInfo = {
        code: "Math 101 - Section A",
        instructorName: "Chidubem",
        maxCapacity: 30,
        createdAt: new Date().toISOString()
    };

    const assignments = [
        { id: "a1", title: "Algebra Worksheet", dueDate: "2026-04-10", maxScore: 100 },
        { id: "a2", title: "Midterm Exam", dueDate: "2026-04-20", maxScore: 100 }
    ];
    // -----------------

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "roster", label: `Roster (${roster.length})` },
        { id: "assignments", label: `Assignments (${assignments.length})` },
        { id: "attendance", label: "Daily Attendance" },
    ] as const;

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <div className="dz-crumb">
                        <Link to={`/dashboard/organizations/${id}/sessions`}>← Sessions</Link>
                        <span className="dz-crumb-sep">/</span>
                        <span style={{ color: "var(--text-secondary)" }}>Class Details</span>
                    </div>
                    <h1 className="dz-page-title">{classInfo.code}</h1>
                    <p className="dz-page-sub">
                        Instructor <strong style={{ color: "var(--accent-light)" }}>{classInfo.instructorName || "Unassigned"}</strong>
                        {" · "}Capacity {roster.length} / {classInfo.maxCapacity}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button className="dz-btn-outline">Edit Class Info</button>
                    <button className="dz-btn-green">Generate Report Card</button>
                </div>
            </div>

            <div className="dz-segmented" role="tablist" aria-label="Class sections">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        role="tab"
                        aria-selected={tab === t.id}
                        className={`dz-seg-btn ${tab === t.id ? "active" : ""}`}
                        onClick={() => setTab(t.id as typeof tab)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "overview" && (
                <div className="dz-grid-stats-3">
                    <div className="dz-card dz-stat dz-stat-accent-top">
                        <span className="dz-stat-label">Total Enrolled</span>
                        <div className="dz-stat-value">{roster.length} <span style={{ fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: 600 }}>/ {classInfo.maxCapacity}</span></div>
                        <div className="dz-stat-sub">Seats filled in this section</div>
                    </div>
                    <div className="dz-card dz-stat dz-stat-cyan-top">
                        <span className="dz-stat-label">Upcoming Assignments</span>
                        <div className="dz-stat-value">{assignments.length}</div>
                        <div className="dz-stat-sub">Due across this section</div>
                    </div>
                    <div className="dz-card dz-stat dz-stat-amber-top">
                        <span className="dz-stat-label">Attendance Today</span>
                        <div className="dz-stat-value" style={{ fontSize: "1.6rem", paddingTop: "0.45rem" }}>Not taken</div>
                        <div className="dz-stat-sub">
                            <Link to={`/dashboard/organizations/${id}/classes/${classId}/attendance`} style={{ color: "var(--accent-light)", fontWeight: 700 }}>
                                Take the register →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {tab === "roster" && (
                <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "1.35rem 1.4rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                            <div className="dz-card-title">Class Roster</div>
                            <div className="dz-reminder-meta" style={{ marginTop: "0.25rem" }}>
                                {roster.length} student{roster.length === 1 ? "" : "s"} enrolled.
                            </div>
                        </div>
                        <button className="dz-pill-btn"><PlusIcon /> Enrol Student</button>
                    </div>
                    {roster.length === 0 ? (
                        <div className="dz-empty">
                            <span className="dz-empty-icon"><UsersIcon /></span>
                            <div className="dz-empty-title">No students enrolled</div>
                            <div className="dz-empty-text">Enrol students to populate the roster and attendance register.</div>
                        </div>
                    ) : (
                        <div className="dz-table-wrap">
                            <table className="dz-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Enrolled</th>
                                        <th className="dz-table-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roster.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                                                    <div className="dz-tile" style={{ background: "#8b5cf6" }}>
                                                        {r.firstName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</span>
                                                </div>
                                            </td>
                                            <td><span className="dz-status dz-status-green">Student</span></td>
                                            <td style={{ color: "var(--text-secondary)" }}>{new Date(r.enrolledAt).toLocaleDateString()}</td>
                                            <td className="dz-table-actions">
                                                <button className="dz-btn-danger-ghost">Withdraw</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === "assignments" && (
                <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "1.35rem 1.4rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                            <div className="dz-card-title">Assignments &amp; Grading</div>
                            <div className="dz-reminder-meta" style={{ marginTop: "0.25rem" }}>
                                {assignments.length} assignment{assignments.length === 1 ? "" : "s"} in this section.
                            </div>
                        </div>
                        <button className="dz-pill-btn"><PlusIcon /> New Assignment</button>
                    </div>
                    <div className="dz-table-wrap">
                        <table className="dz-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Due Date</th>
                                    <th>Max Score</th>
                                    <th className="dz-table-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600 }}>{a.title}</td>
                                        <td style={{ color: "var(--text-secondary)" }}>{new Date(a.dueDate).toLocaleDateString()}</td>
                                        <td><span className="dz-status dz-status-gray">{a.maxScore} pts</span></td>
                                        <td className="dz-table-actions">
                                            <button className="dz-pill-btn" style={{ marginRight: "0.5rem" }}>Grade Submissions</button>
                                            <button className="dz-btn-danger-ghost">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === "attendance" && (
                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Daily Attendance</span>
                        <span className="dz-status dz-status-gray">{roster.length} on roll</span>
                    </div>
                    <p className="dz-reminder-meta" style={{ lineHeight: 1.65, marginBottom: "1.1rem", maxWidth: "62ch" }}>
                        Take the register for {roster.length} enrolled students. Everyone starts
                        marked present. Adjust the exceptions and save once.
                    </p>
                    <div>
                        <Link
                            to={`/dashboard/organizations/${id}/classes/${classId}/attendance`}
                            className="dz-btn-green"
                        >
                            Take today's register →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
