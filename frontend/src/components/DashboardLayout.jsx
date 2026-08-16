import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const notifications = [
  {
    id: 'relative-accident',
    title: 'New message from Maya',
    subtitle: 'Emergency alert',
    thread: '/messages?thread=relative-accident',
  },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const [activeNotification, setActiveNotification] = useState(notifications[0]);

  useEffect(() => {
    if (!activeNotification) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActiveNotification(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [activeNotification]);

  const closeNotification = () => {
    setActiveNotification(null);
  };

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
              Messages
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `dashboard-link ${isActive ? 'is-active' : ''}`
              }
            >
              Profile
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
