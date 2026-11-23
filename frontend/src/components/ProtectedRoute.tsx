import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  children: ReactNode;
  roles?: string[];
  fallback?: string;
}

export default function ProtectedRoute({ children, roles, fallback = '/login' }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-center">
        <LoadingSpinner label="Checking your session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallback} state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length > 0 && !roles.some((role) => user.roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
