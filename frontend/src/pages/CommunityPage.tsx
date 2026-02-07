import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, PublicStats } from '../services/api';
import { PublicProfile } from '../types';
import { Footer } from '../components/Footer';

interface ProfileWithStats extends PublicProfile {
  stats?: PublicStats;
}

export function CommunityPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loadingStats, setLoadingStats] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { profiles: data } = await usersAPI.listPublicProfiles();
        setProfiles(data);

        // Fetch stats for each profile
        for (const profile of data) {
          setLoadingStats(prev => new Set(prev).add(profile.id));
          try {
            const { stats } = await usersAPI.getPublicStats(profile.username);
            setProfiles(prev =>
              prev.map(p => (p.id === profile.id ? { ...p, stats } : p))
            );
          } catch {
            // Stats fetch failed — card will render without stats
          } finally {
            setLoadingStats(prev => {
              const next = new Set(prev);
              next.delete(profile.id);
              return next;
            });
          }
        }
      } catch {
        setError('Failed to load profiles');
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(p =>
      p.username.toLowerCase().includes(q) ||
      (p.first_name && p.first_name.toLowerCase().includes(q)) ||
      (p.last_name && p.last_name.toLowerCase().includes(q))
    );
  }, [profiles, search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--zinc-950)' }}>
      {/* Header */}
      <nav className="navbar shadow-sm" style={{ backgroundColor: 'var(--zinc-900)', borderBottom: '1px solid var(--zinc-800)' }}>
        <div className="container-fluid px-4">
          <div className="navbar-brand mb-0 d-flex align-items-center gap-2" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: '2rem' }}>🥃</span>
            <span className="fw-bold" style={{ color: 'var(--zinc-100)' }}>Whiskey Canon</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn btn-outline-light btn-sm">
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5 flex-grow-1">
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold" style={{ color: 'var(--amber-500)' }}>
            Community
          </h1>
          <p className="lead" style={{ color: 'var(--zinc-400)' }}>
            Discover whiskey collectors and explore their public profiles
          </p>
        </div>

        {/* Search */}
        <div className="row justify-content-center mb-4">
          <div className="col-lg-6">
            <div className="input-group">
              <span className="input-group-text" style={{ backgroundColor: 'var(--zinc-800)', borderColor: 'var(--zinc-700)', color: 'var(--zinc-400)' }}>
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ backgroundColor: 'var(--zinc-800)', borderColor: 'var(--zinc-700)', color: 'var(--zinc-100)' }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--amber-500)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: 'var(--zinc-400)' }}>Loading profiles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem', color: 'var(--zinc-500)' }}></i>
            <h3 className="mt-3" style={{ color: 'var(--zinc-100)' }}>{error}</h3>
            <button onClick={() => window.location.reload()} className="btn mt-3" style={{ backgroundColor: 'var(--amber-500)', color: '#000' }}>
              Try Again
            </button>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people" style={{ fontSize: '3rem', color: 'var(--zinc-500)' }}></i>
            <h3 className="mt-3" style={{ color: 'var(--zinc-100)' }}>
              {search ? 'No profiles match your search' : 'No public profiles yet'}
            </h3>
            <p style={{ color: 'var(--zinc-400)' }}>
              {search
                ? 'Try a different search term.'
                : 'Be the first to make your profile public in your Profile settings!'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-end mb-3" style={{ color: 'var(--zinc-500)', fontSize: '0.875rem' }}>
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'collector' : 'collectors'}
            </p>
            <div className="row g-4">
              {filteredProfiles.map(profile => (
                <div key={profile.id} className="col-sm-6 col-lg-4 col-xl-3">
                  <div
                    className="card h-100 border-0"
                    style={{ backgroundColor: 'var(--zinc-800)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onClick={() => navigate(`/u/${profile.username}`)}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className="card-body text-center p-4">
                      {/* Avatar */}
                      <div
                        className="mx-auto mb-3 d-flex align-items-center justify-content-center overflow-hidden"
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--zinc-700)',
                          border: '3px solid var(--amber-500)',
                        }}
                      >
                        {profile.profile_photo ? (
                          <img
                            src={profile.profile_photo}
                            alt={profile.username}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--zinc-100)' }}>
                            {profile.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Username */}
                      <h5 className="mb-1" style={{ color: 'var(--zinc-100)' }}>
                        {profile.username}
                      </h5>

                      {/* Display name */}
                      {(profile.first_name || profile.last_name) && (
                        <p className="mb-2" style={{ color: 'var(--zinc-400)', fontSize: '0.875rem' }}>
                          {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                        </p>
                      )}

                      {/* Member since */}
                      <p className="mb-3" style={{ color: 'var(--zinc-500)', fontSize: '0.8rem' }}>
                        Member since {formatDate(profile.created_at)}
                      </p>

                      {/* Stats */}
                      {loadingStats.has(profile.id) ? (
                        <div className="d-flex justify-content-center gap-3 pt-2" style={{ borderTop: '1px solid var(--zinc-700)' }}>
                          <div className="spinner-border spinner-border-sm" style={{ color: 'var(--amber-500)' }} role="status">
                            <span className="visually-hidden">Loading stats...</span>
                          </div>
                        </div>
                      ) : profile.stats && profile.stats.totalBottles > 0 ? (
                        <div className="d-flex justify-content-center gap-3 pt-2" style={{ borderTop: '1px solid var(--zinc-700)' }}>
                          <div className="text-center">
                            <div style={{ color: 'var(--amber-500)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {profile.stats.totalBottles}
                            </div>
                            <div style={{ color: 'var(--zinc-500)', fontSize: '0.75rem' }}>Bottles</div>
                          </div>
                          {profile.stats.averageRating !== null && (
                            <div className="text-center">
                              <div style={{ color: 'var(--amber-500)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {profile.stats.averageRating.toFixed(1)}
                              </div>
                              <div style={{ color: 'var(--zinc-500)', fontSize: '0.75rem' }}>Avg Rating</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div style={{ color: 'var(--amber-500)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {profile.stats.totalDistilleries}
                            </div>
                            <div style={{ color: 'var(--zinc-500)', fontSize: '0.75rem' }}>Distilleries</div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2" style={{ borderTop: '1px solid var(--zinc-700)' }}>
                          <p className="mb-0" style={{ color: 'var(--zinc-500)', fontSize: '0.8rem' }}>
                            No bottles yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
