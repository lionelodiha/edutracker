import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getSemesterByIdEndpointHandler,
    getTermsBySemesterEndpointHandler,
    createTermEndpointHandler,
    deleteTermEndpointHandler,
    getCourseOfferingsBySemesterEndpointHandler,
    createCourseOfferingEndpointHandler,
    deleteCourseOfferingEndpointHandler,
    getCoursesEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import type { SemesterResponse, TermResponse, CourseOfferingResponse, CourseResponse } from "../../api";

const API_BASE = "http://localhost:3187";

export default function SemesterDetailsPage() {
    const { id: organizationId, semesterId } = useParams<{ id: string; semesterId: string }>();
    const navigate = useNavigate();

    const [semester, setSemester] = useState<SemesterResponse | null>(null);
    const [terms, setTerms] = useState<TermResponse[]>([]);
    const [offerings, setOfferings] = useState<CourseOfferingResponse[]>([]);
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Term form state
    const [showTermCreate, setShowTermCreate] = useState(false);
    const [newTermOrdinal, setNewTermOrdinal] = useState<number>(1);
    const [submittingTerm, setSubmittingTerm] = useState(false);
    const [termError, setTermError] = useState<string | null>(null);

    // Offering form state
    const [showOfferingCreate, setShowOfferingCreate] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedTermId, setSelectedTermId] = useState("");
    const [submittingOffering, setSubmittingOffering] = useState(false);
    const [offeringError, setOfferingError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"terms" | "offerings">("terms");

    const fetchData = async () => {
        if (!organizationId || !semesterId) return;
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        try {
            // Fetch Semester
            const semRes = await getSemesterByIdEndpointHandler({
                path: { id: semesterId },
                query: { organizationId }
            });
            if (semRes.data?.data) {
                setSemester(semRes.data.data);
            }

            // Fetch Terms
            const termRes = await getTermsBySemesterEndpointHandler({
                path: { semesterId },
                query: { organizationId }
            });
            if (termRes.data?.data) setTerms(termRes.data.data);

            // Fetch Offerings
            const offRes = await getCourseOfferingsBySemesterEndpointHandler({
                path: { semesterId },
                query: { organizationId }
            });
            if (offRes.data?.data) setOfferings(offRes.data.data);

            // Fetch Courses for Dropdown
            const courseRes = await getCoursesEndpointHandler({
                query: { organizationId }
            });
            if (courseRes.data?.data) {
                setCourses(courseRes.data.data);
                if (courseRes.data.data.length > 0) {
                    setSelectedCourseId(courseRes.data.data[0].id);
                }
            }
        } catch (err) {
            console.error("Error fetching semester details:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [organizationId, semesterId]);

    // Set default term when terms load
    useEffect(() => {
        if (terms.length > 0 && !selectedTermId) {
            setSelectedTermId(terms[0].id);
        }
    }, [terms]);

    const handleCreateTerm = async (e: React.FormEvent) => {
        e.preventDefault();
        setTermError(null);
        setSubmittingTerm(true);
        try {
            const res = await createTermEndpointHandler({
                body: { organizationId: organizationId!, semesterId: semesterId!, ordinal: newTermOrdinal }
            });
            if (res.response?.ok) {
                setShowTermCreate(false);
                setNewTermOrdinal(newTermOrdinal + 1);
                await fetchData();
            } else {
                const d = res.data as any;
                setTermError(d?.message || "Failed to create term.");
            }
        } catch (err: any) {
            setTermError(err?.message || "Error creating term.");
        }
        setSubmittingTerm(false);
    };

    const handleDeleteTerm = async (id: string) => {
        if (!confirm("Delete this term? Any linked course offerings will also report errors.")) return;
        try {
            await deleteTermEndpointHandler({ path: { id }, query: { organizationId: organizationId! } });
            await fetchData();
        } catch (err) {
            console.error("Failed to delete term", err);
        }
    };

    const handleCreateOffering = async (e: React.FormEvent) => {
        e.preventDefault();
        setOfferingError(null);
        setSubmittingOffering(true);
        try {
            const res = await createCourseOfferingEndpointHandler({
                body: { organizationId: organizationId!, courseId: selectedCourseId, termId: selectedTermId }
            });
            if (res.response?.ok) {
                setShowOfferingCreate(false);
                await fetchData();
            } else {
                const d = res.data as any;
                setOfferingError(d?.message || "Failed to add course offering.");
            }
        } catch (err: any) {
            setOfferingError(err?.message || "Error adding offering.");
        }
        setSubmittingOffering(false);
    };

    const handleDeleteOffering = async (id: string) => {
        if (!confirm("Remove this course offering?")) return;
        try {
            await deleteCourseOfferingEndpointHandler({ path: { id }, query: { organizationId: organizationId! } });
            await fetchData();
        } catch (err) {
            console.error("Failed to remove offering", err);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    if (!semester) {
        return (
            <div className="fade-in card empty-state">
                <div className="empty-state-icon">⚠</div>
                <div className="empty-state-title">Semester not found</div>
                <button className="btn btn-secondary" onClick={() => navigate(`/dashboard/organizations/${organizationId}/semesters`)}>
                    Back to Semesters
                </button>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/dashboard/organizations/${organizationId}/semesters`)}>
                    &larr; Back
                </button>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                        Semester {semester.startYear} / {Number(semester.startYear) + 1}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        Manage Terms and Course Offerings
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
                <button
                    className={`btn ${activeTab === 'terms' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    onClick={() => setActiveTab('terms')}
                >
                    Terms ({terms.length})
                </button>
                <button
                    className={`btn ${activeTab === 'offerings' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    onClick={() => setActiveTab('offerings')}
                >
                    Course Offerings ({offerings.length})
                </button>
            </div>

            {/* Terms Section */}
            {activeTab === 'terms' && (
                <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Academic Terms</h2>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowTermCreate(true)}>
                            + Add Term
                        </button>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        {terms.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                                No terms found. Create one.
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Ordinal</th>
                                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Created At</th>
                                        <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600, fontSize: "0.9rem" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {terms.map((t) => (
                                        <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td style={{ padding: "1rem", fontWeight: 600 }}>Term {t.ordinal}</td>
                                            <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "1rem", textAlign: "right" }}>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTerm(t.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Offerings Section */}
            {activeTab === 'offerings' && (
                <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Course Offerings</h2>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowOfferingCreate(true)}>
                            + Add Offering
                        </button>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        {offerings.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                                No offerings mapped. Add terms and courses first.
                            </div>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Course Name</th>
                                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Code</th>
                                        <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "0.9rem" }}>Term</th>
                                        <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600, fontSize: "0.9rem" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offerings.map((o) => (
                                        <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td style={{ padding: "1rem", fontWeight: 600 }}>{o.courseName}</td>
                                            <td style={{ padding: "1rem" }}>
                                                <span className="badge badge-secondary">{o.courseCode}</span>
                                            </td>
                                            <td style={{ padding: "1rem" }}>Term {o.termOrdinal}</td>
                                            <td style={{ padding: "1rem", textAlign: "right" }}>
                                                <button className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }} onClick={() => navigate(`/dashboard/organizations/${organizationId}/classes/${o.id}`)}>View Classes</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOffering(o.id)}>Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Term Create Modal */}
            {showTermCreate && (
                <div className="modal-overlay" onClick={() => setShowTermCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Create Term</h2>
                        <form onSubmit={handleCreateTerm} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {termError && (
                                <div className="alert alert-error">
                                    <span>⚠</span>
                                    <span>{termError}</span>
                                </div>
                            )}
                            <div>
                                <label className="input-label">Term Ordinal (e.g. 1 for Term 1)</label>
                                <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    value={newTermOrdinal}
                                    onChange={(e) => setNewTermOrdinal(parseInt(e.target.value))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTermCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submittingTerm}>
                                    {submittingTerm ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Offering Create Modal */}
            {showOfferingCreate && (
                <div className="modal-overlay" onClick={() => setShowOfferingCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Add Course Offering</h2>
                        <form onSubmit={handleCreateOffering} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {offeringError && (
                                <div className="alert alert-error">
                                    <span>⚠</span>
                                    <span>{offeringError}</span>
                                </div>
                            )}
                            <div>
                                <label className="input-label">Select Term</label>
                                <select 
                                    className="input" 
                                    value={selectedTermId} 
                                    onChange={(e) => setSelectedTermId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Select a Term --</option>
                                    {terms.map(t => (
                                        <option key={t.id} value={t.id}>Term {t.ordinal}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Select Course</label>
                                <select 
                                    className="input" 
                                    value={selectedCourseId} 
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Select a Course --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowOfferingCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submittingOffering || !selectedTermId || !selectedCourseId}>
                                    {submittingOffering ? "Adding..." : "Add"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
