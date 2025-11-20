import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/AdminSidebar';

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get('/admin/teachers');
    setTeachers(res.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/teachers', form);
      setForm({ fullName: '', email: '', password: '' });
      await load();
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Manage Teachers</h1>

        <form onSubmit={submit} className="card p-6 space-y-3 max-w-xl">
          <div>
            <label className="block text-sm">Full Name</label>
            <input className="w-full px-3 py-2 rounded input-dark" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm">Email</label>
            <input type="email" className="w-full px-3 py-2 rounded input-dark" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="password" className="w-full px-3 py-2 rounded input-dark" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          </div>
          <button disabled={loading} className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white px-4 py-2 rounded">{loading? 'Creating...' : 'Create Teacher'}</button>
        </form>

        <div className="card">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,.03)]">
              <tr>
                <th className="p-3 text-white">Name</th>
                <th className="p-3 text-white">Email</th>
              </tr>
            </thead>
            <tbody>
            {teachers.map((t)=> (
              <tr key={t.id} className="border-t divider">
                <td className="p-3">{t.user.fullName}</td>
                <td className="p-3">{t.user.email}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
