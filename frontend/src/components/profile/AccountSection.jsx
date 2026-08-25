import EditField from './EditField';

export function AccountDisplay({ user, onEdit }) {
  return (
    <section className="profile-section">
      <div className="profile-section-header">
        <h2>Account Details</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit('account')}>
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
  );
}

export function AccountEditForm({ form, onFieldChange, onSubmit, onCancel, saving, saveError }) {
  return (
    <form className="profile-edit-form" onSubmit={onSubmit}>
      <section className="profile-section">
        <div className="profile-section-header">
          <h2>Edit Account Details</h2>
        </div>
        <div className="profile-edit-grid">
          <EditField id="fullName" label="Full Name" value={form.fullName} onChange={(v) => onFieldChange('fullName', v)} />
          <EditField id="username" label="Username" value={form.username} onChange={(v) => onFieldChange('username', v)} />
          <EditField id="email" label="Email" type="email" value={form.email} onChange={(v) => onFieldChange('email', v)} />
        </div>
      </section>
      {saveError && <p className="state-message state-message--error">{saveError}</p>}
      <div className="profile-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
