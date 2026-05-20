import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-stone-500">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = role === 'client' ? '/portal/login' : '/admin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user?.role === 'client') {
      return <Navigate to="/portal/dashboard" replace />;
    }
    const loginPath = role === 'admin' ? '/admin/login' : '/portal/login';
    return <Navigate to={loginPath} replace />;
  }

  return children;
}
