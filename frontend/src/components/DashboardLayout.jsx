import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';
import { useMessagesPoll } from '../context/MessagesPollContext';

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { threads } = useMessagesPoll();
  const [activeNotification, setActiveNotification] = useState(null);
  const lastUnreadRef = useRef(0);
  const initializedRef = useRef(false);

  const unreadCount = threads.reduce((sum, t) => sum + (t.unread || 0), 0);

  useEffect(() => {
    if (!activeNotification) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActiveNotification(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [activeNotification]);

  // Show toast when unread increases (centralised polling via MessagesPollProvider)
  useEffect(() => {
    if (!initializedRef.current) {
      lastUnreadRef.current = unreadCount;
      initializedRef.current = true;
      return;
    }
    if (unreadCount > lastUnreadRef.current && location.pathname !== '/messages') {
      const newestUnreadThread = threads.find((thread) => (thread.unread || 0) > 0);
      setActiveNotification({
        title: 'New Message Received',
        subtitle: newestUnreadThread
          ? `${newestUnreadThread.senderName}: ${newestUnreadThread.latestIncomingText || newestUnreadThread.preview}`
          : `You have ${unreadCount - lastUnreadRef.current} new message(s)`,
        thread: newestUnreadThread ? `/messages?thread=${encodeURIComponent(newestUnreadThread.id)}` : '/messages',
      });
    }
    lastUnreadRef.current = unreadCount;
  }, [unreadCount, threads, location.pathname]);

  const closeNotification = () => setActiveNotification(null);

  const openNotification = () => {
    if (activeNotification) {
      closeNotification();
      navigate(activeNotification.thread);
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-nav-wrap">
        <nav className="dashboard-nav page-shell" aria-label="Main navigation">
          <NavLink to="/home" className="dashboard-brand">
            <BrandMark size={32} />
            SmartCar QR
          </NavLink>

          <div className="dashboard-links">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `dashboard-link ${isActive ? 'is-active' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/messages"
              className={({ isActive }) =>
                `dashboard-link ${isActive ? 'is-active' : ''}`
              }
            >
              Messages
              {unreadCount > 0 && <span className="message-count">{unreadCount}</span>}
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `dashboard-link ${isActive ? 'is-active' : ''}`
              }
            >
              Users
            </NavLink>
          </div>

          <div className="dashboard-account">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `dashboard-avatar-btn ${isActive ? 'is-active' : ''}`
              }
              aria-label="Profile"
              title="View Profile & Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </NavLink>
          </div>
        </nav>
      </header>

      <Outlet />

      {activeNotification && (
        <div className="message-toast" role="alert">
          <div className="message-toast__content">
            <span className="message-toast__badge">Alert</span>
            <div>
              <strong style={{ color: 'var(--text-h)', display: 'block', fontSize: '0.92rem' }}>
                {activeNotification.title}
              </strong>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                {activeNotification.subtitle}
              </p>
            </div>
          </div>

          <div className="message-toast__actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={openNotification}>
              View Messages
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={closeNotification}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
