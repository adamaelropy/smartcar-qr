import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, registrationComplete } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!registrationComplete) {
    return <Navigate to="/register" replace />;
  }

  return children;
}

export function RegisterRoute({ children }) {
  const { isAuthenticated, registrationComplete } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (registrationComplete) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
