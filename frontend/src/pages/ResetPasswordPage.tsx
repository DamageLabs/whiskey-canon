import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { checkPasswordStrength } from '../utils/passwordPolicy';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!checkPasswordStrength(password).isValid) {
      setError('Password does not meet complexity requirements');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, password);
      setSuccess('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--zinc-950)' }}>
      <div className="card shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <span style={{ fontSize: '2.5rem' }}>🥃</span>
            <span className="h3 mb-0 fw-bold" style={{ color: 'var(--zinc-100)' }}>Whiskey Canon</span>
          </div>
          <h2 className="text-center mb-2 fs-4">Reset Password</h2>
          <p className="text-center text-muted mb-4">
            Enter your new password below.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
              {!token && (
                <div className="mt-2">
                  <Link to="/forgot-password" className="alert-link">
                    Request a new reset link
                  </Link>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          {token && !success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">New Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  autoFocus
                />
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn w-100 mb-3 text-white"
                style={{ backgroundColor: 'var(--amber-500)' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-muted mb-0">
            <Link to="/login" className="text-decoration-none fw-bold" style={{ color: 'var(--amber-500)' }}>
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
