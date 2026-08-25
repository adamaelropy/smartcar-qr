import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  changePassword as changePasswordRequest,
  fetchMyProfile,
  fetchMyVehicleQr,
  updateMyProfile,
} from '../services/api';
import { applyTheme, getStoredTheme, resolveTheme } from '../utils/theme';
import { SUPPORT_EMAIL, buildQrUrl } from '../constants/appConfig';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import { AccountDisplay, AccountEditForm } from '../components/profile/AccountSection';
import { PersonalDisplay, PersonalEditForm } from '../components/profile/PersonalSection';
import PasswordSection from '../components/profile/PasswordSection';
import AppearanceSection from '../components/profile/AppearanceSection';
import HelpSection from '../components/profile/HelpSection';
import AboutSection from '../components/profile/AboutSection';
import QRModal from '../components/profile/QRModal';
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [section, setSection] = useState('account');
  const [helpMessages, setHelpMessages] = useState([]);
  const [helpInput, setHelpInput] = useState('');
  const [theme, setTheme] = useState(() => resolveTheme(getStoredTheme()));
  const successTimeoutRef = useRef(null);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const { ok, data } = await fetchMyProfile(token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!ok) throw new Error(data?.message || 'Unable to load profile.');
        const nextProfile = { user: data.user, emergencyContact: data.emergencyContact, vehicle: data.vehicle };
        setProfile(nextProfile);
        if (data.vehicle) {
          if (data.vehicle.qr_token) {
            setQrToken(data.vehicle.qr_token);
          } else {
            const qrRes = await fetchMyVehicleQr(token, { signal: controller.signal });
            if (!controller.signal.aborted && qrRes.ok) {
              setQrToken(qrRes.data?.vehicle?.qr_token || '');
            }
          }
        }
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Unable to load profile.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
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

  const qrUrl = buildQrUrl(qrToken);
  const openQrModal = () => setShowQrModal(true);
  const closeQrModal = () => setShowQrModal(false);

  const downloadQr = (id = 'profile-qr-modal') => {
    try {
      const canvas = document.getElementById(id) || qrCanvasRef.current;
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartcar-qr-${profile?.user?.username || 'vehicle'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // ignore
    }
  };

  const copyQrLink = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setSuccessMessage('QR link copied to clipboard!');
      if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = window.setTimeout(() => setSuccessMessage(''), 2500);
    } catch {
      // fallback
    }
  };

  const handleHelpQuery = (q) => {
    const text = String(q).toLowerCase();
    let reply = `I'm here to help. Try selecting a topic or contact ${SUPPORT_EMAIL}.`;
    if (text.includes('register') || text.includes('vehicle')) {
      reply = 'To register a vehicle, complete your personal, emergency contact, and vehicle details on the registration page.';
    } else if (text.includes('qr') || text.includes('scan') || text.includes('download')) {
      reply = 'Open the Users page to view, download, or copy your QR link. Anyone who scans it can reach you securely through SmartCar QR.';
    } else if (text.includes('issue') || text.includes('bug') || text.includes('report')) {
      reply = `Please email ${SUPPORT_EMAIL} with a short description and steps to reproduce any issue.`;
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
        <ProfileHeader qrToken={qrToken} onOpenQrModal={openQrModal} />

        <div className="profile-layout">
          <ProfileSidebar user={user} section={section} onSectionChange={handleSectionChange} onLogout={handleLogout} />

          <div className="profile-content">
            {successMessage && <p className="profile-success" role="status">{successMessage}</p>}

            {editingSection ? (
              <>
                {editingSection === 'account' && (
                  <AccountEditForm
                    form={form}
                    onFieldChange={updateFormField}
                    onSubmit={handleSaveProfile}
                    onCancel={cancelEditing}
                    saving={saving}
                    saveError={saveError}
                  />
                )}
                {editingSection === 'personal' && (
                  <PersonalEditForm
                    form={form}
                    onFieldChange={updateFormField}
                    onSubmit={handleSaveProfile}
                    onCancel={cancelEditing}
                    saving={saving}
                    saveError={saveError}
                  />
                )}
              </>
            ) : (
              <>
                {section === 'account' && <AccountDisplay user={user} onEdit={startEditing} />}
                {section === 'personal' && (
                  <PersonalDisplay user={user} emergencyContact={emergencyContact} vehicle={vehicle} onEdit={startEditing} />
                )}
                {section === 'password' && (
                  <PasswordSection
                    passwordForm={passwordForm}
                    onFieldChange={updatePasswordField}
                    onSubmit={handleChangePassword}
                    passwordSaving={passwordSaving}
                    passwordError={passwordError}
                    passwordSuccess={passwordSuccess}
                    showCurrentPassword={showCurrentPassword}
                    setShowCurrentPassword={setShowCurrentPassword}
                    showNewPassword={showNewPassword}
                    setShowNewPassword={setShowNewPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                  />
                )}
                {section === 'appearance' && <AppearanceSection theme={theme} onChange={setTheme} />}
                {section === 'help' && (
                  <HelpSection
                    helpMessages={helpMessages}
                    helpInput={helpInput}
                    setHelpInput={setHelpInput}
                    onAsk={askHelpQuestion}
                    onSubmit={submitHelpQuestion}
                  />
                )}
                {section === 'about' && <AboutSection />}
              </>
            )}
          </div>
        </div>

        {showQrModal && (
          <QRModal qrUrl={qrUrl} onClose={closeQrModal} onDownload={downloadQr} onCopy={copyQrLink} />
        )}
      </section>
    </main>
  );
}
