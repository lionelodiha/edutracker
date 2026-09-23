/**
 * FACULTY-BUILD §4 + §5 — invitations, approval queue, resend/revoke.
 * Placement fields are set by the inviter and read-only from the form
 * onward; the form never sends them.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { readSchoolSetup, unitKindOf } from "../cohorts/schoolSetup";
import { facultyApi, FacultyApiError } from "./api";
import type { Invitation, PendingRecord } from "../onboarding/invitations";
import type { StaffProfile } from "../staff/types";
import type { StaffKind } from "../staff/types";
import { useAuth } from "../../context/AuthContext";

// The inviter selects the real session; a hard-coded year would misplace an intake.

export default function PendingQueuePage() {
  const { user } = useAuth();
  const { id: organizationId = "", facultyId = "" } = useParams<{ id: string; facultyId: string }>();
  const [pending, setPending] = useState<PendingRecord[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [inviteMode, setInviteMode] = useState<null | "student-single" | "student-batch" | "staff-single">(null);

  const setup = readSchoolSetup(organizationId);
  const units = useMemo(() => setup?.structure.units ?? [], [setup]);
  const stages = useMemo(() => setup?.structure.stages ?? [], [setup]);
  const departments = useMemo(() => units.filter((u) => u.parent === facultyId), [units, facultyId]);
  const programmes = useMemo(() => {
    if (!setup) return [];
    const deptKeys = new Set(departments.map((d) => d.key));
    return units.filter(
      (u) =>
        (setup.model !== "University" || unitKindOf(setup.structure, u.key) === "Programme") &&
        u.parent !== null &&
        (deptKeys.has(u.parent) || u.parent === facultyId),
    );
  }, [setup, units, departments, facultyId]);

  const inviteById = useMemo(() => new Map(invitations.map((i) => [i.invitationId, i])), [invitations]);
  const staffById = useMemo(() => new Map(staff.map((s) => [s.staffProfileId, s])), [staff]);
  const reviewer = staff.find(member => member.userId === user?.id);
  const reviewerId = reviewer?.staffProfileId ?? "";

  async function reload() {
    setLoading(true);
    try {
      const [p, inv, people] = await Promise.all([
        facultyApi.pending(organizationId, { facultyId }),
        facultyApi.invitations(organizationId),
        facultyApi.staff(organizationId, { facultyId }),
      ]);
      setPending(p);
      setInvitations(inv);
      setStaff(people.items);
      setError("");
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not load the approval queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, facultyId]);

  async function approve(pendingRecordId: string) {
    setError("");
    setNotice("");
    if (!reviewerId) {
      setError("Your account must be linked to a Dean or HOD staff record before you can approve.");
      return;
    }
    try {
      const result = await facultyApi.approvePending(organizationId, pendingRecordId, reviewerId);
      if (result.type === "Student") {
        setNotice(`Approved. Matriculation number ${result.matriculationNumber}, email ${result.schoolEmail}.`);
      } else {
        setNotice(`Approved. Staff number ${result.staffNumber}, email ${result.schoolEmail}.`);
      }
      await reload();
      setReviewId(null);
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not approve this record.");
    }
  }

  async function reject(pendingRecordId: string) {
    setError("");
    setNotice("");
    if (!reviewerId) {
      setError("Your account must be linked to a Dean or HOD staff record before you can reject.");
      return;
    }
    if (!rejectReason.trim()) {
      setError("Give a reason. The person sees it and resubmits against it.");
      return;
    }
    try {
      await facultyApi.rejectPending(organizationId, pendingRecordId, reviewerId, rejectReason.trim());
      setNotice("Rejected with reason. A mock email was queued and the invitation is open for resubmission.");
      setRejectId(null);
      setRejectReason("");
      await reload();
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not reject this record.");
    }
  }

  async function resend(invitationId: string) {
    setError("");
    setNotice("");
    try {
      const inv = await facultyApi.resendInvitation(organizationId, invitationId);
      setNotice(`New mock invitation queued. Share this link: /join/${inv.token}`);
      await reload();
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not resend this invitation.");
    }
  }

  async function revoke(invitationId: string) {
    setError("");
    setNotice("");
    try {
      await facultyApi.revokeInvitation(organizationId, invitationId);
      setNotice("Invitation revoked.");
      await reload();
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not revoke this invitation.");
    }
  }

  const awaiting = pending.filter((p) => p.status === "AwaitingReview");
  const decided = pending.filter((p) => p.status !== "AwaitingReview");
  const reviewRecord = awaiting.find(record => record.pendingRecordId === reviewId);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div className="dz-card">
        <div className="dz-card-head">
          <span className="dz-card-title">Approval queue</span>
          <span className="dz-reminder-meta">{awaiting.length} awaiting review</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "end" }}>
          <p className="dz-reminder-meta">Signed in as {reviewer ? `${reviewer.fullName} · ${reviewer.staffNumber}` : "an account without a linked staff record"}. Link your own record in Officers to review or invite.</p>
          <button className="dz-btn-green" onClick={() => setInviteMode("student-single")}>Invite student</button>
          <button className="dz-btn-outline" onClick={() => setInviteMode("student-batch")}>Pasted list</button>
          <button className="dz-btn-outline" onClick={() => setInviteMode("staff-single")}>Invite staff</button>
        </div>
        {error && <p role="alert" className="cohort-error">{error}</p>}
        {notice && <p role="status" className="school-saved">{notice}</p>}
        {loading ? (
          <p className="dz-reminder-meta">Loading approvals…</p>
        ) : awaiting.length === 0 ? (
          <div className="dz-empty">
            <div className="dz-empty-title">Nothing waiting</div>
            <div className="dz-empty-text">Invite students or staff above; completed forms appear here for review.</div>
          </div>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>For</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {awaiting.map((p) => {
                  const inv = inviteById.get(p.invitationId);
                  const submitted = p.submitted as Record<string, unknown>;
                  return (
                    <tr key={p.pendingRecordId}>
                      <td style={{ fontWeight: 600 }}>{String(submitted.fullName ?? "—")}</td>
                      <td>
                        {inv?.kind === "Student"
                          ? `${units.find((u) => u.key === inv.programmeId)?.name ?? inv.programmeId} · ${stages.find((s) => s.key === inv.entryStageId)?.name ?? inv.entryStageId}`
                          : `Staff · ${units.find((u) => u.key === inv?.departmentId)?.name ?? inv?.departmentId}`}
                      </td>
                      <td>{p.submittedAt.slice(0, 10)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          <button className="dz-btn-green" onClick={() => setReviewId(p.pendingRecordId)}>Review details</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rejectId && (
          <Modal titleId="reject-title" onClose={() => setRejectId(null)}>
            <h2 id="reject-title" className="dz-modal-title">Reject with a reason</h2>
            <p className="dz-modal-sub">The person sees this reason and resubmits against it.</p>
            <label className="input-label">
              Reason
              <textarea className="input" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </label>
            <div className="dz-form-actions">
              <button className="dz-btn-outline" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="dz-btn-green" onClick={() => void reject(rejectId)}>Send rejection</button>
            </div>
          </Modal>
        )}
        {reviewRecord && (
          <Modal titleId="review-title" onClose={() => setReviewId(null)} maxWidth={640}>
            <h2 id="review-title" className="dz-modal-title">Review submitted form</h2>
            <p className="dz-modal-sub">Confirm these details before creating a live school record and number.</p>
            <dl style={{ display: "grid", gridTemplateColumns: "minmax(130px, 1fr) 2fr", gap: "0.5rem 1rem", margin: "1rem 0" }}>
              {Object.entries(reviewRecord.submitted).filter(([key]) => key !== "photograph").map(([key, value]) => (
                <div key={key} style={{ display: "contents" }}><dt style={{ textTransform: "capitalize", color: "var(--text-muted)" }}>{key.replace(/([A-Z])/g, " $1")}</dt><dd style={{ margin: 0, overflowWrap: "anywhere" }}>{String(value ?? "—")}</dd></div>
              ))}
            </dl>
            {typeof reviewRecord.submitted.photograph === "string" && reviewRecord.submitted.photograph.startsWith("data:image/") && (
              <img src={reviewRecord.submitted.photograph} alt="Submitted applicant photograph" style={{ maxWidth: 160, maxHeight: 160, objectFit: "cover", borderRadius: 8 }} />
            )}
            <div className="dz-form-actions">
              <button className="dz-btn-outline" onClick={() => setReviewId(null)}>Close</button>
              <button className="dz-btn-outline" onClick={() => { setReviewId(null); setRejectId(reviewRecord.pendingRecordId); setRejectReason(""); }}>Reject</button>
              <button className="dz-btn-green" onClick={() => void approve(reviewRecord.pendingRecordId)}>Approve</button>
            </div>
          </Modal>
        )}
      </div>

      {decided.length > 0 && (
        <div className="dz-card">
          <div className="dz-card-head"><span className="dz-card-title">Decided</span></div>
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Decision</th>
                  <th>Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((p) => (
                  <tr key={p.pendingRecordId}>
                    <td>{String((p.submitted as Record<string, unknown>).fullName ?? "—")}</td>
                    <td>
                      <span className={`dz-status ${p.status === "Approved" ? "dz-status-green" : "dz-status-red"}`}>{p.status}</span>
                      {p.status === "Rejected" && p.rejectionReason ? ` — ${p.rejectionReason}` : ""}
                    </td>
                    <td>{p.reviewedBy ? (staffById.get(p.reviewedBy)?.fullName ?? p.reviewedBy) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dz-card">
        <div className="dz-card-head"><span className="dz-card-title">Invitations</span></div>
        {invitations.length === 0 ? (
          <p className="dz-reminder-meta">No invitations yet.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Kind</th>
                  <th>Status</th>
                  <th>Link token</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.invitationId}>
                    <td>{inv.email}</td>
                    <td>{inv.kind}</td>
                    <td>
                      <span className={`dz-status ${inv.status === "Approved" ? "dz-status-green" : inv.status === "Expired" || inv.status === "Rejected" ? "dz-status-red" : "dz-status-amber"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: "0.72rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                      /join/{inv.token}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button className="dz-btn-outline" onClick={() => void resend(inv.invitationId)}>Resend</button>
                        <button className="dz-btn-outline" onClick={() => void revoke(inv.invitationId)}>Revoke</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inviteMode && (
        <InviteModal
          mode={inviteMode}
          organizationId={organizationId}
          programmes={programmes.map((p) => ({ key: p.key, name: p.name }))}
          stages={stages.map((s) => ({ key: s.key, name: s.name }))}
          departments={departments.map((d) => ({ key: d.key, name: d.name }))}
          faculty={{ key: facultyId, name: units.find(unit => unit.key === facultyId)?.name ?? "Faculty" }}
          invitedBy={reviewerId}
          onClose={() => setInviteMode(null)}
          onDone={(msg) => {
            setInviteMode(null);
            setNotice(msg);
            void reload();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function InviteModal(props: {
  mode: "student-single" | "student-batch" | "staff-single";
  organizationId: string;
  programmes: { key: string; name: string }[];
  stages: { key: string; name: string }[];
  departments: { key: string; name: string }[];
  faculty: { key: string; name: string };
  invitedBy: string;
  onClose: () => void;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { mode, organizationId, programmes, stages, departments, faculty, invitedBy, onClose, onDone, onError } = props;
  const [email, setEmail] = useState("");
  const [batch, setBatch] = useState("");
  const [programmeId, setProgrammeId] = useState(programmes[0]?.key ?? "");
  const [entryStageId, setEntryStageId] = useState(stages[0]?.key ?? "");
  const [departmentId, setDepartmentId] = useState(departments[0]?.key ?? "");
  const [proposedKind, setProposedKind] = useState<StaffKind>("Academic");
  const [sessionId, setSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const organizationName = (() => {
    try { return localStorage.getItem(`edutracker.organizationName.${organizationId}`) || "Your school"; }
    catch { return "Your school"; }
  })();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!invitedBy) {
      onError("Your account must be linked to an eligible staff record before inviting.");
      return;
    }
    setSaving(true);
    setResult(null);
    try {
      if (mode === "student-batch") {
        const emails = batch.split("\n").map((l) => l.trim()).filter(Boolean);
        if (!emails.length) throw new Error("Paste at least one email address, one per line.");
        const payload = emails.map((addr) => ({
          kind: "Student" as const,
          email: addr,
          programmeId,
          entryStageId,
          sessionId,
          sessionName,
          invitedBy,
          organizationName,
        }));
        const res = await facultyApi.createInvitations(organizationId, payload);
        setResult(`${res.created.length} invitations created${res.failed.length ? `, ${res.failed.length} failed` : ""}.`);
        if (res.failed.length) {
          onError(res.failed.map((f) => `${f.email}: ${f.message}`).join(" "));
        }
        if (res.created.length) onDone(`${res.created.length} mock invitations queued. Share each /join link.`);
      } else if (mode === "student-single") {
        const res = await facultyApi.createInvitations(organizationId, {
          kind: "Student",
          email: email.trim(),
          programmeId,
          entryStageId,
          sessionId,
          sessionName,
          invitedBy,
          organizationName,
        });
        const token = res.created[0]?.token ?? "";
        onDone(`Mock invitation queued for ${email.trim()}. Share link: /join/${token}`);
      } else {
        const res = await facultyApi.createInvitations(organizationId, {
          kind: "Staff",
          email: email.trim(),
          departmentId,
          proposedKind,
          proposedPost: proposedKind === "Administrative" && departmentId === faculty.key ? "FacultyOfficer" : null,
          sessionId,
          sessionName,
          invitedBy,
          organizationName,
        });
        const token = res.created[0]?.token ?? "";
        onDone(`Mock staff invitation queued for ${email.trim()}. Share link: /join/${token}`);
      }
    } catch (e) {
      onError(e instanceof FacultyApiError ? e.message : e instanceof Error ? e.message : "Could not send invitations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal titleId="invite-title" onClose={onClose} maxWidth={560}>
      <h2 id="invite-title" className="dz-modal-title">
        {mode === "student-single" ? "Invite a student" : mode === "student-batch" ? "Invite a whole intake" : "Invite staff"}
      </h2>
      <p className="dz-modal-sub">
        The link already knows the placement. The person is never asked for it on the form.
      </p>
      <form onSubmit={(e) => void submit(e)} className="dz-form">
        {mode === "student-batch" ? (
          <label className="input-label">
            One email per line — all share the same programme, level and session
            <textarea className="input" rows={6} value={batch} onChange={(e) => setBatch(e.target.value)} placeholder={"ada@example.com\nbola@example.com"} required />
          </label>
        ) : (
          <label className="input-label">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        )}
        {(mode === "student-single" || mode === "student-batch") && (
          <>
            <label className="input-label">
              Programme
              <select className="input" value={programmeId} onChange={(e) => setProgrammeId(e.target.value)} required>
                <option value="">Choose…</option>
                {programmes.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="input-label">
              Entry level
              <select className="input" value={entryStageId} onChange={(e) => setEntryStageId(e.target.value)} required>
                <option value="">Choose…</option>
                {stages.map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {mode === "staff-single" && (
          <>
            <label className="input-label">
              Department
              <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
                <option value="">Choose…</option>
                {proposedKind === "Administrative" && <option value={faculty.key}>{faculty.name} office</option>}
                {departments.map((d) => (
                  <option key={d.key} value={d.key}>{d.name}</option>
                ))}
              </select>
            </label>
            <label className="input-label">
              Proposed kind
              <select className="input" value={proposedKind} onChange={(e) => setProposedKind(e.target.value as StaffKind)}>
                <option value="Academic">Academic</option>
                <option value="Administrative">Administrative</option>
                <option value="Technical">Technical</option>
              </select>
            </label>
          </>
        )}
        <div className="dz-form-grid-2">
          <label className="input-label">
            Session id
            <input className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)} required />
          </label>
          <label className="input-label">
            Session name
            <input className="input" value={sessionName} onChange={(e) => setSessionName(e.target.value)} required />
          </label>
        </div>
        {result && <p role="status" className="school-saved">{result}</p>}
        <div className="dz-form-actions">
          <button type="button" className="dz-btn-outline" onClick={onClose}>Cancel</button>
          <button className="dz-btn-green" disabled={saving}>{saving ? "Sending…" : "Send invitation"}</button>
        </div>
      </form>
    </Modal>
  );
}
