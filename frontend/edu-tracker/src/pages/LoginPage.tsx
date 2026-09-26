import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";

export default function LoginPage() {
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const result = await login(identifier, password, rememberMe);
        setLoading(false);
        if (result.ok) {
            setShowSuccess(true);
            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);
        } else {
            setError(result.error || "Login failed.");
        }
    };

    return (
        <AuthShell mode="login">
                    {showSuccess ? (
                        <div className="success-anim-container" role="status" aria-live="polite">
                            <div className="success-anim-circle">
                                <svg className="success-anim-svg" viewBox="0 0 52 52">
                                    <circle cx="26" cy="26" r="24" />
                                    <path d="M14 26 L22 34 L38 16" />
                                </svg>
                            </div>
                            <div className="success-anim-title">Login Successful!</div>
                            <div className="success-anim-text">Redirecting to dashboard...</div>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                        {error && (
                            <div className="alert alert-error" role="alert">
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

                            />
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className="input-label" htmlFor="login-pw" style={{ marginBottom: 0 }}>Password</label>
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

                        <button type="submit" className="btn btn-primary btn-full btn-lg auth-submit" disabled={loading} style={{ marginTop: "0.25rem" }}>
                            {loading ? (
                                <><div className="spinner" style={{ borderTopColor: "#fff", width: 18, height: 18 }} /> Signing in...</>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                    )}
        </AuthShell>
    );
}
