import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-40">
        <div className="backdrop-blur supports-[backdrop-filter]:bg-[rgba(17,24,39,.55)] bg-[rgba(17,24,39,.85)] border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-glow" />
              <div className="text-lg font-semibold tracking-tight text-white">EduTrack</div>
            </Link>
            <div className="flex-1" />
            {/* Search */}
            <div className="hidden md:flex items-center bg-[rgba(255,255,255,.06)] border border-[var(--border)] rounded-xl px-3 py-2 w-80">
              <svg width="16" height="16" viewBox="0 0 24 24" className="text-[var(--muted)]"><path fill="currentColor" d="m21.53 20.47l-4.66-4.66A7.92 7.92 0 0 0 19 10a8 8 0 1 0-8 8a7.92 7.92 0 0 0 5.81-2.13l4.66 4.66zM4 10a6 6 0 1 1 6 6a6 6 0 0 1-6-6"/></svg>
              <input className="ml-2 bg-transparent outline-none text-sm placeholder-[var(--muted)] flex-1" placeholder="Search modules, students, subjects..." />
            </div>
            {/* User */}
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-white leading-tight">{user.fullName}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] text-right">{user.role}</div>
                </div>
                <button onClick={handleLogout} className="px-3 py-2 rounded-lg text-sm bg-[var(--surface)] border border-[var(--border)] hover:shadow-glow">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-[var(--muted)] text-sm">
          © 2024 EduTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

