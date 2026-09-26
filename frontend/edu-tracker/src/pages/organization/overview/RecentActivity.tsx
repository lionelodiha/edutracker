import type { OrganizationMemberResponse, OrganizationResponse, SemesterResponse } from "../../../api";
import { formatDate, sessionLabel, timeAgo } from "./format";

type Props = { org: OrganizationResponse; members: OrganizationMemberResponse[] | null; sessions: SemesterResponse[] | null };
type Activity = { at: string; text: string };

export default function RecentActivity({ org, members, sessions }: Props) {
  // Derived from creation/join timestamps; this is not an audit log.
  const activity: Activity[] = [
    { at: org.createdAt, text: "School created" },
    ...(sessions ?? []).map(session => ({ at: session.createdAt, text: `Session ${sessionLabel(session)} opened` })),
    ...(members ?? []).filter(member => member.role !== "Owner").map(member => ({ at: member.joinedAt, text: `${member.firstName} ${member.lastName} joined as ${member.role.toLowerCase()}` })),
  ].filter(item => !!item.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  return <section className="ov-panel">
    <header className="ov-panel-head"><h2>Recent activity</h2></header>
    {members === null || sessions === null ? <p className="ov-muted ov-pad">Couldn't load {members === null && sessions === null ? "members or sessions" : members === null ? "members" : "sessions"}; showing what's available.</p> : null}
    {activity.length ? <ol className="ov-timeline">{activity.map((item, index) => <li key={`${item.at}-${item.text}-${index}`}>
      <span className="ov-timeline-dot" aria-hidden="true" /><span className="ov-timeline-text">{item.text}</span><time dateTime={item.at} title={formatDate(item.at)}>{timeAgo(item.at)}</time>
    </li>)}</ol> : <p className="ov-muted ov-pad">Nothing yet.</p>}
  </section>;
}
