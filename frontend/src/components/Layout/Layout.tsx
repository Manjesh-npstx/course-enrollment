import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Layout() {
  const { user, isAdmin, switchRole, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h1 className="sidebar-title">Course Enrollment</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Courses</span>
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Students</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <span className="sidebar-user-name">{user?.name}</span>
                <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem', marginLeft: '6px' }}>
                  {isAdmin ? 'Admin' : 'Student'}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout} title="Sign out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', marginTop: '8px', width: '100%', padding: '4px 8px' }}
              onClick={() => switchRole(isAdmin ? 'student' : 'admin')}
            >
              {isAdmin ? 'Switch to Student (Read-Only)' : '⚡ Switch to Admin'}
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        {!isAdmin && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem'
          }}>
            <span>
              ℹ️ <strong>Student Mode (Read-Only):</strong> You can browse courses and view enrollments. Switch to Admin mode to add/edit/delete courses and enroll students.
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => switchRole('admin')}
              style={{ marginLeft: '12px', whiteSpace: 'nowrap' }}
            >
              ⚡ Switch to Admin
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
