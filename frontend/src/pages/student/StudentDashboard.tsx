import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/student/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="p-10 text-center text-[var(--muted)]">Loading your results...</div>
    </Layout>
  );
  if (!data) return (
    <Layout>
      <div className="p-10 text-center text-[var(--muted)]">No data found.</div>
    </Layout>
  );

  const { student, term, subjects, overallAverage } = data;

  const chartData = subjects.map((s: any) => ({ name: s.subjectCode, score: s.totalScore }));
  const bestSubject =
    subjects.length > 0
      ? subjects.reduce((prev: any, current: any) => (prev.totalScore > current.totalScore ? prev : current))
      : null;

  return (
    <Layout>
      {/* Header Profile */}
      <div className="card p-8 mb-8 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Hello, {student.user.fullName}</h1>
          <p className="text-[var(--muted)] text-lg">
            Class: <span className="font-semibold text-white">{student.classroom.name}</span> | Term:{' '}
            <span className="font-semibold text-white">{term.name}</span>
          </p>
        </div>
        <div className="mt-6 md:mt-0 text-center">
          <span className="block text-sm text-[var(--muted)] uppercase tracking-wider font-medium">Term Average</span>
          <div className="text-5xl font-bold text-[var(--accent2)] mt-1">{overallAverage.toFixed(1)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Results Table */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white">Subject Performance</h2>
          <div className="grid grid-cols-1 gap-4">
            {subjects.map((sub: any) => (
              <div key={sub.subjectId} className="card p-6 transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">{sub.subjectName}</h3>
                    <span className="text-xs text-[var(--muted)] font-mono">{sub.subjectCode}</span>
                  </div>
                  <div className="px-4 py-2 rounded-lg border border-[var(--border)] font-bold text-xl text-white bg-[rgba(255,255,255,.04)]">{sub.grade}</div>
                </div>

                {/* Breakdown Progress */}
                <div className="space-y-3">
                  {sub.breakdown.map((b: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)] w-24">{b.category}</span>
                      <div className="flex-1 mx-3 h-2 bg-[rgba(255,255,255,.08)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${(b.score / b.max) * 100}%` }} />
                      </div>
                      <span className="font-medium text-white w-12 text-right">{b.score}</span>
                    </div>
                  ))}
                  <div className="divider border-t pt-3 flex justify-between items-center mt-2">
                    <span className="font-bold text-white">Total</span>
                    <span className="font-bold text-[var(--accent2)] text-lg">{sub.totalScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics / Chart */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Analytics</h2>
          <div className="card p-6 h-80">
            <h3 className="text-sm font-semibold text-[var(--muted)] mb-4 text-center">Score Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 70 ? '#6d5dfc' : '#26e3ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {bestSubject && (
            <div className="mt-6 rounded-xl p-6 text-white shadow-glow bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)]">
              <h3 className="font-bold text-lg mb-2">Keep it up!</h3>
              <p className="text-white/90 text-sm mb-4">
                You are performing exceptionally well in <span className="font-bold text-white">{bestSubject.subjectName}</span>!
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

