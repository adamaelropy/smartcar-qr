import { NavLink, Outlet } from 'react-router-dom';

function DashboardLayout() {
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
              to="/services"
              className={({ isActive }) =>
                `dashboard-link ${isActive ? 'is-active' : ''}`
              }
            >
              Services
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
    </div>
  );
}

export default DashboardLayout;
