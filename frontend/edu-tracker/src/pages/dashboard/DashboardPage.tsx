import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    getOrganizationsEndpointHandler,
    getCurrentUserSessionsEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import type { OrganizationListItemResponse, SessionData } from "../../api";

const API_BASE = "http://localhost:3187";

export default function DashboardPage() {
    const { user } = useAuth();
    const [orgs, setOrgs] = useState<OrganizationListItemResponse[]>([]);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [orgsLoading, setOrgsLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    useEffect(() => {
        client.setConfig({ baseUrl: API_BASE });

        getOrganizationsEndpointHandler()
            .then((r) => {
                if (r.data?.data) setOrgs(r.data.data);
            })
            .catch(() => { })
            .finally(() => setOrgsLoading(false));

        getCurrentUserSessionsEndpointHandler()
            .then((r) => {
                if (r.data?.data) setSessions(r.data.data);
            })
            .catch(() => { })
            .finally(() => setSessionsLoading(false));
    }, []);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Welcome header */}
            <div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                    {greeting()}, {user?.firstName || user?.userName} 👋
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                    Here's what's happening with your EduTracker account.
                </p>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div className="stat-card">
                    <div className="stat-value">{orgsLoading ? "–" : orgs.length}</div>
                    <div className="stat-label">Organizations</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{sessionsLoading ? "–" : sessions.filter((s) => !s.isRevoked).length}</div>
                    <div className="stat-label">Active Sessions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        <span className="badge badge-accent" style={{ fontSize: "0.85rem" }}>
                            {user?.role || "User"}
                        </span>
                    </div>
                    <div className="stat-label">Account Role</div>
                </div>
            </div>

            {/* Organizations */}
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 600 }}>My Organizations</h2>
                </div>

                {orgsLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                        <div className="spinner spinner-lg" />
                    </div>
                ) : orgs.length === 0 ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">🏫</div>
                        <div className="empty-state-title">No organizations yet</div>
                        <div className="empty-state-text">
                            Create or join an organization to start tracking.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                        {orgs.map((org) => (
                            <div key={org.organizationId} className="card card-clickable">
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                    <div
                                        style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: "1rem",
                                        }}
                                    >
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`badge ${org.status === "Active" ? "badge-success" : "badge-warn"}`}>
                                        {org.status}
                                    </span>
                                </div>
                                <h3 style={{ fontWeight: 600, fontSize: "1.05rem", marginBottom: "0.25rem" }}>{org.name}</h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>Role: {org.role}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sessions */}
            <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.75rem" }}>Active Sessions</h2>
                {sessionsLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                        <div className="spinner spinner-lg" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">🔐</div>
                        <div className="empty-state-title">No sessions</div>
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
                                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem" }}>
                                            {s.sessionId.substring(0, 8)}…
                                        </td>
                                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                        <td>{new Date(s.expiresAt).toLocaleDateString()}</td>
                                        <td>{s.rememberMe ? "Yes" : "No"}</td>
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
            </div>
        </div>
    );
}
