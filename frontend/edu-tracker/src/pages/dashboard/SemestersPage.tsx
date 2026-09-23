import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getSemestersEndpointHandler,
    createSemesterEndpointHandler,
    deleteSemesterEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import Modal from "../../components/Modal";
import type { SemesterResponse } from "../../api";

import { API_BASE } from "../../apiBase";

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

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
                setError(d?.message || "Failed to create session.");
            }
        } catch (err: any) {
            setError(err?.message || "Error creating session.");
        }
        setSubmitting(false);
    };

    const handleDelete = async (semesterId: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        try {
            await deleteSemesterEndpointHandler({ path: { id: semesterId }, query: { organizationId: organizationId! } });
            await fetchSemesters();
        } catch (err) {
            console.error("Failed to delete session", err);
        }
    };

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <div className="dz-crumb">
                        <button className="dz-pill-btn" onClick={() => navigate(`/dashboard/organizations/${organizationId}`)}>← School</button>
                    </div>
                    <h1 className="dz-page-title">Sessions</h1>
                    <p className="dz-page-sub">
                        {loading ? "Loading academic years…" : `${semesters.length} session${semesters.length === 1 ? "" : "s"} · academic years and terms.`}
                    </p>
                </div>
                <button className="dz-btn-green" onClick={() => { setError(null); setShowCreate(true); }}>
                    <PlusIcon /> New Session
                </button>
            </div>

            <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div className="dz-list" style={{ padding: "1.4rem" }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="dz-row">
                                <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ height: 12, width: "35%", borderRadius: 6, marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 9, width: "25%", borderRadius: 5 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : semesters.length === 0 ? (
                    <div className="dz-empty">
                        <span className="dz-empty-icon"><CalendarIcon /></span>
                        <div className="dz-empty-title">No sessions yet</div>
                        <div className="dz-empty-text">Create an academic year to start adding terms and course offerings.</div>
                        <button className="dz-btn-green" style={{ marginTop: "1rem" }} onClick={() => { setError(null); setShowCreate(true); }}>
                            <PlusIcon /> New Session
                        </button>
                    </div>
                ) : (
                    <div className="dz-table-wrap">
                        <table className="dz-table">
                            <thead>
                                <tr>
                                    <th>Academic Year</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th className="dz-table-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {semesters.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 700 }}>{s.startYear} / {Number(s.startYear) + 1}</td>
                                        <td>
                                            <span className="dz-status dz-status-green">Active</span>
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>
                                            {new Date(s.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="dz-table-actions">
                                            <button className="dz-pill-btn" style={{ marginRight: "0.5rem" }} onClick={() => navigate(`/dashboard/organizations/${organizationId}/sessions/${s.id}`)}>Open session</button>
                                            <button className="dz-btn-danger-ghost" onClick={() => handleDelete(s.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreate && (
                <Modal titleId="create-semester-title" onClose={() => setShowCreate(false)}>
                    <h2 id="create-semester-title" className="dz-modal-title">Create Session</h2>
                    <p className="dz-modal-sub">Start a new academic year. Terms are added inside the session.</p>
                    <form onSubmit={handleCreate} className="dz-form">
                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}
                        <div>
                            <label className="input-label" htmlFor="start-year">Start Year</label>
                            <input
                                id="start-year"
                                className="input"
                                type="number"
                                value={newStartYear}
                                onChange={(e) => setNewStartYear(parseInt(e.target.value))}
                                required
                                autoFocus
                            />
                            <span className="dz-hint">Creates the {newStartYear} / {Number(newStartYear) + 1} academic year.</span>
                        </div>
                        <div className="dz-form-actions">
                            <button type="button" className="dz-btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button type="submit" className="dz-btn-green" disabled={submitting}>
                                {submitting ? "Creating…" : "Create"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
