import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const features = [
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" />
                <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
                <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
            </svg>
        ),
        title: "Organization Management",
        desc: "Create and manage educational organizations with ease. Invite members, assign roles, and streamline your institution.",
    },
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
        title: "Team Collaboration",
        desc: "Bring your team together with role-based access. Owners, moderators, and members — everyone has the right tools.",
    },
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9,12 11,14 15,10" />
            </svg>
        ),
        title: "Secure by Design",
        desc: "Enterprise-grade encryption, session management, and secure authentication protect your data at every layer.",
    },
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
        title: "Real-time Dashboard",
        desc: "Get instant insights into your organizations, active sessions, and team activity from a beautiful dashboard.",
    },
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
        ),
        title: "Flexible Subscriptions",
        desc: "Choose plans that fit your needs. Scale effortlessly as your institution grows with transparent pricing.",
    },
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
            </svg>
        ),
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

function DashboardMockup() {
    return (
        <div className="mockup-window fade-in-delay-4">
            {/* Browser chrome */}
            <div className="mockup-titlebar">
                <div className="mockup-dot" style={{ background: "#ff5f57" }} />
                <div className="mockup-dot" style={{ background: "#ffbc2e" }} />
                <div className="mockup-dot" style={{ background: "#28c840" }} />
                <div className="mockup-addressbar">
                    <div className="mockup-addressbar-inner">
                        app.edutracker.io/dashboard
                    </div>
                </div>
            </div>

            {/* Mock dashboard body */}
            <div style={{ display: "flex", height: 320 }}>
                {/* Mock sidebar */}
                <div style={{ width: 140, background: "#0a0b0f", padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.5rem", marginBottom: "0.875rem" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--grad-brand)", flexShrink: 0 }} />
                        <div style={{ height: 8, width: 60, background: "rgba(255,255,255,0.2)", borderRadius: 4 }} />
                    </div>
                    {[
                        { active: true, w: 56 },
                        { active: false, w: 72 },
                        { active: false, w: 48 },
                    ].map((item, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex", alignItems: "center", gap: "0.4rem",
                                padding: "0.35rem 0.5rem",
                                borderRadius: 6,
                                background: item.active ? "rgba(99,102,241,0.2)" : "transparent",
                            }}
                        >
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: item.active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.18)", flexShrink: 0 }} />
                            <div style={{ height: 7, width: item.w, background: item.active ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)", borderRadius: 4 }} />
                        </div>
                    ))}
                </div>

                {/* Mock main content */}
                <div style={{ flex: 1, padding: "1rem 1.125rem", background: "var(--bg-primary)", overflowY: "hidden" }}>
                    {/* Top bar mock */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                        <div>
                            <div style={{ height: 7, width: 48, background: "var(--border-hover)", borderRadius: 3, marginBottom: 5 }} />
                            <div style={{ height: 10, width: 80, background: "var(--text-muted)", borderRadius: 4, opacity: 0.4 }} />
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--grad-brand)" }} />
                    </div>

                    {/* Mock greeting */}
                    <div style={{ height: 12, width: 180, background: "var(--text-primary)", borderRadius: 5, opacity: 0.15, marginBottom: "1rem" }} />

                    {/* Mock stat cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                        {[
                            { color: "var(--accent-glow-strong)" },
                            { color: "var(--success-bg)" },
                            { color: "var(--warn-bg)" },
                        ].map((s, i) => (
                            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.625rem" }}>
                                <div style={{ width: 24, height: 24, borderRadius: 6, background: s.color, marginBottom: "0.5rem" }} />
                                <div style={{ height: 14, width: "55%", background: "var(--grad-brand)", borderRadius: 4, marginBottom: 4, opacity: 0.7 }} />
                                <div style={{ height: 7, width: "75%", background: "var(--border-hover)", borderRadius: 3 }} />
                            </div>
                        ))}
                    </div>

                    {/* Mock org cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                        {[1, 2].map((i) => (
                            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.625rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--grad-brand)" }} />
                                    <div style={{ height: 14, width: 36, background: "var(--success-bg)", borderRadius: 20 }} />
                                </div>
                                <div style={{ height: 9, width: "65%", background: "var(--border-hover)", borderRadius: 4, marginBottom: 4 }} />
                                <div style={{ height: 7, width: "40%", background: "var(--border)", borderRadius: 3 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
                            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
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
                    <Link to="/register" className="btn btn-primary btn-sm">Get Started →</Link>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section style={{ paddingTop: "8.5rem", paddingBottom: "3rem", position: "relative", zIndex: 1 }}>
                <div className="container" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="hero-badge fade-in" style={{ marginBottom: "1.75rem" }}>
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
                            display: "flex", gap: "2rem", marginTop: "3.5rem", flexWrap: "wrap", justifyContent: "center",
                            padding: "1.25rem 2.5rem", borderRadius: "var(--r-xl)",
                            background: "var(--bg-card)", border: "1px solid var(--border)",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        {stats.map((s) => (
                            <div key={s.label} style={{ textAlign: "center", minWidth: 80 }}>
                                <div style={{ fontSize: "1.35rem", fontWeight: 800 }} className="text-gradient">{s.value}</div>
                                <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Dashboard Mockup ─── */}
            <section style={{ position: "relative", zIndex: 1, paddingBottom: "5rem" }}>
                <div className="container">
                    <div style={{ maxWidth: 760, margin: "0 auto" }}>
                        <DashboardMockup />
                    </div>
                </div>
            </section>

            {/* ─── Features ─── */}
            <section className="section" style={{ position: "relative", zIndex: 1 }}>
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                        <div className="hero-badge" style={{ marginBottom: "1rem" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" /></svg>
                            <span>Features</span>
                        </div>
                        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Everything you need to <span className="text-gradient">manage education</span>
                        </h2>
                        <p style={{ color: "var(--text-secondary)", maxWidth: 520, margin: "1rem auto 0", fontSize: "1.05rem" }}>
                            Powerful features designed to simplify your workflow and empower your team.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
                        {features.map((f, i) => (
                            <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.07}s` }}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>{f.title}</h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.65 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How it works ─── */}
            <section className="section" style={{ position: "relative", zIndex: 1 }}>
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                        <div className="hero-badge" style={{ marginBottom: "1rem" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                            <span>How it works</span>
                        </div>
                        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Up and running in <span className="text-gradient">minutes</span>
                        </h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
                        {[
                            { step: "01", title: "Create your account", desc: "Sign up for free in under 2 minutes. No credit card required." },
                            { step: "02", title: "Set up your organization", desc: "Create your institution and customize it for your team's needs." },
                            { step: "03", title: "Invite your team", desc: "Add members with role-based permissions — owners, mods, and members." },
                            { step: "04", title: "Track & manage", desc: "Monitor activity, sessions, and subscriptions from your dashboard." },
                        ].map((item) => (
                            <div key={item.step} style={{ position: "relative" }}>
                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center", justifyContent: "center",
                                        width: 40, height: 40, borderRadius: 10,
                                        background: "var(--grad-brand-subtle)",
                                        border: "1px solid rgba(99,102,241,0.15)",
                                        fontWeight: 800, fontSize: "0.8rem",
                                        color: "var(--accent)",
                                        marginBottom: "1rem",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    {item.step}
                                </div>
                                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem" }}>{item.title}</h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.87rem", lineHeight: 1.6 }}>{item.desc}</p>
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
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                            <span>Testimonials</span>
                        </div>
                        <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                            Loved by <span className="text-gradient">educators everywhere</span>
                        </h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
                        {testimonials.map((t) => (
                            <div key={t.name} className="testimonial-card">
                                {/* Quote mark */}
                                <div style={{ fontSize: "2rem", lineHeight: 1, color: "var(--accent)", opacity: 0.3, marginBottom: "0.75rem", fontFamily: "Georgia, serif" }}>"</div>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.91rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                                    {t.quote}
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div
                                        style={{
                                            width: 38, height: 38, borderRadius: 10,
                                            background: "var(--grad-brand)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: "0.88rem", color: "#fff",
                                            boxShadow: "0 3px 10px rgba(99,102,241,0.25)",
                                        }}
                                    >
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{t.name}</div>
                                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section
                className="section cta-glow"
                style={{
                    position: "relative", zIndex: 1,
                    background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(168,85,247,0.03))",
                    borderTop: "1px solid rgba(99,102,241,0.08)",
                    borderBottom: "1px solid rgba(99,102,241,0.08)",
                }}
            >
                <div className="container" style={{ textAlign: "center" }}>
                    <div
                        style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 56, height: 56, borderRadius: 16, marginBottom: "1.5rem",
                            background: "var(--grad-brand)",
                            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
                        Ready to <span className="text-gradient">get started</span>?
                    </h2>
                    <p style={{ color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 2.25rem", fontSize: "1.05rem" }}>
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
            <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid var(--border)", padding: "2.5rem 0" }}>
                <div className="container">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
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
                                <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>EduTracker</span>
                            </div>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                                The modern education management platform.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "1.5rem" }}>
                            <Link to="/login" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Sign In</Link>
                            <Link to="/register" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Get Started</Link>
                        </div>
                    </div>
                    <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center" }}>
                            © 2026 EduTracker. Built with ❤️ for education.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
