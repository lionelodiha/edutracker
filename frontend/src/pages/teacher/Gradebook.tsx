import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import api from '../../services/api';
import { Student } from '../../../types';

export const Gradebook: React.FC = () => {
    const { classId, subjectId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [termId, setTermId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null); // Student ID being saved

    useEffect(() => {
        api.get(`/teacher/class/${classId}/subject/${subjectId}`)
           .then(res => {
               setStudents(res.data.students);
               setCategories(res.data.categories);
               setTermId(res.data.termId);
               setLoading(false);
           })
           .catch(() => navigate('/teacher'));
    }, [classId, subjectId, navigate]);

    const handleScoreChange = async (studentId: number, categoryId: number, value: string) => {
        // Optimistic update locally
        setStudents(prev => prev.map(s => {
            if (s.id !== studentId) return s;
            const newScores = s.scores ? [...s.scores] : [];
            const existingIdx = newScores.findIndex(sc => sc.categoryId === categoryId);
            
            if (existingIdx > -1) {
                newScores[existingIdx] = { ...newScores[existingIdx], score: Number(value) };
            } else {
                newScores.push({ id: 0, score: Number(value), categoryId });
            }
            return { ...s, scores: newScores };
        }));

        // Debounce or direct save (Direct for simplicity here, but UI feedback shown)
        if (!termId) return;
        
        setSaving(studentId);
        try {
            await api.post('/teacher/scores', {
                studentId,
                subjectId: Number(subjectId),
                termId,
                categoryId,
                score: value
            });
        } finally {
            setSaving(null);
        }
    };

    const getScoreValue = (student: Student, categoryId: number) => {
        return student.scores?.find(s => s.categoryId === categoryId)?.score || '';
    };

    if (loading) return <Layout><div className="text-[var(--muted)]">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Gradebook</h1>
                <button onClick={() => navigate('/teacher')} className="text-[var(--accent2)] hover:underline">&larr; Back to Dashboard</button>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[rgba(255,255,255,.03)] border-b divider">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-white">Student Name</th>
                                <th className="px-6 py-4 font-semibold text-white text-sm">ID</th>
                                {categories.map(cat => (
                                    <th key={cat.id} className="px-6 py-4 font-semibold text-white text-center">
                                        {cat.name} 
                                        <span className="block text-xs font-normal text-[var(--muted)]">{cat.weight}%</span>
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-center font-semibold text-white">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divider">
                            {students.map(student => {
                                const total = student.scores?.reduce((sum, s) => sum + s.score, 0) || 0;
                                return (
                                    <tr key={student.id} className="hover:bg-[rgba(255,255,255,.02)] transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {student.user.fullName}
                                            {saving === student.id && <span className="text-xs text-[var(--accent2)] ml-2 animate-pulse">Saving...</span>}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--muted)] text-sm">{student.admissionNumber}</td>
                                        {categories.map(cat => (
                                            <td key={cat.id} className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-16 text-center input-dark rounded-md py-1"
                                                    value={getScoreValue(student, cat.id)}
                                                    onChange={(e) => handleScoreChange(student.id, cat.id, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-center font-bold text-[var(--accent2)]">
                                            {total}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};
