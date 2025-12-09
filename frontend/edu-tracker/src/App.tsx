import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        
        {/* Dashboard Routes - Protected */}
        <Route 
          path="/dashboard/teacher" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/student" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/master_admin" 
          element={
            <ProtectedRoute allowedRoles={['master_admin']}>
              <MasterAdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback for /admin legacy route or other dashboard paths */}
        <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
