import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/LogoLockup";
import "./LandingPage.css";

function Icon({ name, size = 20 }: { name: "grid" | "people" | "book" | "arrow" | "check" | "shield"; size?: number }) {
    const paths = {
        grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
        people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0112 0v3M16 5a3 3 0 010 6M21 21v-3a6 6 0 00-3-5" /></>,
        book: <><path d="M12 5v16M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-2-1-6-2-10 1Z" /></>,
        arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const previewTabs = ["Overview", "Academic year", "Members"] as const;
type PreviewTab = typeof previewTabs[number];

function ProductPreview() {
    const [tab, setTab] = useState<PreviewTab>("Overview");
    return <div className="lp-preview-wrap" id="preview">
        <div className="lp-preview-label"><span><span className="lp-status-dot" /> A little less admin. A lot more clarity.</span><span>EXPLORE THE PREVIEW ↘</span></div>
        <div className="lp-preview">
            <aside className="lp-sidebar">
                <Logo markSize={27} fontSize="1.08rem" color="var(--lp-ink)" markFill="var(--lp-accent)" />
                <div className="lp-school"><span className="lp-school-avatar">R</span><div><strong>Ridgeway Academy</strong><small>School workspace</small></div></div>
                <span className="lp-sidebar-label">WORKSPACE</span>
                <div className="lp-preview-controls" role="group" aria-label="Product preview">
                    {previewTabs.map((item, index) => <button key={item} id={`preview-tab-${index}`} aria-pressed={tab === item} aria-controls="preview-panel" onClick={() => setTab(item)} className={tab === item ? "is-active" : ""}><Icon name={index === 0 ? "grid" : index === 1 ? "book" : "people"} size={17} />{item}</button>)}
                </div>
                <div className="lp-sidebar-bottom"><span className="lp-user-avatar">AO</span><div><strong>Alex Ojo</strong><small>Organization owner</small></div></div>
            </aside>
            <div key={tab} className="lp-preview-main" id="preview-panel" role="region" aria-labelledby={`preview-tab-${previewTabs.indexOf(tab)}`}>
                <div className="lp-preview-top"><span>Workspace <span>/</span> <strong>{tab}</strong></span><span className="lp-demo-badge">Sample workspace</span></div>
                <div className="lp-preview-heading"><div><span className="lp-overline">2026 / 2027 ACADEMIC YEAR</span><h3>{tab === "Overview" ? "A clear view of your school." : tab === "Academic year" ? "Your year, beautifully organized." : "The right people. The right access."}</h3><p>{tab === "Overview" ? "Your people, courses, and classes. All together." : tab === "Academic year" ? "From the first term to the last class." : "A shared workspace with a role for everyone."}</p></div><span className="lp-term-badge"><span className="lp-status-dot" /> Autumn term</span></div>
                <div className="lp-metrics">{[{ icon: "people", label: "Members", value: "128", note: "Connected in one place" }, { icon: "book", label: "Courses", value: "12", note: "Across your academic year" }, { icon: "grid", label: "Classes", value: "24", note: "Organized and ready" }].map(item => <div key={item.label}><span><Icon name={item.icon as "people" | "book" | "grid"} size={16} />{item.label}</span><strong>{item.value}<small>{item.note}</small></strong></div>)}</div>
                <div className="lp-preview-table"><div className="lp-table-heading"><h4>{tab === "Members" ? "Your team" : tab === "Academic year" ? "Academic structure" : "Your courses"}</h4><span>{tab === "Members" ? "MEMBERS & ROLES" : "AUTUMN · 2026"}</span></div>
                    <div className="lp-table-columns"><span>{tab === "Members" ? "Name" : tab === "Academic year" ? "Session / term" : "Course name"}</span><span>{tab === "Members" ? "Role" : "Details"}</span><span>Status</span></div>
                    {(tab === "Members" ? [ ["AO", "Alex Ojo", "Organization owner", "Owner", "Joined"], ["SW", "Sarah Williams", "Teaching team", "Teacher", "Joined"], ["JD", "James Davis", "Teaching team", "Teacher", "Invited"] ] : tab === "Academic year" ? [["01", "First term", "2026 / 2027", "Autumn term", "Active"], ["02", "Second term", "2026 / 2027", "Spring term", "Upcoming"], ["03", "Third term", "2026 / 2027", "Summer term", "Upcoming"]] : [["MA", "Further Algebra", "MATH-201", "8 classes", "Active"], ["EN", "English Literature", "ENG-102", "6 classes", "Active"], ["PH", "Applied Physics", "PHY-201", "10 classes", "Active"]]).map((row, index) => <div className="lp-table-row" key={row[0]}><div><span className={`lp-course-icon lp-tone-${index}`}>{row[0]}</span><span><strong>{row[1]}</strong><small>{row[2]}</small></span></div><span>{row[3]}</span><span className={`lp-row-status ${row[4] === "Upcoming" || row[4] === "Invited" ? "is-pending" : ""}`}>{row[4]}</span></div>)}
                </div>
            </div>
        </div>
        <p className="lp-preview-caption">An interactive illustration with sample data. Your workspace starts with you.</p>
    </div>;
}

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (!root || !("IntersectionObserver" in window)) return;

        const targets = root.querySelectorAll<HTMLElement>(
            ".lp-section-heading, .lp-feature, .lp-centered-heading, .lp-steps article, .lp-cta, .lp-audience",
        );
        const reveal = (element: HTMLElement) => {
            element.classList.remove("lp-reveal-pending");
            element.classList.add("lp-revealed");
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                reveal(entry.target as HTMLElement);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08 });

        if (!preference.matches) {
            targets.forEach((element) => {
                // Leave initially visible content alone; animate only upcoming sections.
                if (element.getBoundingClientRect().top >= window.innerHeight) {
                    element.classList.add("lp-reveal-pending");
                    observer.observe(element);
                }
            });
        }
        const showAll = () => {
            if (!preference.matches) return;
            observer.disconnect();
            targets.forEach(reveal);
        };
        const showFocused = (event: FocusEvent) => {
            if (!(event.target instanceof Element)) return;
            const section = event.target.closest<HTMLElement>(".lp-reveal-pending");
            if (section) {
                reveal(section);
                observer.unobserve(section);
            }
        };
        preference.addEventListener("change", showAll);
        root.addEventListener("focusin", showFocused);
        return () => {
            observer.disconnect();
            preference.removeEventListener("change", showAll);
            root.removeEventListener("focusin", showFocused);
            targets.forEach((element) => element.classList.remove("lp-reveal-pending", "lp-revealed"));
        };
    }, []);

    useEffect(() => {
        const root = rootRef.current;
        const enabled = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
        if (!root) return;
        const surfaces = root.querySelectorAll<HTMLElement>(".lp-hero, .lp-preview-wrap, .lp-feature, .lp-cta");
        const cleanups = Array.from(surfaces, (surface) => {
            let frame = 0;
            const reset = () => {
                cancelAnimationFrame(frame);
                surface.style.removeProperty("--pointer-x");
                surface.style.removeProperty("--pointer-y");
                surface.style.removeProperty("--tilt-x");
                surface.style.removeProperty("--tilt-y");
                surface.classList.remove("lp-pointer-active");
            };
            const move = (event: PointerEvent) => {
                if (!enabled.matches || event.pointerType !== "mouse") return;
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(() => {
                    const bounds = surface.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
                    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
                    surface.style.setProperty("--pointer-x", `${x * 100}%`);
                    surface.style.setProperty("--pointer-y", `${y * 100}%`);
                    surface.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
                    surface.style.setProperty("--tilt-y", `${(x - 0.5) * 5}deg`);
                    surface.classList.add("lp-pointer-active");
                });
            };
            surface.addEventListener("pointermove", move, { passive: true });
            surface.addEventListener("pointerleave", reset);
            surface.addEventListener("pointercancel", reset);
            enabled.addEventListener("change", reset);
            return () => {
                reset();
                surface.removeEventListener("pointermove", move);
                surface.removeEventListener("pointerleave", reset);
                surface.removeEventListener("pointercancel", reset);
                enabled.removeEventListener("change", reset);
            };
        });
        return () => cleanups.forEach((cleanup) => cleanup());
    }, []);
    return <div className="lp" ref={rootRef}>
        <a className="lp-skip" href="#main">Skip to content</a>
        <header className="lp-header"><nav className="lp-shell lp-nav" aria-label="Main navigation">
            <Link to="/" aria-label="EduTracker home"><Logo markSize={34} fontSize="1.35rem" color="var(--lp-ink)" markFill="var(--lp-accent)" /></Link>
            <div className="lp-desktop-links"><a href="#product">Product</a><a href="#workflow">How it works</a><Link to="/portal-login">Student & teacher portal <span>↗</span></Link></div>
            <div className="lp-nav-actions"><Link to="/login" className="lp-signin">Sign in</Link><Link to="/register" className="lp-button lp-button-small">Get started <Icon name="arrow" size={16} /></Link><button className="lp-menu-toggle" aria-expanded={menuOpen} aria-controls="landing-mobile-menu" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "✕" : "☰"}</button></div>
        </nav>{menuOpen && <nav className="lp-mobile-menu" id="landing-mobile-menu" aria-label="Mobile navigation"><a href="#product" onClick={() => setMenuOpen(false)}>Product</a><a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a><Link to="/portal-login">Student & teacher portal</Link><Link to="/login">Sign in</Link></nav>}</header>
        <main id="main">
            <section className="lp-hero lp-shell" aria-labelledby="hero-title"><div className="lp-hero-art" aria-hidden="true"><span className="lp-orbit lp-orbit-one" /><span className="lp-orbit lp-orbit-two" /><span className="lp-orbit lp-orbit-three" /><span className="lp-grid-plane" /></div><div className="lp-eyebrow"><span className="lp-status-dot" /> A little structure. A world of possibility.</div><h1 id="hero-title">Your school, in sync.<br /><span>Your year, in focus.</span></h1><p className="lp-hero-description">Bring your people, courses, and academic year together.<br className="lp-desktop-break" /> One thoughtful workspace for everything that comes next.</p><div className="lp-hero-actions"><Link to="/register" className="lp-button">Create your account <Icon name="arrow" size={18} /></Link><a href="#preview" className="lp-button lp-button-secondary"><span className="lp-play" aria-hidden="true">▷</span> Explore the workspace</a></div><p className="lp-hero-note"><Icon name="check" size={14} /> Built for schools, academies, and the people behind them.</p><ProductPreview /></section>
            <section className="lp-audience lp-shell" aria-label="Who EduTracker is for"><p>ONE WORKSPACE. EVERY PART OF YOUR SCHOOL.</p><div><span>School administrators</span><span className="lp-audience-dot">·</span><span>Academic teams</span><span className="lp-audience-dot">·</span><span>Teachers & students</span></div></section>
            <section className="lp-features lp-shell" id="product" aria-labelledby="features-title"><div className="lp-section-heading"><div><span className="lp-overline">LESS BUSYWORK. MORE BIG PICTURE.</span><h2 id="features-title">Everything connected.<br /><span>Nothing lost in the shuffle.</span></h2></div><p>Give your academic year a home. Keep the structure clear, your team connected, and the details within reach.</p></div>
                <div className="lp-feature-grid"><article className="lp-feature lp-feature-wide"><span className="lp-feature-symbol"><Icon name="book" size={24} /></span><h3>A place for every part of the year.</h3><p>Connect sessions, terms, courses, and classes in one clear structure. See how every piece fits together.</p><div className="lp-structure" aria-label="Academic hierarchy"><div><span>01</span> Ridgeway Academy <small>Organization</small></div><div><span>02</span> 2026 / 2027 <small>Session</small></div><div><span>03</span> Autumn <small>Term</small></div><div><span>04</span> Further Algebra <small>Course</small></div><div><span>05</span> Monday · Period 4 <small>Class</small></div></div></article>
                    <article className="lp-feature"><span className="lp-feature-symbol"><Icon name="people" size={24} /></span><h3>Your people, brought together.</h3><p>Invite your team and assign roles. Give everyone a place in your organization, from the office to the classroom.</p><div className="lp-role-list">{["Owner", "Moderator", "Member", "Admin", "Teacher", "Student"].map(role => <span key={role}>{role}</span>)}</div><div className="lp-feature-divider" /><span className="lp-feature-symbol"><Icon name="shield" size={24} /></span><h3>Stay in control of your account.</h3><p>See your active sign-ins in one place. End a single session or sign out of all other devices from your profile.</p></article></div>
            </section>
            <section className="lp-workflow" id="workflow" aria-labelledby="workflow-title"><div className="lp-shell"><div className="lp-centered-heading"><span className="lp-overline">A FRESH START, WITHOUT THE FRICTION</span><h2 id="workflow-title">From your first sign-in<br />to your next school year.</h2></div><div className="lp-steps">{[{ title: "Make yourself at home", text: "Create your account. Your dashboard is the starting point for everything ahead." }, { title: "Bring your school together", text: "Add your organization, invite your people, and give everyone the right role." }, { title: "Give your year some structure", text: "Set up sessions, add courses, and organize the classes that bring it all to life." }].map((step, index) => <article key={step.title}><span className="lp-step-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>
            <section className="lp-shell lp-cta"><div><span className="lp-overline">YOUR NEXT CHAPTER STARTS HERE</span><h2>A more organized year<br />is a few clicks away.</h2><p>Make space for what school is really about.</p></div><Link to="/register" className="lp-button">Let’s get started <Icon name="arrow" /></Link><span className="lp-cta-decoration" aria-hidden="true">↗</span></section>
        </main>
        <footer className="lp-footer lp-shell"><div><Logo markSize={28} color="var(--lp-ink)" markFill="var(--lp-accent)" /><p>A little clarity for every school day.</p></div><nav aria-label="Footer navigation"><a href="#product">Product</a><a href="#workflow">How it works</a><Link to="/portal-login">Portal sign in</Link></nav><small>© {new Date().getFullYear()} EduTracker</small></footer>
    </div>;
}
