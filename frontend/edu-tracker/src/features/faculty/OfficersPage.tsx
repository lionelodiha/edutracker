/**
 * FACULTY-BUILD §3 + §8 — officers (appointments).
 * Scope per post is fixed in one table (POST_SCOPE); the form only
 * offers the valid scope for the chosen post. Ending sets endsOn —
 * rows are never deleted. Expired terms flag amber.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { readSchoolSetup, unitKindOf } from "../cohorts/schoolSetup";
import { POST_SCOPE, isAppointmentExpired, type PostCode } from "../staff/appointments";
import { facultyApi, FacultyApiError } from "./api";
import type { Appointment } from "../staff/appointments";
import type { StaffProfile } from "../staff/types";
import type { AcademicRank } from "../staff/ranks";
import { useAuth } from "../../context/AuthContext";

const POSTS = Object.keys(POST_SCOPE) as PostCode[];

export default function OfficersPage() {
  const { user } = useAuth();
  const { id: organizationId = "", facultyId = "" } = useParams<{ id: string; facultyId: string }>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [ranks, setRanks] = useState<AcademicRank[]>([]);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newKind, setNewKind] = useState<StaffProfile["kind"]>("Academic");
  const [newUnit, setNewUnit] = useState("");
  const [newRank, setNewRank] = useState("");
  const [linkCurrentUser, setLinkCurrentUser] = useState(false);
  const [post, setPost] = useState<PostCode>("HOD");
  const [scopeId, setScopeId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const setup = readSchoolSetup(organizationId);
  const units = useMemo(() => setup?.structure.units ?? [], [setup]);
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

  const scopeKind = POST_SCOPE[post];
  const scopeOptions = useMemo(() => {
    if (scopeKind === "Faculty") return [{ key: facultyId, name: units.find((u) => u.key === facultyId)?.name ?? "This faculty" }];
    if (scopeKind === "Department") return departments.map((d) => ({ key: d.key, name: d.name }));
    if (scopeKind === "Programme") return programmes.map((p) => ({ key: p.key, name: p.name }));
    return []; // Cohort scopes are entered as an id (the student's group).
  }, [scopeKind, facultyId, units, departments, programmes]);

  const staffName = useMemo(() => new Map(staff.map((s) => [s.staffProfileId, s.fullName])), [staff]);

  async function reload() {
    setLoading(true);
    try {
      const [appts, people, rankList] = await Promise.all([
        facultyApi.appointments(organizationId),
        facultyApi.staff(organizationId, { facultyId }),
        facultyApi.ranks(organizationId),
      ]);
      setAppointments(appts.filter((a) => {
        if (a.scopeId === facultyId) return true;
        if (departments.some((d) => d.key === a.scopeId)) return true;
        if (programmes.some((p) => p.key === a.scopeId)) return true;
        return false;
      }));
      setStaff(people.items);
      setRanks(rankList);
      setError("");
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not load officers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, facultyId]);

  useEffect(() => {
    setScopeId(scopeOptions[0]?.key ?? "");
  }, [scopeOptions]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!staffId || !scopeId) {
      setError("Choose the staff member and the unit this post belongs to.");
      return;
    }
    setSaving(true);
    try {
      await facultyApi.createAppointment(organizationId, {
        staffProfileId: staffId,
        post,
        scopeId,
        scopeKind,
        startsOn: new Date().toISOString(),
        endsOn: endsOn || null,
      });
      setNotice(`${post} appointment saved.`);
      setStaffId("");
      setEndsOn("");
      await reload();
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not save this appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function end(termId: string) {
    setError("");
    setNotice("");
    try {
      await facultyApi.endAppointment(organizationId, termId, new Date().toISOString());
      setNotice("Appointment ended. The row stays as history.");
      await reload();
    } catch (e) {
      setError(e instanceof FacultyApiError ? e.message : "Could not end this appointment.");
    }
  }

  async function addStaff(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const unitId = newUnit || departments[0]?.key;
      if (!unitId) throw new Error("Add a department before creating staff.");
      await facultyApi.createStaff(organizationId, {
        fullName: newName.trim(), staffNumber: newNumber.trim(), schoolEmail: newEmail.trim(),
        kind: newKind, unitId, unitKind: unitId === facultyId ? "Faculty" : "Department",
        rankId: newKind === "Academic" ? (newRank || ranks[0]?.rankId || null) : null,
        title: "", status: "Active", appointedOn: new Date().toISOString(),
        userId: linkCurrentUser ? user?.id ?? null : null,
      });
      setNewName(""); setNewNumber(""); setNewEmail(""); setLinkCurrentUser(false);
      setNotice("Staff record created. You can now give this person an appointment.");
      await reload();
    } catch (cause) {
      setError(cause instanceof FacultyApiError || cause instanceof Error ? cause.message : "Could not create staff.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div className="dz-card">
        <div className="dz-card-head"><span className="dz-card-title">Add staff record</span></div>
        <form className="dz-form" onSubmit={event => void addStaff(event)} style={{ maxWidth: 650 }}>
          <div className="dz-form-grid-2">
            <label className="input-label">Full name<input className="input" value={newName} onChange={event => setNewName(event.target.value)} required /></label>
            <label className="input-label">Staff number<input className="input" value={newNumber} onChange={event => setNewNumber(event.target.value)} required /></label>
          </div>
          <label className="input-label">School email<input className="input" type="email" value={newEmail} onChange={event => setNewEmail(event.target.value)} required /></label>
          <div className="dz-form-grid-2">
            <label className="input-label">Kind<select className="input" value={newKind} onChange={event => setNewKind(event.target.value as StaffProfile["kind"])}>
              <option value="Academic">Academic</option><option value="Administrative">Administrative</option><option value="Technical">Technical</option>
            </select></label>
            <label className="input-label">Unit<select className="input" value={newUnit} onChange={event => setNewUnit(event.target.value)} required>
              <option value="">Choose…</option>
              {newKind === "Administrative" && <option value={facultyId}>{units.find(unit => unit.key === facultyId)?.name ?? "Faculty office"}</option>}
              {departments.map(department => <option key={department.key} value={department.key}>{department.name}</option>)}
            </select></label>
          </div>
          {newKind === "Academic" && <label className="input-label">Rank<select className="input" value={newRank} onChange={event => setNewRank(event.target.value)} required>
            <option value="">Choose…</option>{ranks.map(rank => <option key={rank.rankId} value={rank.rankId}>{rank.name}</option>)}
          </select></label>}
          {user && newKind !== "Technical" && <label className="input-label"><input type="checkbox" checked={linkCurrentUser} onChange={event => setLinkCurrentUser(event.target.checked)} /> This is my staff record</label>}
          <button className="dz-btn-green" disabled={saving}>Create staff</button>
        </form>
      </div>
      <div className="dz-card">
        <div className="dz-card-head">
          <span className="dz-card-title">Officers</span>
          <span className="dz-reminder-meta">Who holds every post, with the term end date visible</span>
        </div>
        {error && <p role="alert" className="cohort-error">{error}</p>}
        {notice && <p role="status" className="school-saved">{notice}</p>}
        {loading ? (
          <p className="dz-reminder-meta">Loading officers…</p>
        ) : appointments.length === 0 ? (
          <p className="dz-reminder-meta">No appointments yet. Appoint a Dean, HODs and officers below.</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Holder</th>
                  <th>Scope</th>
                  <th>Term ends</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const expired = isAppointmentExpired(a);
                  const scopeName = units.find((u) => u.key === a.scopeId)?.name ?? a.scopeId;
                  return (
                    <tr key={a.appointmentId}>
                      <td style={{ fontWeight: 600 }}>{a.post}</td>
                      <td>{staffName.get(a.staffProfileId) ?? a.staffProfileId}</td>
                      <td>{scopeName}</td>
                      <td>
                        {a.endsOn ? a.endsOn.slice(0, 10) : "open-ended"}{" "}
                        {expired && <span className="dz-status dz-status-amber">Expired</span>}
                      </td>
                      <td>
                        {!expired && (
                          <button className="dz-btn-outline" onClick={() => void end(a.appointmentId)}>
                            End now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dz-card">
        <div className="dz-card-head"><span className="dz-card-title">New appointment</span></div>
        <form onSubmit={(e) => void create(e)} className="dz-form" style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
          <label className="input-label">
            Post
            <select className="input" value={post} onChange={(e) => setPost(e.target.value as PostCode)}>
              {POSTS.map((p) => (
                <option key={p} value={p}>{p} — {scopeKind === undefined ? "" : ""}{POST_SCOPE[p]}</option>
              ))}
            </select>
          </label>
          <p className="dz-reminder-meta" style={{ margin: 0 }}>
            {post} must be scoped to a {scopeKind}. One live holder per post and unit.
          </p>
          {scopeKind === "Cohort" ? (
            <label className="input-label">
              Cohort id
              <input className="input" value={scopeId} onChange={(e) => setScopeId(e.target.value)} placeholder="Level adviser cohort id" required />
            </label>
          ) : (
            <label className="input-label">
              Unit
              <select className="input" value={scopeId} onChange={(e) => setScopeId(e.target.value)} required>
                <option value="">Choose…</option>
                {scopeOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="input-label">
            Staff member (Active only)
            <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
              <option value="">Choose…</option>
              {staff
                .filter((s) => s.status === "Active")
                .map((s) => (
                  <option key={s.staffProfileId} value={s.staffProfileId}>
                    {s.fullName} · {s.kind} · {s.staffNumber}
                  </option>
                ))}
            </select>
          </label>
          <label className="input-label">
            Term ends (optional)
            <input className="input" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
          </label>
          <div>
            <button className="dz-btn-green" disabled={saving}>{saving ? "Saving…" : "Save appointment"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
