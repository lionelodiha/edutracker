import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
    getOrganizationMembersEndpointHandler,
    addStaffMemberEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import type { OrganizationMemberResponse, OrganizationMemberRole } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../apiBase";
import { readSchoolSetup } from "../../features/cohorts/schoolSetup";
import { facultyApi, FacultyApiError } from "../../features/faculty/api";
import type { StaffProfile } from "../../features/staff/types";
import type { OrganizationContext } from "../../layouts/OrganizationLayout";
import { AcHeader, Badge, Drawer, EmptyState, Segmented } from "../../features/academics/ui";
import { formatDay, initials, monogramColour } from "../../features/academics/helpers";
import "../../features/academics/academics.css";
import "./staff.css";

type AddStaffRole = Extract<OrganizationMemberRole, "Admin" | "Moderator" | "Teacher" | "Student">;
type AddStaffForm = { firstName: string; middleName: string; lastName: string; userName: string; email: string; password: string; role: AddStaffRole };
type View = "accounts" | "records";
const ROLES: AddStaffRole[] = ["Admin", "Moderator", "Teacher", "Student"];
const EMPTY_STAFF_FORM: AddStaffForm = { firstName: "", middleName: "", lastName: "", userName: "", email: "", password: "", role: "Teacher" };

const roleTone = (role: string) => role === "Admin" || role === "Owner" ? "code" : role === "Teacher" ? "upcoming" : "neutral";
const statusTone = (status: string) => status === "Active" ? "current" : status === "Banned" || status === "Suspended" ? "warn" : "closed";
const fullName = (m: OrganizationMemberResponse) => (m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.userName);

function Avatar({ name }: { name: string }) {
    const colour = monogramColour(name);
    return <span className="ws-avatar" style={{ color: colour, background: `${colour}24` }} aria-hidden="true">{initials(name) || "?"}</span>;
}

