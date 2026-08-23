
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as signupRequest } from '../services/api';
import PasswordInput from '../components/PasswordInput';
import BrandMark from '../components/BrandMark';
import '../styles/auth.css';

function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { ok, data } = await signupRequest(
        username,
        password,
        confirmPassword,
      );

      if (!ok) {
        const message =
          data.errors?.join(' ') ||
          data.message ||
          'Sign up failed. Please try again.';
        setError(message);
        return;
      }

      login(data.token, data.user, false);
      navigate('/register');
    } catch {
      setError('Unable to reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <BrandMark />
          <span>SmartCar QR</span>
        </Link>
        <p className="auth-subtitle">Create your account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="signup-username">Username *</label>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
  <label htmlFor="signup-password">Password *</label>

  <div className="mobile-password-field">
    <input
      id="signup-password"
      name="password"
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      autoComplete="new-password"
      required
    />

    <button
      type="button"
      className="mobile-password-eye"
      onClick={() => setShowPassword((current) => !current)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58A3 3 0 0113.42 13.42" />
          <path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  </div>
</div>

<div className="auth-field">
  <label htmlFor="confirm-password">Confirm Password *</label>

  <div className="mobile-password-field">
    <input
      id="confirm-password"
      name="confirmPassword"
      type={showConfirmPassword ? 'text' : 'password'}
      value={confirmPassword}
      onChange={(event) => setConfirmPassword(event.target.value)}
      autoComplete="new-password"
      required
    />

    <button
      type="button"
      className="mobile-password-eye"
      onClick={() => setShowConfirmPassword((current) => !current)}
      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
    >
      {showConfirmPassword ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58A3 3 0 0113.42 13.42" />
          <path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  </div>
</div>

          <p className="auth-hint">
            Password must be at least 6 characters and include uppercase,
            lowercase, number, and symbol.
          </p>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
