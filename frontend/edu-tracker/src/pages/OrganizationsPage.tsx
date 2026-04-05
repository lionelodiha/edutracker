import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getOrganizationsEndpointHandler,
    createOrganizationEndpointHandler,
} from "../api";
import { client } from "../api/client.gen";
import type { OrganizationListItemResponse } from "../api";

const API_BASE = "http://localhost:3187";

export default function OrganizationsPage() {
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState<OrganizationListItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrgs = async () => {
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        try {
            const r = await getOrganizationsEndpointHandler();
            if (r.data?.data) setOrgs(r.data.data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

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
                const errBody = result.error || result.data as any;
                let errorMsg = "Failed to create organization.";
                if (errBody) {
                    if (errBody.message) errorMsg = errBody.message;
                    else if (errBody.title) errorMsg = errBody.title;
                    else if (typeof errBody === 'string') errorMsg = errBody;
                    
                    if (errBody.details && Array.isArray(errBody.details)) {
                        errorMsg += " " + errBody.details.map((d: any) => d.message || d).join(" ");
                    }
                }
                setError(errorMsg);
                console.error("Create organization failed:", result);
            }
        } catch (err: any) {
            setError(err?.message || "Failed to create organization.");
            console.error("Create organization exception:", err);
        }
        setCreating(false);
    };

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>Organizations</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        Manage your organizations and memberships.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    + New Organization
                </button>
            </div>

            {/* Create modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
                            Create Organization
                        </h2>
                        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {error && (
                                <div className="alert alert-error">
                                    <span>⚠</span>
                                    <span>{error}</span>
                                </div>
                            )}
                            <div>
                                <label className="input-label">Organization Name</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Acme Academy"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Org list */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                    <div className="spinner spinner-lg" />
                </div>
            ) : orgs.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">🏫</div>
                    <div className="empty-state-title">No organizations yet</div>
                    <div className="empty-state-text">
                        Get started by creating your first organization.
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: "1rem" }}
                        onClick={() => setShowCreate(true)}
                    >
                        + Create Organization
                    </button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {orgs.map((org) => (
                        <div 
                            key={org.organizationId} 
                            className="card card-clickable"
                            onClick={() => navigate(`/dashboard/organizations/${org.organizationId}`)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <div
                                    style={{
                                        width: 44, height: 44, borderRadius: 12,
                                        background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 700, fontSize: "1.1rem", flexShrink: 0,
                                    }}
                                >
                                    {org.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: 600, fontSize: "1.05rem" }}>{org.name}</h3>
                                </div>
                                <span className={`badge ${org.status === "Active" ? "badge-success" : "badge-warn"}`}>
                                    {org.status}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span className="badge badge-accent">{org.role}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
