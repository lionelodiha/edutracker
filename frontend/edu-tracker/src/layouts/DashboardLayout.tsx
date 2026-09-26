import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/LogoLockup";
import AccountMenu from "../components/AccountMenu";
import { BellIcon, SearchIcon } from "../components/icons";
import { DashboardDataProvider, useDashboardData } from "./DashboardData";
import { isDemoMode } from "../demoMode";
import "./Dashboard.css";

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
        <div className="dz-scope dz-shell dz-shell--top">
            {/* Main */}
            <div className="dz-main dz-main--full">
                <header className="dz-topbar">
                    <Link to="/dashboard" aria-label="EduTracker home" style={{ display: "inline-flex", textDecoration: "none" }}>
                        <Logo markSize={32} markFill="#8b5cf6" fontSize="1.1rem" color="#f1f5f9" />
                    </Link>

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

                    {isDemoMode() && (
                        <span className="dz-demo-indicator" title="Academic, cohort and faculty data is stored in this browser for the demo.">
                            Demo data
                        </span>
                    )}

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

                    <AccountMenu
                        displayName={displayName}
                        userName={user?.userName}
                        initials={initials}
                        onLogout={handleLogout}
                    />
                </header>

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
