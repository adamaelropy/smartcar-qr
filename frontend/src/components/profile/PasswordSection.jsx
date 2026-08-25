export default function PasswordSection({
  passwordForm,
  onFieldChange,
  onSubmit,
  passwordSaving,
  passwordError,
  passwordSuccess,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) {
  return (
    <section className="profile-section">
      <div className="profile-section-header">
        <div>
          <h2>Password &amp; Security</h2>
        </div>
      </div>
      <form className="profile-password-form" onSubmit={onSubmit}>
        <label className="profile-edit-field" htmlFor="currentPassword">
          <span className="profile-label">Current Password</span>
          <div className="mobile-password-field">
            <input
              id="currentPassword"
              name="currentPassword"
              className="profile-input"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => onFieldChange('currentPassword', e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Enter your current password"
            />
            <button
              type="button"
              className="mobile-password-eye"
              onClick={() => setShowCurrentPassword((c) => !c)}
              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            >
              {showCurrentPassword ? (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58A3 3 0 0113.42 13.42" />
                  <path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        <label className="profile-edit-field" htmlFor="newPassword">
          <span className="profile-label">New Password</span>
          <div className="mobile-password-field">
            <input
              id="newPassword"
              name="newPassword"
              className="profile-input"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => onFieldChange('newPassword', e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Enter a new password"
            />
            <button
              type="button"
              className="mobile-password-eye"
              onClick={() => setShowNewPassword((c) => !c)}
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            >
              {showNewPassword ? (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58A3 3 0 0113.42 13.42" />
                  <path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        <label className="profile-edit-field" htmlFor="confirmPassword">
          <span className="profile-label">Confirm New Password</span>
          <div className="mobile-password-field">
            <input
              id="confirmPassword"
              name="confirmPassword"
              className="profile-input"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              className="mobile-password-eye"
              onClick={() => setShowConfirmPassword((c) => !c)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58A3 3 0 0113.42 13.42" />
                  <path d="M14.12 14.12A9 9 0 0112 17c-4.97 0-9-5-9-5a19.6 19.6 0 014.28-4.77" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        <div className="password-requirements">
          <div>
            <strong>Password must contain:</strong>
            <ul>
              <li>6+ characters</li>
              <li>1 uppercase letter</li>
              <li>1 lowercase letter</li>
              <li>1 number</li>
              <li>1 special character</li>
            </ul>
          </div>
          <button type="submit" className="btn btn-primary password-requirements__action" disabled={passwordSaving}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            {passwordSaving ? 'Updating...' : 'Change Password'}
          </button>
        </div>
        {passwordError && <p className="state-message state-message--error">{passwordError}</p>}
        {passwordSuccess && <p className="profile-success">{passwordSuccess}</p>}
      </form>
    </section>
  );
}
