import { Link } from "react-router-dom";

type Props = { base: string; faculties: number; teachers: number | null; students: number | null; staffAdmins: number | null; sessions: number | null };

export default function StatStrip({ base, faculties, teachers, students, staffAdmins, sessions }: Props) {
  const stats = [
    { label: "Faculties", value: faculties, to: `${base}/structure` },
    { label: "Teachers", value: teachers, to: `${base}/staff` },
    { label: "Students", value: students, to: `${base}/staff` },
    { label: "Staff & admins", value: staffAdmins, to: `${base}/staff` },
    { label: "Sessions", value: sessions, to: `${base}/structure?tab=sessions` },
  ];
  return <section className="ov-stats" aria-label="School at a glance">
    {stats.map(stat => <Link className={`ov-stat${!stat.value ? " is-zero" : ""}`} key={stat.label} to={stat.to}>
      <strong>{stat.value === null ? "–" : stat.value.toLocaleString()}</strong>
      <span>{stat.label}</span>
    </Link>)}
  </section>;
}
