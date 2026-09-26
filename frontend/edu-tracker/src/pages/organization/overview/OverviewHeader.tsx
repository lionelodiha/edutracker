import { Link } from "react-router-dom";
import type { OrganizationMemberResponse, OrganizationResponse, SemesterResponse } from "../../../api";
import type { SchoolModel } from "../../../features/cohorts/settings";
import { monogramColour } from "../../../features/academics/helpers";
import { sessionLabel } from "./format";

type Props = {
  org: OrganizationResponse;
  model: SchoolModel | null;
  currentSession: SemesterResponse | null;
  owner: OrganizationMemberResponse | null;
  base: string;
  /** While setup is incomplete, the setup band owns the primary action. */
  setupComplete: boolean;
};

export default function OverviewHeader({ org, model, currentSession, owner, base, setupComplete }: Props) {
  const modelLabel = model === "Primary" ? "Primary school" : model === "Secondary" ? "Secondary school" : model === "University" ? "University" : null;
  const colour = monogramColour(org.name);
  const facts = [modelLabel, currentSession ? `${sessionLabel(currentSession)} session` : null, owner ? `Owner ${owner.firstName} ${owner.lastName}` : null].filter(Boolean) as string[];
  return <header className="ov-header">
    <div className="ov-header-tile" aria-hidden="true" style={{ color: colour, background: `${colour}24` }}>{org.name.charAt(0).toUpperCase()}</div>
    <div className="ov-header-copy">
      <h1 className="dz-page-title">{org.name}</h1>
      <p className="ov-facts">{!modelLabel && <span className="ov-warn">Setup not finished</span>}{facts.map(fact => <span key={fact}>{fact}</span>)}</p>
    </div>
    <div className="ov-header-actions">
      <Link className="dz-btn-outline" to={`${base}/settings`}>Settings</Link>
      <Link className={setupComplete ? "dz-btn-green" : "dz-btn-outline"} to={`${base}/staff`}>Add staff</Link>
    </div>
  </header>;
}
