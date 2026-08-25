export default function ProfileSidebar({ user, section, onSectionChange, onLogout }) {
  const navItems = [
    ['account', 'Account Details', 'user'],
    ['personal', 'Personal & Vehicle', 'car'],
    ['password', 'Password & Security', 'lock'],
    ['appearance', 'Appearance', 'palette'],
    ['help', 'Help Center', 'help'],
    ['about', 'About Application', 'info'],
  ];

  return (
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
        {navItems.map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={`profile-nav-btn ${section === id ? 'is-active' : ''}`}
            aria-current={section === id ? 'page' : undefined}
          >
            <span className="profile-nav-icon" aria-hidden="true">
              {icon === 'user' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>
              )}
              {icon === 'car' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 13l2-5h14l2 5" /><path d="M5 16h14" /><circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /></svg>
              )}
              {icon === 'lock' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              )}
              {icon === 'palette' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12" /><circle cx="7.5" cy="10" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="14" cy="7" r="1" /><circle cx="16.5" cy="10" r="1" /></svg>
              )}
              {icon === 'help' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.5 1-1.5 1.7V14" /><circle cx="12" cy="17" r=".8" /></svg>
              )}
              {icon === 'info' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 10v7" /><circle cx="12" cy="7" r=".8" /></svg>
              )}
            </span>
            {label}
          </button>
        ))}
        <button type="button" onClick={onLogout} className="profile-logout-btn">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
          Log Out
        </button>
      </nav>
    </aside>
  );
}
