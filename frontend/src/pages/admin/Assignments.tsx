import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/AdminSidebar';

export const Assignments: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [form, setForm] = useState({ teacherId: '', classroomId: '', subjectId: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [tRes, cRes, sRes, aRes] = await Promise.all([
      api.get('/admin/teachers'), api.get('/admin/classes'), api.get('/admin/subjects'), api.get('/admin/assignments')
    ]);
    setTeachers(tRes.data); setClasses(cRes.data); setSubjects(sRes.data); setAssignments(aRes.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/admin/assignments', { teacherId: Number(form.teacherId), classroomId: Number(form.classroomId), subjectId: Number(form.subjectId) });
      setForm({ teacherId: '', classroomId: '', subjectId: '' });
      await load();
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Teacher Assignments</h1>

        <form onSubmit={submit} className="card p-6 space-y-3 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm">Teacher</label>
              <select className="w-full px-3 py-2 rounded input-dark" value={form.teacherId} onChange={e=>setForm({...form, teacherId:e.target.value})} required>
                <option value="">Select teacher</option>
                {teachers.map((t:any)=> <option key={t.id} value={t.id}>{t.user.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm">Class</label>
              <select className="w-full px-3 py-2 rounded input-dark" value={form.classroomId} onChange={e=>setForm({...form, classroomId:e.target.value})} required>
                <option value="">Select class</option>
                {classes.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm">Subject</label>
              <select className="w-full px-3 py-2 rounded input-dark" value={form.subjectId} onChange={e=>setForm({...form, subjectId:e.target.value})} required>
                <option value="">Select subject</option>
                {subjects.map((s:any)=> <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
          <button disabled={loading} className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white px-4 py-2 rounded">{loading? 'Assigning...' : 'Assign'}</button>
        </form>

        <div className="card">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,.03)]"><tr><th className="p-3 text-white">Teacher</th><th className="p-3 text-white">Class</th><th className="p-3 text-white">Subject</th></tr></thead>
            <tbody>
              {assignments.map((a:any)=> (
                <tr key={a.id} className="border-t divider">
                  <td className="p-3">{a.teacher?.user?.fullName}</td>
                  <td className="p-3">{a.classroom?.name}</td>
                  <td className="p-3">{a.subject?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
