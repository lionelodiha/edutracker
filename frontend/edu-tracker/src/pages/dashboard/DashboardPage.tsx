import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    getOrganizationsEndpointHandler,
    getCurrentUserSessionsEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import type { OrganizationListItemResponse, SessionData } from "../../api";

const API_BASE = "http://localhost:3187";

function OrgIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" />
            <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
        </svg>
    );
}

function MonitorIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9,12 11,14 15,10" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12,5 19,12 12,19" />
        </svg>
    );
}

function ExternalIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}

const ORG_COLORS = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#3b82f6,#06b6d4)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)",
    "linear-gradient(135deg,#14b8a6,#3b82f6)",
];

function orgColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return ORG_COLORS[h % ORG_COLORS.length];
}

function StatCard({
    icon,
    label,
    value,
    badge,
    color,
    loading,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    badge?: React.ReactNode;
    color: "indigo" | "green" | "amber";
    loading?: boolean;
}) {
    const colorMap = {
        indigo: { bg: "var(--accent-glow-strong)", stroke: "var(--accent)", border: "rgba(99,102,241,0.18)", top: "#6366f1" },
        green:  { bg: "var(--success-bg)",          stroke: "var(--success)",  border: "rgba(22,163,74,0.15)",   top: "#22c55e" },
        amber:  { bg: "var(--warn-bg)",              stroke: "var(--warn)",     border: "rgba(217,119,6,0.15)",   top: "#f59e0b" },
    };
    const c = colorMap[color];

    return (
        <div
            className="stat-card-v2"
            style={{
                borderTop: `3px solid ${c.top}`,
                borderColor: loading ? "var(--border)" : undefined,
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div
                    className="stat-icon"
                    style={{ background: c.bg }}
                >
                    <span style={{ color: c.stroke, display: "flex" }}>{icon}</span>
                </div>
                {badge && <div>{badge}</div>}
            </div>
            <div>
                {loading ? (
                    <div className="skeleton" style={{ height: 36, width: 60, marginBottom: 6, borderRadius: 8 }} />
                ) : (
                    <div className="stat-value" style={{ fontSize: "2.1rem", marginBottom: "0.1rem" }}>{value}</div>
                )}
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [orgs, setOrgs] = useState<OrganizationListItemResponse[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [orgsLoading, setOrgsLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    useEffect(() => {
        client.setConfig({ baseUrl: API_BASE });

        getOrganizationsEndpointHandler()
            .then((r) => { if (r.data?.data) setOrgs(r.data.data); })
            .catch(() => {})
            .finally(() => setOrgsLoading(false));

        getCurrentUserSessionsEndpointHandler()
            .then((r) => { if (r.data?.data) setSessions(r.data.data); })
            .catch(() => {})
            .finally(() => setSessionsLoading(false));
    }, []);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    };

    const activeSessions = sessions.filter((s) => !s.isRevoked).length;
    const displayName = user?.firstName || user?.userName || "there";
    const initials = user?.firstName
        ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase()
        : (user?.userName?.charAt(0) || "U").toUpperCase();

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* ── Welcome banner ── */}
            <div
                style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(168,85,247,0.05) 100%)",
                    border: "1px solid rgba(99,102,241,0.12)",
                    borderRadius: "var(--r-xl)",
                    padding: "1.75rem 2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div
                        style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: "var(--grad-brand)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: "1.2rem", color: "#fff",
                            boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
                            flexShrink: 0,
                        }}
                    >
                        {initials}
                    </div>
                    <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.2rem" }}>
                            {greeting()}
                        </div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: "0.3rem" }}>
                            {displayName} 👋
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                            Here's what's happening with your account today.
                        </p>
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    <Link to="/dashboard/organizations" className="btn btn-primary btn-sm" style={{ gap: "0.375rem" }}>
                        <PlusIcon />
                        New Organization
                    </Link>
                    <Link to="/dashboard/organizations" className="btn btn-secondary btn-sm" style={{ gap: "0.375rem" }}>
                        View All
                        <ArrowRightIcon />
                    </Link>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <StatCard
                    icon={<OrgIcon />}
                    label="Organizations"
                    value={orgs.length}
                    badge={<span className="badge badge-accent" style={{ fontSize: "0.62rem" }}>Total</span>}
                    color="indigo"
                    loading={orgsLoading}
                />
                <StatCard
                    icon={<MonitorIcon />}
                    label="Active Sessions"
                    value={activeSessions}
                    badge={<span className="badge badge-success" style={{ fontSize: "0.62rem" }}>Live</span>}
                    color="green"
                    loading={sessionsLoading}
                />
                <StatCard
                    icon={<ShieldIcon />}
                    label="Account Role"
                    value={
                        <span style={{ fontSize: "1rem", fontWeight: 700, background: "var(--grad-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            {user?.role || "User"}
                        </span>
                    }
                    color="amber"
                />
            </div>

            {/* ── Organizations ── */}
            <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.125rem" }}>
                    <div>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>My Organizations</h2>
                        {!orgsLoading && orgs.length > 0 && (
                            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                                {orgs.length} organization{orgs.length !== 1 ? "s" : ""} total
                            </p>
                        )}
                    </div>
                    <Link
                        to="/dashboard/organizations"
                        style={{
                            fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600,
                            display: "flex", alignItems: "center", gap: "0.3rem",
                        }}
                    >
                        View all <ArrowRightIcon />
                    </Link>
                </div>

                {orgsLoading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem" }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card" style={{ padding: "1.25rem" }}>
                                <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 11, marginBottom: "0.875rem" }} />
                                <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6, marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 6 }} />
                            </div>
                        ))}
                    </div>
                ) : orgs.length === 0 ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">🏫</div>
                        <div className="empty-state-title">No organizations yet</div>
                        <div className="empty-state-text">Create or join an organization to get started.</div>
                        <Link to="/dashboard/organizations" className="btn btn-primary" style={{ marginTop: "1.125rem" }}>
                            <PlusIcon /> Create Organization
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem" }}>
                        {orgs.slice(0, 6).map((org) => (
                            <Link
                                key={org.organizationId}
                                to={`/dashboard/organizations/${org.organizationId}`}
                                className="card card-clickable"
                                style={{ textDecoration: "none", color: "inherit", padding: "1.25rem" }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                                    <div
                                        style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: orgColor(org.name),
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 800, fontSize: "1.1rem", color: "#fff",
                                            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                                        }}
                                    >
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`badge ${org.status === "Active" ? "badge-success" : "badge-warn"}`}>
                                        {org.status}
                                    </span>
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem", letterSpacing: "-0.01em" }}>
                                    {org.name}
                                </h3>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span className="badge badge-accent">{org.role}</span>
                                    <span style={{ color: "var(--accent)", opacity: 0.5 }}><ExternalIcon /></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Sessions ── */}
            <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.125rem" }}>
                    <div>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>Active Sessions</h2>
                        {!sessionsLoading && sessions.length > 0 && (
                            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                                {activeSessions} active · {sessions.length - activeSessions} revoked
                            </p>
                        )}
                    </div>
                </div>

                {sessionsLoading ? (
                    <div className="card" style={{ padding: "1.25rem" }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "0.625rem 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                                <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 6 }} />
                                <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 6 }} />
                                <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 6 }} />
                                <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 20, marginLeft: "auto" }} />
                            </div>
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">🔐</div>
                        <div className="empty-state-title">No sessions found</div>
                        <div className="empty-state-text">You have no active sessions.</div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Session ID</th>
                                    <th>Created</th>
                                    <th>Expires</th>
                                    <th>Remember Me</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => (
                                    <tr key={s.sessionId}>
                                        <td>
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", background: "var(--bg-input)", padding: "0.2rem 0.5rem", borderRadius: 6 }}>
                                                {s.sessionId.substring(0, 8)}…
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                        <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{new Date(s.expiresAt).toLocaleDateString()}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{s.rememberMe ? "Yes" : "No"}</td>
                                        <td>
                                            <span className={`badge ${s.isRevoked ? "badge-error" : "badge-success"}`}>
                                                {s.isRevoked ? "Revoked" : "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
