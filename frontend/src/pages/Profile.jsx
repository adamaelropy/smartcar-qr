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

function DetailRow({ label, value }) {
  return (
    <div className="profile-row">
      <span className="profile-label">{label}</span>
      <span className="profile-value">{value || '-'}</span>
    </div>
  );
}

function EditField({ id, label, type = 'text', value, onChange }) {
  return (
    <label className="profile-edit-field" htmlFor={id}>
      <span className="profile-label">{label}</span>
      <input
        id={id}
        className="profile-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Profile() {
  const { token, logout, updateStoredUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrError, setQrError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const loadQrForVehicle = useCallback(async (hasVehicle) => {
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
  }, [token]);

  const loadProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { ok, data } = await fetchMyProfile(token);

      if (!ok) {
        throw new Error(data?.message || 'Unable to load profile.');
      }

      const nextProfile = {
        user: data.user,
        emergencyContact: data.emergencyContact,
        vehicle: data.vehicle,
      };

      setProfile(nextProfile);
      await loadQrForVehicle(Boolean(nextProfile.vehicle));
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, loadQrForVehicle]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const startEditing = () => {
    setForm(buildFormFromProfile(profile));
    setSaveError('');
    setSuccessMessage('');
    setIsChangingPassword(false);
    setPasswordError('');
    setPasswordSuccess('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(null);
    setSaveError('');
    setIsEditing(false);
  };

  const updateFormField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    setSuccessMessage('');

    try {
      const { ok, data } = await updateMyProfile(token, form);

      if (!ok) {
        const message =
          data?.errors?.join(' ') ||
          data?.message ||
          'Unable to update profile.';
        throw new Error(message);
      }

      const nextProfile = {
        user: data.user,
        emergencyContact: data.emergencyContact,
        vehicle: data.vehicle,
      };

      setProfile(nextProfile);
      setForm(null);
      setIsEditing(false);
      setSuccessMessage(data.message || 'Profile updated successfully.');

      updateStoredUser({
        user_id: data.user.user_id,
        username: data.user.username,
      });

      await loadQrForVehicle(Boolean(nextProfile.vehicle));
    } catch (saveErr) {
      setSaveError(saveErr?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  

  const openChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);
    setIsEditing(false);
    setSaveError('');
    setSuccessMessage('');
  };

  const cancelChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(false);
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const { ok, data } = await changePasswordRequest(token, passwordForm);

      if (!ok) {
        const message =
          data?.errors?.join(' ') ||
          data?.message ||
          'Unable to change password.';
        throw new Error(message);
      }

      setPasswordSuccess(data.message || 'Password changed successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (changeErr) {
      setPasswordError(changeErr?.message || 'Unable to change password.');
    } finally {
      setPasswordSaving(false);
    }
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
          <p className="state-message state-message--error">
            {error || 'Unable to load profile. Please try again.'}
          </p>
        </section>
      </main>
    );
  }

  const { user, emergencyContact, vehicle } = profile;
  const qrUrl = qrToken ? `${window.location.origin}/qr/${qrToken}` : '';

  return (
    <main className="page-shell dashboard-page">
      <section className="home-card profile-card">
        <div className="profile-header">
          <div className="profile-title-with-thumb">
            <div>
              <p className="eyebrow">Profile</p>
              <h1>My Profile</h1>
            </div>

            {vehicle && qrToken && (
              <div className="profile-qr-thumb" aria-label="My QR">
                <QRCodeCanvas value={qrUrl} size={64} includeMargin={false} />
              </div>
            )}
          </div>

          {!isEditing && !isChangingPassword && (
            <button
              type="button"
              className="profile-edit-button"
              onClick={startEditing}
            >
              Edit Profile
            </button>
          )}
        </div>

        {successMessage && (
          <p className="profile-success" role="status">
            {successMessage}
          </p>
        )}

        {isEditing && form ? (
          <form className="profile-edit-form" onSubmit={handleSaveProfile}>
            <section className="profile-section">
              <h2>Personal Information</h2>
              <div className="profile-edit-grid">
                <EditField
                  id="fullName"
                  label="Full Name"
                  value={form.fullName}
                  onChange={(value) => updateFormField('fullName', value)}
                />
                <EditField
                  id="username"
                  label="Username"
                  value={form.username}
                  onChange={(value) => updateFormField('username', value)}
                />
                <EditField
                  id="age"
                  label="Age"
                  type="number"
                  value={form.age}
                  onChange={(value) => updateFormField('age', value)}
                />
                <EditField
                  id="phone"
                  label="Phone Number"
                  value={form.phone}
                  onChange={(value) => updateFormField('phone', value)}
                />
                <EditField
                  id="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateFormField('email', value)}
                />
              </div>
            </section>

            <section className="profile-section">
              <h2>Emergency Contact</h2>
              <div className="profile-edit-grid">
                <EditField
                  id="relativeName"
                  label="Emergency Contact Name"
                  value={form.relativeName}
                  onChange={(value) => updateFormField('relativeName', value)}
                />
                <EditField
                  id="relativePhone"
                  label="Emergency Contact Phone"
                  value={form.relativePhone}
                  onChange={(value) => updateFormField('relativePhone', value)}
                />
                <EditField
                  id="relationship"
                  label="Relationship"
                  value={form.relationship}
                  onChange={(value) => updateFormField('relationship', value)}
                />
              </div>
            </section>

            <section className="profile-section">
              <h2>My Vehicle</h2>
              <div className="profile-edit-grid">
                <EditField
                  id="plateNumber"
                  label="Plate Number"
                  value={form.plateNumber}
                  onChange={(value) => updateFormField('plateNumber', value)}
                />
                <EditField
                  id="carName"
                  label="Car Name"
                  value={form.carName}
                  onChange={(value) => updateFormField('carName', value)}
                />
                <EditField
                  id="yearModel"
                  label="Year Model"
                  type="number"
                  value={form.yearModel}
                  onChange={(value) => updateFormField('yearModel', value)}
                />
              </div>
            </section>

            {saveError && (
              <p className="state-message state-message--error" role="alert">
                {saveError}
              </p>
            )}

            <div className="profile-form-actions">
              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="profile-cancel-button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <section className="profile-section">
              <h2>Personal Information</h2>
              <div className="profile-grid">
                <DetailRow label="Full Name" value={user?.name} />
                <DetailRow label="Username" value={user?.username} />
                <DetailRow
                  label="Age"
                  value={
                    user?.age !== undefined && user?.age !== null
                      ? String(user.age)
                      : '-'
                  }
                />
                <DetailRow label="Phone Number" value={user?.phone} />
                <DetailRow label="Email Address" value={user?.email} />
              </div>
            </section>

            <section className="profile-section">
              <h2>Emergency Contact</h2>
              {emergencyContact ? (
                <div className="profile-grid">
                  <DetailRow
                    label="Emergency Contact Name"
                    value={emergencyContact.relative_name}
                  />
                  <DetailRow
                    label="Emergency Contact Phone"
                    value={emergencyContact.relative_phone}
                  />
                  <DetailRow
                    label="Relationship"
                    value={emergencyContact.relationship}
                  />
                </div>
              ) : (
                <p className="state-message">No emergency contact registered.</p>
              )}
            </section>

            <section className="profile-section">
              <h2>My Vehicle</h2>
              {vehicle ? (
                <div className="profile-grid">
                  <DetailRow label="Plate Number" value={vehicle.plate_number} />
                  <DetailRow label="Car Name" value={vehicle.car_name} />
                  <DetailRow
                    label="Year Model"
                    value={
                      vehicle.year_model !== undefined &&
                      vehicle.year_model !== null
                        ? String(vehicle.year_model)
                        : '-'
                    }
                  />
                </div>
              ) : (
                <p className="state-message">No vehicle registered.</p>
              )}
            </section>

            <section className="profile-section profile-section--last">
              <h2>My SmartCar QR</h2>
              {!vehicle ? (
                <p className="state-message">No vehicle registered.</p>
              ) : qrError ? (
                  <p className="state-message state-message--error">{qrError}</p>
                ) : qrToken ? (
                  <>
                    <p className="page-description">Your SmartCar QR</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                      <QRCodeCanvas value={qrUrl} size={200} includeMargin />
                    </div>
                  </>
                ) : (
                  <p className="state-message">Unable to load QR code.</p>
                )}
            </section>
          </>
        )}

        {isChangingPassword && (
          <section className="profile-password-panel">
            <h2>Change Password</h2>
            <form className="profile-password-form" onSubmit={handleChangePassword}>
              <label className="profile-edit-field" htmlFor="currentPassword">
                <span className="profile-label">Current Password</span>
                <input
                  id="currentPassword"
                  className="profile-input"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    updatePasswordField('currentPassword', event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </label>

              <label className="profile-edit-field" htmlFor="newPassword">
                <span className="profile-label">New Password</span>
                <input
                  id="newPassword"
                  className="profile-input"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    updatePasswordField('newPassword', event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="profile-edit-field" htmlFor="confirmPassword">
                <span className="profile-label">Confirm New Password</span>
                <input
                  id="confirmPassword"
                  className="profile-input"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    updatePasswordField('confirmPassword', event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
              </label>

              {passwordError && (
                <p className="state-message state-message--error" role="alert">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p className="profile-success" role="status">
                  {passwordSuccess}
                </p>
              )}

              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={cancelChangePassword}
                  disabled={passwordSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {!isEditing && (
          <div className="profile-actions">
            <button
              type="button"
              className="profile-password-button"
              onClick={openChangePassword}
            >
              Change Password
            </button>
            <button
              type="button"
              className="profile-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Profile;
