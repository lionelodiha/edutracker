import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";

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
    const { register, isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        userName: "",
        email: params.get("email") ?? "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated && !showSuccess) {
            navigate("/dashboard", { replace: true });
        }
    }, [authLoading, isAuthenticated, showSuccess, navigate]);

    if (authLoading) return null;

    const strength = getPasswordStrength(form.password);

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
            setLoading(false);
            setShowSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 2500);
        } else {
            setLoading(false);
            setError(result.error || "Registration failed.");
        }
    };

    return (
        <AuthShell mode="register">
                    {showSuccess ? (
                        <div className="success-anim-container" role="status" aria-live="polite">
                            <div className="success-anim-circle">
                                <svg className="success-anim-svg" viewBox="0 0 52 52">
                                    <circle cx="26" cy="26" r="24" />
                                    <path d="M14 26 L22 34 L38 16" />
                                </svg>
                            </div>
                            <div className="success-anim-title">Account Created!</div>
                            <div className="success-anim-text">Redirecting to login...</div>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {error && (
                            <div className="alert alert-error" role="alert">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="auth-name-row">
                            <div>
                                <label className="input-label" htmlFor="reg-fn">First Name</label>
                                <input id="reg-fn" autoComplete="given-name" className="input" placeholder="John" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
                            </div>
                            <div>
                                <label className="input-label" htmlFor="reg-ln">Last Name</label>
                                <input id="reg-ln" autoComplete="family-name" className="input" placeholder="Doe" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
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
                                    aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}
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

                        <button type="submit" className="btn btn-primary btn-full btn-lg auth-submit" disabled={loading} style={{ marginTop: "0.25rem" }}>
                            {loading ? (
                                <><div className="spinner" style={{ borderTopColor: "#fff", width: 18, height: 18 }} /> Creating account...</>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>
                    )}
        </AuthShell>
    );
}
