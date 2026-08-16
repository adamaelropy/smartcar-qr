import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import '../App.css';

function Users() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(buildApiUrl('/users'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Server returned ${res.status}`);
        }

        const data = await res.json();
        // Support multiple shapes: { users: [...] } or array
        const list = Array.isArray(data) ? data : data.users || data.items || [];
        if (mounted) setUsers(list);
      } catch (err) {
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <main className="page-shell">
      <section className="surface-card">
        <p className="eyebrow">Users</p>
        <h1>Logged-in / Registered Users</h1>

        {loading && <p className="state-message">Loading users…</p>}
        {error && (
          <p className="state-message state-message--error">{error}</p>
        )}

        {!loading && !error && (
          <div className="users-list">
            {users.length === 0 ? (
              <p className="state-message">No users found.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {users.map((u, i) => {
                  const username = u.username || u.user?.username || u.name || u.email || `user-${i}`;
                  const qrToken = u.vehicle?.qr_token || u.qr_token || u.token || null;
                  const qrLink = qrToken ? `${window.location.origin}/qr/${qrToken}` : '';

                  return (
                    <li
                      key={i}
                      className="service-card"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}
                    >
                      <div style={{ flex: '0 0 200px' }}>
                        <strong>{username}</strong>
                      </div>

                      <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {qrToken ? (
                          <QRCodeCanvas value={qrLink} size={64} includeMargin={false} />
                        ) : (
                          <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: 6 }}>
                            <span style={{ color: 'var(--muted)', fontSize: 12 }}>No QR</span>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        {qrLink ? (
                          <a
                            href={qrLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              fontSize: 13,
                              lineHeight: '1.2',
                              maxWidth: 420,
                              color: 'var(--accent)',
                              wordBreak: 'break-all',
                            }}
                          >
                            {qrLink}
                          </a>
                        ) : (
                          <span className="state-message">No QR link</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default Users;
