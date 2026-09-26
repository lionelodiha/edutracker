import { Link } from "react-router-dom";
import type { OrganizationMemberResponse, OrganizationMemberRole } from "../../../api";
import { initials, monogramColour } from "../../../features/academics/helpers";

type Props = { base: string; members: OrganizationMemberResponse[] | null };
const rank: Record<OrganizationMemberRole, number> = { Owner: 0, Admin: 1, Moderator: 2, Teacher: 3, Member: 4, Student: 5 };

export default function TeamPreview({ base, members }: Props) {
  const staff = members?.filter(member => member.role !== "Student") ?? [];
  const team = [...staff].sort((a, b) => rank[a.role] - rank[b.role] || `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)).slice(0, 5);
  return <section className="ov-panel">
    <header className="ov-panel-head"><h2>Team</h2>{members && staff.length > 0 && <Link to={`${base}/staff`}>All {staff.length} →</Link>}</header>
    {members === null ? <p className="ov-muted ov-pad">Couldn't load team members.</p> : team.length ? <ul className="ov-rows">
      {team.map(member => {
        const name = `${member.firstName} ${member.lastName}`.trim() || member.userName;
        const colour = monogramColour(name);
        return <li key={member.id} className="ov-row ov-row-static">
          <span className="ov-avatar" aria-hidden="true" style={{ color: colour, background: `${colour}24` }}>{initials(name)}</span>
          <span className="ov-person"><strong>{name}</strong><small>@{member.userName}</small></span>
          <span className={`ov-role ov-role-${member.role.toLowerCase()}`}>{member.role}</span>
        </li>;
      })}
    </ul> : <div className="ov-empty"><p>No staff yet.</p><Link className="dz-btn-outline" to={`${base}/staff`}>Add staff</Link></div>}
  </section>;
}
