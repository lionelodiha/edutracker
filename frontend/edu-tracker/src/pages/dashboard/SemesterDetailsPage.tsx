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
import Modal from "../../components/Modal";
import { apiErrorMessage, thrownMessage } from "../../utils/apiError";
import type { SemesterResponse, TermResponse, CourseOfferingResponse, CourseResponse } from "../../api";
import { getApiBaseUrl } from "../../config";

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

function BookIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
    );
}

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
        client.setConfig({ baseUrl: getApiBaseUrl(), credentials: 'include' });
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
                setTermError(apiErrorMessage(res.data, "Failed to create term."));
            }
        } catch (err: unknown) {
            setTermError(thrownMessage(err, "Error creating term."));
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
                setOfferingError(apiErrorMessage(res.data, "Failed to add course offering."));
            }
        } catch (err: unknown) {
            setOfferingError(thrownMessage(err, "Error adding offering."));
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
            <div className="dz-page">
                <div className="dz-page-head">
                    <div>
                        <div className="skeleton" style={{ height: 28, width: 240, borderRadius: 8, marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 14, width: 180, borderRadius: 6 }} />
                    </div>
                </div>
                <div className="dz-card">
                    <div className="skeleton" style={{ height: 14, width: "40%", borderRadius: 6, marginBottom: 10 }} />
                    <div className="skeleton" style={{ height: 10, width: "70%", borderRadius: 6 }} />
                </div>
            </div>
        );
    }

    if (!semester) {
        return (
            <div className="dz-page">
                <div className="dz-card dz-empty">
                    <span className="dz-empty-icon"><CalendarIcon /></span>
                    <div className="dz-empty-title">Semester not found</div>
                    <div className="dz-empty-text">This academic year may have been removed.</div>
                    <button className="dz-btn-outline" style={{ marginTop: "1rem" }} onClick={() => navigate(`/dashboard/organizations/${organizationId}/semesters`)}>
                        Back to Semesters
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <div className="dz-crumb">
                        <button className="dz-pill-btn" onClick={() => navigate(`/dashboard/organizations/${organizationId}/semesters`)}>← Semesters</button>
                    </div>
                    <h1 className="dz-page-title">
                        Semester {semester.startYear} / {Number(semester.startYear) + 1}
                    </h1>
                    <p className="dz-page-sub">
                        {terms.length} term{terms.length === 1 ? "" : "s"} · {offerings.length} course offering{offerings.length === 1 ? "" : "s"}.
                    </p>
                </div>
                {activeTab === 'terms' ? (
                    <button className="dz-btn-green" onClick={() => { setTermError(null); setShowTermCreate(true); }}>
                        <PlusIcon /> Add Term
                    </button>
                ) : (
                    <button className="dz-btn-green" onClick={() => { setOfferingError(null); setShowOfferingCreate(true); }}>
                        <PlusIcon /> Add Offering
                    </button>
                )}
            </div>

            <div className="dz-segmented" role="tablist" aria-label="Semester sections">
                <button
                    role="tab"
                    aria-selected={activeTab === 'terms'}
                    className={`dz-seg-btn ${activeTab === 'terms' ? 'active' : ''}`}
                    onClick={() => setActiveTab('terms')}
                >
                    Terms ({terms.length})
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'offerings'}
                    className={`dz-seg-btn ${activeTab === 'offerings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('offerings')}
                >
                    Course Offerings ({offerings.length})
                </button>
            </div>

            {activeTab === 'terms' && (
                <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "1.35rem 1.4rem 1rem" }}>
                        <div className="dz-card-title">Academic Terms</div>
                        <div className="dz-reminder-meta" style={{ marginTop: "0.25rem" }}>Terms split the year into teaching periods.</div>
                    </div>
                    {terms.length === 0 ? (
                        <div className="dz-empty">
                            <span className="dz-empty-icon"><CalendarIcon /></span>
                            <div className="dz-empty-title">No terms yet</div>
                            <div className="dz-empty-text">Add Term 1 to start scheduling course offerings.</div>
                        </div>
                    ) : (
                        <div className="dz-table-wrap">
                            <table className="dz-table">
                                <thead>
                                    <tr>
                                        <th>Term</th>
                                        <th>Created</th>
                                        <th className="dz-table-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {terms.map((t) => (
                                        <tr key={t.id}>
                                            <td style={{ fontWeight: 700 }}>Term {t.ordinal}</td>
                                            <td style={{ color: "var(--text-secondary)" }}>
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="dz-table-actions">
                                                <button className="dz-btn-danger-ghost" onClick={() => handleDeleteTerm(t.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'offerings' && (
                <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "1.35rem 1.4rem 1rem" }}>
                        <div className="dz-card-title">Course Offerings</div>
                        <div className="dz-reminder-meta" style={{ marginTop: "0.25rem" }}>Map catalog courses to terms in this semester.</div>
                    </div>
                    {offerings.length === 0 ? (
                        <div className="dz-empty">
                            <span className="dz-empty-icon"><BookIcon /></span>
                            <div className="dz-empty-title">No offerings yet</div>
                            <div className="dz-empty-text">Add terms and courses first, then map them here.</div>
                        </div>
                    ) : (
                        <div className="dz-table-wrap">
                            <table className="dz-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Code</th>
                                        <th>Term</th>
                                        <th className="dz-table-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offerings.map((o) => (
                                        <tr key={o.id}>
                                            <td style={{ fontWeight: 600 }}>{o.courseName}</td>
                                            <td>
                                                <span className="dz-status dz-status-gray mono">{o.courseCode}</span>
                                            </td>
                                            <td style={{ color: "var(--text-secondary)" }}>Term {o.termOrdinal}</td>
                                            <td className="dz-table-actions">
                                                <button className="dz-pill-btn" style={{ marginRight: "0.5rem" }} onClick={() => navigate(`/dashboard/organizations/${organizationId}/classes/${o.id}`)}>View Classes</button>
                                                <button className="dz-btn-danger-ghost" onClick={() => handleDeleteOffering(o.id)}>Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showTermCreate && (
                <Modal titleId="create-term-title" onClose={() => setShowTermCreate(false)}>
                    <h2 id="create-term-title" className="dz-modal-title">Create Term</h2>
                    <p className="dz-modal-sub">Add a teaching period to {semester.startYear} / {Number(semester.startYear) + 1}.</p>
                    <form onSubmit={handleCreateTerm} className="dz-form">
                        {termError && (
                            <div className="alert alert-error">
                                <span>{termError}</span>
                            </div>
                        )}
                        <div>
                            <label className="input-label" htmlFor="term-ordinal">Term Ordinal (e.g. 1 for Term 1)</label>
                            <input
                                id="term-ordinal"
                                className="input"
                                type="number"
                                min="1"
                                value={newTermOrdinal}
                                onChange={(e) => setNewTermOrdinal(parseInt(e.target.value))}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="dz-form-actions">
                            <button type="button" className="dz-btn-outline" onClick={() => setShowTermCreate(false)}>Cancel</button>
                            <button type="submit" className="dz-btn-green" disabled={submittingTerm}>
                                {submittingTerm ? "Creating…" : "Create"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {showOfferingCreate && (
                <Modal titleId="create-offering-title" onClose={() => setShowOfferingCreate(false)}>
                    <h2 id="create-offering-title" className="dz-modal-title">Add Course Offering</h2>
                    <p className="dz-modal-sub">Offer a catalog course inside one term of this semester.</p>
                    <form onSubmit={handleCreateOffering} className="dz-form">
                        {offeringError && (
                            <div className="alert alert-error">
                                <span>{offeringError}</span>
                            </div>
                        )}
                        <div>
                            <label className="input-label" htmlFor="offering-term">Term</label>
                            <select
                                id="offering-term"
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
                            <label className="input-label" htmlFor="offering-course">Course</label>
                            <select
                                id="offering-course"
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
                        <div className="dz-form-actions">
                            <button type="button" className="dz-btn-outline" onClick={() => setShowOfferingCreate(false)}>Cancel</button>
                            <button type="submit" className="dz-btn-green" disabled={submittingOffering || !selectedTermId || !selectedCourseId}>
                                {submittingOffering ? "Adding…" : "Add"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
