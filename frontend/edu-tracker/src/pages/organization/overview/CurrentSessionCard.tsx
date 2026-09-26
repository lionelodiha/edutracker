import { Link } from "react-router-dom";
import type { SemesterResponse } from "../../../api";
import { formatDate, sessionLabel } from "./format";

type Props = { base: string; sessions: SemesterResponse[] | null; currentSession: SemesterResponse | null };

export default function CurrentSessionCard({ base, sessions, currentSession }: Props) {
  return <section className="ov-panel">
    <header className="ov-panel-head"><h2>Current session</h2></header>
    <div className="ov-panel-body">
      {sessions === null ? <p className="ov-muted">Couldn't load sessions.</p> : currentSession ? <>
        <p className="ov-session-name">{sessionLabel(currentSession)}</p>
        <p className="ov-muted">Opened {formatDate(currentSession.createdAt)} · {sessions.length} session{sessions.length === 1 ? "" : "s"} on record</p>
        <Link className="dz-btn-outline" to={`${base}/structure?tab=sessions`}>Manage sessions</Link>
      </> : <>
        <p className="ov-session-name ov-session-none">No session yet</p>
        <p className="ov-muted">A session is one academic year. Courses and results hang off it.</p>
        <Link className="dz-btn-outline" to={`${base}/structure?tab=sessions`}>Open a session</Link>
      </>}
    </div>
  </section>;
}
