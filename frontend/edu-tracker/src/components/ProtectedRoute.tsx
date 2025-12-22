import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If role is missing or not matched, check if org is selected
    if (!user.organizationId) {
        return <Navigate to="/dashboard" replace />;
    }
    // Redirect to their appropriate dashboard if they try to access unauthorized role route
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  // If accessing a specific role route, ensure organization is selected
  if (allowedRoles && user && !user.organizationId) {
      return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
