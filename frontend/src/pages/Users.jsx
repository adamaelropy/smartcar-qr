import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import '../App.css';

function Users() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(buildApiUrl('/users'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Server returned ${res.status}`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.users || data.items || [];
        setUsers(list);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setError(err.message || String(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchUsers();
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyLink = async (url, username) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(`Copied link for @${username}`);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopyFeedback(''), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <main className="page-shell dashboard-page">
      <section className="surface-card users-page">
        <div className="profile-section-header">
          <h1>Users</h1>
        </div>

        {copyFeedback && <p className="profile-success" role="status">{copyFeedback}</p>}

        {loading && <p className="state-message">Loading registered users...</p>}
        {error && (
          <p className="state-message state-message--error" role="alert">{error}</p>
        )}

        {!loading && !error && (
          <div className="users-list-wrapper">
            {users.length === 0 ? (
              <p className="state-message">No registered users found.</p>
            ) : (
              <div className="users-grid">
                {users.map((u) => {
                  const username = u.username || u.user?.username || u.name || `user-${String(u.user_id ?? u.id ?? 'unknown')}`;
                  const email = u.email || u.user?.email || '';
                  const qrToken = u.vehicle?.qr_token || u.qr_token || u.token || null;
                  const qrLink = qrToken ? `${window.location.origin}/qr/${qrToken}` : '';
                  const initial = username.charAt(0).toUpperCase() || 'U';
                  const stableKey = u.user_id ?? u.id ?? username;

                  return (
                    <article key={stableKey} className="user-card">
                      <div className="user-card__header">
                        <div className="user-card__avatar">{initial}</div>
                        <div className="user-card__details">
                          <strong>{username}</strong>
                          {email && <span>{email}</span>}
                        </div>
                      </div>

                      <div className="user-card__body">
                        <div className="user-card__qr-box">
                          {qrToken ? (
                            <QRCodeCanvas value={qrLink} size={56} includeMargin={false} />
                          ) : (
                            <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-input)', borderRadius: 4 }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>No QR</span>
                            </div>
                          )}
                        </div>

                        <div className="user-card__qr-info">
                          <span className="user-card__qr-badge">
                            {qrToken ? 'Vehicle QR Active' : 'No Vehicle Linked'}
                          </span>
                          <span className="user-card__link-text" title={qrLink || 'No link'}>
                            {qrLink ? qrLink.replace(/^https?:\/\//, '') : 'Not available'}
                          </span>
                        </div>
                      </div>

                      <div className="user-card__footer">
                        {qrLink ? (
                          <>
                            <a
                              href={qrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1 }}
                            >
                              Open QR
                            </a>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCopyLink(qrLink, username)}
                            >
                              Copy
                            </button>
                          </>
                        ) : (
                          <span className="btn btn-outline btn-sm" style={{ flex: 1, opacity: 0.5, cursor: 'default' }}>
                            Unregistered
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default Users;
