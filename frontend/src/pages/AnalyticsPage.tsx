import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { Footer } from '../components/Footer';
import logoSvg from '../assets/glencairn.webp';

export default function AnalyticsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <nav className="navbar shadow-sm" style={{ backgroundColor: '#5B9BD5' }}>
        <div className="container-fluid px-4">
          <div className="navbar-brand mb-0 d-flex align-items-center gap-3" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <img src={logoSvg} alt="Whiskey Canon" height="50" />
            <div className="d-flex flex-column">
              <span className="h4 mb-0 text-white">WHISKEY</span>
              <span className="text-white-50" style={{ fontSize: '0.9rem', letterSpacing: '0.1em' }}>CANON</span>
            </div>
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
            <span className="text-white">
              {user?.username} <span className="badge bg-light" style={{ color: '#5B9BD5' }}>{user?.role}</span>
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
