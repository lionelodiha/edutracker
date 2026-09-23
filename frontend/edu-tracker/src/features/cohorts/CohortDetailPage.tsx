import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { cohortApi } from "./api";
import type { Cohort, CohortStudent } from "./types";
import { useCohortWorkspace } from "./workspace";
import "./cohorts.css";

type Workspace = ReturnType<typeof useCohortWorkspace>;
type Snapshot = { cohort: Cohort; students: CohortStudent[] };
type LoadState = { loading: boolean; snapshot: Snapshot | null; error: string | null };
const STATUSES: CohortStudent["status"][] = ["Active", "Deferred", "Suspended", "Withdrawn", "Graduated"];

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

async function readCohort(cohortId: string, organizationId: string, sessionId: string): Promise<Snapshot> {
    // Resolve membership in the active session before fetching a roster.
    // This also initializes the development mock when opening a saved deep link.
    const groups = await cohortApi.list(organizationId, { sessionId });
    if (!groups.some(group => group.id === cohortId)) throw new Error("This student group was not found in the selected school and session.");
    const cohort = await cohortApi.get(cohortId);
    if (cohort.organizationId !== organizationId || cohort.sessionId !== sessionId) {
        throw new Error("This student group was not found in the selected school and session.");
    }
    const students = await cohortApi.students(cohortId);
    return { cohort, students };
}

function academicPath(cohort: Cohort, units: Workspace["academicUnits"]): string[] {
    if (!cohort.academicUnitId) return [];
    const path: string[] = [];
    const visited = new Set<string>();
    let unitId: string | null = cohort.academicUnitId;
    while (unitId && !visited.has(unitId)) {
        visited.add(unitId);
        const unit = units.find((candidate) => candidate.id === unitId);
        if (!unit) break;
        path.unshift(unit.name);
        unitId = unit.parentId;
    }
    return path.length ? path : cohort.academicUnitName ? [cohort.academicUnitName] : [];
}

