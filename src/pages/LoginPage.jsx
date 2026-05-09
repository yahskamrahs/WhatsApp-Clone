import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle } from '@/firebase/auth';
import AuthForm from '@/components/AuthForm';
import styles from './AuthPage.module.css';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async ({ email, password }) => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/chat');
    } catch (e) {
      setError(getAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/chat');
    } catch (e) {
      setError(getAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>💬</span>
          <h1 className={styles.appName}>Chatter</h1>
          <p className={styles.tagline}>Real-time messaging, reimagined.</p>
        </div>

        <h2 className={styles.title}>Welcome back</h2>
        <AuthForm
          mode="login"
          onSubmit={handleSubmit}
          onGoogle={handleGoogle}
          loading={loading}
          error={error}
        />

        <p className={styles.switch}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>Create one</Link>
        </p>
      </div>

      <div className={styles.backdrop} />
    </div>
  );
};

const getAuthError = (code) => {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with that email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    case 'auth/popup-closed-by-user': return 'Sign-in cancelled.';
    default: return 'Authentication failed. Please try again.';
  }
};

export default LoginPage;
