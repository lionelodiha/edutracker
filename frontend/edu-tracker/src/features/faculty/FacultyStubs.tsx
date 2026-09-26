/**
 * FACULTY-BUILD §10 — documents and board render an empty state
 * naming what will go there and nothing else.
 */
export function DocumentsStub() {
  return (
    <div className="dz-card dz-empty">
      <div className="dz-empty-title">Documents — coming soon</div>
      <div className="dz-empty-text">
        Board minutes, memos, result sheets awaiting approval, course allocation for the
        session and accreditation files will live here, attached to the faculty and the
        session with a visible owner and date.
      </div>
    </div>
  );
}

export function BoardStub() {
  return (
    <div className="dz-card dz-empty">
      <div className="dz-empty-title">Faculty board — coming soon</div>
      <div className="dz-empty-text">
        Board membership, meeting dates and minutes will live here. The board — the Dean,
        the Sub-Dean, every HOD and elected representatives — approves results and passes
        them to Senate.
      </div>
    </div>
  );
}
