import { Link } from "react-router-dom";
import type { AcademicUnitNode } from "../../../features/cohorts/schoolSetup";
import { monogramColour, unitCode } from "../../../features/academics/helpers";

type Props = { base: string; faculties: AcademicUnitNode[]; units: AcademicUnitNode[] };
const SHOWN = 6;

export default function FacultiesStrip({ base, faculties, units }: Props) {
  return <section className="ov-panel">
    <header className="ov-panel-head"><h2>Faculties</h2>{faculties.length > 0 && <Link to={`${base}/structure`}>Academic Structure →</Link>}</header>
    {faculties.length ? <ul className="ov-rows">
      {faculties.slice(0, SHOWN).map(faculty => {
        const count = units.filter(unit => unit.parent === faculty.key).length;
        const code = unitCode(faculty);
        const colour = monogramColour(code);
        return <li key={faculty.key}><Link className="ov-row" to={`${base}/structure/faculties/${faculty.key}`}>
          <span className="ov-mark" style={{ color: colour, background: `${colour}24` }} aria-hidden="true">{code.slice(0, 3)}</span>
          <strong>{faculty.name}</strong>
          {count ? <span className="ov-row-meta">{count} department{count === 1 ? "" : "s"}</span> : <span className="ov-row-meta ov-row-todo">Add departments</span>}
          <span className="ov-chevron" aria-hidden="true">›</span>
        </Link></li>;
      })}
      {faculties.length > SHOWN && <li><Link className="ov-row ov-row-more" to={`${base}/structure`}>{faculties.length - SHOWN} more faculties</Link></li>}
    </ul> : <div className="ov-empty"><p>No faculties yet. They hold your departments and courses.</p><Link className="dz-btn-outline" to={`${base}/structure`}>Set up Academic Structure</Link></div>}
  </section>;
}
