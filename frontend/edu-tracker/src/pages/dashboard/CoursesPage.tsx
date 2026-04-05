import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getCoursesEndpointHandler,
    createCourseEndpointHandler,
    deleteCourseEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import type { CourseResponse } from "../../api";

const API_BASE = "http://localhost:3187";

export default function CoursesPage() {
    const { id: organizationId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = async () => {
        if (!organizationId) return;
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        try {
            const res = await getCoursesEndpointHandler({ query: { organizationId } });
            if (res.data?.data) {
                setCourses(res.data.data);
            }
        } catch {}
        setLoading(false);
    };

    useEffect(() => {
        fetchCourses();
    }, [organizationId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await createCourseEndpointHandler({
                body: { organizationId: organizationId!, name: newName, code: newCode }
            });
            if (res.response?.ok) {
                setShowCreate(false);
                setNewName("");
                setNewCode("");
                await fetchCourses();
            } else {
                const d = res.data as any;
                setError(d?.message || "Failed to create course.");
            }
        } catch (err: any) {
            setError(err?.message || "Error creating course.");
        }
        setSubmitting(false);
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this course?")) return;
        try {
            await deleteCourseEndpointHandler({ path: { id: courseId }, query: { organizationId: organizationId! } });
            await fetchCourses();
        } catch (err) {
            console.error("Failed to delete course", err);
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
                        Courses
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        Manage the organization's courses
                    </p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                        + New Course
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {courses.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No courses found. Create one to get started.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Name</th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Code</th>
                                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Created</th>
                                <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600, fontSize: "0.9rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((c) => (
                                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "1rem", fontWeight: 600 }}>{c.name}</td>
                                    <td style={{ padding: "1rem", fontFamily: "monospace" }}>{c.code}</td>
                                    <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
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
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Create Course</h2>
                        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {error && (
                                <div className="alert alert-error">
                                    <span>⚠</span>
                                    <span>{error}</span>
                                </div>
                            )}
                            <div>
                                <label className="input-label">Course Name</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="e.g. Intro to Computer Science"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="input-label">Course Code</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="e.g. CS101"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    required
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
