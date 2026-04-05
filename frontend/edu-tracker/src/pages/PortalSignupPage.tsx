import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

export default function PortalSignupPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Read from query params URL (e.g. ?schoolName=Springfield&role=student)
    const schoolName = searchParams.get("schoolName") || "Unknown School";
    const roleParam = searchParams.get("role");
    const role = roleParam === "teacher" ? "Teacher" : "Student";

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // MOCK: Simulate API signup delay
        setTimeout(() => {
            setLoading(false);
            setShowSuccess(true);
            setTimeout(() => {
                navigate(role === "Teacher" ? "/teacher-portal" : "/student-portal");
            }, 2500);
        }, 1500);
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "2rem" }}>
                    
                    <div style={{ textAlign: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: role === "Teacher" ? "var(--accent)" : "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", color: "#fff" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <polyline points="17 11 19 13 23 9"></polyline>
                            </svg>
                        </div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Create your {role} Account</h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>You have been invited to join an academy.</p>
                    </div>

                    <div className="auth-card" style={{ padding: "2rem" }}>
                        {showSuccess ? (
                            <div className="success-anim-container">
                                <div className="success-anim-circle">
                                    <svg className="success-anim-svg" viewBox="0 0 52 52">
                                        <circle cx="26" cy="26" r="24" />
                                        <path d="M14 26 L22 34 L38 16" />
                                    </svg>
                                </div>
                                <div className="success-anim-title">Account Created!</div>
                                <div className="success-anim-text">Redirecting to your portal...</div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                
                                {/* LOCKED FIELDS */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                                    <div>
                                        <label className="input-label" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Academy / School (Locked)</label>
                                        <input className="input" type="text" value={schoolName} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                                    </div>
                                    <div>
                                        <label className="input-label" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Assigned Role (Locked)</label>
                                        <input className="input" type="text" value={role} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                                    </div>
                                </div>

                                {/* USER FIELDS */}
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">First Name</label>
                                        <input className="input" type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required autoFocus />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">Last Name</label>
                                        <input className="input" type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required />
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">School Email Address</label>
                                    <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                                </div>

                                <div>
                                    <label className="input-label">Create Password</label>
                                    <input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={loading}>
                                    {loading ? "Creating Account..." : "Complete Registration"}
                                </button>
                            </form>
                        )}
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Already have an account? <Link to="/portal-login" style={{ color: "var(--accent)" }}>Sign In Here</Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
