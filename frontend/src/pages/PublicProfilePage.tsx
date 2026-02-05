import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersAPI, PublicStats } from '../services/api';
import { PublicProfile } from '../types';
import { Footer } from '../components/Footer';
import '../styles/ProfilePage.css';

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileAndStats() {
      if (!username) {
        setError('No username provided');
        setLoading(false);
        return;
      }

      try {
        const [profileRes, statsRes] = await Promise.all([
          usersAPI.getPublicProfile(username),
          usersAPI.getPublicStats(username),
        ]);
        setProfile(profileRes.profile);
        setStats(statsRes.stats);
      } catch (err: any) {
        if (err.status === 404) {
          setError('Profile not found');
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndStats();
  }, [username]);

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-admin';
      case 'editor':
        return 'badge-editor';
      default:
        return 'badge-default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatWhiskeyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <nav className="navbar shadow-sm mb-4" style={{ backgroundColor: 'var(--zinc-900)', borderBottom: '1px solid var(--zinc-800)' }}>
          <div className="container-fluid px-4">
            <div className="navbar-brand mb-0">
              <span className="h4 mb-0" style={{ color: 'var(--amber-500)' }}>Profile</span>
            </div>
            <button onClick={() => navigate(-1)} className="btn btn-outline-light btn-sm">
              Go Back
            </button>
          </div>
        </nav>
        <div className="profile-container">
          <div className="text-center py-5">
            <i className="bi bi-person-x" style={{ fontSize: '4rem', color: 'var(--zinc-500)' }}></i>
            <h2 className="mt-3">{error || 'Profile not found'}</h2>
            <p className="text-muted">This profile may be private or does not exist.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
              Go Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <nav className="navbar shadow-sm mb-4" style={{ backgroundColor: 'var(--zinc-900)', borderBottom: '1px solid var(--zinc-800)' }}>
        <div className="container-fluid px-4">
          <div className="navbar-brand mb-0">
            <span className="h4 mb-0" style={{ color: 'var(--amber-500)' }}>{profile.username}'s Profile</span>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-outline-light btn-sm">
            Go Back
          </button>
        </div>
      </nav>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt={profile.username}
                className="avatar-image"
              />
            ) : (
              <span className="avatar-text">{profile.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h1>{profile.username}</h1>
          <span className={`role-badge ${getRoleBadgeClass(profile.role)}`}>
            {profile.role}
          </span>
        </div>

        <div className="profile-content">
          <div className="profile-view">
            {/* About Section */}
            <div className="profile-section">
              <h2>About</h2>
              {(profile.first_name || profile.last_name) && (
                <div className="info-group">
                  <label>Name</label>
                  <p>{[profile.first_name, profile.last_name].filter(Boolean).join(' ')}</p>
                </div>
              )}
              <div className="info-group">
                <label>Member Since</label>
                <p>{formatDate(profile.created_at)}</p>
              </div>
            </div>

            {/* Collection Stats Section */}
            {stats && stats.totalBottles > 0 && (
              <div className="profile-section mt-4">
                <h2>Collection Stats</h2>

                {/* Stats Overview Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="card h-100" style={{ backgroundColor: 'var(--zinc-800)', border: '1px solid var(--zinc-700)' }}>
                      <div className="card-body text-center">
                        <h3 className="mb-0" style={{ color: 'var(--amber-500)' }}>{stats.totalBottles}</h3>
                        <small className="text-muted">Total Bottles</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card h-100" style={{ backgroundColor: 'var(--zinc-800)', border: '1px solid var(--zinc-700)' }}>
                      <div className="card-body text-center">
                        <h3 className="mb-0" style={{ color: 'var(--amber-500)' }}>
                          {stats.averageRating !== null ? stats.averageRating.toFixed(1) : '—'}
                        </h3>
                        <small className="text-muted">Avg Rating</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card h-100" style={{ backgroundColor: 'var(--zinc-800)', border: '1px solid var(--zinc-700)' }}>
                      <div className="card-body text-center">
                        <h3 className="mb-0" style={{ color: 'var(--amber-500)' }}>{stats.totalDistilleries}</h3>
                        <small className="text-muted">Distilleries</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card h-100" style={{ backgroundColor: 'var(--zinc-800)', border: '1px solid var(--zinc-700)' }}>
                      <div className="card-body text-center">
                        <h3 className="mb-0" style={{ color: 'var(--amber-500)' }}>{stats.countriesRepresented.length}</h3>
                        <small className="text-muted">Countries</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Whiskey Types Breakdown */}
                {stats.typeBreakdown.length > 0 && (
                  <div className="info-group mb-4">
                    <label>Whiskey Types</label>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {stats.typeBreakdown.map(({ type, count }) => (
                        <span
                          key={type}
                          className="badge"
                          style={{
                            backgroundColor: 'var(--zinc-700)',
                            color: 'var(--zinc-100)',
                            fontSize: '0.9rem',
                            padding: '0.5rem 0.75rem',
                          }}
                        >
                          {formatWhiskeyType(type)} <span style={{ color: 'var(--amber-500)' }}>({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Distilleries */}
                {stats.topDistilleries.length > 0 && (
                  <div className="info-group mb-4">
                    <label>Top Distilleries</label>
                    <ul className="list-unstyled mt-2 mb-0">
                      {stats.topDistilleries.map(({ distillery, count }, index) => (
                        <li
                          key={distillery}
                          className="d-flex justify-content-between align-items-center py-2"
                          style={{ borderBottom: index < stats.topDistilleries.length - 1 ? '1px solid var(--zinc-700)' : 'none' }}
                        >
                          <span>{distillery}</span>
                          <span className="badge" style={{ backgroundColor: 'var(--amber-500)', color: 'var(--zinc-900)' }}>
                            {count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Countries */}
                {stats.countriesRepresented.length > 0 && (
                  <div className="info-group">
                    <label>Countries Represented</label>
                    <p className="mt-2 mb-0">{stats.countriesRepresented.join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Empty Collection Message */}
            {stats && stats.totalBottles === 0 && (
              <div className="profile-section mt-4">
                <h2>Collection</h2>
                <p className="text-muted">This collector hasn't added any whiskeys yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
