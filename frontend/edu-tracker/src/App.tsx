import { useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import OrganizationLayout from "./layouts/OrganizationLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import OrganizationDetailsPage from "./pages/dashboard/OrganizationDetailsPage";
import SemestersPage from "./pages/dashboard/SemestersPage";
import CoursesPage from "./pages/dashboard/CoursesPage";
import SemesterDetailsPage from "./pages/dashboard/SemesterDetailsPage";
import ClassDetailsPage from "./pages/dashboard/ClassDetailsPage";
import AttendancePage from "./pages/dashboard/AttendancePage";
import SuperAdminDashboardPage from "./pages/dashboard/SuperAdminDashboardPage";
import PortalLoginPage from "./pages/PortalLoginPage";
import PortalSignupPage from "./pages/PortalSignupPage";
import ProfilePage from "./pages/ProfilePage";
import CohortWorkspacePage from "./features/cohorts/CohortWorkspacePage";
import FacultyWorkspacePage from "./features/faculty/FacultyWorkspacePage";
import PendingRecordPage from "./features/onboarding/PendingRecordPage";
import FacultiesListPage from "./pages/organization/FacultiesListPage";
import AcademicStructurePage from "./pages/organization/AcademicStructurePage";
import StaffPage from "./pages/organization/StaffPage";
import SchoolSettingsPage from "./pages/organization/SchoolSettingsPage";
import PortalLayout from "./features/portal/PortalLayout";
import { NotificationsPage, ProfilePage as PortalProfilePage, TimetablePage } from "./features/portal/SharedPages";
import { StudentCourseworkPage, StudentHome, StudentResultsPage } from "./features/portal/StudentPages";
import { TeacherClassPage, TeacherClassesPage, TeacherHome, TeacherResultsPage } from "./features/portal/TeacherPages";
import ResultSheetPage from "./features/portal/ResultSheetPage";
import { DutyRosterPage, LeavePage, StaffHome, TasksPage } from "./features/portal/StaffPages";
import PortalSignInPage, { LegacyPortalRedirect } from "./features/portal/PortalSignInPage";

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

// Every new page opens at the top. Links to a #section still land on it.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
            <Route path="profile" element={<ProfilePage />} />

            <Route path="organizations/:id" element={<OrganizationLayout />}>
              <Route index element={<OrganizationDetailsPage />} />

              <Route path="faculties" element={<FacultiesListPage />} />
              <Route path="faculties/:facultyId/*" element={<FacultyWorkspacePage />} />

              <Route path="structure" element={<AcademicStructurePage />} />
              <Route path="structure/faculties/:facultyId" element={<AcademicStructurePage />} />
              <Route path="structure/departments/new" element={<AcademicStructurePage />} />
              <Route path="structure/departments/:departmentId" element={<AcademicStructurePage />} />
              <Route path="structure/departments/:departmentId/edit" element={<AcademicStructurePage />} />
              <Route path="sessions" element={<SemestersPage />} />
              <Route path="sessions/:semesterId" element={<SemesterDetailsPage />} />
              <Route path="sessions/:semesterId/groups/*" element={<CohortWorkspacePage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="classes/:classId" element={<ClassDetailsPage />} />
              <Route path="classes/:classId/attendance" element={<AttendancePage />} />

              <Route path="staff" element={<StaffPage />} />
              <Route path="settings" element={<SchoolSettingsPage />} />

              {/* Legacy bookmarks */}
              <Route path="semesters" element={<SemestersPage />} />
              <Route path="semesters/:semesterId" element={<SemesterDetailsPage />} />
              <Route path="semesters/:semesterId/groups/*" element={<CohortWorkspacePage />} />
            </Route>
          </Route>

          {/* Student and staff portals: outside the admin app, one address per school.
              Schools share /portal/<school>; sign-in is mocked until the portal API ships. */}
          <Route path="/portal-login" element={<PortalLoginPage />} />
          <Route path="/portal-signup" element={<PortalSignupPage />} />
          <Route path="/portal/:schoolId" element={<PortalSignInPage />} />
          <Route path="/portal/:schoolId/student" element={<PortalLayout role="Student" />}>
            <Route index element={<StudentHome />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="coursework" element={<StudentCourseworkPage />} />
            <Route path="results" element={<StudentResultsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<PortalProfilePage />} />
          </Route>
          <Route path="/portal/:schoolId/teacher" element={<PortalLayout role="Teaching" />}>
            <Route index element={<TeacherHome />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="classes" element={<TeacherClassesPage />} />
            <Route path="classes/:offeringId" element={<TeacherClassPage />} />
            <Route path="results" element={<TeacherResultsPage />} />
            <Route path="results/:offeringId" element={<ResultSheetPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<PortalProfilePage />} />
          </Route>
          <Route path="/portal/:schoolId/staff" element={<PortalLayout role="NonTeaching" />}>
            <Route index element={<StaffHome />} />
            <Route path="roster" element={<DutyRosterPage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<PortalProfilePage />} />
          </Route>
          {/* Earlier portal addresses. */}
          <Route path="/student-portal/*" element={<LegacyPortalRedirect />} />
          <Route path="/teacher-portal/*" element={<LegacyPortalRedirect />} />
          <Route path="/staff-portal/*" element={<LegacyPortalRedirect />} />

          {/* Global / Super Admin (Mock) */}
          <Route path="/super-admin" element={<SuperAdminDashboardPage />} />


          {/* Public join form — no auth, the person has no account yet. */}
          <Route path="/join/:token" element={<PendingRecordPage />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
