import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, type CSSProperties } from "react";
import Logo from "../components/LogoLockup";
import LogoMark from "../components/Logo";
import "./LandingPage.css";

const ROLES = ["Owner", "Moderator", "Member", "Admin", "Teacher", "Student"];

function StructureIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" />
            <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
        </svg>
    );
}

function MembersIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}

function SessionIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9,12 11,14 15,10" />
        </svg>
    );
}

const STRIP = [
    {
        Icon: MembersIcon,
        title: "Organizations",
        text: "One workspace per school or academy, each with its own members and roles.",
    },
    {
        Icon: StructureIcon,
        title: "Academic structure",
        text: "Semesters, terms, courses, and classes modeled as one hierarchy.",
    },
    {
        Icon: ShieldIcon,
        title: "Roles and invites",
        text: "Owners, moderators, members, admins, teachers, and students, with invites you accept or reject.",
    },
    {
        Icon: SessionIcon,
        title: "Sessions",
        text: "Every sign in is listed on your profile. Revoke one session or all others.",
    },
];

const HIERARCHY = [
    { depth: 0, kind: "Org", name: "Ridgeway Academy" },
    { depth: 1, kind: "Semester", name: "2026 / 2027" },
    { depth: 2, kind: "Term", name: "Autumn" },
    { depth: 3, kind: "Course", name: "MATH-201 Further Algebra" },
    { depth: 4, kind: "Class", name: "Period 4, Mon and Wed" },
];

function HierarchyTree() {
    return (
        <ol className="hierarchy-tree">
            {HIERARCHY.map((row) => (
                // depth travels as a custom property so the media query can
                // override the indent. An inline paddingLeft could not be.
                <li key={row.kind} style={{ "--depth": row.depth } as CSSProperties}>
                    <span className="hierarchy-kind">{row.kind}</span>
                    <span className="hierarchy-name">{row.name}</span>
                </li>
            ))}
        </ol>
    );
}

function HeroStart() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");

    return (
        <form
            className="hero-start"
            onSubmit={(e) => {
                e.preventDefault();
                navigate(`/register?email=${encodeURIComponent(email.trim())}`);
            }}
        >
            <label htmlFor="hero-email" className="sr-only">School email</label>
            <input
                id="hero-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@yourschool.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button type="submit" className="btn btn-primary">
                Create free account
            </button>
        </form>
    );
}

