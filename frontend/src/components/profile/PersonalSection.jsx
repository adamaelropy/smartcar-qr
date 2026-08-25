import EditField from './EditField';

export function PersonalDisplay({ user, emergencyContact, vehicle, onEdit }) {
  return (
    <section className="profile-section">
      <div className="profile-section-header">
        <h2>Personal &amp; Vehicle Details</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit('personal')}>
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
  );
}

export function PersonalEditForm({ form, onFieldChange, onSubmit, onCancel, saving, saveError }) {
  return (
    <form className="profile-edit-form" onSubmit={onSubmit}>
      <section className="profile-section">
        <div className="profile-section-header">
          <h2>Edit Personal &amp; Vehicle Details</h2>
        </div>
        <h3 style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'var(--text-h)' }}>Personal Information</h3>
        <div className="profile-edit-grid">
          <EditField id="age" label="Age" type="number" value={String(form.age)} onChange={(v) => onFieldChange('age', v)} />
          <EditField id="phone" label="Phone Number" value={form.phone} onChange={(v) => onFieldChange('phone', v)} />
        </div>

        <h3 style={{ fontSize: '1rem', marginTop: '1rem', color: 'var(--text-h)' }}>Emergency Contact</h3>
        <div className="profile-edit-grid">
          <EditField id="relativeName" label="Relative Name" value={form.relativeName} onChange={(v) => onFieldChange('relativeName', v)} />
          <EditField id="relativePhone" label="Relative Phone" value={form.relativePhone} onChange={(v) => onFieldChange('relativePhone', v)} />
          <EditField id="relationship" label="Relationship" value={form.relationship} onChange={(v) => onFieldChange('relationship', v)} placeholder="e.g. Spouse, Sibling" />
        </div>

        <h3 style={{ fontSize: '1rem', marginTop: '1rem', color: 'var(--text-h)' }}>Vehicle Information</h3>
        <div className="profile-edit-grid">
          <EditField id="plateNumber" label="Plate Number" value={form.plateNumber} onChange={(v) => onFieldChange('plateNumber', v)} />
          <EditField id="carName" label="Car Model / Name" value={form.carName} onChange={(v) => onFieldChange('carName', v)} />
          <EditField id="yearModel" label="Year Model" type="number" value={String(form.yearModel)} onChange={(v) => onFieldChange('yearModel', v)} />
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
