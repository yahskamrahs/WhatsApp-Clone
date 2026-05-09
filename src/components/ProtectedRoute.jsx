import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Shows a loading spinner while Firebase resolves auth state
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--bg-primary)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font)',
      }}>
        <div style={{ fontSize: 48 }}>💬</div>
        <p style={{ fontSize: 14 }}>Loading Chatter…</p>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
