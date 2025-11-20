import React from 'react';
import { NavLink } from 'react-router-dom';

export const AdminSidebar: React.FC = () => {
  const linkClass = ({ isActive }: any) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-[rgba(109,93,252,.15)] text-white' : 'text-[var(--muted)] hover:bg-[rgba(255,255,255,.06)]'}`;

  const Item = ({ to, icon, label }: any) => (
    <NavLink to={to} className={linkClass}>
      <span className="w-5 h-5 text-[var(--accent)]">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-[var(--panel)] border-r border-[var(--border)] p-4 text-[var(--text)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-glow" />
        <div className="font-semibold">Admin</div>
      </div>
      <nav className="space-y-1">
        <Item to="/admin" label="Dashboard" icon={<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 3v8h8v2h-8v8h-2v-8H3V11h8V3z"/></svg>} />
        <Item to="/admin/teachers" label="Teachers" icon={<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m-7 8a7 7 0 0 1 14 0z"/></svg>} />
        <Item to="/admin/students" label="Students" icon={<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 3l9 5l-9 5l-9-5l9-5m0 7l7.62-4.23L12 4.54L4.38 5.77L12 10m0 2l9-5v6l-9 5l-9-5V7z"/></svg>} />
        <Item to="/admin/classes" label="Classes" icon={<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18v2H3zm2 4h14v10H5z"/></svg>} />
        <Item to="/admin/subjects" label="Subjects" icon={<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2"/></svg>} />
        <Item to="/admin/assignments" label="Assignments" icon={<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2v2h-4V2H8v2H7a2 2 0 0 0-2 2v14l3-3h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V2z"/></svg>} />
      </nav>
      <div className="mt-auto" />
    </aside>
  );
};
