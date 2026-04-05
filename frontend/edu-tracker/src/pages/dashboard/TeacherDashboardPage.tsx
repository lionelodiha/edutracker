import { Link } from "react-router-dom";

export default function TeacherDashboardPage() {
    // --- MOCK DATA ---
    const teacherProfile = {
        name: "Mr. Ebenezer Smith",
        department: "Mathematics",
        email: "e.smith@edutracker.school.edu"
    };

    const classesHandling = [
        { id: "c1", name: "Math 101 - Section A", studentsCount: 28, schedule: "Mon, Wed, Fri 10:00 AM" },
        { id: "c2", name: "Advanced Calculus", studentsCount: 15, schedule: "Tue, Thu 02:00 PM" }
    ];

    const upcomingTasks = [
        { id: "t1", task: "Grade Midterm Exams (Math 101)", dueDate: "2026-04-10", type: "Grading" },
        { id: "t2", task: "Approve Attendance for Calculus", dueDate: "2026-04-06", type: "Admin" }
    ];

    const studentRecords = [
        { id: "s1", name: "Alice Johnson", class: "Math 101", grade: "A", attendance: "98%" },
        { id: "s2", name: "Bob Smith", class: "Math 101", grade: "B-", attendance: "85%" },
        { id: "s3", name: "Charlie Davis", class: "Advanced Calculus", grade: "A+", attendance: "100%" }
    ];
    // -----------------

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.2rem" }}>Teacher Portal</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Welcome back, {teacherProfile.name}</p>
                </div>
                <Link to="/dashboard" className="btn btn-secondary btn-sm">← Back to Main</Link>
            </div>

            {/* Top Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                <div className="stat-card">
                    <div className="stat-label">Classes Handled</div>
                    <div className="stat-value">{classesHandling.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{studentRecords.length} Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pending Tasks</div>
                    <div className="stat-value">{upcomingTasks.length}</div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                {/* Left Column: Classes & Students */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>My Classes</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                            {classesHandling.map(c => (
                                <div key={c.id} style={{ padding: "1rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{c.schedule}</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <span className="badge badge-accent">{c.studentsCount} Students</span>
                                        <button className="btn btn-primary btn-sm">Manage Class</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Student Records Overview</h2>
                        </div>
                        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Class</th>
                                    <th>Current Grade</th>
                                    <th>Attendance</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentRecords.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                                        <td>{s.class}</td>
                                        <td><span className={`badge ${s.grade.includes('A') ? 'badge-success' : 'badge-warn'}`}>{s.grade}</span></td>
                                        <td>{s.attendance}</td>
                                        <td><button className="btn btn-secondary btn-sm">View Profile</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Profile & Tasks */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--grad-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>
                            {teacherProfile.name.charAt(0)}
                        </div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{teacherProfile.name}</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{teacherProfile.department} Dept.</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{teacherProfile.email}</p>
                    </div>

                    <div className="card" style={{ padding: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>To-Do List</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                            {upcomingTasks.map(t => (
                                <div key={t.id} style={{ display: "flex", gap: "0.8rem", alignItems: "flex-start", paddingBottom: "0.8rem", borderBottom: "1px solid var(--border)" }}>
                                    <input type="checkbox" style={{ marginTop: "0.2rem" }} />
                                    <div>
                                        <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>{t.task}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>Due: {new Date(t.dueDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
