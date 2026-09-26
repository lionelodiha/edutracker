import { useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
    updateOrganizationEndpointHandler,
    deleteOrganizationEndpointHandler,
} from "../../api";
import { client } from "../../api/client.gen";
import { API_BASE } from "../../apiBase";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import type { OrganizationContext } from "../../layouts/OrganizationLayout";
import { readSchoolSetup } from "../../features/cohorts/schoolSetup";
import { AcHeader, Badge } from "../../features/academics/ui";
import { formatDay } from "../../features/academics/helpers";
import "../../features/academics/academics.css";
import "./settings.css";

const SECTIONS = [
    { id: "general", label: "General" },
    { id: "academic", label: "Academic" },
    { id: "people", label: "People & access" },
    { id: "danger", label: "Danger zone" },
] as const;

/** School Settings — one section card per setting, each with its own save (Vercel/Geist pattern). */
export default function SchoolSettingsPage() {
    const { id: organizationId } = useParams<{ id: string }>();
    const { org } = useOutletContext<OrganizationContext>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast, show } = useToast();

    const [name, setName] = useState<string | null>(null);
    const [savedName, setSavedName] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    if (!organizationId) return null;

    const isOwner = org ? org.ownerUserId === user?.id : false;
    const originalName = savedName ?? org?.name ?? "";
    const currentName = name ?? originalName;
    const dirty = currentName.trim() !== originalName && currentName.trim().length > 0;
    const setup = readSchoolSetup(organizationId);
    const schoolName = originalName || "this school";

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dirty) return;
        setSaving(true);
        setNameError(null);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: "include" });
            const res = await updateOrganizationEndpointHandler({ path: { id: organizationId }, body: { name: currentName.trim() } });
            if (res.response?.ok) {
                setSavedName(currentName.trim());
                setName(null);
                show("School name updated");
                try { localStorage.setItem(`edutracker.organizationName.${organizationId}`, currentName.trim()); } catch { /* cache is best-effort */ }
            } else {
                const errBody = (res.error ?? res.data) as { message?: string } | undefined;
                setNameError(errBody?.message || "Couldn't update the school name.");
            }
        } catch (err: unknown) {
            setNameError((err as Error)?.message || "Couldn't update the school name.");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (confirmText !== originalName) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            client.setConfig({ baseUrl: API_BASE, credentials: "include" });
            const res = await deleteOrganizationEndpointHandler({ path: { id: organizationId } });
            if (res.response?.ok) navigate("/dashboard/organizations");
            else {
                const errBody = (res.error ?? res.data) as { message?: string } | undefined;
                setDeleteError(errBody?.message || "Couldn't delete the school.");
            }
        } catch (err: unknown) {
            setDeleteError((err as Error)?.message || "Couldn't delete the school.");
        }
        setDeleting(false);
    };

    const copyId = async () => {
        try { await navigator.clipboard.writeText(organizationId); show("School ID copied"); }
        catch { show("Couldn't copy — select the ID and copy it manually", "error"); }
    };

    const base = `/dashboard/organizations/${organizationId}`;
    const modelLabel = setup?.model ? `${setup.model} school` : null;

    return (
        <div className="dz-page ac-page se-page">
            <AcHeader title="School Settings" meta={[schoolName, isOwner ? null : "Only the owner can change these settings"]} />

            <div className="se-layout">
                <nav className="se-nav" aria-label="Settings sections">
                    {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className={s.id === "danger" ? "se-nav-danger" : ""}>{s.label}</a>)}
                </nav>

                <div className="se-sections">
                    <form id="general" className="se-card" onSubmit={handleRename}>
                        <div className="se-card-body">
                            <h2>School name</h2>
                            <p>How the school appears in the sidebar, dashboard, invites and portals.</p>
                            <input className="input se-input" value={currentName} onChange={(e) => { setName(e.target.value); setNameError(null); }} disabled={!isOwner} required maxLength={120} aria-label="School name" aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "se-name-error" : undefined} />
                            {nameError && <p id="se-name-error" role="alert" className="ac-error">{nameError}</p>}
                        </div>
                        <footer className="se-card-foot">
                            <span>Up to 120 characters.</span>
                            {isOwner && <span className="ac-actions">
                                {name !== null && name !== originalName && <button type="button" className="dz-btn-outline" onClick={() => { setName(null); setNameError(null); }}>Reset</button>}
                                <button type="submit" className="dz-btn-green" disabled={!dirty || saving}>{saving ? "Saving…" : "Save"}</button>
                            </span>}
                        </footer>
                    </form>

                    <section className="se-card">
                        <div className="se-card-body">
                            <h2>School details</h2>
                            <p>Set when the school was created. The institution type comes from Academic Structure.</p>
                            <dl className="se-facts">
                                <div><dt>Institution type</dt><dd>{modelLabel ?? <Badge tone="warn">Not set up</Badge>}</dd></div>
                                <div><dt>Created</dt><dd>{org?.createdAt ? formatDay(org.createdAt) : "—"}</dd></div>
                                <div className="se-fact-wide"><dt>School ID</dt><dd><code className="ws-mono se-id">{organizationId}</code><button type="button" className="dz-pill-btn" onClick={() => void copyId()}>Copy</button></dd></div>
                            </dl>
                        </div>
                        <footer className="se-card-foot"><span>Support may ask for the School ID.</span></footer>
                    </section>

                    <section id="academic" className="se-card">
                        <div className="se-card-body">
                            <h2>Academic structure</h2>
                            <p>Faculties, departments, levels, sessions and the course plan are managed in one place.</p>
                        </div>
                        <footer className="se-card-foot">
                            <span>{modelLabel ? `Set up as a ${modelLabel.toLowerCase()}.` : "Not set up yet."}</span>
                            <Link className="dz-btn-outline" to={`${base}/structure`}>Open Academic Structure</Link>
                        </footer>
                    </section>

                    <section id="people" className="se-card">
                        <div className="se-card-body">
                            <h2>People & access</h2>
                            <p>For now, teacher and student accounts are created directly with a temporary password that you share with them. Email invite links will replace this once portal invites ship.</p>
                        </div>
                        <footer className="se-card-foot">
                            <span><Badge tone="warn">Temporary flow</Badge></span>
                            <Link className="dz-btn-outline" to={`${base}/staff`}>Go to Staff & Teachers</Link>
                        </footer>
                    </section>

                    <section id="danger" className="se-card se-card-danger">
                        <div className="se-card-body">
                            <h2>Delete this school</h2>
                            <p>Removes {schoolName} and everything in it. Every member loses access immediately. This can't be undone.</p>
                        </div>
                        <footer className="se-card-foot">
                            <span>{isOwner ? "You'll be asked to type the school name." : "Only the school owner can delete it."}</span>
                            <button type="button" className="ws-btn ws-btn-danger" disabled={!isOwner} onClick={() => { setConfirmText(""); setDeleteError(null); setDeleteOpen(true); }}>Delete school</button>
                        </footer>
                    </section>
                </div>
            </div>

            {deleteOpen && (
                <Modal titleId="se-delete-title" onClose={() => !deleting && setDeleteOpen(false)} maxWidth={460}>
                    <form className="dz-form se-delete" onSubmit={(e) => { e.preventDefault(); void handleDelete(); }}>
                        <h2 id="se-delete-title">Delete {schoolName}?</h2>
                        <p>This permanently removes the school, its structure and its records. Members lose access straight away.</p>
                        <label className="ac-field">
                            <span className="ac-label">Type <strong className="se-confirm-name">{originalName}</strong> to confirm</span>
                            <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus autoComplete="off" spellCheck={false} aria-label="Type the school name to confirm" />
                        </label>
                        {deleteError && <p role="alert" className="ac-error">{deleteError}</p>}
                        <div className="ac-actions" style={{ justifyContent: "flex-end" }}>
                            <button type="button" className="dz-btn-outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</button>
                            <button type="submit" className="ws-btn ws-btn-danger" disabled={confirmText !== originalName || deleting}>{deleting ? "Deleting…" : "Delete school"}</button>
                        </div>
                    </form>
                </Modal>
            )}
            {toast}
        </div>
    );
}
