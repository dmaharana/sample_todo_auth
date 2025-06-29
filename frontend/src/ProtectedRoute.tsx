import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken: { user_id: number; role: string; exp: number } = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp < currentTime) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(decodedToken.role)) {
      return <Navigate to="/app" replace />;
    }

    return <Outlet context={{ userRole: decodedToken.role, username: decodedToken.username }} />;
  } catch (error) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
