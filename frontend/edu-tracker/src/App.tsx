import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import OrganizationDetailsPage from "./pages/dashboard/OrganizationDetailsPage";
import SemestersPage from "./pages/dashboard/SemestersPage";
import CoursesPage from "./pages/dashboard/CoursesPage";
import SemesterDetailsPage from "./pages/dashboard/SemesterDetailsPage";
import ClassDetailsPage from "./pages/dashboard/ClassDetailsPage";
import TeacherDashboardPage from "./pages/dashboard/TeacherDashboardPage";
import StudentDashboardPage from "./pages/dashboard/StudentDashboardPage";
import SuperAdminDashboardPage from "./pages/dashboard/SuperAdminDashboardPage";
import PortalLoginPage from "./pages/PortalLoginPage";
import PortalSignupPage from "./pages/PortalSignupPage";
import ProfilePage from "./pages/ProfilePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className="spinner spinner-lg" />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Removed PublicRoute to let Auth pages manage their own redirect animations.

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth pages (manage their own redirect if already logged in) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:id" element={<OrganizationDetailsPage />} />
            <Route path="organizations/:id/semesters" element={<SemestersPage />} />
            <Route path="organizations/:id/semesters/:semesterId" element={<SemesterDetailsPage />} />
            <Route path="organizations/:id/classes/:classId" element={<ClassDetailsPage />} />
            <Route path="organizations/:id/courses" element={<CoursesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Student & Teacher Portals & Login (Mocks) */}
          <Route path="/portal-login" element={<PortalLoginPage />} />
          <Route path="/portal-signup" element={<PortalSignupPage />} />
          <Route path="/student-portal" element={<StudentDashboardPage />} />
          <Route path="/teacher-portal" element={<TeacherDashboardPage />} />
          
          {/* Global / Super Admin (Mock) */}
          <Route path="/super-admin" element={<SuperAdminDashboardPage />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
