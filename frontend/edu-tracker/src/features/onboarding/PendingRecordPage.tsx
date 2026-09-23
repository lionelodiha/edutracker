/**
 * FACULTY-BUILD §5 — public join form.
 * Route: /join/:token. Unauthenticated — the person has no account yet.
 * The invitation already knows the placement; the page shows the school,
 * programme and level as read-only text and collects only what the
 * school does not know. It creates a pending record, not a person.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { facultyApi, FacultyApiError, type JoinInfo } from "../faculty/api";

export default function PendingRecordPage() {
  const { token = "" } = useParams<{ token: string }>();
  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [error, setError] = useState("");
  const [unusable, setUnusable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [kinName, setKinName] = useState("");
  const [kinPhone, setKinPhone] = useState("");
  const [password, setPassword] = useState("");
  const [qualification, setQualification] = useState("");
  const [proposedRank, setProposedRank] = useState("");
  const [title, setTitle] = useState("");
  const [photograph, setPhotograph] = useState("");

  useEffect(() => {
    let live = true;
    setLoading(true);
    facultyApi
      .joinInfo(token)
      .then((j) => {
        if (live) {
          setInfo(j);
          setError("");
        }
      })
      .catch((e) => {
        if (!live) return;
        if (e instanceof FacultyApiError && (e.status === 410 || e.code === "INVITATION_UNUSABLE")) {
          setUnusable(true);
        } else {
          setError(e instanceof FacultyApiError ? e.message : "Could not load this invitation.");
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!photograph) { setError("Wait for the photograph to finish loading, then submit again."); return; }
    setSaving(true);
    try {
      await facultyApi.submitJoin(token, {
        fullName: fullName.trim(),
        dateOfBirth: dob,
        sex,
        phone: phone.trim(),
        homeAddress: address.trim(),
        nextOfKinName: kinName.trim(),
        nextOfKinPhone: kinPhone.trim(),
        photograph,
        password,
        ...(info?.kind === "Staff"
          ? { highestQualification: qualification.trim(), proposedRank: proposedRank.trim(), title: title.trim() }
          : {}),
      });
      setSent(true);
    } catch (e) {
      if (e instanceof FacultyApiError && (e.status === 410 || e.code === "INVITATION_UNUSABLE")) {
        setUnusable(true);
      } else {
        setError(e instanceof FacultyApiError ? e.message : "Could not submit. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="dz-scope" style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem" }}>
        <div className="dz-card">
          <div className="skeleton" style={{ height: 24, width: 260, borderRadius: 8, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 14, width: 340, borderRadius: 6 }} />
        </div>
      </main>
    );
  }

  if (unusable) {
    return (
      <main className="dz-scope" style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem" }}>
        <div className="dz-card dz-empty">
          <div className="dz-empty-title">This link is no longer usable</div>
          <div className="dz-empty-text">
            It was used, expired or rejected. Ask the school for a fresh invitation link (410 INVITATION_UNUSABLE).
          </div>
          <Link className="dz-btn-outline" style={{ marginTop: "1rem" }} to="/">Back home</Link>
        </div>
      </main>
    );
  }

  if (error && !info) {
    return (
      <main className="dz-scope" style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem" }}>
        <div className="dz-card dz-empty">
          <div className="dz-empty-title">Could not load this invitation</div>
          <div className="dz-empty-text">{error}</div>
        </div>
      </main>
    );
  }

  if (sent) {
    return (
      <main className="dz-scope" style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem" }}>
        <div className="dz-card dz-empty">
          <div className="dz-empty-title">Details sent for review</div>
          <div className="dz-empty-text">
            The faculty office will review your form. If approved, your matriculation or staff
            number and school email will be emailed to {info?.email}.
          </div>
          <Link className="dz-btn-outline" style={{ marginTop: "1rem" }} to="/">Back home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="dz-scope" style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem" }}>
      <div className="dz-card">
        <span className="school-overline">{info?.organizationName} · {info?.sessionName}</span>
        <h1 className="dz-page-title" style={{ marginTop: "0.4rem" }}>
          {info?.kind === "Staff" ? "Join as staff" : "Complete your admission"}
        </h1>
        {/* Placement is read-only text — the form never asks for it. */}
        <p className="dz-reminder-meta">
          {info?.programmeName ? `${info.programmeName}` : info?.departmentName ? `${info.departmentName}` : ""}
          {info?.stageName ? ` · ${info.stageName}` : ""} · {info?.sessionName}
        </p>
        <p className="dz-reminder-meta">Invitation for {info?.email}. Tell us what the school does not know yet.</p>

        <form onSubmit={(e) => void submit(e)} className="dz-form" style={{ marginTop: "1rem" }}>
          {error && <p role="alert" className="cohort-error">{error}</p>}
          <label className="input-label">
            Full name
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} />
          </label>
          <div className="dz-form-grid-2">
            <label className="input-label">
              Date of birth
              <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            </label>
            <label className="input-label">
              Sex
              <select className="input" value={sex} onChange={(e) => setSex(e.target.value)} required>
                <option value="">Choose…</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </label>
          </div>
          <label className="input-label">
            Photograph (up to 1 MB)
            <input className="input" type="file" accept="image/*" required onChange={event => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 1024 * 1024) { setError("Choose a photograph under 1 MB."); event.target.value = ""; return; }
              const reader = new FileReader();
              reader.onload = () => setPhotograph(String(reader.result ?? ""));
              reader.readAsDataURL(file);
            }} />
          </label>
          <label className="input-label">
            Phone
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} />
          </label>
          <label className="input-label">
            Home address
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required maxLength={200} />
          </label>
          <div className="dz-form-grid-2">
            <label className="input-label">
              Next of kin name
              <input className="input" value={kinName} onChange={(e) => setKinName(e.target.value)} required maxLength={120} />
            </label>
            <label className="input-label">
              Next of kin phone
              <input className="input" value={kinPhone} onChange={(e) => setKinPhone(e.target.value)} required maxLength={20} />
            </label>
          </div>
          {info?.kind === "Staff" && (
            <>
              <div className="dz-form-grid-2">
                <label className="input-label">
                  Title (max 20 chars)
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={20} placeholder="Dr." />
                </label>
                <label className="input-label">
                  Proposed rank
                  <input className="input" value={proposedRank} onChange={(e) => setProposedRank(e.target.value)} placeholder="Lecturer I" />
                </label>
              </div>
              <label className="input-label">
                Highest qualification
                <input className="input" value={qualification} onChange={(e) => setQualification(e.target.value)} required maxLength={120} />
              </label>
            </>
          )}
          <label className="input-label">
            Choose a password (min 8 characters)
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          <p className="dz-reminder-meta">
            You do not choose a programme, level, matriculation number or email — those are the school&apos;s to decide on approval.
          </p>
          <div className="dz-form-actions">
            <button className="dz-btn-green" disabled={saving}>{saving ? "Sending…" : "Send for review"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
