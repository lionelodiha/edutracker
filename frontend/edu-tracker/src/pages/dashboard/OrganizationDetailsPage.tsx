import SchoolStructureEditor from "../../features/cohorts/SchoolStructureEditor";
import { readSchoolSetup } from "../../features/cohorts/schoolSetup";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    getOrganizationByIdEndpointHandler,
    getOrganizationMembersEndpointHandler,
    addStaffMemberEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import Modal from "../../components/Modal";
import type {
    OrganizationResponse,
    OrganizationMemberResponse,
    OrganizationMemberRole,
} from "../../api";
import { useAuth } from "../../context/AuthContext";

import { API_BASE } from "../../apiBase";

// TEMPORARY — roles available in the "Add Member" modal. The long-term email-invite flow
// will only issue Teacher/Student roles; Admin/Moderator will be granted through the
// existing Update Role endpoint. See School_API_Requirements.md §2.
type AddStaffRole = Extract<OrganizationMemberRole, "Admin" | "Moderator" | "Teacher" | "Student">;

type AddStaffForm = {
    firstName: string;
    middleName: string;
    lastName: string;
    userName: string;
    email: string;
    password: string;
    role: AddStaffRole;
};

const EMPTY_STAFF_FORM: AddStaffForm = {
    firstName: "",
    middleName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    role: "Teacher",
};

function PlusIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z" />
            <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "faculties", label: "Faculties" },
    { id: "departments", label: "Academic structure" },
    { id: "staff", label: "Staff & Teachers" },
    { id: "settings", label: "School Settings" },
] as const;

/** FACULTY-BUILD §8 — faculties as cards that navigate into the workspace. */
function FacultiesTab({ organizationId, onOpen }: { organizationId: string; onOpen: (facultyId: string) => void }) {
    const setup = readSchoolSetup(organizationId);
    const faculties = (setup?.structure.units ?? []).filter((u) => u.parent === null);
    const deptCount = (facultyId: string) =>
        (setup?.structure.units ?? []).filter((u) => u.parent === facultyId).length;
    if (!setup) {
        return (
            <div className="dz-card dz-empty">
                <div className="dz-empty-title">Set up your school first</div>
                <div className="dz-empty-text">Define the academic structure, then each faculty opens as its own workspace.</div>
            </div>
        );
    }
    if (faculties.length === 0) {
        return (
            <div className="dz-card dz-empty">
                <div className="dz-empty-title">No faculties yet</div>
                <div className="dz-empty-text">Add a faculty under Academic structure. It opens as a workspace of its own.</div>
            </div>
        );
    }
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {faculties.map((f) => (
                <button
                    key={f.key}
                    className="dz-card"
                    style={{ textAlign: "left", cursor: "pointer" }}
                    onClick={() => onOpen(f.key)}
                >
                    <div className="dz-card-title">{f.name}</div>
                    <div className="dz-reminder-meta" style={{ margin: "0.35rem 0 0.75rem" }}>
                        {deptCount(f.key)} department{deptCount(f.key) === 1 ? "" : "s"}
                    </div>
                    <span className="dz-btn-outline">Open workspace →</span>
                </button>
            ))}
        </div>
    );
}

