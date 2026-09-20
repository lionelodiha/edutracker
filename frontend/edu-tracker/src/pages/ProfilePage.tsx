import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
    updateCurrentUserEndpointHandler,
    updateCurrentUserPasswordEndpointHandler,
    getCurrentUserSessionsEndpointHandler,
    revokeCurrentUserSessionEndpointHandler,
    revokeAllCurrentUserSessionsEndpointHandler
} from "../api";
import { client } from "../api/client.gen";
import type { SessionData } from "../api";

const API_BASE = "http://localhost:3187";

function MonitorIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    );
}

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [tab, setTab] = useState<"profile" | "password" | "sessions">("profile");

    // Profile form
    const [profile, setProfile] = useState({
        userName: user?.userName || "",
        firstName: user?.firstName || "",
        middleName: user?.middleName || "",
        lastName: user?.lastName || "",
    });
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Password form
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });
    const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pwLoading, setPwLoading] = useState(false);

    // Sessions state
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
            const r = await getCurrentUserSessionsEndpointHandler();
            if (r.data?.data) {
                setSessions(r.data.data);
            }
        } catch {
            // Sessions list is best-effort; the table already handles the
            // empty state, so a failed refresh stays silent.
        }
        setSessionsLoading(false);
    }, []);

    useEffect(() => {
        if (tab === "sessions") {
            fetchSessions();
        }
    }, [tab, fetchSessions]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to sign out of this session?")) return;
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
            await revokeCurrentUserSessionEndpointHandler({ path: { id: sessionId } });
            fetchSessions();
        } catch {
            // Revocation failure leaves the list as-is; the next refresh
            // will show the true server state.
        }
    };

    const handleRevokeAllSessions = async () => {
        if (!confirm("Are you sure you want to sign out of all other devices?")) return;
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
            await revokeAllCurrentUserSessionsEndpointHandler({ query: { keepCurrentUserSession: true } });
            fetchSessions();
        } catch {
            // Same as above: keep the current list on failure.
        }
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg(null);
        setProfileLoading(true);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
            const result = await updateCurrentUserEndpointHandler({
                body: {
                    userName: profile.userName || null,
                    firstName: profile.firstName || null,
                    middleName: profile.middleName || null,
                    lastName: profile.lastName || null,
                },
            });
            if (result.response?.ok) {
                setProfileMsg({ type: "success", text: "Profile updated successfully." });
                await refreshUser();
            } else {
                const d = result.data as { message?: string } | undefined;
                setProfileMsg({ type: "error", text: d?.message || "Failed to update profile." });
            }
        } catch (err: unknown) {
            setProfileMsg({ type: "error", text: (err as Error)?.message || "Failed to update profile." });
        }
        setProfileLoading(false);
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMsg(null);
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            setPwMsg({ type: "error", text: "New passwords do not match." });
            return;
        }
        setPwLoading(true);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
            const result = await updateCurrentUserPasswordEndpointHandler({
                body: {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                    logoutAll: false,
                },
            });
            if (result.response?.ok) {
                setPwMsg({ type: "success", text: "Password updated successfully." });
                setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
            } else {
                const d = result.data as { message?: string } | undefined;
                setPwMsg({ type: "error", text: d?.message || "Failed to update password." });
            }
        } catch (err: unknown) {
            setPwMsg({ type: "error", text: (err as Error)?.message || "Failed to update password." });
        }
        setPwLoading(false);
    };

    const fullName =
        [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") ||
        user?.userName || "Account";
    const initials = user?.firstName
        ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase()
        : (user?.userName?.charAt(0) || "U").toUpperCase();

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <h1 className="dz-page-title">Profile Settings</h1>
                    <p className="dz-page-sub">Manage your account details, password, and signed-in devices.</p>
                </div>
            </div>

            <div className="dz-card">
                <div className="dz-hero">
                    <div className="dz-avatar" style={{ width: 52, height: 52, fontSize: "1.15rem", background: "#8b5cf6", color: "#fff" }}>
                        {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div className="dz-hero-name">{fullName}</div>
                        <div className="dz-hero-sub">
                            <span>@{user?.userName}</span>
                            <span className="dz-status dz-status-gray">{user?.role || "User"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dz-segmented" role="tablist" aria-label="Profile sections">
                <button
                    role="tab"
                    aria-selected={tab === "profile"}
                    className={`dz-seg-btn ${tab === "profile" ? "active" : ""}`}
                    onClick={() => setTab("profile")}
                >
                    Edit Profile
                </button>
                <button
                    role="tab"
                    aria-selected={tab === "password"}
                    className={`dz-seg-btn ${tab === "password" ? "active" : ""}`}
                    onClick={() => setTab("password")}
                >
                    Change Password
                </button>
                <button
                    role="tab"
                    aria-selected={tab === "sessions"}
                    className={`dz-seg-btn ${tab === "sessions" ? "active" : ""}`}
                    onClick={() => setTab("sessions")}
                >
                    Active Sessions
                </button>
            </div>

            {tab === "profile" && (
                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Account details</span>
                    </div>
                    <form onSubmit={handleProfileSave} className="dz-form">
                        {profileMsg && (
                            <div className={`alert ${profileMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                {profileMsg.text}
                            </div>
                        )}
                        <div className="dz-form-grid-2">
                            <div>
                                <label className="input-label" htmlFor="first-name">First Name</label>
                                <input
                                    id="first-name"
                                    className="input"
                                    value={profile.firstName}
                                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="input-label" htmlFor="last-name">Last Name</label>
                                <input
                                    id="last-name"
                                    className="input"
                                    value={profile.lastName}
                                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label" htmlFor="middle-name">Middle Name (optional)</label>
                            <input
                                id="middle-name"
                                className="input"
                                value={profile.middleName}
                                onChange={(e) => setProfile((p) => ({ ...p, middleName: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="input-label" htmlFor="username">Username</label>
                            <input
                                id="username"
                                className="input"
                                value={profile.userName}
                                onChange={(e) => setProfile((p) => ({ ...p, userName: e.target.value }))}
                            />
                        </div>
                        <div className="dz-form-actions" style={{ justifyContent: "flex-start" }}>
                            <button className="dz-btn-green" type="submit" disabled={profileLoading}>
                                {profileLoading ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tab === "password" && (
                <div className="dz-card">
                    <div className="dz-card-head">
                        <span className="dz-card-title">Change password</span>
                    </div>
                    <form onSubmit={handlePasswordSave} className="dz-form">
                        {pwMsg && (
                            <div className={`alert ${pwMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                {pwMsg.text}
                            </div>
                        )}
                        <div>
                            <label className="input-label" htmlFor="current-pw">Current Password</label>
                            <input
                                id="current-pw"
                                className="input"
                                type="password"
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <div className="dz-form-grid-2">
                            <div>
                                <label className="input-label" htmlFor="new-pw">New Password</label>
                                <input
                                    id="new-pw"
                                    className="input"
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label className="input-label" htmlFor="confirm-pw">Confirm New Password</label>
                                <input
                                    id="confirm-pw"
                                    className="input"
                                    type="password"
                                    value={passwords.confirmNewPassword}
                                    onChange={(e) => setPasswords((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                        <div className="dz-form-actions" style={{ justifyContent: "flex-start" }}>
                            <button className="dz-btn-green" type="submit" disabled={pwLoading}>
                                {pwLoading ? "Updating…" : "Update Password"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tab === "sessions" && (
                <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "1.35rem 1.4rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                            <div className="dz-card-title">Active sessions</div>
                            <div className="dz-reminder-meta" style={{ marginTop: "0.25rem" }}>
                                {sessionsLoading ? "Loading devices…" : `${sessions.length} device${sessions.length === 1 ? "" : "s"} signed in.`}
                            </div>
                        </div>
                        <button className="dz-pill-btn" onClick={handleRevokeAllSessions}>
                            Sign out other devices
                        </button>
                    </div>

                    {sessionsLoading ? (
                        <div className="dz-list" style={{ padding: "0 1.4rem 1.4rem" }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="dz-row">
                                    <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton" style={{ height: 12, width: "45%", borderRadius: 6, marginBottom: 6 }} />
                                        <div className="skeleton" style={{ height: 9, width: "35%", borderRadius: 5 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="dz-empty">
                            <span className="dz-empty-icon"><MonitorIcon /></span>
                            <div className="dz-empty-title">No active sessions</div>
                            <div className="dz-empty-text">Devices signed into your account will appear here.</div>
                        </div>
                    ) : (
                        <div className="dz-table-wrap">
                            <table className="dz-table">
                                <thead>
                                    <tr>
                                        <th>Session</th>
                                        <th>Created</th>
                                        <th>Expires</th>
                                        <th>Status</th>
                                        <th className="dz-table-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((s) => (
                                        <tr key={s.sessionId}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                                    <div className="dz-tile" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                                                        <MonitorIcon />
                                                    </div>
                                                    <div>
                                                        <div className="mono">{s.sessionId.substring(0, 8)}…</div>
                                                        {s.rememberMe && <div className="dz-note">Remembered device</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ color: "var(--text-secondary)" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>{new Date(s.expiresAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`dz-status ${s.isRevoked ? "dz-status-red" : "dz-status-green"}`}>
                                                    {s.isRevoked ? "Revoked" : "Active"}
                                                </span>
                                            </td>
                                            <td className="dz-table-actions">
                                                <button
                                                    className="dz-btn-danger-ghost"
                                                    onClick={() => handleRevokeSession(s.sessionId)}
                                                >
                                                    Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
