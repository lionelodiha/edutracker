import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

function getPasswordStrength(pw: string): { level: number; label: string } {
    if (!pw) return { level: 0, label: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { level: 1, label: "Weak" };
    if (score <= 4) return { level: 2, label: "Medium" };
    return { level: 3, label: "Strong" };
}

export default function RegisterPage() {
    const { register, login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

    const update = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        const result = await register({
            firstName: form.firstName,
            lastName: form.lastName,
            userName: form.userName,
            email: form.email,
            password: form.password,
        });

        if (result.ok) {
            const loginResult = await login(form.email, form.password);
            setLoading(false);
            if (loginResult.ok) {
                navigate("/dashboard");
            } else {
                navigate("/login");
            }
        } else {
            setLoading(false);
            setError(result.error || "Registration failed.");
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative" }}>
            {/* Animated background */}
            <div className="bg-orbs">
                <div className="bg-orb bg-orb-1" />
                <div className="bg-orb bg-orb-2" />
                <div className="bg-orb bg-orb-3" />
            </div>
            <div className="bg-grid" />

            <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }} className="fade-in">
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                    <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", marginBottom: "0.75rem" }}>
                        <div
                            style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: "var(--grad-brand)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, fontSize: "1.1rem", color: "#fff",
                                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
                            }}
                        >
                            E
                        </div>
                        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                            EduTracker
                        </span>
                    </Link>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginTop: "0.5rem" }}>
                        Create your account to get started.
                    </p>
                </div>

                {/* Card */}
                <div className="auth-card" style={{ padding: "2rem" }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {error && (
                            <div className="alert alert-error fade-in">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                            <div>
                                <label className="input-label" htmlFor="reg-fn">First Name</label>
                                <input id="reg-fn" className="input" placeholder="John" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
                            </div>
                            <div>
                                <label className="input-label" htmlFor="reg-ln">Last Name</label>
                                <input id="reg-ln" className="input" placeholder="Doe" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
                            </div>
                        </div>

                        <div>
                            <label className="input-label" htmlFor="reg-un">Username</label>
                            <input id="reg-un" className="input" placeholder="johndoe" value={form.userName} onChange={(e) => update("userName", e.target.value)} required autoComplete="username" />
                        </div>

                        <div>
                            <label className="input-label" htmlFor="reg-email">Email Address</label>
                            <input id="reg-email" className="input" type="email" placeholder="john@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required autoComplete="email" />
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className="input-label" htmlFor="reg-pw" style={{ marginBottom: 0 }}>Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "var(--text-muted)", fontSize: "0.72rem", fontFamily: "inherit",
                                        padding: "0 0 0.4rem 0",
                                    }}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <input id="reg-pw" className="input" type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={(e) => update("password", e.target.value)} required autoComplete="new-password" />
                            {/* Strength indicator */}
                            {form.password && (
                                <div style={{ marginTop: "0.5rem" }}>
                                    <div className="pw-strength">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`pw-strength-bar ${strength.level >= i
                                                        ? strength.level === 1
                                                            ? "active-weak"
                                                            : strength.level === 2
                                                                ? "active-medium"
                                                                : "active-strong"
                                                        : ""
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <div style={{
                                        fontSize: "0.72rem", marginTop: "0.3rem",
                                        color: strength.level === 1 ? "var(--error)" : strength.level === 2 ? "var(--warn)" : "var(--success)",
                                    }}>
                                        {strength.label}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="input-label" htmlFor="reg-cpw">Confirm Password</label>
                            <input id="reg-cpw" className="input" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required autoComplete="new-password" />
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <div style={{ fontSize: "0.72rem", color: "var(--error)", marginTop: "0.3rem" }}>
                                    Passwords do not match
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary btn-full btn-lg glow-ring" disabled={loading} style={{ marginTop: "0.25rem" }}>
                            {loading ? (
                                <><div className="spinner" style={{ borderTopColor: "#fff", width: 18, height: 18 }} /> Creating account...</>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>
                </div>

                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                        Already have an account?{" "}
                    </span>
                    <Link to="/login" style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        Sign in →
                    </Link>
                </div>
            </div>
        </div>
    );
}
