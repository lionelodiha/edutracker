import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../services/api';
import { Assignment } from '../../../types';
import { Link } from 'react-router-dom';

export const TeacherDashboard: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    useEffect(() => {
        api.get('/teacher/assignments').then(res => setAssignments(res.data));
    }, []);

    return (
        <Layout>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
                <p className="text-[var(--muted)]">Select a class below to manage grades.</p>
              </div>
              <div className="pill">Current Term</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map(assign => (
                    <div key={assign.id} className="card hover-card overflow-hidden">
                        <div className="p-5 border-b divider bg-[rgba(255,255,255,.02)]">
                            <h3 className="font-bold text-white text-lg">{assign.subject.name}</h3>
                            <span className="text-xs font-mono text-[var(--muted)]">{assign.subject.code}</span>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 text-[var(--muted)]">
                                <span>Classroom</span>
                                <span className="font-semibold text-white">{assign.classroom.name}</span>
                            </div>
                            <Link 
                                to={`/teacher/class/${assign.classroom.id}/subject/${assign.subject.id}`}
                                className="block w-full text-center bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white font-semibold py-2 rounded-lg hover:shadow-glow"
                            >
                                Open Gradebook
                            </Link>
                        </div>
                    </div>
                ))}

                {assignments.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-[var(--muted)]">
                        You are not assigned to any classes yet.
                    </div>
                )}
            </div>
        </Layout>
    );
};