function AddStudentsDialog({ availableStudents, currentStudents, busy, error, onClose, onSubmit }: {
    availableStudents: CohortStudent[];
    currentStudents: CohortStudent[];
    busy: boolean;
    error: string | null;
    onClose: () => void;
    onSubmit: (studentProfileIds: string[]) => void;
}) {
    const workspace = useCohortWorkspace();
    const [directory, setDirectory] = useState(availableStudents);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState("");
    useEffect(() => {
        let active = true;
        cohortApi.list(workspace.organizationId, { sessionId: workspace.sessionId })
            .then(groups => Promise.all(groups.map(group => cohortApi.students(group.id))))
            .then(rosters => { if (active) setDirectory(rosters.flat()); })
            .catch(() => { if (active) setDirectoryError("The student list could not be loaded. Close and reopen to retry, or enter an existing profile ID."); })
            .finally(() => { if (active) setDirectoryLoading(false); });
        return () => { active = false; };
    }, [workspace.organizationId, workspace.sessionId]);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [profileIds, setProfileIds] = useState("");
    const currentIds = useMemo(() => new Set(currentStudents.map((student) => student.studentProfileId)), [currentStudents]);
    const candidates = useMemo(() => {
        const unique = new Map(directory.map((student) => [student.studentProfileId, student]));
        return [...unique.values()].filter((student) => !currentIds.has(student.studentProfileId));
    }, [directory, currentIds]);
    const matching = candidates.filter((student) => `${student.fullName} ${student.admissionNumber}`.toLowerCase().includes(query.trim().toLowerCase()));
    const submittedIds = [...new Set([...selected, ...profileIds.split(/[\s,;]+/).filter(Boolean)])].filter((id) => !currentIds.has(id));

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!busy && submittedIds.length) onSubmit(submittedIds);
    }

    return (
        <Modal titleId="add-cohort-students-title" onClose={onClose} maxWidth={640}>
            <form className="cohort-modal" onSubmit={submit}>
                <div className="cohort-modal-header">
                    <div>
                        <span className="cohort-eyebrow">PLACEMENT CORRECTION</span>
                        <h2 id="add-cohort-students-title">Add students</h2>
                        <p className="cohort-muted">Select students to include here. Remove their previous placement separately if needed.</p>
                    </div>
                    <button type="button" className="cohort-modal-close" aria-label="Close add students" onClick={onClose} disabled={busy}>×</button>
                </div>
                {error && <p className="cohort-error" role="alert">{error}</p>}
                <fieldset className="cohort-fieldset" disabled={busy}>
                    {directoryLoading && <p role="status">Loading students in this session…</p>}
                    {directoryError && <p role="alert" className="cohort-error">{directoryError}</p>}
                    {candidates.length > 0 && <>
                        <label className="cohort-field">
                            <span>Find a student</span>
                            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or admission number" />
                        </label>
                        <div className="cohort-student-options" role="group" aria-label="Available students">
                            {matching.map((student) => (
                                <label className="cohort-student-option" key={student.studentProfileId}>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(student.studentProfileId)}
                                        onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, student.studentProfileId] : previous.filter((id) => id !== student.studentProfileId))}
                                    />
                                    <span className="cohort-avatar" aria-hidden="true">{initials(student.fullName)}</span>
                                    <span><strong>{student.fullName}</strong><small>{student.admissionNumber}</small></span>
                                    <span className={`cohort-status cohort-status-${student.status.toLowerCase()}`}>{student.status}</span>
                                </label>
                            ))}
                            {!matching.length && <p className="cohort-empty">No students match that search.</p>}
                        </div>
                    </>}
                    {!directoryLoading && !candidates.length && <p className="cohort-muted">No additional students are available to select. You can add students using their profile IDs below.</p>}
                    <label className="cohort-field">
                        <span>Student profile IDs {candidates.length ? "(optional)" : ""}</span>
                        <textarea rows={3} value={profileIds} onChange={(event) => setProfileIds(event.target.value)} aria-describedby="cohort-profile-ids-help" placeholder="Paste student profile IDs" />
                    </label>
                    <p id="cohort-profile-ids-help" className="cohort-muted">Separate IDs with commas or new lines. Students already listed here are skipped.</p>
                </fieldset>
                <div className="cohort-modal-actions">
                    <span className="cohort-muted" aria-live="polite">{submittedIds.length} selected</span>
                    <button type="button" className="dz-btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
                    <button type="submit" className="dz-btn-green" disabled={busy || submittedIds.length === 0}>
                        {busy ? "Adding students…" : `Add ${submittedIds.length || ""} student${submittedIds.length === 1 ? "" : "s"}`}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function CohortDetail({ cohortId, workspace }: { cohortId: string; workspace: Workspace }) {
    const [load, setLoad] = useState<LoadState>({ loading: true, snapshot: null, error: null });
    const [reload, setReload] = useState(0);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<CohortStudent["status"] | "">("");
    const [addOpen, setAddOpen] = useState(false);
    const [admitOpen, setAdmitOpen] = useState(false);
    const [studentName, setStudentName] = useState("");
    const [admissionNumber, setAdmissionNumber] = useState("");
    const [removeTarget, setRemoveTarget] = useState<CohortStudent | null>(null);
    const [mutation, setMutation] = useState<"add" | "remove" | null>(null);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [notice, setNotice] = useState("");
    const mounted = useRef(false);
    const mutationPending = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        let current = true;
        readCohort(cohortId, workspace.organizationId, workspace.sessionId).then(
            (snapshot) => { if (current) setLoad({ loading: false, snapshot, error: null }); },
            (error: unknown) => { if (current) setLoad({ loading: false, snapshot: null, error: errorMessage(error) }); },
        );
        return () => { current = false; };
    }, [cohortId, workspace.organizationId, workspace.sessionId, reload]);

    function retry() {
        setLoad({ loading: true, snapshot: null, error: null });
        setReload((previous) => previous + 1);
    }

    async function updateMembership(kind: "add" | "remove", action: () => Promise<unknown>, successMessage: string) {
        if (mutationPending.current || !load.snapshot || load.snapshot.cohort.organizationId !== workspace.organizationId) return;
        mutationPending.current = true;
        setMutation(kind);
        setMutationError(null);
        setNotice("");
        try {
            await action();
            if (!mounted.current) return;
            setAddOpen(false);
            setAdmitOpen(false);
            setRemoveTarget(null);
            setNotice(successMessage);
            try {
                const snapshot = await readCohort(cohortId, workspace.organizationId, workspace.sessionId);
                if (mounted.current) setLoad({ loading: false, snapshot, error: null });
            } catch (error) {
                if (mounted.current) setLoad({ loading: false, snapshot: null, error: `The change was saved, but the updated student group could not be loaded. ${errorMessage(error)}` });
            }
        } catch (error) {
            if (mounted.current) setMutationError(errorMessage(error));
        } finally {
            mutationPending.current = false;
            if (mounted.current) setMutation(null);
        }
    }

    const backLink = <Link className="cohort-back-link" to={workspace.basePath}>← All {workspace.plural.toLowerCase()}</Link>;
    if (load.loading) return <div className="cohort-page">{backLink}<div className="cohort-card cohort-empty" role="status">Loading students…</div></div>;
    if (load.error || !load.snapshot) return (
        <div className="cohort-page">
            {backLink}
            <div className="cohort-card cohort-empty">
                <h1>Unable to open this {workspace.singular.toLowerCase()}</h1>
                <p className="cohort-error" role="alert">{load.error ?? "This student group could not be found."}</p>
                <button className="dz-btn-outline" onClick={retry}>Try again</button>
            </div>
        </div>
    );

    const { cohort, students } = load.snapshot;
    const university = workspace.institutionType === "University";
    const path = academicPath(cohort, workspace.academicUnits);
    const session = workspace.sessions.find((candidate) => candidate.id === cohort.sessionId);
    const activeCount = students.filter((student) => student.status === "Active").length;
    const matching = students.filter((student) => (!status || student.status === status) && `${student.fullName} ${student.admissionNumber}`.toLowerCase().includes(query.trim().toLowerCase()));
    const busy = mutation !== null;

    return (
        <div className="cohort-page">
            {backLink}
            <header className="cohort-heading">
                <div>
                    <span className="cohort-eyebrow">{workspace.singular.toUpperCase()} OVERVIEW</span>
                    <h1>{cohort.displayName}</h1>
                    <p className="cohort-muted">One group. Every student, connected.</p>
                </div>
                <div className="school-actions">
                    <button className="dz-btn-outline" disabled={busy} onClick={() => { setMutationError(null); setAddOpen(true); }}>Correct placement</button>
                    {import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true" && <button className="dz-btn-green" disabled={busy} onClick={() => { setMutationError(null); setStudentName(""); setAdmissionNumber(""); setAdmitOpen(true); }}>+ Student record</button>}
                </div>
            </header>

            <nav className="cohort-path" aria-label="Academic unit path">
                <span>{workspace.organizationName}</span>
                {path.map((name, index) => <span key={`${index}-${name}`}><span aria-hidden="true"> / </span>{name}</span>)}
                <span aria-current="page"><span aria-hidden="true"> / </span>{cohort.displayName}</span>
            </nav>

            <div className="cohort-detail-summary">
                <section className="cohort-card cohort-detail-stat">
                    <span className="cohort-muted">Students in this {workspace.singular.toLowerCase()}</span>
                    <strong>{cohort.studentCount}</strong>
                    <small>{activeCount} active · {students.length - activeCount} with other statuses</small>
                </section>
                <section className="cohort-card cohort-detail-stat">
                    <span className="cohort-muted">{university ? "Level adviser" : "Form teacher"}</span>
                    <div className="cohort-person">
                        <span className="cohort-avatar" aria-hidden="true">{cohort.formTeacherName ? initials(cohort.formTeacherName) : "—"}</span>
                        <b>{cohort.formTeacherName || "Not assigned"}</b>
                    </div>
                    <small>{university ? "Academic guidance for this level" : "A familiar point of contact for the class"}</small>
                </section>
                <section className="cohort-card cohort-detail-stat">
                    <span className="cohort-muted">Academic session</span>
                    <b>{session?.name ?? "Session information unavailable"}</b>
                    <small>{cohort.stageName}{cohort.arm ? ` · Arm ${cohort.arm}` : ""}</small>
                </section>
            </div>

            {notice && <p className="cohort-success" role="status">{notice}</p>}
            <section className="cohort-card" aria-labelledby="cohort-students-title" aria-busy={busy}>
                <div className="cohort-toolbar">
                    <div>
                        <h2 id="cohort-students-title">Student directory</h2>
                        <p className="cohort-muted">{students.length} student{students.length === 1 ? "" : "s"} in {cohort.displayName}</p>
                    </div>
                    <label className="cohort-field">
                        <span>Search students</span>
                        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or admission number" />
                    </label>
                    <label className="cohort-field">
                        <span>Filter by status</span>
                        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                            <option value="">All statuses</option>
                            {STATUSES.map((value) => <option value={value} key={value}>{value}</option>)}
                        </select>
                    </label>
                </div>
                {students.length === 0 ? (
                    <div className="cohort-empty">
                        <h3>No students admitted yet</h3>
                        <p className="cohort-muted">Students appear here after admission. Use placement corrections for students assigned elsewhere.</p>
                        <button className="dz-btn-outline" disabled={busy} onClick={() => { setMutationError(null); setAddOpen(true); }}>Correct placement</button>
                    </div>
                ) : matching.length === 0 ? (
                    <div className="cohort-empty">
                        <h3>No matching students</h3>
                        <p className="cohort-muted">Try another name, admission number, or status.</p>
                        <button className="dz-btn-outline" onClick={() => { setQuery(""); setStatus(""); }}>Clear filters</button>
                    </div>
                ) : (
                    <div className="cohort-table-wrap">
                        <table className="cohort-table">
                            <caption className="sr-only">Students in {cohort.displayName}</caption>
                            <thead><tr><th scope="col">Student</th><th scope="col">{university ? "Matriculation / admission number" : "Admission number"}</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                            <tbody>
                                {matching.map((student) => (
                                    <tr key={student.studentProfileId}>
                                        <th scope="row"><span className="cohort-person"><span className="cohort-avatar" aria-hidden="true">{initials(student.fullName)}</span>{student.fullName}</span></th>
                                        <td>{student.admissionNumber}</td>
                                        <td><span className={`cohort-status cohort-status-${student.status.toLowerCase()}`}>{student.status}</span></td>
                                        <td><button className="dz-btn-danger-ghost" disabled={busy} aria-label={`Remove ${student.fullName}`} onClick={() => { setMutationError(null); setRemoveTarget(student); }}>Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="cohort-table-count cohort-muted" aria-live="polite">Showing {matching.length} of {students.length} students</p>
                    </div>
                )}
            </section>

            {admitOpen && <Modal titleId="admit-student-title" onClose={() => { if (!busy) setAdmitOpen(false); }}>
                <h2 id="admit-student-title" className="dz-modal-title">New student record</h2>
                <p className="dz-modal-sub">Admit a student into {cohort.displayName}. This frontend record is saved in this browser.</p>
                <form className="dz-form" onSubmit={event => { event.preventDefault(); void updateMembership("add", () => cohortApi.admitStudent(cohortId, { fullName: studentName, admissionNumber }), "Student record saved."); }}>
                    <label className="input-label">Full name<input className="input" required maxLength={120} value={studentName} onChange={event => setStudentName(event.target.value)} /></label>
                    <label className="input-label">Admission number<input className="input" required maxLength={80} value={admissionNumber} onChange={event => setAdmissionNumber(event.target.value)} /></label>
                    {mutationError && <p role="alert" className="cohort-error">{mutationError}</p>}
                    <div className="dz-form-actions"><button type="button" className="dz-btn-outline" disabled={busy} onClick={() => setAdmitOpen(false)}>Cancel</button><button className="dz-btn-green" disabled={busy}>{busy ? "Saving…" : "Save student record"}</button></div>
                </form>
            </Modal>}
            {addOpen && <AddStudentsDialog
                availableStudents={workspace.availableStudents}
                currentStudents={students}
                busy={busy}
                error={mutationError}
                onClose={() => { if (!mutationPending.current) setAddOpen(false); }}
                onSubmit={(ids) => { void updateMembership("add", () => cohortApi.addStudents(cohortId, ids), `${ids.length} student${ids.length === 1 ? "" : "s"} added successfully.`); }}
            />}
            {removeTarget && <Modal titleId="remove-cohort-student-title" maxWidth={480} onClose={() => { if (!mutationPending.current) setRemoveTarget(null); }}>
                <div className="cohort-modal">
                    <div className="cohort-modal-header">
                        <h2 id="remove-cohort-student-title">Remove student from {workspace.singular.toLowerCase()}?</h2>
                        <button type="button" className="cohort-modal-close" aria-label="Close remove student" disabled={busy} onClick={() => setRemoveTarget(null)}>×</button>
                    </div>
                    <p><strong>{removeTarget.fullName}</strong> will be removed from <strong>{cohort.displayName}</strong>. Their student account will remain unchanged.</p>
                    {mutationError && <p className="cohort-error" role="alert">{mutationError}</p>}
                    <div className="cohort-modal-actions">
                        <button className="dz-btn-outline" disabled={busy} onClick={() => setRemoveTarget(null)}>Cancel</button>
                        <button className="dz-btn-danger-ghost" disabled={busy} onClick={() => { void updateMembership("remove", () => cohortApi.removeStudent(cohortId, removeTarget.studentProfileId), `${removeTarget.fullName} was removed successfully.`); }}>{busy ? "Removing student…" : "Remove student"}</button>
                    </div>
                </div>
            </Modal>}
        </div>
    );
}

export default function CohortDetailPage() {
    const { cohortId } = useParams();
    const workspace = useCohortWorkspace();
    if (!cohortId) return <div className="cohort-page"><Link className="cohort-back-link" to={workspace.basePath}>← All {workspace.plural.toLowerCase()}</Link><p className="cohort-error" role="alert">Choose a {workspace.singular.toLowerCase()} to view its students.</p></div>;
    // A new organization or route starts a clean page and cancels stale UI updates.
    return <CohortDetail key={`${workspace.organizationId}:${cohortId}`} cohortId={cohortId} workspace={workspace} />;
}
