
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../../types';

interface ProtectedRouteProps {
    allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard if they try to access an unauthorized route
        if (user.role === Role.ADMIN) return <Navigate to="/admin" replace />;
        if (user.role === Role.TEACHER) return <Navigate to="/teacher" replace />;
        if (user.role === Role.STUDENT) return <Navigate to="/student" replace />;
        
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
