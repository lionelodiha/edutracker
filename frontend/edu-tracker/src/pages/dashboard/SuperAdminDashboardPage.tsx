import { Link } from "react-router-dom";

export default function SuperAdminDashboardPage() {
    // --- MOCK DATA ---
    const systemStats = {
        totalOrganizations: 142,
        activeUsers: 45200,
        serverHealth: "99.9%",
        monthlyRevenue: "$14,200"
    };

    const recentOrganizations = [
        { id: "org1", name: "Springfield High", status: "Active", users: 1205, joined: "2026-03-15" },
        { id: "org2", name: "Green Valley Academy", status: "Active", users: 840, joined: "2026-03-12" },
        { id: "org3", name: "Downtown Middle School", status: "Suspended", users: 430, joined: "2025-11-04" },
        { id: "org4", name: "Lakeside Secondary", status: "Active", users: 2150, joined: "2026-04-01" },
    ];

    const systemAlerts = [
        { id: 1, type: "Warning", message: "Database storage reaching 85% capacity.", time: "2 hours ago" },
        { id: 2, type: "Info", message: "Successfully processed 1,200 automated report cards.", time: "5 hours ago" }
    ];
    // -----------------

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.2rem", color: "var(--accent-light)" }}>Super Admin HQ</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Global System Oversight & Management</p>
                </div>
                <Link to="/dashboard" className="btn btn-secondary btn-sm">← Back to Main</Link>
            </div>

            {/* Top Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.5rem" }}>
                <div className="stat-card" style={{ borderTop: "3px solid var(--accent)" }}>
                    <div className="stat-label">Total Organizations</div>
                    <div className="stat-value">{systemStats.totalOrganizations}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--success)", marginTop: "0.5rem" }}>↑ 12 this month</div>
                </div>
                <div className="stat-card" style={{ borderTop: "3px solid var(--success)" }}>
                    <div className="stat-label">Total Active Users</div>
                    <div className="stat-value">{(systemStats.activeUsers / 1000).toFixed(1)}k</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--success)", marginTop: "0.5rem" }}>↑ 5.2% growth</div>
                </div>
                <div className="stat-card" style={{ borderTop: "3px solid #f59e0b" }}>
                    <div className="stat-label">Monthly Revenue</div>
                    <div className="stat-value">{systemStats.monthlyRevenue}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>SaaS Subscriptions</div>
                </div>
                <div className="stat-card" style={{ borderTop: "3px solid #ec4899" }}>
                    <div className="stat-label">System Health</div>
                    <div className="stat-value">{systemStats.serverHealth}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>All services operational</div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "1.5rem" }}>
                {/* Left Column: Orgs Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Organization Directory</h2>
                        <button className="btn btn-primary btn-sm">+ Onboard New School</button>
                    </div>
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th>Organization Name</th>
                                <th>Status</th>
                                <th>Registered Users</th>
                                <th>Joined Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrganizations.map(org => (
                                <tr key={org.id}>
                                    <td style={{ fontWeight: 600 }}>{org.name}</td>
                                    <td>
                                        <span className={`badge ${org.status === 'Active' ? 'badge-success' : 'badge-error'}`}>
                                            {org.status}
                                        </span>
                                    </td>
                                    <td>{org.users.toLocaleString()}</td>
                                    <td>{new Date(org.joined).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }}>Manage</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Right Column: System Logs */}
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>System Alerts</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {systemAlerts.map(alert => (
                            <div key={alert.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span className={`badge ${alert.type === 'Info' ? 'badge-accent' : 'badge-warn'}`}>{alert.type}</span>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alert.time}</span>
                                </div>
                                <div style={{ fontSize: "0.9rem", marginTop: "0.4rem", lineHeight: 1.4 }}>{alert.message}</div>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: "100%", marginTop: "1rem" }}>View All Logs</button>
                </div>
            </div>
        </div>
    );
}
