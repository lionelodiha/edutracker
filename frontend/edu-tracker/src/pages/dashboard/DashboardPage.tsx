import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDashboardData } from "../../layouts/DashboardData";

/* ─── Icons (inline SVG, no emoji) ─── */

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function ArrowUpRightIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7,7 17,7 17,17" />
        </svg>
    );
}

function MonitorIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    );
}

function InboxIcon() {
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
    );
}

const ORG_COLORS = ["#8b5cf6", "#22d3ee", "#3b82f6", "#f59e0b", "#ec4899", "#6d28d9"];

function orgColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return ORG_COLORS[h % ORG_COLORS.length];
}

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function DashboardPage() {
    const { user } = useAuth();
    const {
        orgs, sessions, invites,
        orgsLoading, sessionsLoading, invitesLoading,
        searchQuery, respondingInvite, respondInvite,
    } = useDashboardData();
    const location = useLocation();

    useEffect(() => {
        if (location.hash === "#invites") {
            document.getElementById("invites")?.scrollIntoView({ behavior: "smooth" });
        }
    }, [location.hash]);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    };

    const activeSessions = sessions.filter((s) => !s.isRevoked);
    const ownedOrgs = orgs.filter((o) => o.role === "Owner").length;
    const displayName = user?.firstName || user?.userName || "there";
    const fullName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "Account";
    const initials = user?.firstName
        ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase()
        : (user?.userName?.charAt(0) || "U").toUpperCase();

    const query = searchQuery.trim().toLowerCase();
    const filteredOrgs = query
        ? orgs.filter((o) => o.name.toLowerCase().includes(query))
        : orgs;

    const weekdayCounts = useMemo(() => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        for (const s of sessions) {
            const d = new Date(s.createdAt);
            if (!Number.isNaN(d.getTime())) counts[d.getDay()] += 1;
        }
        return counts;
    }, [sessions]);
    const maxCount = Math.max(1, ...weekdayCounts);

    const nextInvite = useMemo(() => {
        if (invites.length === 0) return null;
        return [...invites].sort(
            (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        )[0];
    }, [invites]);

    const activePct = sessions.length === 0
        ? 0
        : Math.round((activeSessions.length / sessions.length) * 100);

    const statsLoading = orgsLoading || sessionsLoading || invitesLoading;

    return (
        <div className="dz-page">
            {/* ── Header ── */}
            <div className="dz-page-head">
                <div>
                    <h1 className="dz-page-title">Dashboard</h1>
                    <p className="dz-page-sub">
                        {greeting()}, {displayName}. Your schools, invites, and sessions at a glance.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <Link to="/dashboard/organizations" className="dz-btn-green">
                        <PlusIcon /> New Organization
                    </Link>
                    <Link to="/dashboard/organizations" className="dz-btn-outline">
                        View All
                    </Link>
                </div>
            </div>

            {/* ── Stat cards (real counts only) ── */}
            <div className="dz-grid-stats">
                <div className="dz-card dz-stat dz-stat-featured">
                    <div className="dz-stat-top">
                        <span className="dz-stat-label">Total Organizations</span>
                        <Link to="/dashboard/organizations" className="dz-goto" aria-label="View organizations">
                            <ArrowUpRightIcon />
                        </Link>
                    </div>
                    {orgsLoading
                        ? <div className="skeleton" style={{ height: 46, width: 70, borderRadius: 10 }} />
                        : <div className="dz-stat-value">{orgs.length}</div>}
                    <div className="dz-stat-sub">{ownedOrgs} owned by you</div>
                </div>

                <div className="dz-card dz-stat">
                    <div className="dz-stat-top">
                        <span className="dz-stat-label">Pending Invites</span>
                        <a href="#invites" className="dz-goto" aria-label="View invites">
                            <ArrowUpRightIcon />
                        </a>
                    </div>
                    {invitesLoading
                        ? <div className="skeleton" style={{ height: 46, width: 70, borderRadius: 10 }} />
                        : <div className="dz-stat-value">{invites.length}</div>}
                    <div className="dz-stat-sub">
                        {invites.length > 0 ? "Awaiting your response" : "You're all caught up"}
                    </div>
                </div>

                <div className="dz-card dz-stat">
                    <div className="dz-stat-top">
                        <span className="dz-stat-label">Active Sessions</span>
                        <Link to="/dashboard/profile" className="dz-goto" aria-label="Manage sessions">
                            <ArrowUpRightIcon />
                        </Link>
                    </div>
                    {sessionsLoading
                        ? <div className="skeleton" style={{ height: 46, width: 70, borderRadius: 10 }} />
                        : <div className="dz-stat-value">{activeSessions.length}</div>}
                    <div className="dz-stat-sub">of {sessions.length} total sessions</div>
                </div>

                <div className="dz-card dz-stat">
                    <div className="dz-stat-top">
                        <span className="dz-stat-label">Account Role</span>
                        <Link to="/dashboard/profile" className="dz-goto" aria-label="View profile">
                            <ArrowUpRightIcon />
                        </Link>
                    </div>
                    <div className="dz-stat-value" style={{ fontSize: "1.6rem", paddingTop: "0.45rem" }}>
                        {user?.role || "User"}
                    </div>
                    <div className="dz-stat-sub">@{user?.userName}</div>
                </div>
            </div>

            {/* ── Activity + reminder + organizations ── */}
            <div className="dz-grid-row-3">
                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Session Activity</span>
                    </div>
                    {sessionsLoading ? (
                        <div className="dz-bars">
                            {WEEK_DAYS.map((d, i) => (
                                <div key={i} className="dz-bar-col">
                                    <div className="skeleton dz-bar" style={{ height: 90 }} />
                                    <span className="dz-bar-day">{d}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="dz-bars">
                            {weekdayCounts.map((count, i) => {
                                const filled = count > 0;
                                const height = filled
                                    ? Math.max(24, Math.round((count / maxCount) * 100))
                                    : 38;
                                return (
                                    <div key={i} className="dz-bar-col">
                                        <div
                                            className={`dz-bar ${filled ? (i % 2 === 0 ? "dz-bar-fill" : "dz-bar-fill-alt") : "dz-bar-empty"}`}
                                            style={{ height: `${(height / 100) * 150}px` }}
                                            title={`${count} sign-in${count === 1 ? "" : "s"}`}
                                        >
                                            {filled && <span className="dz-bar-pct">{count}</span>}
                                        </div>
                                        <span className="dz-bar-day">{WEEK_DAYS[i]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="dz-stat-sub">Sign-ins per weekday, all time</div>
                </div>

                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Reminders</span>
                    </div>
                    {invitesLoading ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            <div className="skeleton" style={{ height: 26, width: "80%", borderRadius: 8 }} />
                            <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 6 }} />
                            <div className="skeleton" style={{ height: 42, width: "100%", borderRadius: "999px", marginTop: "auto" }} />
                        </div>
                    ) : nextInvite ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div className="dz-reminder-org">{nextInvite.organizationName}</div>
                            <div className="dz-reminder-meta">
                                Invited by @{nextInvite.invitedByUserName}
                            </div>
                            <div className="dz-reminder-meta" style={{ marginBottom: "1rem" }}>
                                Expires {new Date(nextInvite.expiresAt).toLocaleDateString()}
                            </div>
                            <a href="#invites" className="dz-btn-green" style={{ marginTop: "auto", width: "100%" }}>
                                Review Invite
                            </a>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.4rem" }}>
                            <div className="dz-reminder-org" style={{ fontSize: "1.05rem" }}>You're all caught up</div>
                            <div className="dz-reminder-meta" style={{ marginBottom: "1rem" }}>
                                New organization invites will appear here.
                            </div>
                            <Link to="/dashboard/organizations" className="dz-btn-green" style={{ marginTop: "auto", width: "100%" }}>
                                Browse Organizations
                            </Link>
                        </div>
                    )}
                </div>

                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Organizations</span>
                        <Link to="/dashboard/organizations" className="dz-pill-btn">
                            <PlusIcon /> New
                        </Link>
                    </div>
                    {orgsLoading ? (
                        <div className="dz-list">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="dz-row">
                                    <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 6, marginBottom: 6 }} />
                                        <div className="skeleton" style={{ height: 9, width: "45%", borderRadius: 5 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredOrgs.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "1rem 0", textAlign: "center" }}>
                            <span style={{ color: "var(--text-muted)", display: "flex" }}><InboxIcon /></span>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                                {query ? "No matches" : "No organizations yet"}
                            </div>
                            <div className="dz-reminder-meta">
                                {query ? "Try a different search." : "Create one to get started."}
                            </div>
                        </div>
                    ) : (
                        <div className="dz-list">
                            {filteredOrgs.slice(0, 5).map((org) => (
                                <Link key={org.organizationId} to={`/dashboard/organizations/${org.organizationId}`} className="dz-row">
                                    <div className="dz-tile" style={{ background: orgColor(org.name) }}>
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="dz-row-main">
                                        <div className="dz-row-title">{org.name}</div>
                                        <div className="dz-row-sub">{org.role} · {org.status}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sessions + donut + account ── */}
            <div className="dz-grid-row-3b">
                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Sessions</span>
                        <Link to="/dashboard/profile" className="dz-pill-btn">Manage</Link>
                    </div>
                    {sessionsLoading ? (
                        <div className="dz-list">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="dz-row">
                                    <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ height: 12, width: "55%", borderRadius: 6, marginBottom: 6 }} />
                                        <div className="skeleton" style={{ height: 9, width: "40%", borderRadius: 5 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 0" }}>
                            <span className="dz-reminder-meta">No sessions found.</span>
                        </div>
                    ) : (
                        <div className="dz-list">
                            {sessions.slice(0, 4).map((s) => (
                                <div key={s.sessionId} className="dz-row">
                                    <div className="dz-tile" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                                        <MonitorIcon />
                                    </div>
                                    <div className="dz-row-main">
                                        <div className="dz-row-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem" }}>
                                            {s.sessionId.substring(0, 8)}…
                                        </div>
                                        <div className="dz-row-sub">
                                            Created {new Date(s.createdAt).toLocaleDateString()}
                                            {s.rememberMe ? " · Remembered" : ""}
                                        </div>
                                    </div>
                                    <span className={`dz-status ${s.isRevoked ? "dz-status-red" : "dz-status-green"}`}>
                                        {s.isRevoked ? "Revoked" : "Active"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Session Health</span>
                    </div>
                    <div className="dz-donut-wrap">
                        <div
                            className="dz-donut"
                            style={{
                                background: `conic-gradient(#22d3ee 0% ${activePct}%, #1b2434 ${activePct}% 100%)`,
                            }}
                        >
                            <div className="dz-donut-hole">
                                <div className="dz-donut-pct">{statsLoading ? "–" : `${activePct}%`}</div>
                                <div className="dz-donut-cap">Sessions Active</div>
                            </div>
                        </div>
                        <div className="dz-legend">
                            <span><i style={{ background: "#22d3ee" }} /> Active</span>
                            <span><i className="hatch" /> Revoked</span>
                        </div>
                    </div>
                </div>

                <div className="dz-card dz-account">
                    <span className="dz-card-title">Account</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", margin: "0.9rem 0 0.35rem" }}>
                        <div className="dz-avatar" style={{ width: 44, height: 44, fontSize: "1rem", background: "#8b5cf6", color: "#fff" }}>
                            {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div className="dz-account-name">{fullName}</div>
                            <div className="dz-account-sub">@{user?.userName}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        <span className="dz-status" style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                            {user?.role || "User"}
                        </span>
                        <span className="dz-status" style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
                            {orgs.length} org{orgs.length === 1 ? "" : "s"}
                        </span>
                    </div>
                    <Link to="/dashboard/profile" className="dz-btn-green" style={{ marginTop: "auto", width: "100%" }}>
                        View Profile
                    </Link>
                </div>
            </div>

            {/* ── My organizations grid ── */}
            <section>
                <div className="dz-card-head" style={{ marginBottom: "0.85rem" }}>
                    <div>
                        <h2 className="dz-card-title">My Organizations</h2>
                        {!orgsLoading && filteredOrgs.length > 0 && (
                            <p className="dz-reminder-meta" style={{ marginTop: "0.15rem" }}>
                                {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? "s" : ""}
                                {query ? ` matching "${searchQuery.trim()}"` : ""}
                            </p>
                        )}
                    </div>
                    <Link to="/dashboard/organizations" className="dz-pill-btn">View all</Link>
                </div>

                {orgsLoading ? (
                    <div className="dz-org-grid">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="dz-card">
                                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, marginBottom: "0.8rem" }} />
                                <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6, marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 6 }} />
                            </div>
                        ))}
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="dz-card" style={{ alignItems: "center", textAlign: "center", padding: "2.5rem 1.5rem" }}>
                        <span style={{ color: "var(--text-muted)", display: "flex", marginBottom: "0.5rem" }}><InboxIcon /></span>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                            {query ? "No organizations match your search" : "No organizations yet"}
                        </div>
                        <div className="dz-reminder-meta" style={{ margin: "0.25rem 0 1rem" }}>
                            {query ? "Try a different search." : "Create or join an organization to get started."}
                        </div>
                        {!query && (
                            <Link to="/dashboard/organizations" className="dz-btn-green">
                                <PlusIcon /> Create Organization
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="dz-org-grid">
                        {filteredOrgs.slice(0, 6).map((org) => (
                            <Link
                                key={org.organizationId}
                                to={`/dashboard/organizations/${org.organizationId}`}
                                className="dz-card dz-org-card"
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.9rem" }}>
                                    <div className="dz-tile" style={{ width: 40, height: 40, fontSize: "1rem", background: orgColor(org.name) }}>
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`dz-status ${org.status === "Active" ? "dz-status-green" : "dz-status-amber"}`}>
                                        {org.status}
                                    </span>
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "0.5rem" }}>{org.name}</h3>
                                <span className="dz-status dz-status-gray">{org.role}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Pending invites ── */}
            {(invitesLoading || invites.length > 0) && (
                <section id="invites" style={{ scrollMarginTop: "1rem" }}>
                    <div className="dz-card-head" style={{ marginBottom: "0.85rem" }}>
                        <div>
                            <h2 className="dz-card-title">Pending Invites</h2>
                            {!invitesLoading && (
                                <p className="dz-reminder-meta" style={{ marginTop: "0.15rem" }}>
                                    {invites.length} invite{invites.length !== 1 ? "s" : ""} awaiting your response
                                </p>
                            )}
                        </div>
                    </div>

                    {invitesLoading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {[1, 2].map((i) => (
                                <div key={i} className="dz-card" style={{ flexDirection: "row", alignItems: "center", gap: "1rem" }}>
                                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ height: 13, width: "40%", borderRadius: 6, marginBottom: 8 }} />
                                        <div className="skeleton" style={{ height: 10, width: "25%", borderRadius: 6 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {invites.map((inv) => (
                                <div key={inv.id} className="dz-card" style={{ flexDirection: "row", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                                    <div className="dz-tile" style={{ width: 40, height: 40, background: orgColor(inv.organizationName) }}>
                                        {inv.organizationName.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 180 }}>
                                        <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{inv.organizationName}</div>
                                        <div className="dz-reminder-meta">
                                            Invited by <strong>@{inv.invitedByUserName}</strong> · expires {new Date(inv.expiresAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button
                                            className="dz-btn-green"
                                            style={{ padding: "0.55rem 1.1rem", fontSize: "0.8rem" }}
                                            disabled={respondingInvite === inv.id}
                                            onClick={() => respondInvite(inv.id, "accept")}
                                        >
                                            {respondingInvite === inv.id ? "…" : "Accept"}
                                        </button>
                                        <button
                                            className="dz-btn-outline"
                                            style={{ padding: "0.55rem 1.1rem", fontSize: "0.8rem" }}
                                            disabled={respondingInvite === inv.id}
                                            onClick={() => respondInvite(inv.id, "reject")}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