function DashboardMockup() {
    const nav = [
        { label: "Dashboard", active: true },
        { label: "Organizations", active: false },
        { label: "Profile", active: false },
    ];
    const cards = [
        { label: "Organizations", value: "2", sub: "Ridgeway Academy, Lakeside College" },
        { label: "Active sessions", value: "3", sub: "Chrome, Edge, iOS Safari" },
        { label: "Pending invites", value: "5", sub: "4 teachers, 1 moderator" },
    ];
    return (
        <div>
            <div className="mockup-window fade-in-delay-2">
                <div className="mockup-titlebar">
                    <div className="mockup-dot" style={{ background: "#ff5f57" }} />
                    <div className="mockup-dot" style={{ background: "#ffbc2e" }} />
                    <div className="mockup-dot" style={{ background: "#28c840" }} />
                    <div className="mockup-addressbar">
                        <div className="mockup-addressbar-inner">
                            Dashboard preview
                        </div>
                    </div>
                    <span className="mockup-live"><i className="mockup-live-dot" />LIVE</span>
                </div>

                <div style={{ display: "flex", height: 320 }}>
                    <div style={{ width: 150, background: "#0a0b0f", padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", marginBottom: "0.875rem" }}>
                            <LogoMark size={22} />
                            <div style={{ height: 8, width: 62, background: "rgba(255,255,255,0.2)", borderRadius: 4 }} />
                        </div>
                        {nav.map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    display: "flex", alignItems: "center", gap: "0.45rem",
                                    padding: "0.4rem 0.5rem",
                                    borderRadius: 6,
                                    background: item.active ? "rgba(139,92,246,0.22)" : "transparent",
                                }}
                            >
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                                <div style={{ fontSize: "0.62rem", fontWeight: item.active ? 600 : 400, color: item.active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)" }}>
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ flex: 1, padding: "1rem 1.125rem", background: "var(--bg-primary)", overflowY: "hidden" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem", paddingBottom: "0.7rem", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
                                DASHBOARD
                            </div>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.65rem", color: "#fff" }}>
                                A
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.9rem" }}>
                            {cards.map((card) => (
                                <div key={card.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.625rem" }}>
                                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                                        {card.label}
                                    </div>
                                    <div style={{
                                        fontSize: "1.05rem", fontWeight: 650, color: "var(--text-primary)",
                                        fontVariantNumeric: "tabular-nums", lineHeight: 1.1,
                                    }}>
                                        {card.value}
                                    </div>
                                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                        {card.sub}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                            {[
                                { name: "Ridgeway Academy", role: "Owner", initial: "R" },
                                { name: "Lakeside College", role: "Teacher", initial: "L" },
                            ].map((org) => (
                                <div key={org.name} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.625rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                        <div style={{ width: 26, height: 26, borderRadius: 7, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.7rem", color: "#fff" }}>
                                            {org.initial}
                                        </div>
                                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--success)", background: "var(--success-bg)", borderRadius: 20, padding: "0.15rem 0.5rem" }}>
                                            Active
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                        {org.name}
                                    </div>
                                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                                        {org.role}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <p className="mockup-caption">Illustrated preview of the dashboard layout.</p>
        </div>
    );
}

const STEPS = [
    {
        num: "1",
        title: "Create your account",
        text: "Register with a username and password, then sign in to your dashboard.",
    },
    {
        num: "2",
        title: "Add your organization",
        text: "Name your school or academy, then add members and assign their roles.",
    },
    {
        num: "3",
        title: "Build the year",
        text: "Create a semester, add courses, schedule classes, and send the invites.",
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
        <div className="landing" style={{ position: "relative", minHeight: "100vh" }}>
            <div className="bg-grid" />

            <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
                <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                    <Logo markSize={36} fontSize="1.25rem" />
                </Link>
                <div className="landing-links">
                    <a href="#product">Product</a>
                    <a href="#workflow">Workflow</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Create free account</Link>
                </div>
            </nav>

            <section style={{ paddingTop: "9rem", paddingBottom: "4rem", position: "relative", zIndex: 1 }}>
                <div className="container hero-grid">
                    <div>
                        <div className="kicker fade-in">For schools and academies</div>
                        <h1 className="hero-h1 font-display fade-in-delay-1">
                            Run the academic year from <em>one dashboard.</em>
                        </h1>
                        <p className="hero-sub fade-in-delay-2">
                            EduTracker holds your organization, semesters, courses, and classes in one place.
                            Add members with roles, send invites, and control every active session from your profile.
                        </p>
                        <div className="fade-in-delay-2">
                            <HeroStart />
                            <a href="#workflow" className="hero-secondary-link">
                                See how it works
                            </a>
                        </div>
                        <div className="proof-strip fade-in-delay-2">
                            <span className="proof-label">Roles modeled</span>
                            <ul>{ROLES.map((r) => <li key={r}>{r}</li>)}</ul>
                        </div>
                    </div>
                    <DashboardMockup />
                </div>
            </section>

            <section style={{ position: "relative", zIndex: 1, paddingBottom: "5rem" }}>
                <div className="container">
                    <div className="panel-section">
                        <div className="split-head">
                            <div>
                                <div className="kicker">What it holds</div>
                                <h2 className="section-h2 font-display">
                                    One record of the year, from the first invite to the last class.
                                </h2>
                            </div>
                            <p className="split-head-note">
                                EduTracker models the structure your office already runs on, so the
                                dashboard matches your paperwork instead of asking you to rebuild it.
                            </p>
                        </div>

                        <div className="strip-grid">
                            {STRIP.map((s) => (
                                <div key={s.title} className="strip-cell">
                                    <div className="strip-icon"><s.Icon /></div>
                                    <h3 className="strip-title">{s.title}</h3>
                                    <p className="strip-text">{s.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id="product" className="section" style={{ position: "relative", zIndex: 1, paddingTop: "2rem" }}>
                <div className="container">
                    <div className="section-head">
                        <div className="kicker">01 / Product</div>
                        <h2 className="section-h2 font-display">The whole year, in one system.</h2>
                        <p className="section-sub">
                            The structure your office already uses, modeled directly in software.
                        </p>
                    </div>

                    <div className="bento-grid">
                        <div className="bento-cell span-6">
                            <div className="bento-icon"><StructureIcon /></div>
                            <h3 className="bento-title">Build the academic structure</h3>
                            <p className="bento-text">
                                Create a semester, break it into terms, add courses from your catalog,
                                and schedule the classes that belong to each term. The dashboard always
                                reflects the current shape of your year.
                            </p>
                            <HierarchyTree />
                        </div>
                        <div className="bento-cell span-2">
                            <div className="bento-icon"><MembersIcon /></div>
                            <h3 className="bento-title">Run membership with roles</h3>
                            <p className="bento-text">
                                Add people to an organization and assign owner, moderator, member, admin,
                                teacher, or student roles. Pending invites wait in the dashboard until
                                they are accepted or rejected.
                            </p>
                        </div>
                        <div className="bento-cell span-2">
                            <div className="bento-icon"><SessionIcon /></div>
                            <h3 className="bento-title">Control every session</h3>
                            <p className="bento-text">
                                Your profile lists each active sign in. Revoke a single session
                                or end all others at once.
                            </p>
                        </div>
                        <div className="bento-cell span-2">
                            <div className="bento-icon"><ShieldIcon /></div>
                            <h3 className="bento-title">Protected by default</h3>
                            <p className="bento-text">
                                Session-based sign in, encrypted storage, and hashed credentials
                                on every account.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="workflow" className="section workflow-band" style={{ position: "relative", zIndex: 1 }}>
                <div className="container">
                    <div className="section-head">
                        <div className="kicker">02 / Workflow</div>
                        <h2 className="section-h2 font-display">From sign up to first class in three steps.</h2>
                    </div>

                    <div className="step-grid">
                        {STEPS.map((item) => (
                            <div key={item.num} className="step">
                                <div className="step-num">{item.num}</div>
                                <h3 className="step-title">{item.title}</h3>
                                <p className="step-text">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section
                className="section landing-cta"
                style={{ position: "relative", zIndex: 1 }}
            >
                <div className="container cta-split">
                    <div>
                        <div className="kicker">Get started</div>
                        <h2 className="section-h2 font-display">Set up your first semester today.</h2>
                        <p className="section-sub">
                            Create an account and add your organization. The dashboard guides the rest.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-start" }}>
                        <Link to="/register" className="btn btn-primary btn-xl">
                            Create free account
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-xl">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="landing-footer" style={{ position: "relative", zIndex: 1, padding: "3.5rem 0 2.5rem" }}>
                <div className="container">
                    <div className="footer-grid">
                        <div>
                            <div style={{ marginBottom: "0.6rem" }}>
                                <Logo markSize={28} fontSize="1rem" />
                            </div>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", maxWidth: 260, lineHeight: 1.6 }}>
                                One dashboard for the academic year.
                            </p>
                        </div>
                        <div className="footer-col">
                            <h4>Product</h4>
                            <a href="#product">Overview</a>
                            <a href="#workflow">Workflow</a>
                        </div>
                        <div className="footer-col">
                            <h4>Account</h4>
                            <Link to="/register">Create account</Link>
                            <Link to="/login">Sign in</Link>
                            <Link to="/portal-login">Portal sign in</Link>
                        </div>
                    </div>
                    <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            © 2026 EduTracker.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
