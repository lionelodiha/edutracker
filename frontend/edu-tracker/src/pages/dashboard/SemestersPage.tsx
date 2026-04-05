import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getSemestersEndpointHandler,
    createSemesterEndpointHandler,
    deleteSemesterEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import type { SemesterResponse } from "../../api";

const API_BASE = "http://localhost:3187";

export default function SemestersPage() {
    const { id: organizationId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [newStartYear, setNewStartYear] = useState<number>(new Date().getFullYear());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSemesters = async () => {
        if (!organizationId) return;
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        try {
            const res = await getSemestersEndpointHandler({ query: { organizationId } });
            if (res.data?.data) {
                setSemesters(res.data.data);
            }
        } catch {}
        setLoading(false);
    };

    useEffect(() => {
        fetchSemesters();
    }, [organizationId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await createSemesterEndpointHandler({
                body: { organizationId: organizationId!, startYear: newStartYear }
            });
            if (res.response?.ok) {
                setShowCreate(false);
                await fetchSemesters();
            } else {
                const d = res.data as any;
                setError(d?.message || "Failed to create semester.");
            }
        } catch (err: any) {
            setError(err?.message || "Error creating semester.");
        }
        setSubmitting(false);
    };

    const handleDelete = async (semesterId: string) => {
        if (!confirm("Are you sure you want to delete this semester?")) return;
        try {
            await deleteSemesterEndpointHandler({ path: { id: semesterId }, query: { organizationId: organizationId! } });
            await fetchSemesters();
        } catch (err) {
            console.error("Failed to delete semester", err);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/dashboard/organizations/${organizationId}`)}>
                    &larr; Back to Org
                </button>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                        Semesters
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        Manage academic terms and periods
                    </p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                        + New Semester
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {semesters.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No semesters found. Create one to get started.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Start Year</th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Status</th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Created</th>
                                <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600, fontSize: "0.9rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {semesters.map((s) => (
                                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "1rem", fontWeight: 600 }}>{s.startYear} / {Number(s.startYear) + 1}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span className={`badge badge-success`}>Active</span>
                                    </td>
                                    <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                        {new Date(s.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                                        <button className="btn btn-secondary btn-sm" style={{ marginLeft: "0.5rem" }} onClick={() => navigate(`/dashboard/organizations/${organizationId}/semesters/${s.id}`)}>View Terms</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Create Semester</h2>
                        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {error && (
                                <div className="alert alert-error">
                                    <span>⚠</span>
                                    <span>{error}</span>
                                </div>
                            )}
                            <div>
                                <label className="input-label">Start Year</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={newStartYear}
                                    onChange={(e) => setNewStartYear(parseInt(e.target.value))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
