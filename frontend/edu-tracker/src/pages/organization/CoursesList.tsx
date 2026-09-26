import { useEffect, useState } from "react";
import {
    getCoursesEndpointHandler,
    createCourseEndpointHandler,
    deleteCourseEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import Modal from "../../components/Modal";
import type { CourseResponse } from "../../api";
import { API_BASE } from "../../apiBase";

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function BookIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
    );
}

/** List part of CoursesPage — shared by the courses route and AcademicStructurePage. */
export default function CoursesList({ organizationId }: { organizationId: string }) {
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = async () => {
        if (!organizationId) return;
        client.setConfig({ baseUrl: API_BASE, credentials: "include" });
        try {
            const res = await getCoursesEndpointHandler({ query: { organizationId } });
            if (res.data?.data) setCourses(res.data.data);
        } catch {
            /* list stays empty; page shows the empty state */
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await createCourseEndpointHandler({
                body: { organizationId: organizationId!, name: newName, code: newCode },
            });
            if (res.response?.ok) {
                setShowCreate(false);
                setNewName("");
                setNewCode("");
                await fetchCourses();
            } else {
                const d = res.data as { message?: string } | undefined;
                setError(d?.message || "Failed to create course.");
            }
        } catch (err: unknown) {
            const error = err as Error;
            setError(error?.message || "Error creating course.");
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

    return (
        <>
            <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "1.35rem 1.4rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <div className="dz-card-title">Courses</div>
                        <div className="dz-reminder-meta" style={{ marginTop: "0.25rem" }}>
                            {loading ? "Loading courses…" : `${courses.length} course${courses.length === 1 ? "" : "s"} in this school's catalog.`}
                        </div>
                    </div>
                    <button className="dz-btn-green" onClick={() => { setError(null); setShowCreate(true); }}>
                        <PlusIcon /> New Course
                    </button>
                </div>
                {loading ? (
                    <div className="dz-list" style={{ padding: "0 1.4rem 1.4rem" }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="dz-row">
                                <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 6, marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 9, width: "25%", borderRadius: 5 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="dz-empty">
                        <span className="dz-empty-icon"><BookIcon /></span>
                        <div className="dz-empty-title">No courses yet</div>
                        <div className="dz-empty-text">Add courses like Mathematics 101 before scheduling offerings per term.</div>
                        <button className="dz-btn-green" style={{ marginTop: "1rem" }} onClick={() => { setError(null); setShowCreate(true); }}>
                            <PlusIcon /> New Course
                        </button>
                    </div>
                ) : (
                    <div className="dz-table-wrap">
                        <table className="dz-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Code</th>
                                    <th>Created</th>
                                    <th className="dz-table-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                                                <div className="dz-tile" style={{ background: "#8b5cf6" }}>
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{c.name}</span>
                                            </div>
                                        </td>
                                        <td><span className="dz-status dz-status-gray mono">{c.code}</span></td>
                                        <td style={{ color: "var(--text-secondary)" }}>
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="dz-table-actions">
                                            <button className="dz-btn-danger-ghost" onClick={() => handleDelete(c.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreate && (
                <Modal titleId="create-course-title" onClose={() => setShowCreate(false)}>
                    <h2 id="create-course-title" className="dz-modal-title">Create Course</h2>
                    <p className="dz-modal-sub">Add a reusable course to the catalog. Offer it per term from a session.</p>
                    <form onSubmit={handleCreate} className="dz-form">
                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}
                        <div>
                            <label className="input-label" htmlFor="course-name">Course Name</label>
                            <input
                                id="course-name"
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
                            <label className="input-label" htmlFor="course-code">Course Code</label>
                            <input
                                id="course-code"
                                className="input mono"
                                type="text"
                                placeholder="e.g. CS101"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value)}
                                required
                            />
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
        </>
    );
}
