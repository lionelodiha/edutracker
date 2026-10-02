/**
 * Shell for the three portals: students, teaching staff and non-teaching
 * staff. Loads the signed-in person's portal once, shares it with every page
 * through the outlet context, and runs class reminders in the background.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import Wordmark from "../../components/Wordmark";
import { BellIcon, CalendarIcon, HomeIcon, LogOutIcon, UserIcon } from "../../components/icons";
import { useToast } from "../../components/Toast";
import { clearPortalSession, portalApi, PortalApiError, readPortalSession } from "./api";
import { portalHome, portalSignIn, useClassReminders, type PortalContext } from "./helpers";
import type { PortalPayload, PortalRole } from "./types";
import "../../layouts/Dashboard.css";
import "../../styles/workspace.css"; // toasts
import "../academics/academics.css";
import "./portal.css";

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ClockIcon = () => <Svg><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>;
const ClipboardIcon = () => <Svg><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></Svg>;
const ChartIcon = () => <Svg><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Svg>;
const BookIcon = () => <Svg><path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z" /><path d="M20 17v5H6.5A2.5 2.5 0 014 19.5" /></Svg>;
const UploadIcon = () => <Svg><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></Svg>;
const TasksIcon = () => <Svg><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12l3 3 5-6" /></Svg>;

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean; badge?: number };

function navFor(role: PortalRole, unread: number, todo: number): NavItem[] {
  const bell = { to: "notifications", label: "Notifications", icon: <BellIcon />, badge: unread };
  const profile = { to: "profile", label: "Profile", icon: <UserIcon /> };
  if (role === "Student") return [
    { to: "", label: "Overview", icon: <HomeIcon />, end: true },
    { to: "timetable", label: "Timetable", icon: <ClockIcon /> },
    { to: "coursework", label: "Coursework", icon: <ClipboardIcon />, badge: todo },
    { to: "results", label: "Results", icon: <ChartIcon /> },
    bell, profile,
  ];
  if (role === "Teaching") return [
    { to: "", label: "Overview", icon: <HomeIcon />, end: true },
    { to: "timetable", label: "Timetable", icon: <ClockIcon /> },
    { to: "classes", label: "My classes", icon: <BookIcon /> },
    { to: "results", label: "Result upload", icon: <UploadIcon /> },
    bell, profile,
  ];
  return [
    { to: "", label: "Overview", icon: <HomeIcon />, end: true },
    { to: "roster", label: "Duty roster", icon: <ClockIcon /> },
    { to: "leave", label: "Leave", icon: <CalendarIcon /> },
    { to: "tasks", label: "Tasks", icon: <TasksIcon />, badge: todo },
    { ...bell, label: "Notices" }, profile,
  ];
}

const ROLE_LABEL: Record<PortalRole, string> = { Student: "Student", Teaching: "Teaching staff", NonTeaching: "Non-teaching staff" };

export default function PortalLayout({ role }: { role: PortalRole }) {
  const navigate = useNavigate();
  const { schoolId = "" } = useParams();
  // A portal session only counts for the school it was made in.
  const [session] = useState(() => {
    const saved = readPortalSession();
    return saved?.organizationId === schoolId ? saved : null;
  });
  const signInPath = portalSignIn(schoolId);
  const [data, setData] = useState<PortalPayload | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const { toast, show } = useToast(5200);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      setData(await portalApi.me(session));
      setError("");
    } catch (cause) {
      if (cause instanceof PortalApiError && cause.status === 401) { clearPortalSession(); navigate(signInPath, { replace: true }); return; }
      setError(cause instanceof Error ? cause.message : "Could not load your portal.");
    }
  }, [session, navigate, signInPath]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh() is async; state lands after the fetch.
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const timetable = data && data.role !== "NonTeaching" ? data.timetable : EMPTY;
  useClassReminders(timetable, now, text => show(text));

  if (!session) return <Navigate to={signInPath} replace />;
  // A person who opens the wrong area's link lands in their own.
  if (data && data.role !== role) return <Navigate to={portalHome(schoolId, data.role)} replace />;

  const base = portalHome(schoolId, role);
  const unread = data?.notifications.filter(item => !item.readAt).length ?? 0;
  const name = data ? `${"title" in data.profile && data.profile.title ? `${data.profile.title} ` : ""}${data.profile.fullName}` : "";
  const initials = data ? data.profile.fullName.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase() : "";

  function signOut() {
    clearPortalSession();
    navigate(signInPath);
  }
  const context: PortalContext | null = data ? { data, session, base, now, refresh, signOut, notify: show } : null;

  // Badge on the tab people act on most: coursework to do, or open tasks.
  const todo = !data ? 0 : data.role === "Student" ? data.coursework.filter(item => item.state === "Open" || item.state === "Overdue").length
    : data.role === "NonTeaching" ? data.tasks.filter(task => task.status !== "Done").length : 0;
  const nav = navFor(role, unread, todo);
  // Phones get a bottom tab bar: the four main areas plus the profile.
  const tabs = [...nav.filter(item => item.to !== "notifications" && item.to !== "profile").slice(0, 4), { ...nav.find(item => item.to === "profile")!, label: "Me" }];
  const href = (item: NavItem) => (item.to ? `${base}/${item.to}` : base);

  return (
    <div className="dz-scope pt-app">
      <aside className="pt-rail">
        <Link to={base} className="pt-rail-brand" aria-label="Portal home">
          <Wordmark fontSize="1.5rem" />
          <span><strong>{data?.organization.name ?? "School portal"}</strong><small>{ROLE_LABEL[role]}</small></span>
        </Link>
        <nav aria-label="Portal" className="pt-rail-nav">
          {nav.map(item => (
            <NavLink key={item.to} to={href(item)} end={item.end} className={({ isActive }) => `pt-rail-link${isActive ? " active" : ""}`}>
              {item.icon}<span>{item.label}</span>
              {item.badge ? <span className="pt-nav-badge" aria-label={`${item.badge} unread`}>{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
        {data && <div className="pt-rail-user">
          <span className="pt-avatar" aria-hidden="true">{initials}</span>
          <span className="pt-rail-user-meta"><strong>{name}</strong><small>{ROLE_LABEL[role]}</small></span>
          <button type="button" className="pt-icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOutIcon /></button>
        </div>}
      </aside>

      <div className="pt-main">
        <header className="pt-appbar">
          <Link to={base} className="pt-appbar-brand" aria-label="Portal home">
            <Wordmark fontSize="1.25rem" />
            <span>{data?.organization.name ?? "School portal"}</span>
          </Link>
          <span className="pt-appbar-spacer" />
          <Link to={`${base}/notifications`} className="pt-icon-btn" aria-label={`Notifications (${unread} unread)`} title="Notifications">
            <BellIcon />
            {unread > 0 && <span className="pt-icon-dot">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          {data && <Link to={`${base}/profile`} className="pt-avatar pt-appbar-avatar" aria-label="Your profile">{initials}</Link>}
        </header>

        <main className="pt-content">
          {error && !data ? (
            <section className="dz-card ac-empty" role="alert">
              <h2>Couldn't load your portal</h2>
              <p>{error}</p>
              <div className="ac-actions"><button className="dz-btn-green" onClick={() => void refresh()}>Try again</button><button className="dz-btn-outline" onClick={signOut}>Sign out</button></div>
            </section>
          ) : context ? <Outlet context={context} /> : (
            <div className="pt-loading" aria-busy="true" aria-label="Loading">
              <div className="skeleton" style={{ height: 180, borderRadius: 18 }} />
              <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
              <div className="skeleton" style={{ height: 240, borderRadius: 14 }} />
            </div>
          )}
        </main>
      </div>

      <nav className="pt-tabbar" aria-label="Portal sections">
        {tabs.map(item => (
          <NavLink key={item.to} to={href(item)} end={item.end} className={({ isActive }) => `pt-tab${isActive ? " active" : ""}`}>
            <span className="pt-tab-icon">{item.icon}{item.badge ? <span className="pt-tab-badge" aria-label={`${item.badge} to do`}>{item.badge}</span> : null}</span><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {toast}
    </div>
  );
}

const EMPTY: never[] = [];
