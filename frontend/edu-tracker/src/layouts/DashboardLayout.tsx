import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/LogoLockup";
import { DashboardDataProvider, useDashboardData } from "./DashboardData";
import "./Dashboard.css";

/* ─── Icons (inline SVG, no emoji) ─── */

function HomeIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" />
            <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function LogOutIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

/* Only destinations that actually exist — no placeholder links. */
const NAV_ITEMS = [
    { to: "/dashboard", icon: <HomeIcon />, label: "Dashboard", end: true },
    { to: "/dashboard/organizations", icon: <BuildingIcon />, label: "Organizations", end: false },
    { to: "/dashboard/profile", icon: <UserIcon />, label: "Profile", end: false },
];

function DashboardShell() {
    const { user, logout } = useAuth();
    const { invites, searchQuery, setSearchQuery } = useDashboardData();

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    const displayName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "Account";
    const initials = user?.firstName
        ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase()
        : (user?.userName?.charAt(0) || "U").toUpperCase();

    return (
        <div className="dz-scope dz-shell">
            {/* Sidebar */}
            <aside className="dz-sidebar">
                <div style={{ padding: "1.4rem 1.25rem 1.1rem" }}>
                    <Logo markSize={34} markFill="#8b5cf6" fontSize="1.15rem" color="#f1f5f9" />
                </div>

                <nav style={{ flex: 1, padding: "0.5rem 0.75rem" }}>
                    <div className="dz-nav-label">Menu</div>
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `dz-nav-link ${isActive ? "active" : ""}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: "0.75rem" }}>
                    <div
                        style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            padding: "0.7rem 0.8rem",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                            <div className="dz-avatar" style={{ width: 34, height: 34, fontSize: "0.78rem" }}>
                                {initials}
                            </div>
                            <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {displayName}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    @{user?.userName}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="dz-pill-btn"
                            style={{ width: "100%", justifyContent: "center" }}
                        >
                            <LogOutIcon />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="dz-main">
                <header className="dz-topbar">
                    <label className="dz-search">
                        <SearchIcon />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search organizations"
                            aria-label="Search organizations"
                        />
                        <kbd>&#8984; F</kbd>
                    </label>

                    <div style={{ flex: 1 }} />

                    <Link
                        to="/dashboard#invites"
                        className="dz-icon-btn"
                        aria-label={`Pending invites (${invites.length})`}
                        title="Pending invites"
                    >
                        <BellIcon />
                        {invites.length > 0 && (
                            <span className="dz-dot">{invites.length}</span>
                        )}
                    </Link>

                    <Link to="/dashboard/profile" className="dz-user-chip">
                        <div className="dz-avatar" style={{ width: 36, height: 36, fontSize: "0.8rem" }}>
                            {initials}
                        </div>
                        <span className="dz-user-meta">
                            <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.25 }}>
                                {displayName}
                            </span>
                            <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.25 }}>
                                @{user?.userName}
                            </span>
                        </span>
                    </Link>
                </header>

                <nav className="dz-mobile-nav" aria-label="Dashboard">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className="dz-pill-btn"
                            style={({ isActive }) =>
                                isActive
                                    ? { borderColor: "#8b5cf6", color: "#a78bfa", background: "rgba(139,92,246,0.12)" }
                                    : { background: "var(--bg-card)" }
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <main className="dz-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout() {
    return (
        <DashboardDataProvider>
            <DashboardShell />
        </DashboardDataProvider>
    );
}
