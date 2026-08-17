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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [section, setSection] = useState('account');
  const [selectedField, setSelectedField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [helpMessages, setHelpMessages] = useState([]);
  const [helpInput, setHelpInput] = useState('');

  // theme: 'system' | 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const apply = (mode) => {
      if (mode === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
      } else {
        document.documentElement.dataset.theme = mode === 'dark' ? 'dark' : 'light';
      }
    };

    apply(theme);
    try { localStorage.setItem('theme', theme); } catch {}

    let mql;
    const onChange = () => { if (theme === 'system') apply('system'); };
    try {
      if (window.matchMedia) {
        mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
      }
    } catch {}

    return () => { if (mql) { mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange); } };
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

  const startEditing = (sec) => { setForm(buildFormFromProfile(profile)); setEditingSection(sec); setSaveError(''); setSuccessMessage(''); };
  const cancelEditing = () => { setForm(null); setEditingSection(null); };
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
    // simple canned responses
    const text = String(q).toLowerCase();
    let reply = "I'm here to help — try our docs or contact support.";
    if (text.includes('register') || text.includes('vehicle')) reply = 'To register a vehicle, go to Register > Vehicle and fill in the plate number and car details.';
    else if (text.includes('qr') || text.includes('scan')) reply = 'When someone scans your QR, they can send a message to the device owner. You can download your QR from My QR.';
    else if (text.includes('issue') || text.includes('bug') || text.includes('report')) reply = 'Please open an issue at support@example.com with details and we will investigate.';

    setHelpMessages((h) => [...h, { from: 'bot', text: reply }]);
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
                  <button key={id} type="button" onClick={() => setSection(id)} className={`dashboard-link ${section===id?'is-active':''}`} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: section===id? '#eef2ff':'transparent' }}>{label}</button>
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

            {section === 'myqr' && (
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

            {section === 'password' && (
              <section className="profile-password-panel">
                <h2>Password &amp; security</h2>
                <form className="profile-password-form" onSubmit={handleChangePassword}>
                  <label className="profile-edit-field" htmlFor="currentPassword">
                    <span className="profile-label">Current Password</span>
                    <div className="input-with-icon">
                      <input id="currentPassword" className="profile-input" type={showCurrentPassword ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e)=>updatePasswordField('currentPassword',e.target.value)} required />
                      <button type="button" className="icon-button" onClick={() => setShowCurrentPassword(s => !s)} aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}>
                        {showCurrentPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0113.42 13.42"/><path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.05 12a19.6 19.6 0 014.28-4.77C7.99 4.99 11.03 3 12 3c4.97 0 9 5 9 5s-4.03 5-9 5a9 9 0 01-2.35-.31"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </label>
                  <label className="profile-edit-field" htmlFor="newPassword">
                    <span className="profile-label">New Password</span>
                    <div className="input-with-icon">
                      <input id="newPassword" className="profile-input" type={showNewPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e)=>updatePasswordField('newPassword',e.target.value)} required />
                      <button type="button" className="icon-button" onClick={() => setShowNewPassword(s => !s)} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}>
                        {showNewPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0113.42 13.42"/><path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.05 12a19.6 19.6 0 014.28-4.77C7.99 4.99 11.03 3 12 3c4.97 0 9 5 9 5s-4.03 5-9 5a9 9 0 01-2.35-.31"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </label>
                  <label className="profile-edit-field" htmlFor="confirmPassword">
                    <span className="profile-label">Confirm New Password</span>
                    <div className="input-with-icon">
                      <input id="confirmPassword" className="profile-input" type={showConfirmPassword ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(e)=>updatePasswordField('confirmPassword',e.target.value)} required />
                      <button type="button" className="icon-button" onClick={() => setShowConfirmPassword(s => !s)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0113.42 13.42"/><path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.05 12a19.6 19.6 0 014.28-4.77C7.99 4.99 11.03 3 12 3c4.97 0 9 5 9 5s-4.03 5-9 5a9 9 0 01-2.35-.31"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </label>
                  {passwordError && <p className="state-message state-message--error">{passwordError}</p>}
                  {passwordSuccess && <p className="profile-success">{passwordSuccess}</p>}
                  <div className="profile-form-actions"><button type="submit" className="profile-save-button" disabled={passwordSaving}>{passwordSaving?'Changing...':'Change Password'}</button></div>
                </form>
              </section>
            )}

            {section === 'appearance' && (
              <section className="profile-section">
                <h2>Appearance</h2>
                <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                  {['system','light','dark'].map((t)=> (
                    <button key={t} type="button" onClick={() => setTheme(t)} className={theme===t? 'profile-edit-button' : 'profile-cancel-button'}>{t === 'system' ? 'System' : (t==='light'?'Light':'Dark')}</button>
                  ))}
                </div>
              </section>
            )}

            {section === 'help' && (
              <section className="profile-section">
                <h2>Help</h2>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ width: 320 }}>
                    <p style={{ marginTop: 0 }}>Common questions</p>
                    {['How do I register a vehicle?','How do I download my QR?','How do I report a bug?'].map((q)=> (
                      <button key={q} type="button" onClick={() => { setHelpMessages((h)=>[...h,{from:'user',text:q}]); handleHelpQuery(q); }} style={{ display:'block', width:'100%', textAlign:'left', padding:10, marginBottom:8 }}>{q}</button>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ minHeight: 160, border: '1px solid #e6e6e6', padding: 12, borderRadius: 8, overflowY: 'auto' }}>
                      {helpMessages.length === 0 && <p className="page-description">Select a question or type below.</p>}
                      {helpMessages.map((m,i)=> (
                        <div key={i} style={{ marginBottom: 8, textAlign: m.from === 'user' ? 'right' : 'left' }}><div style={{ display:'inline-block', background: m.from === 'user' ? '#e6f0ff' : '#f1f5f9', padding:8, borderRadius:6 }}>{m.text}</div></div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input value={helpInput} onChange={(e)=>setHelpInput(e.target.value)} placeholder="Ask a question" style={{ flex: 1, padding: 8 }} />
                      <button type="button" onClick={()=>{ if (!helpInput) return; setHelpMessages((h)=>[...h,{from:'user',text:helpInput}]); handleHelpQuery(helpInput); setHelpInput(''); }}>Send</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {section === 'about' && (
              <section className="profile-section">
                <h2>About SmartCar QR</h2>
                <p>SmartCar QR provides quick sharing of vehicle contact information via QR codes. This app lets you manage profile, vehicle data, and your QR code for sharing with responders or contacts.</p>
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
