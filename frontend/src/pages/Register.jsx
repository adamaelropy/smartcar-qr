import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitRegistration } from '../services/api';
import '../styles/auth.css';

const initialForm = {
  fullName: '',
  age: '',
  email: '',
  phone: '',
  relativeName: '',
  relativePhone: '',
  relationship: '',
  plateNumber: '',
  carName: '',
  yearModel: '',
};

function Register() {
  const navigate = useNavigate();
  const { token, completeRegistration } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { ok, data } = await submitRegistration(form, token);

      if (!ok) {
        const message =
          data.errors?.join(' ') ||
          data.message ||
          'Registration failed. Please try again.';
        setError(message);
        return;
      }

      completeRegistration();
      navigate('/');
    } catch {
      setError('Unable to reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>SmartCar QR</h1>
        <p className="auth-subtitle">
          Complete your registration with your personal and vehicle details
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <fieldset className="auth-section">
            <legend>Personal Information</legend>
            <div className="auth-grid">
              <div className="auth-field">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={updateField('fullName')}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="age">Age *</label>
                <input
                  id="age"
                  type="number"
                  min="16"
                  max="120"
                  value={form.age}
                  onChange={updateField('age')}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={updateField('email')}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField('phone')}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="auth-section">
            <legend>Emergency Contact</legend>
            <div className="auth-grid">
              <div className="auth-field">
                <label htmlFor="relativeName">Relative Name *</label>
                <input
                  id="relativeName"
                  type="text"
                  value={form.relativeName}
                  onChange={updateField('relativeName')}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="relativePhone">Relative Phone *</label>
                <input
                  id="relativePhone"
                  type="tel"
                  value={form.relativePhone}
                  onChange={updateField('relativePhone')}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="relationship">Relationship *</label>
                <input
                  id="relationship"
                  type="text"
                  placeholder="e.g. Spouse, Parent, Sibling"
                  value={form.relationship}
                  onChange={updateField('relationship')}
                  required
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="auth-section">
            <legend>Vehicle Information</legend>
            <div className="auth-grid">
              <div className="auth-field">
                <label htmlFor="plateNumber">Plate Number *</label>
                <input
                  id="plateNumber"
                  type="text"
                  value={form.plateNumber}
                  onChange={updateField('plateNumber')}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="carName">Car Name *</label>
                <input
                  id="carName"
                  type="text"
                  value={form.carName}
                  onChange={updateField('carName')}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="yearModel">Year Model *</label>
                <input
                  id="yearModel"
                  type="number"
                  min="1980"
                  max="2030"
                  value={form.yearModel}
                  onChange={updateField('yearModel')}
                  required
                />
              </div>
            </div>
          </fieldset>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
