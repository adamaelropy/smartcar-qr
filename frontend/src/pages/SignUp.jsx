
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
            <input
                id="signup-confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password">Confirm Password *</label>
            <div className="auth-field">
            <label htmlFor="confirm-password">Confirm Password *</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
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
