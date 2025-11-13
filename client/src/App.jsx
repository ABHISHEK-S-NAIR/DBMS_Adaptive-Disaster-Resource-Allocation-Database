import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Resources from './pages/Resources.jsx';
import DemandRequests from './pages/DemandRequests.jsx';
import Volunteers from './pages/Volunteers.jsx';
import Logistics from './pages/Logistics.jsx';
import Analytics from './pages/Analytics.jsx';
import AccessControl from './pages/AccessControl.jsx';
import Disasters from './pages/Disasters.jsx';
import Login from './pages/Login.jsx';
import Loader from './components/Loader.jsx';
import useAuth from './hooks/useAuth.js';
import './App.css';

const links = [
  { to: '/', label: 'Overview', exact: true },
  { to: '/disasters', label: 'Disasters', roles: ['Administrator', 'Field Coordinator'] },
  { to: '/resources', label: 'Resources' },
  { to: '/demand', label: 'Demand Requests' },
  { to: '/volunteers', label: 'Volunteers' },
  { to: '/logistics', label: 'Logistics' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/admin', label: 'User Access', roles: ['Administrator'] },
];

const App = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="app-shell app-shell--loading">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const visibleLinks = links.filter((link) => !link.roles || link.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
        <div className="sidebar__brand">Adaptive Disaster Ops</div>
        <nav>
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={Boolean(link.exact)}
              className={({ isActive }) => (isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button type="button" className="topbar__toggle" onClick={() => setSidebarOpen((prev) => !prev)}>
            ☰
          </button>
          <div>
            <h2>Command Center</h2>
            <p>Real-time coordination for relief and response</p>
          </div>
          <div className="topbar__profile">
            <div className="topbar__profile-details">
              <span className="topbar__profile-name">{user.display_name}</span>
              <span className="topbar__profile-role">{user.role}</span>
            </div>
            <button type="button" className="topbar__logout" onClick={logout}>
              Log Out
            </button>
          </div>
        </header>
        <section className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/disasters" element={<Disasters />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/demand" element={<DemandRequests />} />
            <Route path="/volunteers" element={<Volunteers />} />
            <Route path="/logistics" element={<Logistics />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route
              path="/admin"
              element={user.role === 'Administrator' ? <AccessControl /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>
      </main>
    </div>
  );
};

export default App;
