import { useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ATTENDANCE_STATUSES,
    getMockRoster,
    submitMockRegister,
    tallyRegister,
    fullName,
    type AttendanceStatus,
} from "./attendanceMocks";

const STATUS_META: Record<AttendanceStatus, { color: string; key: string }> = {
    Present: { color: "var(--success)", key: "P" },
    Absent: { color: "var(--error)", key: "A" },
    Late: { color: "var(--warn)", key: "L" },
    Excused: { color: "var(--text-muted)", key: "E" },
};

function todayLocal(): string {
    const d = new Date();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

export default function AttendancePage() {
    const { id, classId } = useParams();
    const roster = useMemo(() => getMockRoster(), []);
    const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

    const [sessionDate, setSessionDate] = useState(todayLocal);
    // Every student defaults to Present so the common case is one click on Save.
    const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() =>
        Object.fromEntries(roster.map((r) => [r.studentId, "Present" as AttendanceStatus])),
    );
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const ordered = useMemo(() => statusesArray(roster.map((r) => r.studentId), statuses), [roster, statuses]);
    const tally = useMemo(() => tallyRegister(ordered), [ordered]);

    function setStatus(studentId: string, status: AttendanceStatus) {
        setStatuses((prev) => (prev[studentId] === status ? prev : { ...prev, [studentId]: status }));
        setDirty(true);
        setLastSaved(null);
    }

    function focusRow(index: number) {
        rowRefs.current[index]?.focus();
    }

    // Keyboard-first: P / A / L / E sets the focused row and advances, so a
    // teacher can clear a class list without touching the mouse. Ignored when
    // typing inside an input (date picker, note fields).
    function handleRowKeyDown(e: React.KeyboardEvent, index: number) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
        const pressed = e.key.toUpperCase();
        const match = (Object.keys(STATUS_META) as AttendanceStatus[]).find(
            (s) => STATUS_META[s].key === pressed,
        );
        if (!match) return;
        e.preventDefault();
        setStatus(roster[index].studentId, match);
        if (index + 1 < roster.length) focusRow(index + 1);
    }

    function resetAllPresent() {
        setStatuses(Object.fromEntries(roster.map((r) => [r.studentId, "Present" as AttendanceStatus])));
        setDirty(true);
        setLastSaved(null);
    }

    async function handleSave() {
        setSaving(true);
        setError(null);
        try {
            const result = await submitMockRegister(
                sessionDate,
                roster.map((r) => ({
                    studentId: r.studentId,
                    status: statuses[r.studentId] ?? "Present",
                    note: notes[r.studentId]?.trim() ? notes[r.studentId].trim() : null,
                })),
            );
            setLastSaved(result.savedAt);
            setDirty(false);
        } catch {
            setError("Could not save the register. Try again.");
        } finally {
            setSaving(false);
        }
    }

    const attendancePct = Math.round(tally.rate * 100);

    return (
        <div className="dz-page">
            <div className="dz-page-head">
                <div>
                    <div className="dz-crumb">
                        <Link to={`/dashboard/organizations/${id}/classes/${classId}`}>← Back to class</Link>
                    </div>
                    <h1 className="dz-page-title">Daily Attendance</h1>
                    <p className="dz-page-sub">
                        {roster.length} on roll · {tally.present + tally.late} counted present · {attendancePct}% attendance rate
                        {lastSaved && !dirty ? " · saved" : ""}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                        type="date"
                        className="input"
                        aria-label="Session date"
                        value={sessionDate}
                        max={todayLocal()}
                        onChange={(e) => {
                            setSessionDate(e.target.value);
                            setDirty(true);
                            setLastSaved(null);
                        }}
                        style={{ padding: "0.65rem 0.8rem", fontSize: "0.83rem", width: "170px" }}
                    />
                    <button className="dz-btn-outline" onClick={resetAllPresent} disabled={saving}>
                        All present
                    </button>
                    <button className="dz-btn-green" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : lastSaved && !dirty ? "Saved ✓" : "Save register"}
                    </button>
                </div>
            </div>

            <div className="dz-grid-stats-3">
                <div className="dz-card dz-stat">
                    <span className="dz-stat-label">Counted Present</span>
                    <div className="dz-stat-value">{tally.present + tally.late}</div>
                    <div className="dz-stat-sub">Present + late marks</div>
                </div>
                <div className="dz-card dz-stat">
                    <span className="dz-stat-label">Absent</span>
                    <div className="dz-stat-value">{tally.absent}</div>
                    <div className="dz-stat-sub">Unexcused absences</div>
                </div>
                <div className="dz-card dz-stat dz-stat-featured">
                    <div className="dz-stat-top">
                        <span className="dz-stat-label">Attendance Rate</span>
                    </div>
                    <div className="dz-stat-value">{attendancePct}%</div>
                    <div className="dz-stat-sub">Excused absences excluded</div>
                </div>
            </div>

            {dirty && !saving && (
                <div className="alert alert-warn">
                    Unsaved changes — the register only lands when you press Save register.
                </div>
            )}
            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            <p className="dz-note">
                Tip: click a row (or Tab to it), then press{" "}
                <kbd className="dz-kbd">P</kbd> present · <kbd className="dz-kbd">A</kbd> absent ·{" "}
                <kbd className="dz-kbd">L</kbd> late · <kbd className="dz-kbd">E</kbd> excused — focus moves to the next student automatically.
            </p>

            <div className="dz-card" style={{ padding: 0 }} role="form" aria-label={`Attendance register for ${sessionDate}`}>
                {roster.map((student, index) => {
                    const status = statuses[student.studentId] ?? "Present";
                    return (
                        <div
                            key={student.id}
                            ref={(el) => {
                                rowRefs.current[index] = el;
                            }}
                            tabIndex={0}
                            onKeyDown={(e) => handleRowKeyDown(e, index)}
                            aria-label={`${fullName(student)}, marked ${status}. Press P, A, L or E to change.`}
                            className="dz-register-row"
                        >
                            <div style={{ minWidth: 0, flex: "1 1 160px" }}>
                                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                                    {fullName(student)}
                                </div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                    Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div role="radiogroup" aria-label={`Status for ${fullName(student)}`} style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                {ATTENDANCE_STATUSES.map((option) => {
                                    const selected = option === status;
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            tabIndex={-1}
                                            onClick={() => setStatus(student.studentId, option)}
                                            title={`${option} (${STATUS_META[option].key})`}
                                            className={`dz-choice ${selected ? "selected" : ""}`}
                                        >
                                            <span
                                                className="dz-choice-dot"
                                                style={{ background: STATUS_META[option].color }}
                                            />
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>

                            <input
                                className="input"
                                placeholder="Note (optional)"
                                aria-label={`Note for ${fullName(student)}`}
                                value={notes[student.studentId] ?? ""}
                                maxLength={280}
                                onChange={(e) => {
                                    setNotes((prev) => ({ ...prev, [student.studentId]: e.target.value }));
                                    setDirty(true);
                                    setLastSaved(null);
                                }}
                                style={{ flex: "1 1 140px", maxWidth: 220, padding: "0.5rem 0.7rem", fontSize: "0.8rem" }}
                            />
                        </div>
                    );
                })}
            </div>

            <p className="dz-note">
                Excused absences are excluded from the attendance rate. Frontend preview running on mock
                data — wired to the MarkClassAttendance endpoint once the backend slice lands.
            </p>
        </div>
    );
}

function statusesArray(ids: string[], statuses: Record<string, AttendanceStatus>): AttendanceStatus[] {
    return ids.map((studentId) => statuses[studentId] ?? "Present");
}
