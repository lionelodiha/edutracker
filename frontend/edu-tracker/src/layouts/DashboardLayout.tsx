import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HomeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" />
            <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function LogOutIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,18 15,12 9,6" />
        </svg>
    );
}

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    const navItems = [
        { to: "/dashboard", icon: <HomeIcon />, label: "Dashboard", end: true },
        { to: "/dashboard/organizations", icon: <BuildingIcon />, label: "Organizations", end: false },
        { to: "/dashboard/profile", icon: <UserIcon />, label: "Profile", end: false },
    ];

    const currentPage = navItems.find((item) =>
        item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
    );

    const initials = user?.firstName
        ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase()
        : (user?.userName?.charAt(0) || "U").toUpperCase();

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Sidebar */}
            <aside
                className="sidebar"
                style={{
                    width: 256,
                    display: "flex",
                    flexDirection: "column",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    zIndex: 50,
                    overflowY: "auto",
                }}
            >
                {/* Logo */}
                <div style={{ padding: "1.375rem 1.25rem 1.125rem", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                            style={{
                                width: 38, height: 38, borderRadius: 11,
                                background: "var(--grad-brand)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, fontSize: "1rem", color: "#fff",
                                boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
                                flexShrink: 0,
                            }}
                        >
                            E
                        </div>
                        <div>
                            <div style={{ fontSize: "0.97rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                                EduTracker
                            </div>
                            <div style={{ fontSize: "0.59rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.1rem" }}>
                                Platform
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 1.25rem" }} />

                {/* Navigation */}
                <nav style={{ flex: 1, padding: "1.125rem 0.875rem 0.5rem" }}>
                    <div className="nav-section-label" style={{ marginBottom: "0.625rem" }}>Main Menu</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div style={{ padding: "0.75rem 0.875rem 1.25rem", flexShrink: 0 }}>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "0.875rem" }} />
                    <div
                        style={{
                            display: "flex", alignItems: "center", gap: "0.625rem",
                            padding: "0.625rem 0.75rem",
                            borderRadius: "var(--r-md)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            marginBottom: "0.5rem",
                        }}
                    >
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <div
                                style={{
                                    width: 34, height: 34, borderRadius: 9,
                                    background: "var(--grad-brand)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 700, fontSize: "0.8rem", color: "#fff",
                                    boxShadow: "0 2px 10px rgba(99,102,241,0.4)",
                                }}
                            >
                                {initials}
                            </div>
                            <div
                                style={{
                                    position: "absolute", bottom: -1, right: -1,
                                    width: 9, height: 9, borderRadius: "50%",
                                    background: "#22c55e",
                                    border: "2px solid #0a0b0f",
                                }}
                            />
                        </div>
                        <div style={{ overflow: "hidden", flex: 1 }}>
                            <div style={{ fontSize: "0.81rem", fontWeight: 600, color: "rgba(255,255,255,0.88)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.28)" }}>
                                @{user?.userName}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="sidebar-link sidebar-link-logout"
                        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    >
                        <LogOutIcon />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, marginLeft: 256, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                {/* Topbar */}
                <header className="dash-topbar">
                    {/* Breadcrumb */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>
                            Dashboard
                        </span>
                        {currentPage && currentPage.label !== "Dashboard" && (
                            <>
                                <ChevronRightIcon />
                                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                                    {currentPage.label}
                                </span>
                            </>
                        )}
                        {currentPage?.label === "Dashboard" && (
                            <>
                                <ChevronRightIcon />
                                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                                    Overview
                                </span>
                            </>
                        )}
                    </div>

                    {/* Right side actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* Search */}
                        <div
                            style={{
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.45rem 0.875rem",
                                background: "var(--bg-input)", border: "1px solid var(--border)",
                                borderRadius: "var(--r-md)", color: "var(--text-muted)",
                                fontSize: "0.8rem", cursor: "text",
                                width: 180,
                            }}
                        >
                            <SearchIcon />
                            <span>Search…</span>
                        </div>

                        {/* Notification bell */}
                        <button
                            style={{
                                width: 36, height: 36,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: "var(--bg-input)", border: "1px solid var(--border)",
                                borderRadius: "var(--r-md)", cursor: "pointer",
                                color: "var(--text-secondary)",
                                position: "relative",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                        >
                            <BellIcon />
                        </button>

                        {/* User avatar */}
                        <div
                            style={{
                                width: 36, height: 36, borderRadius: 9,
                                background: "var(--grad-brand)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: "0.78rem", color: "#fff",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                            }}
                        >
                            {initials}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: "2rem 2.5rem", maxWidth: 1280, width: "100%" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
