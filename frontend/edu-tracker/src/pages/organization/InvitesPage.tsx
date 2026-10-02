/**
 * Invites & requests: the school makes a link per person, the person fills
 * in their details, and the request lands here. Approving it places them:
 * a department and level for a student, courses for a teacher, a
 * department for non-teaching staff. That creates their portal account.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { formatDay, initials } from "../../features/academics/helpers";
import { AcHeader, Badge, Drawer, EmptyState, Segmented } from "../../features/academics/ui";
import { joinApi } from "../../features/onboarding/joinApi";
import { JOIN_ROLE_LABEL, joinUrl, type JoinBoard, type JoinLink, type JoinRequest, type JoinRole } from "../../features/onboarding/joinLinks";
import { AdminApiError } from "../../features/portal/adminApi";
import type { OrganizationContext } from "../../layouts/OrganizationLayout";
import "../../features/academics/academics.css";
import "./staff.css";
import "./invites.css";

const ROLES: JoinRole[] = ["Student", "Teaching", "NonTeaching"];
const ROLE_NOTE: Record<JoinRole, string> = {
  Student: "You'll place them in a department and level.",
  Teaching: "You'll give them their courses or subjects.",
  NonTeaching: "You'll place them in a department or unit.",
};
const LINK_TONE = { Open: "current", Submitted: "upcoming", Approved: "code", Declined: "warn", Revoked: "closed", Expired: "closed" } as const;
const message = (cause: unknown, fallback: string) => (cause instanceof AdminApiError ? cause.message : fallback);
const shareText = (school: string, link: JoinLink) => `${school} has invited you to join as ${JOIN_ROLE_LABEL[link.role].toLowerCase()}. Fill in your details here: ${joinUrl(link.token)}`;

export default function InvitesPage() {
  const { id: organizationId = "" } = useParams();
  const { org } = useOutletContext<OrganizationContext>();
  const { user } = useAuth();
  const { toast, show } = useToast();
  const adminName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "School admin";
  const school = org?.name ?? "Your school";

  const [board, setBoard] = useState<JoinBoard | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"links" | "decided">("links");
  const [making, setMaking] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setBoard(await joinApi.board(organizationId)); setError(""); }
    catch (cause) { setError(message(cause, "Couldn't load invites.")); }
  }, [organizationId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- async; state lands after the request.
  useEffect(() => { void load(); }, [load]);

  const pending = board?.requests.filter(item => item.status === "Pending") ?? [];
  const decided = board?.requests.filter(item => item.status !== "Pending") ?? [];
  const open = board?.links.filter(item => item.status === "Open") ?? [];
  const departmentName = useMemo(() => new Map(board?.departments.map(item => [item.departmentId, item.name])), [board]);
  const current = board?.requests.find(item => item.requestId === reviewing) ?? null;

  async function copy(link: JoinLink) {
    try { await navigator.clipboard.writeText(joinUrl(link.token)); show("Link copied"); }
    catch { show("Couldn't copy. Select the link and copy it yourself."); }
  }
  async function revoke(link: JoinLink) {
    try { await joinApi.revokeLink(organizationId, link.linkId); show(`Link for ${link.sentTo} cancelled`); await load(); }
    catch (cause) { show(message(cause, "Couldn't cancel the link.")); }
  }

  return <div className="dz-page ac-page jr-page">
    <AcHeader
      title="Invites & requests"
      meta={board ? [`${pending.length} waiting for review`, `${open.length} open link${open.length === 1 ? "" : "s"}`] : ["Loading…"]}
      actions={<button className="dz-btn-green" onClick={() => setMaking(true)}>+ New invite link</button>}
    />

    {error && !board ? <EmptyState title="Couldn't load invites" text={error} action={<button className="dz-btn-outline" onClick={() => void load()}>Try again</button>} />
      : !board ? <div className="skeleton" style={{ height: 260, borderRadius: 14 }} aria-busy="true" />
      : <>
        {!board.links.length && <section className="dz-card jr-how" aria-label="How invites work">
          {[
            ["1", "Make a link", "One per person. Send it on WhatsApp, SMS or email."],
            ["2", "They fill in their details", "Name, contact, next of kin, and where they think they belong."],
            ["3", "You approve and place them", "Pick their class, or the courses they'll teach. Their portal opens."],
          ].map(([n, title, text]) => <div key={n}><span className="jr-how-n">{n}</span><strong>{title}</strong><small>{text}</small></div>)}
        </section>}

        <section className="jr-section" aria-label="Waiting for review">
          <h2 className="lv-title">Waiting for review <span>{pending.length}</span></h2>
          {pending.length ? <div className="jr-cards">{pending.map(request => (
            <article key={request.requestId} className="dz-card jr-card">
              <header className="jr-card-head">
                <Face request={request} />
                <span className="jr-who"><strong>{request.details.title ? `${request.details.title} ` : ""}{request.details.fullName}</strong><small>Sent {formatDay(request.submittedAt)}</small></span>
                <Badge tone={request.role === "Student" ? "code" : request.role === "Teaching" ? "upcoming" : "neutral"}>{JOIN_ROLE_LABEL[request.role]}</Badge>
              </header>
              <dl className="jr-facts">
                <div><dt>Asked for</dt><dd>{departmentName.get(request.details.departmentId) ?? "—"}{request.details.level ? ` · ${request.details.level}` : ""}</dd></div>
                {request.role === "Teaching" && <div><dt>Can teach</dt><dd>{request.details.subjects}</dd></div>}
                {request.role === "NonTeaching" && <div><dt>Post</dt><dd>{request.details.jobTitle}</dd></div>}
                {request.role !== "Student" && <div><dt>Qualification</dt><dd>{request.details.highestQualification}</dd></div>}
                <div><dt>Phone</dt><dd>{request.details.phone}</dd></div>
              </dl>
              <button className="dz-btn-green" onClick={() => setReviewing(request.requestId)}>Review and place</button>
            </article>
          ))}</div> : <p className="lv-empty">Nothing waiting. When someone sends their details through a link, they appear here.</p>}
        </section>

        <div className="jr-switch">
          <Segmented label="Show" value={view} onChange={setView} options={[{ value: "links", label: `Invite links · ${board.links.length}` }, { value: "decided", label: `Decided · ${decided.length}` }]} />
        </div>

        {view === "links" ? (board.links.length ? <section className="dz-card jr-list" aria-label="Invite links">{board.links.map(link => (
          <div key={link.linkId} className="jr-row">
            <span className={`jr-dot jr-dot-${link.role}`} aria-hidden="true" />
            <span className="jr-row-main"><strong>{link.sentTo}</strong><small>{JOIN_ROLE_LABEL[link.role]} · made {formatDay(link.createdAt)}{link.status === "Open" ? ` · works until ${formatDay(link.expiresOn)}` : ""}</small></span>
            <Badge tone={LINK_TONE[link.status]}>{link.status === "Submitted" ? "Filled in" : link.status}</Badge>
            <span className="jr-row-actions">
              {link.status === "Open" && <>
                <button className="dz-pill-btn" onClick={() => void copy(link)}>Copy link</button>
                <a className="dz-pill-btn" href={`https://wa.me/?text=${encodeURIComponent(shareText(school, link))}`} target="_blank" rel="noreferrer">WhatsApp</a>
                <button className="dz-pill-btn jr-cancel" onClick={() => void revoke(link)} aria-label={`Cancel the link for ${link.sentTo}`}>Cancel</button>
              </>}
              {link.status === "Submitted" && link.requestId && <button className="dz-pill-btn" onClick={() => setReviewing(link.requestId)}>Review</button>}
            </span>
          </div>
        ))}</section> : <EmptyState title="No invite links yet" text="Make one for each student or staff member you want to bring in." action={<button className="dz-btn-green" onClick={() => setMaking(true)}>+ New invite link</button>} />)
          : decided.length ? <section className="dz-card jr-list" aria-label="Decided requests">{decided.map(request => (
            <button key={request.requestId} type="button" className="jr-row jr-row-btn" onClick={() => setReviewing(request.requestId)}>
              <Face request={request} small />
              <span className="jr-row-main"><strong>{request.details.fullName}</strong><small>{request.status === "Approved" ? request.outcome?.placement : request.declineReason}</small></span>
              <span className="jr-row-by"><Badge tone={request.status === "Approved" ? "current" : "warn"}>{request.status}</Badge><small>{request.decidedBy} · {formatDay(request.decidedAt!)}</small></span>
            </button>
          ))}</section> : <p className="lv-empty">No decisions yet.</p>}
      </>}

    {making && <NewLinkModal organizationId={organizationId} school={school} onClose={() => setMaking(false)} onMade={() => void load()} />}
    {current && board && <ReviewDrawer key={current.requestId} organizationId={organizationId} request={current} board={board} adminName={adminName}
      onClose={() => setReviewing(null)} onDecided={async text => { show(text); await load(); }} />}
    {toast}
  </div>;
}

function Face({ request, small }: { request: JoinRequest; small?: boolean }) {
  return <span className={`jr-face${small ? " jr-face-sm" : ""}`} aria-hidden="true">{request.details.photograph ? <img src={request.details.photograph} alt="" /> : initials(request.details.fullName)}</span>;
}

function NewLinkModal({ organizationId, school, onClose, onMade }: { organizationId: string; school: string; onClose: () => void; onMade: () => void }) {
  const [role, setRole] = useState<JoinRole>("Student");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [made, setMade] = useState<JoinLink | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try { setMade(await joinApi.createLink(organizationId, { role, sentTo })); onMade(); }
    catch (cause) { setError(message(cause, "Couldn't make the link.")); }
    finally { setBusy(false); }
  }

  return <Modal titleId="jr-new-title" onClose={onClose} maxWidth={540}>
    {made ? <div className="dz-form jr-made">
      <div>
        <h2 id="jr-new-title" className="st-modal-title">Link ready for {made.sentTo}</h2>
        <p className="ws-muted" style={{ margin: ".25rem 0 0" }}>Only {made.sentTo} should get it: it works once, for 14 days.</p>
      </div>
      <div className="jr-link-box"><code>{joinUrl(made.token)}</code></div>
      <div className="jr-made-actions">
        <button className="dz-btn-green" onClick={() => { void navigator.clipboard?.writeText(joinUrl(made.token)).then(() => setCopied(true)); }}>{copied ? "Copied ✓" : "Copy link"}</button>
        <a className="dz-btn-outline" href={`https://wa.me/?text=${encodeURIComponent(shareText(school, made))}`} target="_blank" rel="noreferrer">Send on WhatsApp</a>
      </div>
      <div className="ac-actions" style={{ justifyContent: "space-between" }}>
        <button className="dz-btn-outline" onClick={() => { setMade(null); setSentTo(""); setCopied(false); }}>Make another</button>
        <button className="dz-btn-outline" onClick={onClose}>Done</button>
      </div>
    </div> : <form className="dz-form" onSubmit={event => void create(event)}>
      <div>
        <h2 id="jr-new-title" className="st-modal-title">New invite link</h2>
        <p className="ws-muted" style={{ margin: ".25rem 0 0" }}>One link for one person. They fill in their own details; you approve them.</p>
      </div>
      {error && <p role="alert" className="ac-notice ac-notice-warn" style={{ margin: 0 }}>{error}</p>}
      <div className="jr-roles" role="radiogroup" aria-label="Who is it for">
        {ROLES.map(item => (
          <button key={item} type="button" role="radio" aria-checked={role === item} className={`jr-role${role === item ? " active" : ""}`} onClick={() => setRole(item)}>
            <span className={`jr-dot jr-dot-${item}`} aria-hidden="true" />
            <strong>{JOIN_ROLE_LABEL[item]}</strong>
            <small>{ROLE_NOTE[item]}</small>
          </button>
        ))}
      </div>
      <label className="ac-field"><span className="ac-label">Who are you sending it to?</span>
        <input className="input" value={sentTo} onChange={event => setSentTo(event.target.value)} placeholder="Their name or phone number" required maxLength={80} autoFocus />
        <span className="ac-hint">Only you see this. It helps you tell the links apart.</span>
      </label>
      <div className="ac-actions" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="dz-btn-outline" onClick={onClose}>Cancel</button>
        <button className="dz-btn-green" disabled={busy}>{busy ? "Making…" : "Make link"}</button>
      </div>
    </form>}
  </Modal>;
}

function ReviewDrawer({ organizationId, request, board, adminName, onClose, onDecided }: {
  organizationId: string; request: JoinRequest; board: JoinBoard; adminName: string;
  onClose: () => void; onDecided: (text: string) => Promise<void>;
}) {
  const { details } = request;
  const [departmentId, setDepartmentId] = useState(details.departmentId);
  const [level, setLevel] = useState(details.level ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [everywhere, setEverywhere] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const department = board.departments.find(item => item.departmentId === departmentId);
  const offerings = board.offerings.filter(item => everywhere || item.departmentId === departmentId);
  const nameOf = (id: string) => board.departments.find(item => item.departmentId === id)?.name ?? "—";
  const pending = request.status === "Pending";

  async function approve() {
    setBusy(true); setError("");
    try {
      await joinApi.approve(organizationId, request.requestId, { departmentId, level: request.role === "Student" ? level : undefined, offeringIds: request.role === "Teaching" ? picked : undefined, decidedBy: adminName });
      await onDecided(`${details.fullName} approved. Their portal is open.`);
    } catch (cause) { setError(message(cause, "Couldn't approve.")); }
    finally { setBusy(false); }
  }
  async function decline() {
    setBusy(true); setError("");
    try { await joinApi.decline(organizationId, request.requestId, reason, adminName); await onDecided(`${details.fullName}'s request declined`); onClose(); }
    catch (cause) { setError(message(cause, "Couldn't decline.")); }
    finally { setBusy(false); }
  }

  const footer = !pending ? undefined : declining
    ? <div className="jr-foot"><button className="dz-btn-outline" onClick={() => setDeclining(false)}>Back</button><button className="dz-btn-outline lv-danger" disabled={busy || !reason.trim()} onClick={() => void decline()}>Decline request</button></div>
    : <div className="jr-foot"><button className="dz-btn-outline" onClick={() => setDeclining(true)}>Decline</button>
      <button className="dz-btn-green" disabled={busy || !department || (request.role === "Student" && !level)} onClick={() => void approve()}>{busy ? "Approving…" : "Approve and open portal"}</button></div>;

  return <Drawer title={JOIN_ROLE_LABEL[request.role]} onClose={onClose} footer={footer}>
    <div className="jr-hero">
      <Face request={request} />
      <div><strong>{details.title ? `${details.title} ` : ""}{details.fullName}</strong><small>Sent {formatDay(request.submittedAt)}</small></div>
    </div>

    {request.status === "Approved" && request.outcome && <section className="jr-outcome" aria-label="Approved">
      <Badge tone="current">Approved</Badge>
      <dl className="ac-dl">
        <dt>School email</dt><dd className="ac-mono">{request.outcome.schoolEmail}</dd>
        <dt>Number</dt><dd className="ac-mono">{request.outcome.number}</dd>
        <dt>Placed in</dt><dd>{request.outcome.placement}</dd>
      </dl>
      <p className="ac-hint">They see these when they open their link again, and sign in with the password they chose.</p>
    </section>}
    {request.status === "Declined" && <p className="ac-notice ac-notice-warn">Declined by {request.decidedBy}: {request.declineReason}</p>}

    <section className="jr-block" aria-label="What they sent">
      <h3>What they sent</h3>
      <dl className="ac-dl">
        <dt>Email</dt><dd>{details.email}</dd>
        <dt>Phone</dt><dd>{details.phone}</dd>
        <dt>Born</dt><dd>{formatDay(details.dateOfBirth)} · {details.sex}</dd>
        <dt>Address</dt><dd>{details.homeAddress}</dd>
        <dt>Next of kin</dt><dd>{details.nextOfKinName} · {details.nextOfKinPhone}</dd>
        <dt>Asked for</dt><dd>{nameOf(details.departmentId)}{details.level ? ` · ${details.level}` : ""}</dd>
        {details.previousSchool && <><dt>Previous school</dt><dd>{details.previousSchool}</dd></>}
        {details.highestQualification && <><dt>Qualification</dt><dd>{details.highestQualification}</dd></>}
        {details.subjects && <><dt>Can teach</dt><dd>{details.subjects}</dd></>}
        {details.jobTitle && <><dt>Post</dt><dd>{details.jobTitle}</dd></>}
      </dl>
    </section>

    {pending && (declining ? <section className="jr-block">
      <h3>Why are you declining?</h3>
      <textarea className="input" rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="They'll see this when they open their link, e.g. Use the name on your admission letter." autoFocus maxLength={300} />
    </section> : <section className="jr-block" aria-label="Place them">
      <h3>{request.role === "Student" ? "Place them in a class" : request.role === "Teaching" ? "Give them their courses" : "Place them"}</h3>
      <div className="jr-place">
        <label className="ac-field"><span className="ac-label">Department</span>
          <select className="input" value={departmentId} onChange={event => { setDepartmentId(event.target.value); setLevel(""); }}>
            {board.departments.map(item => <option key={item.departmentId} value={item.departmentId}>{item.name}</option>)}
          </select>
        </label>
        {request.role === "Student" && <label className="ac-field"><span className="ac-label">Level or class</span>
          <select className="input" value={level} onChange={event => setLevel(event.target.value)}>
            <option value="">Choose…</option>
            {department?.levels.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>}
      </div>
      {request.role === "Student" && <p className="ac-hint">They'll be on every course for that level automatically.</p>}
      {request.role === "Teaching" && <>
        <div className="jr-course-head">
          <span className="ac-hint">{picked.length ? `${picked.length} picked` : "Pick what they'll teach this session. You can also do it later from the department."}</span>
          <label className="jr-toggle"><input type="checkbox" checked={everywhere} onChange={event => setEverywhere(event.target.checked)} /> All departments</label>
        </div>
        {offerings.length ? <ul className="jr-courses">{offerings.map(item => {
          const on = picked.includes(item.offeringId);
          return <li key={item.offeringId}>
            <label className={on ? "on" : ""}>
              <input type="checkbox" checked={on} onChange={() => setPicked(list => on ? list.filter(id => id !== item.offeringId) : [...list, item.offeringId])} />
              <span className="jr-course-code">{item.code}</span>
              <span className="jr-course-main"><strong>{item.title}</strong><small>{item.levelKey} · {item.termName}{everywhere ? ` · ${nameOf(item.departmentId)}` : ""}</small>
                {item.lecturer && <small className="jr-course-now">{on ? `Moves from ${item.lecturer}` : `Now taught by ${item.lecturer}`}</small>}</span>
            </label>
          </li>;
        })}</ul> : <p className="lv-empty">No courses offered this session{everywhere ? "" : " in this department"}.</p>}
      </>}
      {request.role === "NonTeaching" && <p className="ac-hint">Set their employment record, duties and tasks from their staff profile after approval.</p>}
    </section>)}
    {error && <p className="ac-notice ac-notice-warn" role="alert">{error}</p>}
  </Drawer>;
}
