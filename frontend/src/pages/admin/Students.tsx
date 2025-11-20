import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSidebar } from '../../components/AdminSidebar';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', classroomId: '', admissionNumber: '' });
  const [enroll, setEnroll] = useState({ studentId: '', subjectId: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [sRes, cRes, subRes] = await Promise.all([
      api.get('/admin/students'),
      api.get('/admin/classes'),
      api.get('/admin/subjects'),
    ]);
    setStudents(sRes.data);
    setClasses(cRes.data);
    setSubjects(subRes.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/admin/students', { ...form, classroomId: Number(form.classroomId) });
      setForm({ fullName: '', email: '', password: '', classroomId: '', admissionNumber: '' });
      await load();
    } finally { setLoading(false); }
  };

  const submitEnroll = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/admin/enrollments', { studentId: Number(enroll.studentId), subjectId: Number(enroll.subjectId) });
      setEnroll({ studentId: '', subjectId: '' });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Manage Students</h1>

        <form onSubmit={submit} className="card p-6 space-y-3 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm">Admission Number</label>
              <input className="w-full px-3 py-2 rounded input-dark" value={form.admissionNumber} onChange={e=>setForm({...form, admissionNumber:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm">Class</label>
              <select className="w-full px-3 py-2 rounded input-dark" value={form.classroomId} onChange={e=>setForm({...form, classroomId:e.target.value})} required>
                <option value="">Select class</option>
                {classes.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button disabled={loading} className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white px-4 py-2 rounded">{loading? 'Creating...' : 'Create Student'}</button>
        </form>

        <form onSubmit={submitEnroll} className="card p-6 space-y-3 max-w-2xl">
          <h2 className="text-lg font-semibold">Enroll Student to Subject</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Student</label>
              <select className="w-full px-3 py-2 rounded input-dark" value={enroll.studentId} onChange={e=>setEnroll({...enroll, studentId:e.target.value})} required>
                <option value="">Select student</option>
                {students.map((s:any)=> <option key={s.id} value={s.id}>{s.user.fullName} ({s.admissionNumber})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm">Subject</label>
              <select className="w-full px-3 py-2 rounded input-dark" value={enroll.subjectId} onChange={e=>setEnroll({...enroll, subjectId:e.target.value})} required>
                <option value="">Select subject</option>
                {subjects.map((s:any)=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <button disabled={loading} className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white px-4 py-2 rounded">{loading? 'Saving...' : 'Enroll'}</button>
        </form>

        <div className="card">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,.03)]"><tr><th className="p-3 text-white">Name</th><th className="p-3 text-white">Email</th><th className="p-3 text-white">Class</th><th className="p-3 text-white">Admission #</th></tr></thead>
            <tbody>
              {students.map((s:any)=> (
                <tr key={s.id} className="border-t divider">
                  <td className="p-3">{s.user.fullName}</td>
                  <td className="p-3">{s.user.email}</td>
                  <td className="p-3">{s.classroom?.name}</td>
                  <td className="p-3">{s.admissionNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
