import { useCallback, useEffect, useState } from 'react';
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

function EditField({ id, label, type = 'text', value, onChange }) {
  return (
    <label className="profile-edit-field" htmlFor={id}>
      <span className="profile-label">{label}</span>
      <input id={id} className="profile-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const HELP_TOPICS = [
  { id: 'register', label: 'How do I register a vehicle?', category: 'Getting started' },
  { id: 'qr', label: 'How do I download my QR?', category: 'Vehicle & QR' },
  { id: 'bug', label: 'How do I report a bug?', category: 'Support' },
];

export default function Profile() {
  const { token, logout, updateStoredUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrError, setQrError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // UI state
  const [section, setSection] = useState('account');
  const [helpMessages, setHelpMessages] = useState([]);
  const [helpInput, setHelpInput] = useState('');

  // theme: 'light' | 'dark'
  const [theme, setTheme] = useState(() => resolveTheme(getStoredTheme()));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const loadQrForVehicle = useCallback(
    async (hasVehicle) => {
      if (!token || !hasVehicle) {
        setQrToken('');
        setQrError('');
        return;
      }
      const qrResponse = await fetchMyVehicleQr(token);
      if (qrResponse.ok) {
        setQrToken(qrResponse.data?.vehicle?.qr_token || '');
        setQrError('');
      } else if (qrResponse.status === 404) {
        setQrToken('');
        setQrError('');
      } else {
        setQrToken('');
        setQrError(qrResponse.data?.message || 'Unable to load QR code.');
      }
    },
    [token]
  );

  const loadProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { ok, data } = await fetchMyProfile(token);
      if (!ok) throw new Error(data?.message || 'Unable to load profile.');
      const nextProfile = { user: data.user, emergencyContact: data.emergencyContact, vehicle: data.vehicle };
      setProfile(nextProfile);
      await loadQrForVehicle(Boolean(nextProfile.vehicle));
    } catch (e) {
      setError(e?.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, [token, loadQrForVehicle]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const cancelEditing = () => { setForm(null); setEditingSection(null); setSaveError(''); };
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
  const updateFormField = (field, value) => setForm((c) => ({ ...c, [field]: value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveError(''); setSuccessMessage('');
    try {
      const { ok, data } = await updateMyProfile(token, form);
      if (!ok) throw new Error(data?.errors?.join(' ') || data?.message || 'Unable to update profile.');
      const nextProfile = { user: data.user, emergencyContact: data.emergencyContact, vehicle: data.vehicle };
      setProfile(nextProfile); setForm(null); setEditingSection(null);
      setSuccessMessage(data.message || 'Profile updated');
      updateStoredUser({ user_id: data.user.user_id, username: data.user.username });
      await loadQrForVehicle(Boolean(nextProfile.vehicle));
    } catch (err) { setSaveError(err?.message || 'Unable to update'); }
    finally { setSaving(false); }
  };

  const openChangePassword = () => { setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setIsChangingPassword(true); setEditingSection(null); };
  const cancelChangePassword = () => { setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setIsChangingPassword(false); };
  const updatePasswordField = (field, value) => setPasswordForm((c) => ({ ...c, [field]: value }));
  const handleChangePassword = async (e) => {
    e.preventDefault(); setPasswordSaving(true); setPasswordError(''); setPasswordSuccess('');
    try {
      const { ok, data } = await changePasswordRequest(token, passwordForm);
      if (!ok) throw new Error(data?.errors?.join(' ') || data?.message || 'Unable to change password.');
      setPasswordSuccess(data.message || 'Password changed'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPasswordError(err?.message || 'Unable to change password.'); }
    finally { setPasswordSaving(false); }
  };

  if (loading) return (<main className="page-shell dashboard-page"><section className="home-card profile-card"><p className="state-message">Loading profile...</p></section></main>);
  if (error || !profile) return (<main className="page-shell dashboard-page"><section className="home-card profile-card"><p className="state-message state-message--error">{error || 'Unable to load profile.'}</p></section></main>);

  const { user, emergencyContact, vehicle } = profile;
  const qrUrl = qrToken ? `${window.location.origin}/qr/${qrToken}` : '';

  const openQrModal = () => setShowQrModal(true);
  const closeQrModal = () => setShowQrModal(false);
  const downloadQr = (id = 'profile-qr-field') => {
    try {
      const canvas = document.getElementById(id); if (!canvas) return; const url = canvas.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = 'smartcar-qr.png'; document.body.appendChild(a); a.click(); a.remove();
    } catch {}
  };
  const copyQrLink = async () => { if (!qrUrl) return; try { await navigator.clipboard.writeText(qrUrl); setSuccessMessage('QR link copied'); setTimeout(()=>setSuccessMessage(''),2000); } catch {} };

  const handleHelpQuery = (q) => {
    const text = String(q).toLowerCase();
    let reply = "I'm here to help. Try selecting a topic or contact support@example.com.";
    if (text.includes('register') || text.includes('vehicle')) {
      reply = 'To register a vehicle, open Register from the menu and complete your personal, emergency contact, and vehicle details.';
    } else if (text.includes('qr') || text.includes('scan') || text.includes('download')) {
      reply = 'Go to Profile > My QR to view, download, or copy your QR link. Anyone who scans it can reach you through SmartCar QR.';
    } else if (text.includes('issue') || text.includes('bug') || text.includes('report')) {
      reply = 'Email support@example.com with a short description, screenshots if possible, and the steps to reproduce the issue.';
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


  return (
    <main className="page-shell dashboard-page">
      <section className="home-card profile-card" style={{ gap: 20 }}>
        <div className="profile-header">
          <div className="profile-title-with-thumb">
            <div>
              <p className="eyebrow">Profile</p>
              <h1 style={{ margin: 0 }}>My Profile</h1>
            </div>
            {vehicle && qrToken && (
              <a onClick={openQrModal} className="profile-qr-thumb" role="button" aria-label="Open my QR">
                <QRCodeCanvas id="profile-qr-thumb-canvas" value={qrUrl} size={56} includeMargin={false} />
              </a>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <aside style={{ width: 280 }}>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 28, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" stroke="#1e40af" strokeWidth="1.2"/><path d="M4 20c0-3 4-4.5 8-4.5s8 1.5 8 4.5" stroke="#1e40af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{user?.name || user?.username}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{user?.username}</div>
                </div>
              </div>

              <nav style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }} aria-label="Profile sections">
                {[['account','Account'],['personal','Personal details'],['myqr','My QR'],['password','Password & security'],['appearance','Appearance'],['help','Help'],['about','About']].map(([id,label])=> (
                  <button key={id} type="button" onClick={() => handleSectionChange(id)} className={`dashboard-link ${section===id?'is-active':''}`} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: section===id? '#eef2ff':'transparent' }}>{label}</button>
                ))}
                <button type="button" onClick={handleLogout} style={{ marginTop: 12, background: '#fee2e2', borderRadius: 8, padding: '8px 12px' }}>Log out</button>
              </nav>
            </div>
          </aside>

          <div style={{ flex: 1 }}>
            {successMessage && <p className="profile-success" role="status">{successMessage}</p>}

            {editingSection ? (
              <form className="profile-edit-form" onSubmit={handleSaveProfile}>
                {editingSection === 'account' && (
                  <section className="profile-section"><h2>Account</h2>
                    <div className="profile-edit-grid">
                      <EditField id="fullName" label="Full Name" value={form.fullName} onChange={(v)=>updateFormField('fullName',v)} />
                      <EditField id="username" label="Username" value={form.username} onChange={(v)=>updateFormField('username',v)} />
                      <EditField id="email" label="Email" type="email" value={form.email} onChange={(v)=>updateFormField('email',v)} />
                    </div>
                  </section>
                )}

                {editingSection === 'personal' && (
                  <section className="profile-section"><h2>Personal details</h2>
                    <div className="profile-edit-grid">
                      <div>
                        <h3>Personal</h3>
                        <EditField id="age" label="Age" type="number" value={String(form.age)} onChange={(v)=>updateFormField('age',v)} />
                        <EditField id="phone" label="Phone" value={form.phone} onChange={(v)=>updateFormField('phone',v)} />
                      </div>
                      <div>
                        <h3>Relative</h3>
                        <EditField id="relativeName" label="Name" value={form.relativeName} onChange={(v)=>updateFormField('relativeName',v)} />
                        <EditField id="relativePhone" label="Phone" value={form.relativePhone} onChange={(v)=>updateFormField('relativePhone',v)} />
                        <EditField id="relationship" label="Relationship" value={form.relationship} onChange={(v)=>updateFormField('relationship',v)} />
                      </div>
                      <div>
                        <h3>Vehicle</h3>
                        <EditField id="plateNumber" label="Plate Number" value={form.plateNumber} onChange={(v)=>updateFormField('plateNumber',v)} />
                        <EditField id="carName" label="Car Name" value={form.carName} onChange={(v)=>updateFormField('carName',v)} />
                        <EditField id="yearModel" label="Year Model" type="number" value={String(form.yearModel)} onChange={(v)=>updateFormField('yearModel',v)} />
                      </div>
                    </div>
                  </section>
                )}

                {saveError && <p className="state-message state-message--error">{saveError}</p>}
                <div className="profile-form-actions"><button type="submit" className="profile-save-button" disabled={saving}>{saving?'Saving...':'Save Changes'}</button><button type="button" className="profile-cancel-button" onClick={cancelEditing}>Cancel</button></div>
              </form>
            ) : (
              <>
                {section === 'account' && (
                  <section className="profile-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ color: '#0f172a' }}>Account</h2>
                      <button type="button" className="profile-edit-button" onClick={() => startEditing('account')}>Edit</button>
                    </div>
                    <div className="profile-grid">
                      <div className="profile-row">
                        <div className="profile-label">Full name</div>
                        <div className="profile-value">{user?.name ?? '-'}</div>
                      </div>
                      <div className="profile-row">
                        <div className="profile-label">Username</div>
                        <div className="profile-value">{user?.username ?? '-'}</div>
                      </div>
                      <div className="profile-row">
                        <div className="profile-label">Email</div>
                        <div className="profile-value">{user?.email ?? '-'}</div>
                      </div>
                    </div>
                  </section>
                )}

                {section === 'personal' && (
                  <section className="profile-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ color: '#0f172a' }}>Personal details</h2>
                      <button type="button" className="profile-edit-button" onClick={() => startEditing('personal')}>Edit</button>
                    </div>
                    <div className="profile-grid">
                      <div className="profile-row">
                        <div className="profile-label">Personal</div>
                        <div className="profile-value">Age: {user?.age ?? '-'} · Phone: {user?.phone ?? '-'}</div>
                      </div>
                      <div className="profile-row">
                        <div className="profile-label">Emergency contact</div>
                        <div className="profile-value">{emergencyContact?.relative_name ?? '-'} · {emergencyContact?.relative_phone ?? '-'} · {emergencyContact?.relationship ?? '-'}</div>
                      </div>
                      <div className="profile-row">
                        <div className="profile-label">Vehicle</div>
                        <div className="profile-value">{vehicle?.car_name || '-'} {vehicle?.plate_number ? `• ${vehicle?.plate_number}` : ''}</div>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}

            {!editingSection && section === 'myqr' && (
              <section className="profile-section">
                <h2>My QR</h2>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <QRCodeCanvas id="profile-qr-field-main" value={qrUrl} size={240} includeMargin />
                </div>
                <p style={{ textAlign: 'center', marginTop: 12, wordBreak: 'break-all' }}><a href={qrUrl} target="_blank" rel="noopener noreferrer">{qrUrl}</a></p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                  <button className="profile-download-button" onClick={() => downloadQr('profile-qr-field-main')}>Download</button>
                  <button className="profile-copy-button" onClick={copyQrLink}>Copy link</button>
                </div>
              </section>
            )}

            {!editingSection && section === 'password' && (
              <section className="profile-password-panel">
                <h2>Password &amp; security</h2>
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
                  <div className="profile-form-actions"><button type="submit" className="profile-save-button" disabled={passwordSaving}>{passwordSaving?'Changing...':'Change Password'}</button></div>
                </form>
              </section>
            )}

            {!editingSection && section === 'appearance' && (
              <section className="profile-section appearance-section">
                <h2>Appearance</h2>
                <AppearancePicker value={theme} onChange={setTheme} />
              </section>
            )}

            {!editingSection && section === 'help' && (
              <section className="profile-section help-section">
                <div className="help-section__intro">
                  <h2>Help Center</h2>
                  <p className="help-section__subtitle">Browse common topics or chat with the SmartCar assistant.</p>
                </div>

                <div className="help-center">
                  <aside className="help-topics">
                    <div className="help-topics__header">
                      <h3>Popular topics</h3>
                      <span className="help-topics__count">{HELP_TOPICS.length} articles</span>
                    </div>
                    <div className="help-topic-list">
                      {HELP_TOPICS.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          className="help-topic-button"
                          onClick={() => askHelpQuestion(topic.label)}
                        >
                          <span className="help-topic-button__content">
                            <span className="help-topic-button__category">{topic.category}</span>
                            <span className="help-topic-button__label">{topic.label}</span>
                          </span>
                          <svg className="help-topic-button__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </aside>

                  <div className="help-chat">
                    <div className="help-chat__header">
                      <div className="help-chat__identity">
                        <div className="help-chat__avatar" aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7L12 3z" />
                          </svg>
                        </div>
                        <div>
                          <strong>SmartCar Assistant</strong>
                          <span>Typically replies instantly</span>
                        </div>
                      </div>
                      <span className="help-chat__status">Online</span>
                    </div>

                    <div className="help-chat__body">
                      {helpMessages.length === 0 ? (
                        <div className="help-chat__empty">
                          <div className="help-chat__empty-icon" aria-hidden="true">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                            </svg>
                          </div>
                          <strong>How can we help?</strong>
                          <p>Select a topic on the left or type your question below.</p>
                        </div>
                      ) : (
                        helpMessages.map((message, index) => (
                          <div
                            key={`${message.from}-${index}`}
                            className={`help-message help-message--${message.from}`}
                          >
                            {message.from === 'bot' && (
                              <div className="help-message__avatar" aria-hidden="true">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7L12 3z" />
                                </svg>
                              </div>
                            )}
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
                        className="help-chat__send"
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
              <section className="profile-section about-section">
                <AboutAppExplainer />
              </section>
            )}
          </div>
        </div>

        {showQrModal && (
          <div role="dialog" aria-modal="true" aria-label="QR code preview" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 9999 }} onClick={closeQrModal}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 20, borderRadius: 8, maxWidth: 480, width: '92%', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>My QR</h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}><QRCodeCanvas id="profile-qr-modal" value={qrUrl} size={300} includeMargin /></div>
              <p style={{ marginTop: 12, wordBreak: 'break-all' }}><a href={qrUrl} target="_blank" rel="noopener noreferrer">{qrUrl}</a></p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                <button type="button" onClick={() => downloadQr('profile-qr-modal')} className="profile-download-button">Download</button>
                <button type="button" onClick={copyQrLink} className="profile-copy-button">Copy link</button>
                <button type="button" onClick={closeQrModal} className="profile-close-button">Close</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
