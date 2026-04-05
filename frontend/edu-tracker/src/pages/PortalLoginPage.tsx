import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function PortalLoginPage() {
    const navigate = useNavigate();
    const [schoolCode, setSchoolCode] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [mockRole, setMockRole] = useState("Student");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Mock API call to authenticate and determine organization + role
        setTimeout(() => {
            setLoading(false);
            if (mockRole === "Teacher") {
                navigate("/teacher-portal");
            } else {
                navigate("/student-portal");
            }
        }, 1500);
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "2rem" }}>
                    
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--grad-brand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", color: "#fff" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                        </div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>School Portal Sign In</h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Teachers and Students sign in here.</p>
                    </div>

                    <div className="auth-card" style={{ padding: "2rem" }}>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label className="input-label" htmlFor="schoolCode">School Code</label>
                                <input
                                    id="schoolCode"
                                    type="text"
                                    className="input"
                                    style={{ textTransform: "uppercase" }}
                                    value={schoolCode}
                                    onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. SPRINGFIELD"
                                    required
                                />
                            </div>

                            <div>
                                <label className="input-label" htmlFor="identifier">School Email or Student ID</label>
                                <input
                                    id="identifier"
                                    type="text"
                                    className="input"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder="e.g. jsmith@school.edu"
                                    required
                                />
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <label className="input-label" htmlFor="password">Password</label>
                                    <Link to="#" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none" }}>Forgot?</Link>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    className="input"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {/* MOCK DEMO SELECTOR */}
                            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                                <label className="input-label" style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>[Mock Backend Override] Login As:</label>
                                <select className="input" value={mockRole} onChange={(e) => setMockRole(e.target.value)}>
                                    <option value="Student">Student Payload Example</option>
                                    <option value="Teacher">Teacher Payload Example</option>
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={loading}>
                                {loading ? "Authenticating..." : "Sign In to Portal"}
                            </button>
                        </form>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <Link to="/" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>
                            ← Back to EduTracker Homepage
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
