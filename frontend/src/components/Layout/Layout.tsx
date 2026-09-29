import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Layout() {
  const { user, isAdmin, isInstructor, isStudent, switchRole, logout } = useAuth();

  const getRoleBadge = () => {
    if (isAdmin) return <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>Admin</span>;
    if (isInstructor) return <span className="badge badge-info" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>Instructor</span>;
    return <span className="badge badge-success" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>Student</span>;
  };

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
                {getRoleBadge()}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout} title="Sign out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Switch Role (Demo)</div>
              <div style={{ display: 'flex', gap: '3px' }}>
                <button
                  className={`btn btn-sm ${isAdmin ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '3px 4px', fontSize: '0.7rem' }}
                  onClick={() => switchRole('admin')}
                  title="Switch to Admin role"
                >
                  Admin
                </button>
                <button
                  className={`btn btn-sm ${isInstructor ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '3px 4px', fontSize: '0.7rem' }}
                  onClick={() => switchRole('instructor')}
                  title="Switch to Instructor role"
                >
                  Instructor
                </button>
                <button
                  className={`btn btn-sm ${isStudent ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '3px 4px', fontSize: '0.7rem' }}
                  onClick={() => switchRole('student')}
                  title="Switch to Student role"
                >
                  Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">
        {isStudent && (
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
              ℹ️ <strong>Student Mode:</strong> You can browse approved courses, self-enroll in courses, and view your enrollments in "My Courses".
            </span>
          </div>
        )}
        {isInstructor && (
          <div style={{
            background: '#f5f3ff',
            border: '1px solid #ddd6fe',
            color: '#5b21b6',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem'
          }}>
            <span>
              🎓 <strong>Instructor Mode:</strong> You can create courses (sent for Admin approval), manage your created courses in "My Courses", and view enrolled students.
            </span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
