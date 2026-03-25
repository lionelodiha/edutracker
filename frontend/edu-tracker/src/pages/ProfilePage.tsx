import { useState, useEffect } from "react";
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

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            client.setConfig({ baseUrl: API_BASE });
            const r = await getCurrentUserSessionsEndpointHandler();
            if (r.data?.data) {
                setSessions(r.data.data);
            }
        } catch {}
        setSessionsLoading(false);
    };

    useEffect(() => {
        if (tab === "sessions") {
            fetchSessions();
        }
    }, [tab]);

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to sign out of this session?")) return;
        try {
            client.setConfig({ baseUrl: API_BASE });
            await revokeCurrentUserSessionEndpointHandler({ path: { id: sessionId } });
            fetchSessions();
        } catch {}
    };

    const handleRevokeAllSessions = async () => {
        if (!confirm("Are you sure you want to sign out of all other devices?")) return;
        try {
            client.setConfig({ baseUrl: API_BASE });
            await revokeAllCurrentUserSessionsEndpointHandler({ query: { keepCurrentUserSession: true } });
            fetchSessions();
        } catch {}
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg(null);
        setProfileLoading(true);
        try {
            client.setConfig({ baseUrl: API_BASE });
            const result = await updateCurrentUserEndpointHandler({
                body: {
                    userName: profile.userName || null,
                    firstName: profile.firstName || null,
                    middleName: profile.middleName || null,
                    lastName: profile.lastName || null,
                },
            });
            if (result.response?.ok) {
                setProfileMsg({ type: "success", text: "Profile updated successfully!" });
                await refreshUser();
            } else {
                const d = result.data as any;
                setProfileMsg({ type: "error", text: d?.message || "Failed to update profile." });
            }
        } catch (err: any) {
            setProfileMsg({ type: "error", text: err?.message || "Failed to update profile." });
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
            client.setConfig({ baseUrl: API_BASE });
            const result = await updateCurrentUserPasswordEndpointHandler({
                body: {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                    logoutAll: false,
                },
            });
            if (result.response?.ok) {
                setPwMsg({ type: "success", text: "Password updated successfully!" });
                setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
            } else {
                const d = result.data as any;
                setPwMsg({ type: "error", text: d?.message || "Failed to update password." });
            }
        } catch (err: any) {
            setPwMsg({ type: "error", text: err?.message || "Failed to update password." });
        }
        setPwLoading(false);
    };

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Profile Settings</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                    Manage your account details and security.
                </p>
            </div>

            {/* User info card */}
            <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                    style={{
                        width: 56, height: 56, borderRadius: 14,
                        background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "1.25rem", flexShrink: 0,
                    }}
                >
                    {user?.firstName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                    <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                        {user?.firstName} {user?.middleName || ""} {user?.lastName}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        @{user?.userName} · <span className="badge badge-accent">{user?.role}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                    className={`btn ${tab === "profile" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setTab("profile")}
                >
                    Edit Profile
                </button>
                <button
                    className={`btn ${tab === "password" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setTab("password")}
                >
                    Change Password
                </button>
                <button
                    className={`btn ${tab === "sessions" ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setTab("sessions")}
                >
                    Active Sessions
                </button>
            </div>

            {/* Profile form */}
            {tab === "profile" && (
                <div className="card">
                    <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {profileMsg && (
                            <div className={`alert ${profileMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                {profileMsg.text}
                            </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label className="input-label">First Name</label>
                                <input
                                    className="input"
                                    value={profile.firstName}
                                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="input-label">Last Name</label>
                                <input
                                    className="input"
                                    value={profile.lastName}
                                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Middle Name (optional)</label>
                            <input
                                className="input"
                                value={profile.middleName}
                                onChange={(e) => setProfile((p) => ({ ...p, middleName: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="input-label">Username</label>
                            <input
                                className="input"
                                value={profile.userName}
                                onChange={(e) => setProfile((p) => ({ ...p, userName: e.target.value }))}
                            />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={profileLoading}>
                            {profileLoading ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            )}

            {/* Password form */}
            {tab === "password" && (
                <div className="card">
                    <form onSubmit={handlePasswordSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {pwMsg && (
                            <div className={`alert ${pwMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                                {pwMsg.text}
                            </div>
                        )}
                        <div>
                            <label className="input-label">Current Password</label>
                            <input
                                className="input"
                                type="password"
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="input-label">New Password</label>
                            <input
                                className="input"
                                type="password"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="input-label">Confirm New Password</label>
                            <input
                                className="input"
                                type="password"
                                value={passwords.confirmNewPassword}
                                onChange={(e) => setPasswords((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                                required
                            />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={pwLoading}>
                            {pwLoading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            )}

            {/* Sessions view */}
            {tab === "sessions" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Active Sessions</h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                Devices currently logged into your account.
                            </p>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleRevokeAllSessions}>
                            Revoke All Other Sessions
                        </button>
                    </div>

                    {sessionsLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                            <div className="spinner" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                            No active sessions found.
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                            {sessions.map((s, index) => (
                                <div 
                                    key={s.sessionId}
                                    style={{ 
                                        padding: "1.5rem",
                                        borderBottom: index < sessions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between"
                                    }}
                                >
                                    <div>
                                        <div style={{ fontFamily: "monospace", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                                            Session ID: {s.sessionId.substring(0, 8)}...
                                        </div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "1rem" }}>
                                            <span>Created: {new Date(s.createdAt).toLocaleDateString()}</span>
                                            <span>Expires: {new Date(s.expiresAt).toLocaleDateString()}</span>
                                            {s.rememberMe && <span className="badge badge-accent">Remembered</span>}
                                        </div>
                                    </div>
                                    <button 
                                        className="btn btn-secondary btn-sm" 
                                        style={{ color: "var(--danger)" }}
                                        onClick={() => handleRevokeSession(s.sessionId)}
                                    >
                                        Revoke Session
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
