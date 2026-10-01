import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "./LogoLockup";
import "./AuthShell.css";

export default function AuthShell({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
    const registering = mode === "register";
    return <div className={`auth-scene auth-scene-${mode}`}>
        <header className="auth-topbar">
            <Link to="/" aria-label="EduTracker home"><Logo markSize={34} fontSize="1.3rem" markFill="#8b5cf6" color="#f1f5f9" /></Link>
            <Link to="/" className="auth-back"><span aria-hidden="true">←</span> Back to home</Link>
        </header>
        <main className="auth-stage">
            <section className="auth-story" aria-labelledby="auth-story-title">
                <span className="auth-kicker"><i /> YOUR SCHOOL. ALL TOGETHER.</span>
                <h1 id="auth-story-title">{registering ? "A new chapter." : "Less catching up."}<br /><em>{registering ? "A clearer year." : "More moving forward."}</em></h1>
                <p>{registering ? "Give your people, courses, and classes a place to come together. Your school’s next chapter starts here." : "Pick up where you left off. Your people, your classes, and your academic year are right here."}</p>
                <div className="auth-illustration" aria-hidden="true">
                    <div className="auth-orbit" /><div className="auth-orbit auth-orbit-second" />
                    <div className="auth-workspace-card">
                        <div className="auth-workspace-top"><span className="auth-school-mark">R</span><div><strong>Ridgeway Academy</strong><small>YOUR CONNECTED WORKSPACE</small></div><span className="auth-online" /></div>
                        <div className="auth-year"><span>Academic year</span><strong>2026 / 2027 <span>↗</span></strong></div>
                        <div className="auth-mini-grid"><div><span>01</span><strong>People</strong><small>A place for everyone</small></div><div><span>02</span><strong>Courses</strong><small>Everything connected</small></div><div><span>03</span><strong>Classes</strong><small>A clear way forward</small></div></div>
                        <div className="auth-mini-footer"><span className="auth-avatars"><i>AO</i><i>SW</i><i>JD</i></span><span>One team. One workspace.</span></div>
                    </div>
                    <span className="auth-floating-note"><span>✓</span> A little structure. A lot of clarity.</span>
                </div>
                <div className="auth-story-footer"><span>ORGANIZE</span><i /><span>CONNECT</span><i /><span>MOVE FORWARD</span></div>
            </section>
            <section className="auth-form-panel" aria-labelledby="auth-form-title">
                <div className="auth-form-heading"><span className="auth-kicker">{registering ? "LET’S GET YOU SET UP" : "GOOD TO SEE YOU AGAIN"}</span><h2 id="auth-form-title">{registering ? "Create your account." : "Welcome back."}</h2><p>{registering ? "A little about you. Then you’re ready to begin." : "Sign in and make room for what matters."}</p></div>
                {children}
                <p className="auth-switch">{registering ? "Already have an account?" : "New to EduTracker?"} <Link to={registering ? "/login" : "/register"}>{registering ? "Sign in" : "Create an account"} <span aria-hidden="true">↗</span></Link></p>
                <div className="auth-portal-note"><span>Here as a student or teacher?</span><Link to="/portal-login">Go to your portal <span aria-hidden="true">→</span></Link></div>
            </section>
        </main>
        <footer className="auth-bottom"><span>© {new Date().getFullYear()} EduTracker</span><span>A little clarity for every school day.</span></footer>
    </div>;
}
