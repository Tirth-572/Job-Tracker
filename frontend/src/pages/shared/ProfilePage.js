import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui';

// This is just a router wrapper that redirects to the correct profile page based on the role
export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'CANDIDATE') {
    return <Navigate to="/candidate/profile" replace />;
  } else if (user.role === 'COMPANY') {
    return <Navigate to="/company/profile" replace />;
  } else if (user.role === 'ADMIN') {
    return <Navigate to="/admin/profile" replace />;
  }

  return <Navigate to="/" replace />;
}
