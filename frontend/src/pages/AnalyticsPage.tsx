import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { Footer } from '../components/Footer';

export default function AnalyticsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-vh-100" style={{ backgroundColor: 'var(--zinc-950)' }}>
      {/* Header */}
      <nav className="navbar shadow-sm" style={{ backgroundColor: 'var(--zinc-900)', borderBottom: '1px solid var(--zinc-800)' }}>
        <div className="container-fluid px-4">
          <div className="navbar-brand mb-0 d-flex align-items-center gap-2" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: '2rem' }}>🥃</span>
            <span className="fw-bold" style={{ color: 'var(--zinc-100)' }}>Whiskey Canon</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm">
              📚 Collection
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="btn btn-outline-light btn-sm">
                Admin Panel
              </button>
            )}
            <span style={{ color: 'var(--zinc-300)' }}>
              {user?.username} <span className="badge" style={{ backgroundColor: 'var(--amber-600)', color: 'white' }}>{user?.role}</span>
            </span>
            <button onClick={() => navigate('/profile')} className="btn btn-outline-light btn-sm">
              Profile
            </button>
            <button onClick={logout} className="btn btn-outline-light btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        <AnalyticsDashboard />
      </div>

      <Footer />
    </div>
  );
}
