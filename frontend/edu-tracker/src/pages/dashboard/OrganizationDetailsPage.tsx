import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getOrganizationByIdEndpointHandler,
    getOrganizationMembersEndpointHandler,
    inviteOrganizationMemberEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import type { OrganizationResponse, OrganizationMemberResponse } from "../../api";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:3187";

export default function OrganizationDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [org, setOrg] = useState<OrganizationResponse | null>(null);
    const [members, setMembers] = useState<OrganizationMemberResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [showInvite, setShowInvite] = useState(false);
    const [inviteUsername, setInviteUsername] = useState("");
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [copiedContent, setCopiedContent] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedContent(text);
        setTimeout(() => setCopiedContent(null), 2000);
    };

    const fetchDetails = useCallback(async () => {
        if (!id) return;
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        try {
            const orgRes = await getOrganizationByIdEndpointHandler({ path: { id } });
            if (orgRes.data?.data) {
                setOrg(orgRes.data.data);
            }

            const membersRes = await getOrganizationMembersEndpointHandler({ path: { id } });
            if (membersRes.data?.data) {
                setMembers(membersRes.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch details:", err);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDetails();
    }, [fetchDetails]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError(null);
        setInviting(true);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });

            const inviteRes = await inviteOrganizationMemberEndpointHandler({
                path: { id: id! },
                body: { userName: inviteUsername }
            });

            if (inviteRes.response?.ok) {
                setShowInvite(false);
                setInviteUsername("");
                await fetchDetails();
            } else {
                const d = inviteRes.data as { message?: string };
                setInviteError(d?.message || "Failed to invite user.");
            }
        } catch (err: unknown) {
            const error = err as Error;
            setInviteError(error?.message || "Failed to invite user.");
        }
        setInviting(false);
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="fade-in card empty-state">
                <div className="empty-state-icon">⚠</div>
                <div className="empty-state-title">Organization not found</div>
                <button className="btn btn-secondary" onClick={() => navigate("/dashboard/organizations")}>
                    Back to Organizations
                </button>
            </div>
        );
    }

    const isOwner = org.ownerUserId === user?.id;

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate("/dashboard/organizations")}>
                    &larr; Back
                </button>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                        {org.name}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        Organization Details & Team
                    </p>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/organizations/${id}/courses`)}>
                        Manage Courses
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/organizations/${id}/semesters`)}>
                        Manage Semesters
                    </button>
                </div>
            </div>

            {/* General Info Card */}
            <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div
                    style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "1.5rem", flexShrink: 0,
                    }}
                >
                    {org.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Organization ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.95rem" }}>{org.id}</div>
                </div>
            </div>

            {/* Student/Teacher Onboarding Section */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Portal Onboarding Links</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    Distribute these secure links to onboard your students and teachers. The school name will be automatically locked for them during signup.
                </p>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                        <label className="input-label" style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Student Registration Link</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input className="input" readOnly value={`${window.location.origin}/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=student`} style={{ flex: 1, fontFamily: "monospace", fontSize: "0.85rem" }} />
                            <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => copyToClipboard(`${window.location.origin}/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=student`)}
                            >
                                {copiedContent === `${window.location.origin}/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=student` ? "Copied!" : "Copy"}
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=student`)} title="Test Link">⤤</button>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="input-label" style={{ fontSize: "0.8rem", color: "var(--success)" }}>Teacher Registration Link</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input className="input" readOnly value={`${window.location.origin}/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=teacher`} style={{ flex: 1, fontFamily: "monospace", fontSize: "0.85rem" }} />
                            <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => copyToClipboard(`${window.location.origin}/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=teacher`)}
                            >
                                {copiedContent === `${window.location.origin}/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=teacher` ? "Copied!" : "Copy"}
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/portal-signup?schoolName=${encodeURIComponent(org.name)}&role=teacher`)} title="Test Link">⤤</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members Section */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Team Members</h2>
                {isOwner && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
                        + Invite Member
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {members.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No members found.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Member</th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Role</th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Status</th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m) => (
                                <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: m.userId === user?.id ? "var(--accent-primary)" : "inherit" }}>
                                                {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.userName}
                                                {m.userId === user?.id && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", opacity: 0.7 }}>(You)</span>}
                                            </span>
                                            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)" }}>@{m.userName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <span className={`badge ${m.role === 'Owner' ? 'badge-accent' : 'badge-secondary'}`}>
                                            {m.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <span className={`badge ${m.status === 'Active' ? 'badge-success' : 'badge-warn'}`}>
                                            {m.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                        {new Date(m.joinedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="modal-overlay" onClick={() => setShowInvite(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
                            Invite Team Member
                        </h2>
                        <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {inviteError && (
                                <div className="alert alert-error">
                                    <span>⚠</span>
                                    <span>{inviteError}</span>
                                </div>
                            )}
                            <div>
                                <label className="input-label">Target Username</label>
                                <input
                                    className="input"
                                    placeholder="Enter exact username"
                                    value={inviteUsername}
                                    onChange={(e) => setInviteUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={inviting}>
                                    {inviting ? "Inviting..." : "Send Invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