export default function OrganizationDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [org, setOrg] = useState<OrganizationResponse | null>(null);
    const [members, setMembers] = useState<OrganizationMemberResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Add Staff Member modal state ---
    const [showAddStaff, setShowAddStaff] = useState(false);
    // The subset of roles that the modal's role dropdown should allow — set by whichever
    // button opened the modal. Lets one modal serve both "Add Admin/Staff" and "Add
    // Teacher/Student" entry points.
    const [allowedRoles, setAllowedRoles] = useState<AddStaffRole[]>([
        "Admin",
        "Moderator",
        "Teacher",
        "Student",
    ]);
    const [addStaffForm, setAddStaffForm] = useState<AddStaffForm>(EMPTY_STAFF_FORM);
    const [addingStaff, setAddingStaff] = useState(false);
    const [addStaffError, setAddStaffError] = useState<string | null>(null);
    const [addStaffSuccess, setAddStaffSuccess] = useState<string | null>(null);

    // Dashboard Tabs
    const [activeTab, setActiveTab] = useState<"overview" | "faculties" | "departments" | "staff" | "settings">(searchParams.get("tab") === "structure" ? "departments" : "overview");

    const fetchDetails = useCallback(async () => {
        if (!id) return;
        client.setConfig({ baseUrl: API_BASE, credentials: 'include' });
        try {
            const orgRes = await getOrganizationByIdEndpointHandler({ path: { id } });
            if (orgRes.data?.data) {
                setOrg(orgRes.data.data);
                try { localStorage.setItem(`edutracker.organizationName.${id}`, orgRes.data.data.name); } catch { /* Name remains visible in this page. */ }
            }

            const membersRes = await getOrganizationMembersEndpointHandler({ path: { id } });
            if (membersRes.data?.data) {
                setMembers(membersRes.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch details:", err);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDetails();
    }, [fetchDetails]);

    const openAddStaffModal = (roles: AddStaffRole[], defaultRole: AddStaffRole) => {
        setAllowedRoles(roles);
        setAddStaffForm({ ...EMPTY_STAFF_FORM, role: defaultRole });
        setAddStaffError(null);
        setAddStaffSuccess(null);
        setShowAddStaff(true);
    };

    const closeAddStaffModal = () => {
        setShowAddStaff(false);
        setAddStaffError(null);
        setAddStaffSuccess(null);
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setAddStaffError(null);
        setAddStaffSuccess(null);
        setAddingStaff(true);

        try {
            client.setConfig({ baseUrl: API_BASE, credentials: 'include' });

            const res = await addStaffMemberEndpointHandler({
                path: { id },
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
                setAddStaffSuccess(
                    `${addStaffForm.firstName} ${addStaffForm.lastName} was added as ${addStaffForm.role}. Share their username and password with them so they can sign in.`
                );
                setAddStaffForm({ ...EMPTY_STAFF_FORM, role: addStaffForm.role });
                await fetchDetails();
            } else {
                const errBody = (res.error ?? res.data) as { message?: string; details?: { message?: string }[] } | undefined;
                const detailMsgs = errBody?.details?.map((d) => d.message).filter(Boolean).join(" ");
                setAddStaffError(detailMsgs || errBody?.message || "Failed to add member.");
            }
        } catch (err: unknown) {
            const error = err as Error;
            setAddStaffError(error?.message || "Failed to add member.");
        }

        setAddingStaff(false);
    };

    if (loading) {
        return (
            <div className="dz-page">
                <div className="dz-page-head">
                    <div>
                        <div className="skeleton" style={{ height: 28, width: 220, borderRadius: 8, marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 14, width: 180, borderRadius: 6 }} />
                    </div>
                </div>
                <div className="dz-grid-stats-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="dz-card">
                            <div className="skeleton" style={{ height: 12, width: "50%", borderRadius: 6, marginBottom: 10 }} />
                            <div className="skeleton" style={{ height: 36, width: 60, borderRadius: 8 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!org) {
        return (
            <div className="dz-page">
                <div className="dz-card dz-empty">
                    <span className="dz-empty-icon"><BuildingIcon /></span>
                    <div className="dz-empty-title">Organization not found</div>
                    <div className="dz-empty-text">This school may have been removed or you may not have access.</div>
                    <button className="dz-btn-outline" style={{ marginTop: "1rem" }} onClick={() => navigate("/dashboard/organizations")}>
                        Back to Organizations
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = org.ownerUserId === user?.id;

    // Filter owners out from the main staff list as requested by the user
    const staffMembers = members.filter(m => m.role !== 'Owner');
    const ownerMember = members.find(m => m.role === 'Owner');

    const teacherCount = members.filter(m => m.role === 'Teacher').length;
    const studentCount = members.filter(m => m.role === 'Student').length;

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <div className="dz-crumb">
                        <button className="dz-pill-btn" onClick={() => navigate("/dashboard/organizations")}>← Organizations</button>
                    </div>
                    <h1 className="dz-page-title">{org.name}</h1>
<button className="dz-btn-outline" onClick={() => navigate(`/dashboard/organizations/${org.id}/sessions`)}>View sessions →</button>
                    <p className="dz-page-sub">
                        {readSchoolSetup(org.id)?.model ?? "School setup needed"} workspace · {members.length} member{members.length === 1 ? "" : "s"}
                        {ownerMember ? ` · Owner ${ownerMember.firstName} ${ownerMember.lastName}` : ""}
                    </p>
                </div>
                {activeTab === "staff" && isOwner && (
                    <button
                        className="dz-btn-green"
                        onClick={() => openAddStaffModal(["Admin", "Moderator", "Teacher", "Student"], "Teacher")}
                    >
                        <PlusIcon /> Add Member
                    </button>
                )}
            </div>

            <div className="dz-tabs" role="tablist" aria-label="School sections">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        role="tab"
                        aria-selected={activeTab === t.id}
                        className={`dz-tab ${activeTab === t.id ? "active" : ""}`}
                        onClick={() => setActiveTab(t.id as typeof activeTab)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
                <>
                    <div className="school-journey">
                        <button onClick={() => setActiveTab("departments")}><span>01 / FOUNDATION</span><strong>Define your structure</strong><small>Institution type, academic units and stages →</small></button>
                        <button onClick={() => navigate(`/dashboard/organizations/${org.id}/sessions`)}><span>02 / ACADEMIC YEAR</span><strong>Open a session</strong><small>Classes, levels and student records →</small></button>
                    </div>
                    <div className="dz-card">
                        <div className="dz-hero">
                            <div className="dz-hero-tile" style={{ background: "#8b5cf6" }}>
                                {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div className="dz-hero-name">{org.name}</div>
                                <div className="dz-hero-sub">
                                    <span className="mono" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem" }}>{org.id}</span>
                                    <span className="dz-status dz-status-green">{(org as unknown as { status?: string }).status ?? "Active"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dz-grid-stats-3">
                        <div className="dz-card dz-stat dz-stat-accent-top">
                            <span className="dz-stat-label">Teachers</span>
                            <div className="dz-stat-value">{teacherCount}</div>
                            <div className="dz-stat-sub">Across all departments</div>
                        </div>
                        <div className="dz-card dz-stat dz-stat-cyan-top">
                            <span className="dz-stat-label">Students</span>
                            <div className="dz-stat-value">{studentCount}</div>
                            <div className="dz-stat-sub">Enrolled in this school</div>
                        </div>
                        <div className="dz-card dz-stat dz-stat-amber-top">
                            <span className="dz-stat-label">Staff &amp; Admins</span>
                            <div className="dz-stat-value">{staffMembers.length - teacherCount - studentCount}</div>
                            <div className="dz-stat-sub">Admins, moderators, support</div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === "departments" && <SchoolStructureEditor key={org.id} organizationId={org.id} editable={isOwner} />}

            {/* TAB: FACULTIES — cards that navigate INTO the workspace, never inline contents. */}
            {activeTab === "faculties" && (
                <FacultiesTab organizationId={org.id} onOpen={(facultyId) => navigate(`/dashboard/organizations/${org.id}/faculties/${facultyId}`)} />
            )}
            
            {/* TAB: STAFF & TEACHERS */}
            {activeTab === "staff" && (
                <div className="dz-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "1.35rem 1.4rem 1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                            <div className="dz-card-title">School staff, teachers &amp; students</div>
                            <div className="dz-reminder-meta" style={{ marginTop: "0.25rem" }}>
                                {staffMembers.length} member{staffMembers.length === 1 ? "" : "s"} enrolled in this school.
                            </div>
                        </div>
                        {isOwner && staffMembers.length > 0 && (
                            <button
                                className="dz-pill-btn"
                                onClick={() => openAddStaffModal(["Admin", "Moderator", "Teacher", "Student"], "Teacher")}
                            >
                                <PlusIcon /> Add
                            </button>
                        )}
                    </div>

                    {staffMembers.length === 0 ? (
                        <div className="dz-empty">
                            <span className="dz-empty-icon"><UsersIcon /></span>
                            <div className="dz-empty-title">No members yet</div>
                            <div className="dz-empty-text">Add a teacher, student, or staff account to populate this school.</div>
                            {isOwner && (
                                <button
                                    className="dz-btn-green"
                                    style={{ marginTop: "1rem" }}
                                    onClick={() => openAddStaffModal(["Admin", "Moderator", "Teacher", "Student"], "Teacher")}
                                >
                                    <PlusIcon /> Add Member
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="dz-table-wrap">
                            <table className="dz-table">
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffMembers.map((m) => (
                                        <tr key={m.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                                                    {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.userName}
                                                    {m.userId === user?.id && (
                                                        <span className="dz-status dz-status-gray" style={{ marginLeft: "0.5rem" }}>You</span>
                                                    )}
                                                </div>
                                                <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>@{m.userName}</div>
                                            </td>
                                            <td>
                                                <span className={`dz-status ${
                                                    m.role === 'Admin' ? 'dz-status-green' :
                                                    m.role === 'Teacher' ? 'dz-status-green' :
                                                    m.role === 'Student' ? 'dz-status-amber' :
                                                    'dz-status-gray'
                                                }`}>
                                                    {m.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`dz-status ${m.status === 'Active' ? 'dz-status-green' : 'dz-status-amber'}`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                                {new Date(m.joinedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: SETTINGS & ONBOARDING */}
            {activeTab === "settings" && (
                <>
                    <div className="dz-card">
                        <div className="dz-card-head">
                            <span className="dz-card-title">Academic structure</span>
                        </div>
                        <p className="dz-reminder-meta" style={{ marginBottom: "1rem" }}>
                            Configure terms and courses for {org.name}. Changes apply school-wide.
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button className="dz-btn-outline" onClick={() => navigate(`/dashboard/organizations/${id}/sessions`)}>
                                Sessions / Terms
                            </button>
                            <button className="dz-btn-outline" onClick={() => navigate(`/dashboard/organizations/${id}/courses`)}>
                                Manage Courses
                            </button>
                        </div>
                    </div>

                    <div className="dz-card">
                        <div className="dz-card-head">
                            <span className="dz-card-title">Invite teachers &amp; students</span>
                            <span className="dz-status dz-status-amber">Temporary flow</span>
                        </div>
                        <p className="dz-reminder-meta" style={{ lineHeight: 1.65, marginBottom: "1rem" }}>
                            For now, create teacher and student accounts directly with a name,
                            email, username, and temporary password. Share those credentials so they can
                            sign in at <code className="mono" style={{ color: "var(--accent-light)" }}>/login</code>.
                            This will be replaced by email invite links once the portal-invite
                            endpoints ship.
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                                className="dz-btn-green"
                                onClick={() => openAddStaffModal(["Teacher"], "Teacher")}
                            >
                                <PlusIcon /> Add Teacher
                            </button>
                            <button
                                className="dz-btn-outline"
                                onClick={() => openAddStaffModal(["Student"], "Student")}
                            >
                                <PlusIcon /> Add Student
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Add Staff Member Modal */}
            {showAddStaff && (
                <Modal titleId="add-staff-title" onClose={closeAddStaffModal} maxWidth={520}>
                        <h2 id="add-staff-title" className="dz-modal-title">
                            Add Member to {org.name}
                        </h2>
                        <p className="dz-modal-sub">
                            Creates a user account and adds them to this school in one step.
                        </p>
                        <form onSubmit={handleAddStaff} className="dz-form">
                            {addStaffError && (
                                <div className="alert alert-error">
                                    <span>{addStaffError}</span>
                                </div>
                            )}
                            {addStaffSuccess && (
                                <div className="alert alert-success">
                                    <span>{addStaffSuccess}</span>
                                </div>
                            )}

                            <div>
                                <label className="input-label" htmlFor="staff-role">Role</label>
                                <select
                                    id="staff-role"
                                    className="input"
                                    value={addStaffForm.role}
                                    onChange={(e) => setAddStaffForm(f => ({ ...f, role: e.target.value as AddStaffRole }))}
                                    disabled={allowedRoles.length === 1}
                                >
                                    {allowedRoles.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="dz-form-grid-2">
                                <div>
                                    <label className="input-label" htmlFor="staff-first">First Name</label>
                                    <input
                                        id="staff-first"
                                        className="input"
                                        value={addStaffForm.firstName}
                                        onChange={(e) => setAddStaffForm(f => ({ ...f, firstName: e.target.value }))}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="input-label" htmlFor="staff-last">Last Name</label>
                                    <input
                                        id="staff-last"
                                        className="input"
                                        value={addStaffForm.lastName}
                                        onChange={(e) => setAddStaffForm(f => ({ ...f, lastName: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="input-label" htmlFor="staff-middle">Middle Name (optional)</label>
                                <input
                                    id="staff-middle"
                                    className="input"
                                    value={addStaffForm.middleName}
                                    onChange={(e) => setAddStaffForm(f => ({ ...f, middleName: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="input-label" htmlFor="staff-username">Username</label>
                                <input
                                    id="staff-username"
                                    className="input"
                                    value={addStaffForm.userName}
                                    onChange={(e) => setAddStaffForm(f => ({ ...f, userName: e.target.value }))}
                                    placeholder="jsmith"
                                    required
                                />
                            </div>

                            <div>
                                <label className="input-label" htmlFor="staff-email">Email</label>
                                <input
                                    id="staff-email"
                                    className="input"
                                    type="email"
                                    value={addStaffForm.email}
                                    onChange={(e) => setAddStaffForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="jsmith@school.edu"
                                    required
                                />
                            </div>

                            <div>
                                <label className="input-label" htmlFor="staff-pw">Temporary Password</label>
                                <input
                                    id="staff-pw"
                                    className="input"
                                    type="text"
                                    value={addStaffForm.password}
                                    onChange={(e) => setAddStaffForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="At least 8 chars, with upper, lower, number, symbol"
                                    required
                                />
                                <span className="dz-hint">
                                    Share this password with the user. They can change it after signing in.
                                </span>
                            </div>

                            <div className="dz-form-actions">
                                <button type="button" className="dz-btn-outline" onClick={closeAddStaffModal}>
                                    {addStaffSuccess ? "Close" : "Cancel"}
                                </button>
                                <button type="submit" className="dz-btn-green" disabled={addingStaff}>
                                    {addingStaff ? "Creating…" : `Create ${addStaffForm.role} Account`}
                                </button>
                            </div>
                        </form>
                </Modal>
            )}
        </div>
    );
}
