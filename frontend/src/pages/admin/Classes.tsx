import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/AdminSidebar';

export const Classes: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get('/admin/classes');
    setClasses(res.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/admin/classes', { name }); setName(''); await load(); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Manage Classes</h1>

        <form onSubmit={submit} className="card p-6 space-y-3 max-w-md">
          <div>
            <label className="block text-sm">Class Name</label>
            <input className="w-full px-3 py-2 rounded input-dark" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <button disabled={loading} className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white px-4 py-2 rounded">{loading? 'Creating...' : 'Create Class'}</button>
        </form>

        <div className="card">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,.03)]"><tr><th className="p-3 text-white">Name</th></tr></thead>
            <tbody>
              {classes.map((c: any) => (<tr key={c.id} className="border-t divider"><td className="p-3">{c.name}</td></tr>))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
