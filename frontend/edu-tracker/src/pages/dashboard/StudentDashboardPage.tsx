import { Link } from "react-router-dom";

export default function StudentDashboardPage() {
    // --- MOCK DATA ---
    const studentProfile = {
        name: "Alice Johnson",
        idNumber: "STU-2026-0812",
        gradeLevel: "10th Grade"
    };

    const attendanceStats = {
        present: 42,
        absent: 2,
        tardy: 1,
        totalRate: "93%"
    };

    const currentClasses = [
        { id: "c1", name: "Math 101 - Section A", teacher: "Mr. Smith", currentGrade: "A", nextClass: "Tomorrow, 10:00 AM" },
        { id: "c2", name: "World History", teacher: "Ms. Davis", currentGrade: "B+", nextClass: "Today, 1:00 PM" }
    ];

    const assignmentsAndTests = [
        { id: "a1", type: "Homework", class: "Math 101", title: "Algebra Worksheet", dueDate: "2026-04-10", status: "Pending" },
        { id: "a2", type: "Exam", class: "World History", title: "Midterm Exam", dueDate: "2026-04-06", status: "Upcoming" },
        { id: "a3", type: "Project", class: "Science", title: "Volcano Model", dueDate: "2026-03-25", status: "Graded", score: "95/100" }
    ];
    // -----------------

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.2rem" }}>Student Portal</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Welcome back, {studentProfile.name}</p>
                </div>
                <Link to="/dashboard" className="btn btn-secondary btn-sm">← Back to Main</Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "1.5rem" }}>
                {/* Left Column: Profile & Attendance */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: 800, color: "var(--success)", border: "2px solid var(--success)", marginBottom: "1rem" }}>
                            {studentProfile.name.charAt(0)}
                        </div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{studentProfile.name}</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{studentProfile.idNumber}</p>
                        <span className="badge badge-accent" style={{ marginTop: "0.8rem" }}>{studentProfile.gradeLevel}</span>
                    </div>

                    <div className="card" style={{ padding: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Attendance Record</h2>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "1.5rem" }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--success)" }}>{attendanceStats.totalRate}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Present Rate</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Present</span>
                                <span style={{ fontWeight: 600 }}>{attendanceStats.present} days</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Absent</span>
                                <span style={{ fontWeight: 600, color: "var(--error)" }}>{attendanceStats.absent} days</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Tardy</span>
                                <span style={{ fontWeight: 600, color: "var(--warn)" }}>{attendanceStats.tardy} days</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Classes & Academics */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>My Current Classes</h2>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            {currentClasses.map(c => (
                                <div key={c.id} style={{ padding: "1rem", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{c.name}</div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-light)" }}>{c.currentGrade}</div>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Teacher: {c.teacher}</div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        🕒 {c.nextClass}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                         <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Assignments & Exams</h2>
                        </div>
                        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Due Date</th>
                                    <th>Status/Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignmentsAndTests.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 500 }}>{a.class}</td>
                                        <td>{a.title}</td>
                                        <td><span className="badge badge-secondary">{a.type}</span></td>
                                        <td>{new Date(a.dueDate).toLocaleDateString()}</td>
                                        <td>
                                            {a.status === "Graded" ? (
                                                <span style={{ fontWeight: 700, color: "var(--success)" }}>{a.score}</span>
                                            ) : (
                                                <span className={`badge ${a.status === 'Pending' ? 'badge-warn' : 'badge-accent'}`}>{a.status}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}
