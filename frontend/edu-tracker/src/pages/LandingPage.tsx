import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const features = [
    {
        icon: "🏫",
        title: "Organization Management",
        desc: "Create and manage educational organizations with ease. Invite members, assign roles, and streamline your institution.",
    },
    {
        icon: "👥",
        title: "Team Collaboration",
        desc: "Bring your team together with role-based access. Owners, moderators, and members — everyone has the right tools.",
    },
    {
        icon: "🔐",
        title: "Secure by Design",
        desc: "Enterprise-grade encryption, session management, and secure authentication protect your data at every layer.",
    },
    {
        icon: "📊",
        title: "Real-time Dashboard",
        desc: "Get instant insights into your organizations, active sessions, and team activity from a beautiful dashboard.",
    },
    {
        icon: "💳",
        title: "Flexible Subscriptions",
        desc: "Choose plans that fit your needs. Scale effortlessly as your institution grows with transparent pricing.",
    },
    {
        icon: "⚡",
        title: "Lightning Fast",
        desc: "Built with performance in mind. Lightning-fast API responses and optimized frontend for the best experience.",
    },
];

const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "< 50ms", label: "API Response" },
    { value: "256-bit", label: "Encryption" },
    { value: "∞", label: "Scalability" },
];

const testimonials = [
    {
        quote: "EduTracker transformed how we manage our academy. The dashboard is incredible and the team features save us hours every week.",
        name: "Sarah Johnson",
        role: "Academy Director",
        avatar: "S",
    },
    {
        quote: "The security features give us complete peace of mind. Session management and encrypted data storage are game changers.",
        name: "Michael Chen",
        role: "CTO, EduTech Inc.",
        avatar: "M",
    },
    {
        quote: "Setting up our organization took minutes, not days. The onboarding experience is seamless and beautifully designed.",
        name: "Amara Okafor",
        role: "School Administrator",
        avatar: "A",
    },
];

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <div style={{ position: "relative", minHeight: "100vh" }}>
            {/* Animated background */}
            <div className="bg-orbs">
                <div className="bg-orb bg-orb-1" />
                <div className="bg-orb bg-orb-2" />
                <div className="bg-orb bg-orb-3" />
            </div>
            <div className="bg-grid" />

            {/* ─── Navbar ─── */}
            <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
                <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
                    <div
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "var(--grad-brand)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: "0.95rem", color: "#fff",
                        }}
                    >
                        E
                    </div>
                    <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                        EduTracker
                    </span>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section style={{ paddingTop: "8rem", paddingBottom: "5rem", position: "relative", zIndex: 1 }}>
                <div className="container" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="hero-badge fade-in" style={{ marginBottom: "1.5rem" }}>
                        <span style={{ fontSize: "0.85rem" }}>✨</span>
                        <span>Now with Cloud-Powered Database</span>
                    </div>

                    <h1 className="hero-title fade-in-delay-1">
                        Education management
                        <br />
                        <span className="text-gradient">reimagined.</span>
                    </h1>

                    <p className="hero-subtitle fade-in-delay-2" style={{ marginTop: "1.5rem" }}>
                        The modern platform for managing organizations, teams, and subscriptions.
                        Beautiful, secure, and blazingly fast.
                    </p>

                    <div className="fade-in-delay-3" style={{ display: "flex", gap: "0.75rem", marginTop: "2.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                        <Link to="/register" className="btn btn-primary btn-xl glow-ring">
                            Start for Free →
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-xl">
                            Sign In
                        </Link>
                    </div>

                    {/* Stats bar */}
                    <div
                        className="fade-in-delay-4"
                        style={{
                            display: "flex", gap: "2rem", marginTop: "4rem", flexWrap: "wrap", justifyContent: "center",
                            padding: "1.5rem 2.5rem", borderRadius: "var(--r-xl)",
                            background: "var(--bg-card)", border: "1px solid var(--border)",
                        }}
                    >
                        {stats.map((s) => (
                            <div key={s.label} style={{ textAlign: "center", minWidth: 90 }}>
                                <div style={{ fontSize: "1.4rem", fontWeight: 800 }} className="text-gradient">{s.value}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Features ─── */}
            <section className="section" style={{ position: "relative", zIndex: 1 }}>
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                        <div className="hero-badge" style={{ marginBottom: "1rem" }}>
                            <span>🚀</span>
                            <span>Features</span>
                        </div>
                        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Everything you need to <span className="text-gradient">manage education</span>
                        </h2>
                        <p style={{ color: "var(--text-secondary)", maxWidth: 520, margin: "1rem auto 0", fontSize: "1.05rem" }}>
                            Powerful features designed to simplify your workflow and empower your team.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
                        {features.map((f, i) => (
                            <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3 style={{ fontSize: "1.08rem", fontWeight: 700, marginBottom: "0.5rem" }}>{f.title}</h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Testimonials ─── */}
            <section className="section" style={{ position: "relative", zIndex: 1 }}>
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                        <div className="hero-badge" style={{ marginBottom: "1rem" }}>
                            <span>💬</span>
                            <span>Testimonials</span>
                        </div>
                        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Loved by <span className="text-gradient">educators everywhere</span>
                        </h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
                        {testimonials.map((t) => (
                            <div key={t.name} className="testimonial-card">
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: "1.25rem", fontStyle: "italic" }}>
                                    "{t.quote}"
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div
                                        style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: "var(--grad-brand)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: "0.9rem", color: "#fff",
                                        }}
                                    >
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.name}</div>
                                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="section cta-glow" style={{ position: "relative", zIndex: 1 }}>
                <div className="container" style={{ textAlign: "center" }}>
                    <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
                        Ready to <span className="text-gradient">get started</span>?
                    </h2>
                    <p style={{ color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 2rem", fontSize: "1.05rem" }}>
                        Join thousands of educators who are already using EduTracker to manage their institutions.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <Link to="/register" className="btn btn-primary btn-xl glow-ring">
                            Create Free Account
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-xl">
                            Sign In →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid var(--border)", padding: "2rem 0" }}>
                <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                            style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: "var(--grad-brand)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: "0.75rem", color: "#fff",
                            }}
                        >
                            E
                        </div>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>EduTracker</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        © 2026 EduTracker. Built with ❤️ for education.
                    </p>
                </div>
            </footer>
        </div>
    );
}
