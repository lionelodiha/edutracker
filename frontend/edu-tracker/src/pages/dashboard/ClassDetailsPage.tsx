import { useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function ClassDetailsPage() {
    const { id, classId } = useParams();
    const [tab, setTab] = useState<"overview" | "roster" | "assignments" | "attendance">("overview");

    // --- MOCK DATA ---
    const classInfo = {
        code: "Math 101 - Section A",
        instructorName: "Chidubem",
        maxCapacity: 30,
        createdAt: new Date().toISOString()
    };

    const roster = [
        { id: "1", firstName: "Alice", lastName: "Johnson", role: "Student", enrolledAt: "2026-04-01" },
        { id: "2", firstName: "Bob", lastName: "Smith", role: "Student", enrolledAt: "2026-04-02" }
    ];

    const assignments = [
        { id: "a1", title: "Algebra Worksheet", dueDate: "2026-04-10", maxScore: 100 },
        { id: "a2", title: "Midterm Exam", dueDate: "2026-04-20", maxScore: 100 }
    ];

    const attendance = [
        { studentId: "1", studentName: "Alice Johnson", status: "Present" },
        { studentId: "2", studentName: "Bob Smith", status: "Absent" }
    ];
    // -----------------

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <Link to={`/dashboard/organizations/${id}/semesters`} style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem" }}>
                            ← Back
                        </Link>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>/</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Class Details</span>
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                        {classInfo.code}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        <span>Instructor: <strong style={{ color: "var(--accent-light)" }}>{classInfo.instructorName || "Unassigned"}</strong></span>
                        <span>Capacity: {classInfo.maxCapacity}</span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-secondary btn-sm">Edit Class Info</button>
                    <button className="btn btn-primary btn-sm glow-ring">Generate Report Card</button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                <button
                    className={`btn ${tab === "overview" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setTab("overview")}
                >
                    Overview
                </button>
                <button
                    className={`btn ${tab === "roster" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setTab("roster")}
                >
                    Roster
                </button>
                <button
                    className={`btn ${tab === "assignments" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setTab("assignments")}
                >
                    Assignments
                </button>
                <button
                    className={`btn ${tab === "attendance" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setTab("attendance")}
                >
                    Daily Attendance
                </button>
            </div>

            {/* Tab Contents */}
            <div className="fade-in">
                {tab === "overview" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                        <div className="stat-card">
                            <div className="stat-label">Total Enrolled</div>
                            <div className="stat-value">{roster.length} / {classInfo.maxCapacity}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Upcoming Assignments</div>
                            <div className="stat-value">{assignments.length}</div>
                        </div>
                    </div>
                )}

                {tab === "roster" && (
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Class Roster</h3>
                            <button className="btn btn-primary btn-sm">Enrol Student</button>
                        </div>
                        <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Enrolled Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roster.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 500 }}>{r.firstName} {r.lastName}</td>
                                            <td><span className="badge badge-accent">{r.role}</span></td>
                                            <td>{new Date(r.enrolledAt).toLocaleDateString()}</td>
                                            <td><button className="btn btn-secondary btn-sm" style={{ color: "var(--error)" }}>Remove</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === "assignments" && (
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Assignments & Grading</h3>
                            <button className="btn btn-primary btn-sm">+ New Assignment</button>
                        </div>
                        <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Due Date</th>
                                        <th>Max Score</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map(a => (
                                        <tr key={a.id}>
                                            <td style={{ fontWeight: 500 }}>{a.title}</td>
                                            <td>{new Date(a.dueDate).toLocaleDateString()}</td>
                                            <td>{a.maxScore} pts</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }}>Grade Submissions</button>
                                                <button className="btn btn-secondary btn-sm" style={{ color: "var(--error)" }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === "attendance" && (
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Daily Attendance</h3>
                                <input type="date" className="input" style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem", width: "160px" }} defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <button className="btn btn-primary btn-sm glow-ring">Save Attendance</button>
                        </div>
                        <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map(a => (
                                        <tr key={a.studentId}>
                                            <td style={{ fontWeight: 500 }}>{a.studentName}</td>
                                            <td>
                                                <select className="input" defaultValue={a.status} style={{ width: "140px", padding: "0.4rem" }}>
                                                    <option value="Present">Present</option>
                                                    <option value="Absent">Absent</option>
                                                    <option value="Tardy">Tardy</option>
                                                    <option value="Excused">Excused</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
