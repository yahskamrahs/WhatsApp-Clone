import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail, signInWithGoogle } from '@/firebase/auth';
import AuthForm from '@/components/AuthForm';
import styles from './AuthPage.module.css';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async ({ displayName, email, password }) => {
    setError('');
    if (!displayName?.trim()) { setError('Display name is required.'); return; }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName.trim());
      navigate('/dashboard');
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
      navigate('/dashboard');
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
          <h1 className={styles.appName}>WhatsApp Clone</h1>
          <p className={styles.tagline}>Join the conversation.</p>
        </div>

        <h2 className={styles.title}>Create your account</h2>
        <AuthForm
          mode="register"
          onSubmit={handleSubmit}
          onGoogle={handleGoogle}
          loading={loading}
          error={error}
        />

        <p className={styles.switch}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>

      <div className={styles.backdrop} />
    </div>
  );
};

const getAuthError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/popup-closed-by-user': return 'Sign-in cancelled.';
    default: return 'Registration failed. Please try again.';
  }
};

export default RegisterPage;