/** Staff & Teachers — one directory with two views: school accounts and faculty staff records. */
export default function StaffPage() {
    const { id: organizationId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { org } = useOutletContext<OrganizationContext>();
    const { toast, show } = useToast();

    const [view, setView] = useState<View>("accounts");
    const [members, setMembers] = useState<OrganizationMemberResponse[]>([]);
    const [membersState, setMembersState] = useState<"loading" | "ready" | "error">("loading");
    const [records, setRecords] = useState<StaffProfile[]>([]);
    const [recordsState, setRecordsState] = useState<"loading" | "ready" | "error">("loading");
    const [recordsError, setRecordsError] = useState("");

    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<AddStaffRole | "">("");
    const [facultyFilter, setFacultyFilter] = useState("");
    const [kindFilter, setKindFilter] = useState("");
    const [openMember, setOpenMember] = useState<OrganizationMemberResponse | null>(null);
    const [openRecord, setOpenRecord] = useState<StaffProfile | null>(null);

    const [showAddStaff, setShowAddStaff] = useState(false);
    const [addStaffForm, setAddStaffForm] = useState<AddStaffForm>(EMPTY_STAFF_FORM);
    const [addingStaff, setAddingStaff] = useState(false);
    const [addStaffError, setAddStaffError] = useState<string | null>(null);
    const [addStaffSuccess, setAddStaffSuccess] = useState<string | null>(null);

    const setup = organizationId ? readSchoolSetup(organizationId) : undefined;
    const units = useMemo(() => setup?.structure.units ?? [], [setup]);
    const faculties = useMemo(() => units.filter((u) => u.parent === null), [units]);
    const unitName = useMemo(() => new Map(units.map((u) => [u.key, u.name])), [units]);
    const isOwner = org ? org.ownerUserId === user?.id : false;
    /** Faculty-office staff sit on the faculty itself; everyone else on a department under it. */
    const facultyOf = (s: StaffProfile) => s.unitKind === "Faculty" ? s.unitId : units.find((u) => u.key === s.unitId)?.parent ?? null;

    const fetchMembers = useCallback(async () => {
        if (!organizationId) return;
        client.setConfig({ baseUrl: API_BASE, credentials: "include" });
        try {
            const res = await getOrganizationMembersEndpointHandler({ path: { id: organizationId } });
            if (res.data?.data) { setMembers(res.data.data); setMembersState("ready"); }
            else setMembersState("error");
        } catch {
            setMembersState("error");
        }
    }, [organizationId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async; state lands after the request.
        void fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        if (!organizationId) return;
        let live = true;
        facultyApi
            .staff(organizationId, facultyFilter ? { facultyId: facultyFilter } : {})
            .then((list) => { if (live) { setRecords(list.items); setRecordsError(""); setRecordsState("ready"); } })
            .catch((e) => { if (live) { setRecordsError(e instanceof FacultyApiError ? e.message : "Could not load staff records."); setRecordsState("error"); } });
        return () => { live = false; };
    }, [organizationId, facultyFilter]);

    const people = useMemo(() => members.filter((m) => m.role !== "Owner"), [members]);
    const roleCounts = useMemo(() => Object.fromEntries(ROLES.map((r) => [r, people.filter((m) => m.role === r).length])) as Record<AddStaffRole, number>, [people]);
    const q = query.trim().toLowerCase();
    const shownMembers = people
        .filter((m) => !roleFilter || m.role === roleFilter)
        .filter((m) => !q || `${fullName(m)} ${m.userName}`.toLowerCase().includes(q))
        .sort((a, b) => fullName(a).localeCompare(fullName(b)));
    const kinds = [...new Set(records.map((r) => r.kind))].sort();
    const shownRecords = records
        .filter((r) => !kindFilter || r.kind === kindFilter)
        .filter((r) => !q || `${r.fullName} ${r.staffNumber}`.toLowerCase().includes(q))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

    const openAddStaffModal = () => {
        setAddStaffForm({ ...EMPTY_STAFF_FORM, role: roleFilter || "Teacher" });
        setAddStaffError(null);
        setAddStaffSuccess(null);
        setShowAddStaff(true);
    };
    const closeAddStaffModal = () => { setShowAddStaff(false); setAddStaffError(null); setAddStaffSuccess(null); };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationId) return;
        setAddStaffError(null);
        setAddStaffSuccess(null);
        setAddingStaff(true);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: "include" });
            const res = await addStaffMemberEndpointHandler({
                path: { id: organizationId },
                body: {
                    firstName: addStaffForm.firstName,
                    middleName: addStaffForm.middleName || null,
                    lastName: addStaffForm.lastName,
                    userName: addStaffForm.userName,
                    email: addStaffForm.email,
                    password: addStaffForm.password,
                    role: addStaffForm.role,
                },
            });
            if (res.response?.ok) {
                setAddStaffSuccess(`${addStaffForm.firstName} ${addStaffForm.lastName} was added as ${addStaffForm.role}. Share their username and password with them so they can sign in.`);
                show(`${addStaffForm.firstName} ${addStaffForm.lastName} added as ${addStaffForm.role}`);
                setAddStaffForm({ ...EMPTY_STAFF_FORM, role: addStaffForm.role });
                await fetchMembers();
            } else {
                const errBody = (res.error ?? res.data) as { message?: string; details?: { message?: string }[] } | undefined;
                const detailMsgs = errBody?.details?.map((d) => d.message).filter(Boolean).join(" ");
                setAddStaffError(detailMsgs || errBody?.message || "Failed to add member.");
            }
        } catch (err: unknown) {
            setAddStaffError((err as Error)?.message || "Failed to add member.");
        }
        setAddingStaff(false);
    };

    if (!organizationId) return null;

    const teacherCount = roleCounts.Teacher;
    const meta = membersState === "ready"
        ? [`${people.length} ${people.length === 1 ? "person" : "people"}`, `${teacherCount} teacher${teacherCount === 1 ? "" : "s"}`, recordsState === "ready" ? `${records.length} staff record${records.length === 1 ? "" : "s"}` : null]
        : ["Loading…"];

    return (
        <div className="dz-page ac-page st-page">
            <AcHeader
                title="Staff & Teachers"
                meta={meta}
                actions={isOwner ? <button className="dz-btn-green" onClick={openAddStaffModal}>+ Add member</button> : undefined}
            />

            <div className="st-toolbar">
                <Segmented label="Directory" value={view} onChange={(next) => { setView(next); setQuery(""); }}
                    options={[{ value: "accounts", label: "School accounts" }, { value: "records", label: "Staff records" }]} />
                <label className="st-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={view === "accounts" ? "Search name or username" : "Search name or staff number"} aria-label="Search people" />
                </label>
            </div>

            {view === "accounts" ? (
                <>
                    <div className="st-chips" role="radiogroup" aria-label="Filter by role">
                        {([["", "All", people.length], ...ROLES.map((r) => [r, `${r}s`, roleCounts[r]] as const)] as const).map(([value, label, n]) => (
                            <button key={label} type="button" role="radio" aria-checked={roleFilter === value} className={`st-chip ${roleFilter === value ? "active" : ""}`} onClick={() => setRoleFilter(value as AddStaffRole | "")}>
                                {label}<span>{membersState === "ready" ? n : "–"}</span>
                            </button>
                        ))}
                    </div>

                    {membersState === "loading" ? <ListSkeleton />
                        : membersState === "error" ? <EmptyState title="Couldn't load members" text="Check your connection and try again." action={<button className="dz-btn-outline" onClick={() => { setMembersState("loading"); void fetchMembers(); }}>Try again</button>} />
                        : !people.length ? <EmptyState title="No members yet" text="Add a teacher, student or staff account to start filling this school." action={isOwner ? <button className="dz-btn-green" onClick={openAddStaffModal}>+ Add member</button> : undefined} />
                        : (
                            <section className="ws-surface" aria-label="School accounts">
                                <div className="ws-row ws-row-head st-grid-accounts"><span>Member</span><span>Role</span><span>Status</span><span className="st-hide-sm">Joined</span></div>
                                {shownMembers.length ? shownMembers.map((m) => (
                                    <button key={m.id} type="button" className="ws-row st-grid-accounts" onClick={() => setOpenMember(m)}>
                                        <span className="ws-person"><Avatar name={fullName(m)} /><span style={{ minWidth: 0 }}><strong>{fullName(m)}{m.userId === user?.id && <span className="st-you">You</span>}</strong><small>@{m.userName}</small></span></span>
                                        <span><Badge tone={roleTone(m.role)}>{m.role}</Badge></span>
                                        <span><Badge tone={statusTone(m.status)}>{m.status}</Badge></span>
                                        <span className="ws-muted st-hide-sm">{formatDay(m.joinedAt)}</span>
                                    </button>
                                )) : <p className="st-none">No one matches{query ? ` “${query}”` : ""}{roleFilter ? ` in ${roleFilter}s` : ""}.</p>}
                            </section>
                        )}
                </>
            ) : (
                <>
                    <div className="st-filters">
                        <select className="input" value={facultyFilter} onChange={(e) => { setFacultyFilter(e.target.value); setRecordsState("loading"); }} aria-label="Filter by faculty">
                            <option value="">All faculties</option>
                            {faculties.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
                        </select>
                        <select className="input" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} aria-label="Filter by kind">
                            <option value="">All kinds</option>
                            {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <span className="ws-muted">{recordsState === "ready" ? `${shownRecords.length} of ${records.length}` : ""}</span>
                    </div>

                    {recordsState === "loading" ? <ListSkeleton />
                        : recordsState === "error" ? <EmptyState title="Couldn't load staff records" text={recordsError} />
                        : !records.length ? <EmptyState title="No staff records yet" text="Staff records are created from a faculty's workspace in Academic Structure." action={<Link className="dz-btn-outline" to={`/dashboard/organizations/${organizationId}/structure`}>Open Academic Structure</Link>} />
                        : (
                            <section className="ws-surface" aria-label="Staff records">
                                <div className="ws-row ws-row-head st-grid-records"><span>Staff</span><span className="st-hide-sm">Unit</span><span>Kind</span><span>Status</span></div>
                                {shownRecords.length ? shownRecords.map((s) => (
                                    <button key={s.staffProfileId} type="button" className="ws-row st-grid-records" onClick={() => setOpenRecord(s)}>
                                        <span className="ws-person"><Avatar name={s.fullName} /><span style={{ minWidth: 0 }}><strong>{s.title ? `${s.title} ` : ""}{s.fullName}</strong><small className="ws-mono">{s.staffNumber}</small></span></span>
                                        <span className="ws-muted st-hide-sm">{unitName.get(s.unitId) ?? "—"}</span>
                                        <span><Badge>{s.kind}</Badge></span>
                                        <span><Badge tone={statusTone(s.status)}>{s.status}</Badge></span>
                                    </button>
                                )) : <p className="st-none">No staff match these filters.</p>}
                            </section>
                        )}
                </>
            )}

            {openMember && (
                <Drawer title={fullName(openMember)} onClose={() => setOpenMember(null)}>
                    <div className="st-drawer-hero"><Avatar name={fullName(openMember)} /><div><strong>{fullName(openMember)}</strong><small>@{openMember.userName}</small></div></div>
                    <dl className="ac-dl">
                        <dt>Role</dt><dd><Badge tone={roleTone(openMember.role)}>{openMember.role}</Badge></dd>
                        <dt>Status</dt><dd><Badge tone={statusTone(openMember.status)}>{openMember.status}</Badge></dd>
                        <dt>Joined</dt><dd>{formatDay(openMember.joinedAt)}</dd>
                    </dl>
                    <p className="ws-muted" style={{ margin: 0 }}>Role changes and removal will live here once those endpoints exist.</p>
                </Drawer>
            )}

            {openRecord && (
                <Drawer title={openRecord.fullName} onClose={() => setOpenRecord(null)}
                    footer={facultyOf(openRecord) ? <><span /><Link className="dz-btn-outline" to={`/dashboard/organizations/${organizationId}/faculties/${facultyOf(openRecord)}`}>Open faculty workspace</Link></> : undefined}>
                    <div className="st-drawer-hero"><Avatar name={openRecord.fullName} /><div><strong>{openRecord.title ? `${openRecord.title} ` : ""}{openRecord.fullName}</strong><small className="ws-mono">{openRecord.staffNumber}</small></div></div>
                    <dl className="ac-dl">
                        <dt>Unit</dt><dd>{unitName.get(openRecord.unitId) ?? "—"} <span className="ws-muted">({openRecord.unitKind})</span></dd>
                        <dt>Kind</dt><dd>{openRecord.kind}</dd>
                        <dt>Status</dt><dd><Badge tone={statusTone(openRecord.status)}>{openRecord.status}</Badge></dd>
                        <dt>School email</dt><dd>{openRecord.schoolEmail || "—"}</dd>
                        <dt>Appointed</dt><dd>{formatDay(openRecord.appointedOn)}</dd>
                        {openRecord.highestQualification && <><dt>Qualification</dt><dd>{openRecord.highestQualification}</dd></>}
                        <dt>Login</dt><dd>{openRecord.userId ? "Has an account" : <Badge tone="warn">No login yet</Badge>}</dd>
                    </dl>
                </Drawer>
            )}

            {showAddStaff && (
                <Modal titleId="add-staff-title" onClose={closeAddStaffModal} maxWidth={520}>
                    <form onSubmit={handleAddStaff} className="dz-form st-form">
                        <div>
                            <h2 id="add-staff-title" className="st-modal-title">Add member</h2>
                            <p className="ws-muted" style={{ margin: ".25rem 0 0" }}>Creates an account and adds it to {org?.name ?? "this school"} in one step.</p>
                        </div>
                        {addStaffError && <p role="alert" className="ac-notice ac-notice-warn" style={{ margin: 0 }}>{addStaffError}</p>}
                        {addStaffSuccess && <p role="status" className="ac-notice st-notice-ok" style={{ margin: 0 }}>{addStaffSuccess}</p>}
                        <div className="ac-field">
                            <span className="ac-label">Role</span>
                            <div className="st-chips" role="radiogroup" aria-label="Role">
                                {ROLES.map((r) => <button key={r} type="button" role="radio" aria-checked={addStaffForm.role === r} className={`st-chip ${addStaffForm.role === r ? "active" : ""}`} onClick={() => setAddStaffForm((f) => ({ ...f, role: r }))}>{r}</button>)}
                            </div>
                        </div>
                        <div className="ac-form-grid">
                            <label className="ac-field"><span className="ac-label">First name</span><input className="input" value={addStaffForm.firstName} onChange={(e) => setAddStaffForm((f) => ({ ...f, firstName: e.target.value }))} required autoFocus /></label>
                            <label className="ac-field"><span className="ac-label">Last name</span><input className="input" value={addStaffForm.lastName} onChange={(e) => setAddStaffForm((f) => ({ ...f, lastName: e.target.value }))} required /></label>
                            <label className="ac-field ac-span"><span className="ac-label">Middle name <span className="ac-hint">(optional)</span></span><input className="input" value={addStaffForm.middleName} onChange={(e) => setAddStaffForm((f) => ({ ...f, middleName: e.target.value }))} /></label>
                            <label className="ac-field"><span className="ac-label">Username</span><input className="input" value={addStaffForm.userName} onChange={(e) => setAddStaffForm((f) => ({ ...f, userName: e.target.value }))} placeholder="jsmith" required autoComplete="off" /></label>
                            <label className="ac-field"><span className="ac-label">Email</span><input className="input" type="email" value={addStaffForm.email} onChange={(e) => setAddStaffForm((f) => ({ ...f, email: e.target.value }))} placeholder="jsmith@school.edu" required /></label>
                            <label className="ac-field ac-span"><span className="ac-label">Temporary password</span><input className="input" type="text" value={addStaffForm.password} onChange={(e) => setAddStaffForm((f) => ({ ...f, password: e.target.value }))} placeholder="8+ characters with upper, lower, number, symbol" required autoComplete="off" /><span className="ac-hint">Share this with them. They can change it after signing in.</span></label>
                        </div>
                        <div className="ac-actions" style={{ justifyContent: "flex-end" }}>
                            <button type="button" className="dz-btn-outline" onClick={closeAddStaffModal}>{addStaffSuccess ? "Done" : "Cancel"}</button>
                            <button type="submit" className="dz-btn-green" disabled={addingStaff}>{addingStaff ? "Creating…" : `Create ${addStaffForm.role.toLowerCase()} account`}</button>
                        </div>
                    </form>
                </Modal>
            )}
            {toast}
        </div>
    );
}

function ListSkeleton() {
    return <div className="ws-surface" aria-busy="true" aria-label="Loading">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="ws-row"><div className="skeleton" style={{ height: 18, width: `${60 - i * 6}%`, borderRadius: 6 }} /></div>)}</div>;
}
