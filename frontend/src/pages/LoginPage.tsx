import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onToggle: () => void;
}

export function LoginPage({ onToggle }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      setError(msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h1>Course Enrollment</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Demo Logins
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary auth-btn"
                style={{ fontSize: '12px', padding: '6px 12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                disabled={loading}
                onClick={async () => {
                  setEmail('admin@campus.com');
                  setPassword('admin123');
                  setError('');
                  setLoading(true);
                  try {
                    await login('admin@campus.com', 'admin123');
                  } catch (err: any) {
                    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
                    setError(msg || 'Admin login failed');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <span>⚡ Admin</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>admin@campus.com</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary auth-btn"
                style={{ fontSize: '12px', padding: '6px 12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                disabled={loading}
                onClick={async () => {
                  setEmail('instructor@campus.com');
                  setPassword('instructor123');
                  setError('');
                  setLoading(true);
                  try {
                    await login('instructor@campus.com', 'instructor123');
                  } catch (err: any) {
                    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
                    setError(msg || 'Instructor login failed');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <span>🎓 Instructor</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>instructor@campus.com</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary auth-btn"
                style={{ fontSize: '12px', padding: '6px 12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                disabled={loading}
                onClick={async () => {
                  setEmail('student@campus.com');
                  setPassword('student123');
                  setError('');
                  setLoading(true);
                  try {
                    await login('student@campus.com', 'student123');
                  } catch (err: any) {
                    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
                    setError(msg || 'Student login failed');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <span>👤 Student</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>student@campus.com</span>
              </button>
            </div>
          </div>
        </form>

        <p className="auth-toggle">
          Don't have an account?{' '}
          <button type="button" onClick={onToggle}>Sign up</button>
        </p>
      </div>
    </div>
  );
}
