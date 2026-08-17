import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import {
  changePassword as changePasswordRequest,
  fetchMyProfile,
  fetchMyVehicleQr,
  updateMyProfile,
} from '../services/api';
import PasswordInput from '../components/PasswordInput';
import AboutAppExplainer from '../components/AboutAppExplainer';
import AppearancePicker from '../components/AppearancePicker';
import { applyTheme, getStoredTheme, resolveTheme } from '../utils/theme';
import '../styles/auth.css';

function buildFormFromProfile(profile) {
  return {
    fullName: profile?.user?.name || '',
    username: profile?.user?.username || '',
    age: profile?.user?.age ?? '',
    phone: profile?.user?.phone || '',
    email: profile?.user?.email || '',
    relativeName: profile?.emergencyContact?.relative_name || '',
    relativePhone: profile?.emergencyContact?.relative_phone || '',
    relationship: profile?.emergencyContact?.relationship || '',
    plateNumber: profile?.vehicle?.plate_number || '',
    carName: profile?.vehicle?.car_name || '',
    yearModel: profile?.vehicle?.year_model ?? '',
  };
}

function EditField({ id, label, type = 'text', value, onChange, placeholder = '' }) {
  return (
    <label className="profile-edit-field" htmlFor={id}>
      <span className="profile-label">{label}</span>
      <input
        id={id}
        className="profile-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

const HELP_TOPICS = [
  { id: 'register', label: 'How do I register a vehicle?', category: 'GETTING STARTED' },
  { id: 'qr', label: 'How do I download my QR?', category: 'VEHICLE & QR' },
  { id: 'bug', label: 'How do I report a bug?', category: 'SUPPORT' },
];

export default function Profile() {
  const { token, logout, updateStoredUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // UI section state
  const [section, setSection] = useState('account');
  const [helpMessages, setHelpMessages] = useState([]);
  const [helpInput, setHelpInput] = useState('');

  // theme: 'light' | 'dark'
  const [theme, setTheme] = useState(() => resolveTheme(getStoredTheme()));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) {
        setLoading(true);
        setError('');
      }
      try {
        const { ok, data } = await fetchMyProfile(token);
        if (!isMounted) return;
        if (!ok) throw new Error(data?.message || 'Unable to load profile.');
        const nextProfile = { user: data.user, emergencyContact: data.emergencyContact, vehicle: data.vehicle };
        setProfile(nextProfile);
        // Set QR token directly if returned on vehicle, otherwise fetch from QR endpoint
        if (data.vehicle) {
          if (data.vehicle.qr_token) {
            setQrToken(data.vehicle.qr_token);
          } else {
            const qrRes = await fetchMyVehicleQr(token);
            if (isMounted && qrRes.ok) {
              setQrToken(qrRes.data?.vehicle?.qr_token || '');
            }
          }
        }
      } catch (e) {
        if (isMounted) setError(e?.message || 'Unable to load profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const cancelEditing = () => {
    setForm(null);
    setEditingSection(null);
    setSaveError('');
  };

  const startEditing = (sec) => {
    setForm(buildFormFromProfile(profile));
    setEditingSection(sec);
    setSection(sec);
    setSaveError('');
    setSuccessMessage('');
  };

  const handleSectionChange = (nextSection) => {
    if (editingSection) cancelEditing();
    setSection(nextSection);
  };

  const updateFormField = (field, value) => {
    setForm((c) => ({ ...c, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSuccessMessage('');
    try {
      const { ok, data } = await updateMyProfile(token, form);
      if (!ok) throw new Error(data?.errors?.join(' ') || data?.message || 'Unable to update profile.');
      const nextProfile = { user: data.user, emergencyContact: data.emergencyContact, vehicle: data.vehicle };
      setProfile(nextProfile);
      if (data.vehicle?.qr_token) {
        setQrToken(data.vehicle.qr_token);
      }
      setForm(null);
      setEditingSection(null);
      setSuccessMessage(data.message || 'Profile updated successfully.');
      updateStoredUser({ user_id: data.user.user_id, username: data.user.username });
    } catch (err) {
      setSaveError(err?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((c) => ({ ...c, [field]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const { ok, data } = await changePasswordRequest(token, passwordForm);
      if (!ok) throw new Error(data?.errors?.join(' ') || data?.message || 'Unable to change password.');
      setPasswordSuccess(data.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err?.message || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const qrUrl = qrToken ? `${window.location.origin}/qr/${qrToken}` : '';

  const openQrModal = () => setShowQrModal(true);
  const closeQrModal = () => setShowQrModal(false);

  const downloadQr = (id = 'profile-qr-field') => {
    try {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartcar-qr-${profile?.user?.username || 'vehicle'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // ignore download error
    }
  };

  const copyQrLink = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setSuccessMessage('QR link copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch {
      // fallback
    }
  };

  const handleHelpQuery = (q) => {
    const text = String(q).toLowerCase();
    let reply = "I'm here to help. Try selecting a topic or contact support@smartcar-qr.app.";
    if (text.includes('register') || text.includes('vehicle')) {
      reply = 'To register a vehicle, complete your personal, emergency contact, and vehicle details on the registration page.';
    } else if (text.includes('qr') || text.includes('scan') || text.includes('download')) {
      reply = 'Open the Users page to view, download, or copy your QR link. Anyone who scans it can reach you securely through SmartCar QR.';
    } else if (text.includes('issue') || text.includes('bug') || text.includes('report')) {
      reply = 'Please email support@smartcar-qr.app with a short description and steps to reproduce any issue.';
    }

    setHelpMessages((h) => [...h, { from: 'bot', text: reply }]);
  };

  const askHelpQuestion = (question) => {
    setHelpMessages((h) => [...h, { from: 'user', text: question }]);
    handleHelpQuery(question);
  };

  const submitHelpQuestion = () => {
    const question = helpInput.trim();
    if (!question) return;
    askHelpQuestion(question);
    setHelpInput('');
  };

  if (loading) {
    return (
      <main className="page-shell dashboard-page">
        <section className="home-card profile-card">
          <p className="state-message">Loading profile...</p>
        </section>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="page-shell dashboard-page">
        <section className="home-card profile-card">
          <p className="state-message state-message--error">{error || 'Unable to load profile.'}</p>
        </section>
      </main>
    );
  }

  const { user, emergencyContact, vehicle } = profile;

  return (
    <main className="page-shell dashboard-page">
      <section className="home-card profile-card">
        <div className="profile-header">
          <div className="profile-title-with-thumb">
            <h1>My Profile</h1>
            {qrToken && (
              <button
                type="button"
                className="profile-qr-thumb"
                onClick={openQrModal}
                title="Click to view enlarged QR code"
                aria-label="View enlarged QR code"
              >
                <QRCodeCanvas
                  value={`${window.location.origin}/qr/${qrToken}`}
                  size={32}
                  marginSize={0}
                />
              </button>
            )}
          </div>
        </div>

        <div className="profile-layout">
          {/* Sidebar Navigation */}
          <aside className="profile-sidebar">
            <div className="profile-user-badge">
              <div className="profile-avatar-circle" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                </svg>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-h)', fontSize: '0.95rem' }}>
                  {user?.name || user?.username}
                </strong>
                <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>@{user?.username}</span>
              </div>
            </div>

            <nav className="profile-nav" aria-label="Profile sections">
              {[
                ['account', 'Account Details'],
                ['personal', 'Personal & Vehicle'],
                ['password', 'Password & Security'],
                ['appearance', 'Appearance'],
                ['help', 'Help Center'],
                ['about', 'About Application'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSectionChange(id)}
                  className={`profile-nav-btn ${section === id ? 'is-active' : ''}`}
                >
                  {label}
                </button>
              ))}
              <button type="button" onClick={handleLogout} className="profile-logout-btn">
                Log Out
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="profile-content">
            {successMessage && <p className="profile-success" role="status">{successMessage}</p>}

            {editingSection ? (
              <form className="profile-edit-form" onSubmit={handleSaveProfile}>
                {editingSection === 'account' && (
                  <section className="profile-section">
                    <div className="profile-section-header">
                      <h2>Edit Account Details</h2>
                    </div>
                    <div className="profile-edit-grid">
                      <EditField id="fullName" label="Full Name" value={form.fullName} onChange={(v) => updateFormField('fullName', v)} />
                      <EditField id="username" label="Username" value={form.username} onChange={(v) => updateFormField('username', v)} />
                      <EditField id="email" label="Email" type="email" value={form.email} onChange={(v) => updateFormField('email', v)} />
                    </div>
                  </section>
                )}

                {editingSection === 'personal' && (
                  <section className="profile-section">
                    <div className="profile-section-header">
                      <h2>Edit Personal &amp; Vehicle Details</h2>
                    </div>
                    
                    <h3 style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'var(--text-h)' }}>Personal Information</h3>
                    <div className="profile-edit-grid">
                      <EditField id="age" label="Age" type="number" value={String(form.age)} onChange={(v) => updateFormField('age', v)} />
                      <EditField id="phone" label="Phone Number" value={form.phone} onChange={(v) => updateFormField('phone', v)} />
                    </div>

                    <h3 style={{ fontSize: '1rem', marginTop: '1rem', color: 'var(--text-h)' }}>Emergency Contact</h3>
                    <div className="profile-edit-grid">
                      <EditField id="relativeName" label="Relative Name" value={form.relativeName} onChange={(v) => updateFormField('relativeName', v)} />
                      <EditField id="relativePhone" label="Relative Phone" value={form.relativePhone} onChange={(v) => updateFormField('relativePhone', v)} />
                      <EditField id="relationship" label="Relationship" value={form.relationship} onChange={(v) => updateFormField('relationship', v)} placeholder="e.g. Spouse, Sibling" />
                    </div>

                    <h3 style={{ fontSize: '1rem', marginTop: '1rem', color: 'var(--text-h)' }}>Vehicle Information</h3>
                    <div className="profile-edit-grid">
                      <EditField id="plateNumber" label="Plate Number" value={form.plateNumber} onChange={(v) => updateFormField('plateNumber', v)} />
                      <EditField id="carName" label="Car Model / Name" value={form.carName} onChange={(v) => updateFormField('carName', v)} />
                      <EditField id="yearModel" label="Year Model" type="number" value={String(form.yearModel)} onChange={(v) => updateFormField('yearModel', v)} />
                    </div>
                  </section>
                )}

                {saveError && <p className="state-message state-message--error">{saveError}</p>}
                <div className="profile-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelEditing}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {section === 'account' && (
                  <section className="profile-section">
                    <div className="profile-section-header">
                      <h2>Account Details</h2>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEditing('account')}>
                        Edit Account
                      </button>
                    </div>
                    <div className="profile-grid">
                      <div className="profile-row">
                        <span className="profile-label">Full Name</span>
                        <span className="profile-value">{user?.name || '-'}</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Username</span>
                        <span className="profile-value">{user?.username || '-'}</span>
                      </div>
                      <div className="profile-row">
                        <span className="profile-label">Email</span>
                        <span className="profile-value">{user?.email || '-'}</span>
                      </div>
                    </div>
                  </section>
                )}

                {section === 'personal' && (
                  <section className="profile-section">
                    <div className="profile-section-header">
                      <h2>Personal &amp; Vehicle Details</h2>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEditing('personal')}>
                        Edit Details
                      </button>
                    </div>

                    <div className="profile-detail-group">
                      <h3>Personal Details</h3>
                      <div className="profile-grid">
                        <div className="profile-row">
                          <span className="profile-label">Full Name</span>
                          <span className="profile-value">{user?.name || '-'}</span>
                        </div>
                        <div className="profile-row">
                          <span className="profile-label">Username</span>
                          <span className="profile-value">{user?.username || '-'}</span>
                        </div>
                        <div className="profile-row">
                          <span className="profile-label">Age</span>
                          <span className="profile-value">{user?.age ?? '-'}</span>
                        </div>
                        <div className="profile-row">
                          <span className="profile-label">Email</span>
                          <span className="profile-value">{user?.email || '-'}</span>
                        </div>
                        <div className="profile-row">
                          <span className="profile-label">Phone</span>
                          <span className="profile-value">{user?.phone || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-detail-group">
                      <h3>Emergency Contact</h3>
                      {emergencyContact ? (
                        <div className="profile-grid">
                          <div className="profile-row">
                            <span className="profile-label">Name</span>
                            <span className="profile-value">{emergencyContact.relative_name || '-'}</span>
                          </div>
                          <div className="profile-row">
                            <span className="profile-label">Phone</span>
                            <span className="profile-value">{emergencyContact.relative_phone || '-'}</span>
                          </div>
                          <div className="profile-row">
                            <span className="profile-label">Relationship</span>
                            <span className="profile-value">{emergencyContact.relationship || '-'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="state-message">No emergency contact registered.</p>
                      )}
                    </div>

                    <div className="profile-detail-group">
                      <h3>Vehicle Details</h3>
                      {vehicle ? (
                        <div className="profile-grid">
                          <div className="profile-row">
                            <span className="profile-label">Plate Number</span>
                            <span className="profile-value">{vehicle.plate_number || '-'}</span>
                          </div>
                          <div className="profile-row">
                            <span className="profile-label">Car Name</span>
                            <span className="profile-value">{vehicle.car_name || '-'}</span>
                          </div>
                          <div className="profile-row">
                            <span className="profile-label">Model Year</span>
                            <span className="profile-value">{vehicle.year_model ?? '-'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="state-message">No vehicle registered.</p>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}

            {!editingSection && section === 'myqr' && (
              <section className="profile-section">
                <div className="profile-section-header">
                  <h2>My Vehicle QR Code</h2>
                </div>
                <div className="profile-qr-panel">
                  <div className="profile-qr-canvas-box">
                    <QRCodeCanvas id="profile-qr-field-main" value={qrUrl} size={220} includeMargin />
                  </div>
                  {qrUrl ? (
                    <>
                      <div className="profile-qr-url-box">
                        <a href={qrUrl} target="_blank" rel="noopener noreferrer">
                          {qrUrl}
                        </a>
                      </div>
                      <div className="profile-qr-actions">
                        <button type="button" className="btn btn-primary" onClick={() => downloadQr('profile-qr-field-main')}>
                          Download QR Code
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={copyQrLink}>
                          Copy Link
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="state-message">No QR code found. Please ensure your vehicle is registered.</p>
                  )}
                </div>
              </section>
            )}

            {!editingSection && section === 'password' && (
              <section className="profile-section">
                <div className="profile-section-header">
                  <h2>Password &amp; Security</h2>
                </div>
                <form className="profile-password-form" onSubmit={handleChangePassword}>
                  <label className="profile-edit-field" htmlFor="currentPassword">
                    <span className="profile-label">Current Password</span>
                    <PasswordInput
                      id="currentPassword"
                      inputClassName="profile-input"
                      value={passwordForm.currentPassword}
                      onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
                      autoComplete="current-password"
                      required
                      label="Show current password"
                      hideLabel="Hide current password"
                    />
                  </label>
                  <label className="profile-edit-field" htmlFor="newPassword">
                    <span className="profile-label">New Password</span>
                    <PasswordInput
                      id="newPassword"
                      inputClassName="profile-input"
                      value={passwordForm.newPassword}
                      onChange={(e) => updatePasswordField('newPassword', e.target.value)}
                      autoComplete="new-password"
                      required
                      label="Show new password"
                      hideLabel="Hide new password"
                    />
                  </label>
                  <label className="profile-edit-field" htmlFor="confirmPassword">
                    <span className="profile-label">Confirm New Password</span>
                    <PasswordInput
                      id="confirmPassword"
                      inputClassName="profile-input"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
                      autoComplete="new-password"
                      required
                      label="Show confirm password"
                      hideLabel="Hide confirm password"
                    />
                  </label>
                  {passwordError && <p className="state-message state-message--error">{passwordError}</p>}
                  {passwordSuccess && <p className="profile-success">{passwordSuccess}</p>}
                  <div className="profile-form-actions">
                    <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                      {passwordSaving ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {!editingSection && section === 'appearance' && (
              <section className="profile-section">
                <div className="profile-section-header">
                  <h2>Appearance &amp; Theme</h2>
                </div>
                <AppearancePicker value={theme} onChange={setTheme} />
              </section>
            )}

            {!editingSection && section === 'help' && (
              <section className="profile-section">
                <div className="profile-section-header">
                  <div>
                    <h2>Help Center</h2>
                    <p className="page-description" style={{ margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
                      Browse common topics or chat with the SmartCar assistant.
                    </p>
                  </div>
                </div>
                <div className="help-center">
                  <aside className="help-topics-card">
                    <div className="help-topics-header">
                      <h3>Popular topics</h3>
                      <span className="help-topics-badge">3 articles</span>
                    </div>
                    <div className="help-topics-list">
                      {HELP_TOPICS.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          className="help-topic-item"
                          onClick={() => askHelpQuestion(topic.label)}
                        >
                          <div className="help-topic-text">
                            <span className="help-topic-category">{topic.category}</span>
                            <span className="help-topic-title">{topic.label}</span>
                          </div>
                          <svg className="help-topic-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </aside>

                  <div className="help-chat-card">
                    <div className="help-chat__header">
                      <div className="help-chat__identity">
                        <div className="help-chat__avatar" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </div>
                        <div>
                          <strong className="help-chat__name">SmartCar Assistant</strong>
                          <span className="help-chat__sub">Typically replies instantly</span>
                        </div>
                      </div>
                      <span className="help-chat__status">ONLINE</span>
                    </div>

                    <div className="help-chat__body">
                      {helpMessages.length === 0 ? (
                        <div className="help-chat__empty-state">
                          <div className="help-chat__empty-icon" aria-hidden="true">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <strong>How can we help?</strong>
                          <p>Select a topic on the left or type your question below.</p>
                        </div>
                      ) : (
                        helpMessages.map((message, index) => (
                          <div key={`${message.from}-${index}`} className={`help-message help-message--${message.from}`}>
                            <div className="help-message__bubble">{message.text}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="help-chat__composer">
                      <input
                        className="help-chat__input"
                        value={helpInput}
                        onChange={(e) => setHelpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submitHelpQuestion();
                          }
                        }}
                        placeholder="Ask a question..."
                        aria-label="Ask a question"
                      />
                      <button
                        type="button"
                        className="btn btn-primary help-chat__send-btn"
                        onClick={submitHelpQuestion}
                        disabled={!helpInput.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!editingSection && section === 'about' && (
              <section className="profile-section">
                <div className="profile-section-header">
                  <h2>About SmartCar QR</h2>
                </div>
                <AboutAppExplainer />
              </section>
            )}
          </div>
        </div>

        {/* Modal for full QR view */}
        {showQrModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="QR code preview"
            className="service-modal-backdrop"
            onClick={closeQrModal}
          >
            <div className="service-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
              <div className="service-modal__header">
                <h2>Vehicle QR Code</h2>
                <button type="button" className="service-modal__close" onClick={closeQrModal} aria-label="Close modal">
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                <div className="profile-qr-canvas-box">
                  <QRCodeCanvas id="profile-qr-modal" value={qrUrl} size={240} includeMargin />
                </div>
              </div>
              <div className="profile-qr-url-box" style={{ margin: '0 auto 1.25rem' }}>
                <a href={qrUrl} target="_blank" rel="noopener noreferrer">
                  {qrUrl}
                </a>
              </div>
              <div className="profile-qr-actions">
                <button type="button" onClick={() => downloadQr('profile-qr-modal')} className="btn btn-primary">
                  Download
                </button>
                <button type="button" onClick={copyQrLink} className="btn btn-secondary">
                  Copy Link
                </button>
                <button type="button" onClick={closeQrModal} className="btn btn-outline">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
