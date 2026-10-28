import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { UserRole } from '@training-platform/shared-types';

interface NavItem {
  to: string;
  label: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/certifications', label: 'Certifications' },
  { to: '/enrollments', label: 'Enrollments' },
  { to: '/courses', label: 'Courses' },
  { to: '/assessments', label: 'Assessments' },
  {
    to: '/reports',
    label: 'Compliance',
    roles: ['manager', 'hr_admin', 'compliance_officer'],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    clearAuth();
    navigate('/login');
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-brand">
          <div>
            <h1>Training Register</h1>
            <span>Certification &amp; Compliance System</span>
          </div>
        </div>

        <nav className="tab-nav" role="navigation" aria-label="Main navigation">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) => `tab-nav-item${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-header-end">
          <div>
            <div className="app-header-user">{user?.email}</div>
            <div className="app-header-role">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button
            id="logout-btn"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        {children}
      </main>
    </div>
  );
}
