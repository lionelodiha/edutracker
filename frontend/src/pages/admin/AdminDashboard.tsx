import React, { useEffect, useState } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card hover-card p-6">
            <div className="flex items-center justify-between">
              <span className="pill">Teachers</span>
              <span className="text-[var(--muted)] text-sm">Total</span>
            </div>
            <div className="mt-4 text-4xl font-bold">{stats.teachers}</div>
          </div>
          <div className="card hover-card p-6">
            <div className="flex items-center justify-between">
              <span className="pill">Students</span>
              <span className="text-[var(--muted)] text-sm">Total</span>
            </div>
            <div className="mt-4 text-4xl font-bold">{stats.students}</div>
          </div>
          <div className="card hover-card p-6">
            <div className="flex items-center justify-between">
              <span className="pill">Classes</span>
              <span className="text-[var(--muted)] text-sm">Active</span>
            </div>
            <div className="mt-4 text-4xl font-bold">{stats.classes}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/teachers" className="card hover-card p-6">
            <h3 className="text-xl font-semibold mb-2 text-white">Manage Teachers</h3>
            <p className="text-[var(--muted)] text-sm">Create and list teacher accounts.</p>
          </Link>
          <Link to="/admin/students" className="card hover-card p-6">
            <h3 className="text-xl font-semibold mb-2 text-white">Manage Students</h3>
            <p className="text-[var(--muted)] text-sm">Create students and enroll in subjects.</p>
          </Link>
          <Link to="/admin/classes" className="card hover-card p-6">
            <h3 className="text-xl font-semibold mb-2 text-white">Manage Classes</h3>
            <p className="text-[var(--muted)] text-sm">Create and list classes.</p>
          </Link>
          <Link to="/admin/subjects" className="card hover-card p-6">
            <h3 className="text-xl font-semibold mb-2 text-white">Manage Subjects</h3>
            <p className="text-[var(--muted)] text-sm">Create and list subjects.</p>
          </Link>
          <Link to="/admin/assignments" className="card hover-card p-6">
            <h3 className="text-xl font-semibold mb-2 text-white">Teacher Assignments</h3>
            <p className="text-[var(--muted)] text-sm">Assign teachers to class + subject.</p>
          </Link>
        </div>
      </main>
    </div>
  );
};
