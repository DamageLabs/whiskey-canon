import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoSvg from '../assets/glencairn.webp';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #5B9BD5 0%, #83B4E0 100%)' }}>
      <div className="card shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
            <img src={logoSvg} alt="Whiskey Canon" height="60" />
            <div className="d-flex flex-column">
              <span className="h3 mb-0" style={{ color: '#5B9BD5' }}>WHISKEY</span>
              <span className="text-muted" style={{ fontSize: '1rem', letterSpacing: '0.15em' }}>CANON</span>
            </div>
          </div>
          <h2 className="text-center mb-4 fs-4">Login</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-100 mb-3 text-white"
              style={{ backgroundColor: '#5B9BD5' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : 'Login'}
            </button>
          </form>

          <p className="text-center text-muted">
            Don't have an account? <Link to="/register" className="text-decoration-none fw-bold" style={{ color: '#5B9BD5' }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
