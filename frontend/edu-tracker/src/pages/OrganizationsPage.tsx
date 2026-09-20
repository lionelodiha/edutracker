import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    getOrganizationsEndpointHandler,
    createOrganizationEndpointHandler,
} from "../api";
import { client } from "../api/client.gen";
import Modal from "../components/Modal";
import type { OrganizationListItemResponse } from "../api";

const API_BASE = "http://localhost:3187";

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

export default function OrganizationsPage() {
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState<OrganizationListItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrgs = useCallback(async () => {
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        try {
            const r = await getOrganizationsEndpointHandler();
            if (r.data?.data) setOrgs(r.data.data);
        } catch {
            // Listing is best-effort on mount; the page already renders
            // loading/empty states, so there is nothing to report here.
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCreating(true);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
            const result = await createOrganizationEndpointHandler({
                body: { name: newName },
            });
            if (result.response?.ok || result.response?.status === 201) {
                setShowCreate(false);
                setNewName("");
                await fetchOrgs();
            } else {
                const errBody = (result.error ?? result.data) as { message?: string; title?: string; details?: { message?: string }[] } | undefined;
                let errorMsg = "Failed to create organization.";
                if (errBody) {
                    if (errBody.message) errorMsg = errBody.message;
                    else if (errBody.title) errorMsg = errBody.title;
                    else if (typeof errBody === 'string') errorMsg = errBody;

                    if (errBody.details && Array.isArray(errBody.details)) {
                        errorMsg += " " + errBody.details.map((d) => d.message || d).join(" ");
                    }
                }
                setError(errorMsg);
                console.error("Create organization failed:", result);
            }
        } catch (err: unknown) {
            setError((err as Error)?.message || "Failed to create organization.");
            console.error("Create organization exception:", err);
        }
        setCreating(false);
    };

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <h1 className="dz-page-title">Organizations</h1>
                    <p className="dz-page-sub">
                        {loading ? "Loading your schools…" : `${orgs.length} organization${orgs.length === 1 ? "" : "s"} · manage schools and memberships.`}
                    </p>
                </div>
                <button className="dz-btn-green" onClick={() => { setError(null); setShowCreate(true); }}>
                    <PlusIcon /> New Organization
                </button>
            </div>

            {showCreate && (
                <Modal titleId="create-org-title" onClose={() => setShowCreate(false)}>
                    <h2 id="create-org-title" className="dz-modal-title">Create Organization</h2>
                    <p className="dz-modal-sub">Give your school a name. You can add departments, staff, and terms afterwards.</p>
                    <form onSubmit={handleCreate} className="dz-form">
                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}
                        <div>
                            <label className="input-label" htmlFor="org-name">Organization Name</label>
                            <input
                                id="org-name"
                                className="input"
                                placeholder="e.g. Acme Academy"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="dz-form-actions">
                            <button type="button" className="dz-btn-outline" onClick={() => setShowCreate(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="dz-btn-green" disabled={creating}>
                                {creating ? "Creating…" : "Create"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {loading ? (
                <div className="dz-org-grid">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="dz-card">
                            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, marginBottom: "0.9rem" }} />
                            <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6, marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 10, width: "45%", borderRadius: 6 }} />
                        </div>
                    ))}
                </div>
            ) : orgs.length === 0 ? (
                <div className="dz-card dz-empty">
                    <span className="dz-empty-icon"><InboxIcon /></span>
                    <div className="dz-empty-title">No organizations yet</div>
                    <div className="dz-empty-text">Get started by creating your first school. Departments, staff, and terms come next.</div>
                    <button
                        className="dz-btn-green"
                        style={{ marginTop: "1rem" }}
                        onClick={() => { setError(null); setShowCreate(true); }}
                    >
                        <PlusIcon /> Create Organization
                    </button>
                </div>
            ) : (
                <div className="dz-org-grid">
                    {orgs.map((org) => (
                        <div
                            key={org.organizationId}
                            className="dz-card dz-org-card"
                            onClick={() => navigate(`/dashboard/organizations/${org.organizationId}`)}
                            role="link"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") navigate(`/dashboard/organizations/${org.organizationId}`);
                            }}
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
