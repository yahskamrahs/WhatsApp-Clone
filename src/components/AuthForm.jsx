import { useState } from 'react';
import styles from './AuthForm.module.css';

const AuthForm = ({
  mode = 'login', // 'login' | 'register'
  onSubmit,
  onGoogle,
  loading,
  error,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'register' && password !== confirm) return;
    onSubmit({ displayName, email, password });
  };

  const isRegister = mode === 'register';
  const passMatch = password === confirm;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {isRegister && (
        <div className={styles.field}>
          <label className={styles.label}>Display Name</label>
          <input
            className="input"
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          className="input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Password</label>
        <div className={styles.passWrap}>
          <input
            className="input"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            style={{ paddingRight: 44 }}
          />
          <button type="button" className={styles.passToggle} onClick={() => setShowPass((v) => !v)}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {isRegister && (
        <div className={styles.field}>
          <label className={styles.label}>Confirm Password</label>
          <input
            className="input"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            style={{ borderColor: confirm && !passMatch ? 'var(--danger)' : undefined }}
          />
          {confirm && !passMatch && <span className={styles.validationMsg}>Passwords don't match</span>}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%' }}
        disabled={loading || (isRegister && !passMatch)}
      >
        {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
      </button>

      <div className="divider">or</div>

      <button type="button" className="btn btn-google" onClick={onGoogle} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.7 2.4 30.2 0 24 0 14.7 0 6.8 5.4 2.7 13.3l7.9 6.1C12.5 13.2 17.8 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.4-4.7 7l7.3 5.7c4.3-4 6.8-9.9 7.2-16.7z"/>
          <path fill="#FBBC05" d="M10.6 28.6c-.6-1.7-.9-3.6-.9-5.6s.3-3.9.9-5.6l-7.9-6.1C1 14.5 0 19.1 0 24s1 9.5 2.7 13.7l7.9-9.1z"/>
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2.1 1.4-4.8 2.2-7.9 2.2-6.2 0-11.5-3.7-13.4-9l-7.9 6.1C6.8 42.6 14.7 48 24 48z"/>
        </svg>
        Continue with Google
      </button>
    </form>
  );
};

export default AuthForm;
