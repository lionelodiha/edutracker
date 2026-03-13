import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    const navItems = [
        { to: "/dashboard", icon: "📊", label: "Dashboard", end: true },
        { to: "/dashboard/organizations", icon: "🏫", label: "Organizations", end: false },
        { to: "/dashboard/profile", icon: "👤", label: "Profile", end: false },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Sidebar */}
            <aside
                className="sidebar"
                style={{
                    width: 260,
                    padding: "1.25rem 0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    zIndex: 50,
                }}
            >
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0 0.5rem", marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "var(--grad-brand)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: "0.88rem", color: "#fff",
                        }}
                    >
                        E
                    </div>
                    <span style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.02em" }}>EduTracker</span>
                </div>

                {/* Navigation */}
                <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "0 0.25rem" }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                        >
                            <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User card */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0 0.25rem", marginBottom: "0.75rem" }}>
                        <div
                            style={{
                                width: 34, height: 34, borderRadius: 9,
                                background: "var(--grad-brand)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: "0.8rem", color: "#fff", flexShrink: 0,
                            }}
                        >
                            {user?.firstName?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div style={{ overflow: "hidden", flex: 1 }}>
                            <div style={{ fontSize: "0.84rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>@{user?.userName}</div>
                        </div>
                    </div>
                    <button
                        className="btn btn-ghost btn-sm btn-full"
                        onClick={handleLogout}
                        style={{ justifyContent: "flex-start", gap: "0.6rem", color: "var(--text-secondary)" }}
                    >
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, marginLeft: 260, padding: "2rem 2.5rem", minHeight: "100vh" }}>
                <Outlet />
            </main>
        </div>
    );
}
