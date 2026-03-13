import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const result = await login(identifier, password, rememberMe);
        setLoading(false);
        if (result.ok) {
            navigate("/dashboard");
        } else {
            setError(result.error || "Login failed.");
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

            <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }} className="fade-in">
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
                        Welcome back! Sign in to your account.
                    </p>
                </div>

                {/* Card */}
                <div className="auth-card" style={{ padding: "2rem" }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                        {error && (
                            <div className="alert alert-error fade-in">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="input-label" htmlFor="login-id">Email or Username</label>
                            <input
                                id="login-id"
                                className="input"
                                type="text"
                                placeholder="you@example.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                autoComplete="username"
                                autoFocus
                            />
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className="input-label" htmlFor="login-pw" style={{ marginBottom: 0 }}>Password</label>
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
                            <input
                                id="login-pw"
                                className="input"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                                id="login-remember"
                                type="checkbox"
                                className="checkbox-custom"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="login-remember" style={{ color: "var(--text-secondary)", fontSize: "0.84rem", cursor: "pointer" }}>
                                Keep me signed in for 7 days
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full btn-lg glow-ring" disabled={loading} style={{ marginTop: "0.25rem" }}>
                            {loading ? (
                                <><div className="spinner" style={{ borderTopColor: "#fff", width: 18, height: 18 }} /> Signing in...</>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>

                <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                        Don't have an account?{" "}
                    </span>
                    <Link to="/register" style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        Create one →
                    </Link>
                </div>
            </div>
        </div>
    );
}
