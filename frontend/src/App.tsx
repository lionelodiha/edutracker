
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Teachers } from './pages/admin/Teachers';
import { Students } from './pages/admin/Students';
import { Classes } from './pages/admin/Classes';
import { Subjects } from './pages/admin/Subjects';
import { Assignments } from './pages/admin/Assignments';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { Gradebook } from './pages/teacher/Gradebook';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { Role } from '../types';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Root Redirect */}
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN]} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/teachers" element={<Teachers />} /> 
                        <Route path="/admin/students" element={<Students />} />
                        <Route path="/admin/classes" element={<Classes />} />
                        <Route path="/admin/subjects" element={<Subjects />} />
                        <Route path="/admin/assignments" element={<Assignments />} />
                    </Route>

                    {/* Teacher Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[Role.TEACHER]} />}>
                        <Route path="/teacher" element={<TeacherDashboard />} />
                        <Route path="/teacher/class/:classId/subject/:subjectId" element={<Gradebook />} />
                    </Route>

                    {/* Student Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[Role.STUDENT]} />}>
                        <Route path="/student" element={<StudentDashboard />} />
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
