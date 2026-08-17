import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMessages } from '../services/api';

function DashboardLayout() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [activeNotification, setActiveNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!activeNotification) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActiveNotification(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [activeNotification]);

  // Poll for unread messages. Only show a toast when unread increases
  useEffect(() => {
    let mounted = true;
    let lastUnread = 0;

    async function loadUnread() {
      if (!isAuthenticated || !token) return;
      const { ok, data } = await fetchMessages(token);
      if (!mounted || !ok) return;

      const threads = Array.isArray(data?.messages) ? data.messages : [];
      const totalUnread = threads.reduce((sum, t) => sum + (t.unread || 0), 0);

      // first load: set baseline without notifying
      if (lastUnread === 0) {
        lastUnread = totalUnread;
        setUnreadCount(totalUnread);
        return;
      }

      if (totalUnread > lastUnread) {
        setActiveNotification({
          title: 'New message',
          subtitle: `You have ${totalUnread - lastUnread} new message(s)`,
          thread: '/messages',
        });
      }

      lastUnread = totalUnread;
      setUnreadCount(totalUnread);
    }

    // initial load + interval
    loadUnread();
    const id = window.setInterval(loadUnread, 5000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [isAuthenticated, token]);

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
          <div className="dashboard-brand">SmartCar QR</div>

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
              Messages{unreadCount > 0 && <span className="message-count">{unreadCount}</span>}
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `dashboard-link ${isActive ? 'is-active' : ''}`
              }
            >
              Profile
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
        </nav>
      </header>

      <Outlet />

      {activeNotification && (
        <div className="message-toast" role="alert">
          <div className="message-toast__content">
            <span className="message-toast__badge">New</span>
            <div>
              <strong>{activeNotification.title}</strong>
              <p>{activeNotification.subtitle}</p>
            </div>
          </div>

          <div className="message-toast__actions">
            <button type="button" onClick={openNotification}>
              Open
            </button>
            <button type="button" className="message-toast__close" onClick={closeNotification}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
