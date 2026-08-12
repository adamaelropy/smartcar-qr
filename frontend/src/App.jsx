import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Communications from './pages/Communications';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="app-nav" aria-label="Main navigation">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            Home
          </NavLink>
          <NavLink
            to="/communications"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Communications
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/communications" element={<Communications />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
