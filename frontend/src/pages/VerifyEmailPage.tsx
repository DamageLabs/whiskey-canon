import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  function handleInputChange(index: number, value: string) {
    // Only allow alphanumeric characters
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (sanitized.length <= 1) {
      const newCode = [...code];
      newCode[index] = sanitized;
      setCode(newCode);

      // Auto-focus next input
      if (sanitized && index < 7) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (sanitized.length === 8) {
      // Handle paste of full code
      const newCode = sanitized.split('');
      setCode(newCode);
      inputRefs.current[7]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pastedText.length === 8) {
      setCode(pastedText.split(''));
      inputRefs.current[7]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fullCode = code.join('');
    if (fullCode.length !== 8) {
      setError('Please enter the complete 8-character code');
      return;
    }

    setLoading(true);

    try {
      await authAPI.verifyEmail(email, fullCode);
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;

    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      await authAPI.resendVerification(email);
      setSuccess('A new verification code has been sent to your email');
      setCooldown(60);
      setCode(['', '', '', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--zinc-950)' }}>
      <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <span style={{ fontSize: '2.5rem' }}>🥃</span>
            <span className="h3 mb-0 fw-bold" style={{ color: 'var(--zinc-100)' }}>Whiskey Canon</span>
          </div>
          <h2 className="text-center mb-2 fs-4">Verify Your Email</h2>
          <p className="text-center text-muted mb-4">
            We sent a verification code to<br />
            <strong style={{ color: 'var(--zinc-100)' }}>{email}</strong>
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="d-flex justify-content-center gap-2 mb-4" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  className="form-control text-center fw-bold"
                  style={{
                    width: '48px',
                    height: '56px',
                    fontSize: '1.5rem',
                    textTransform: 'uppercase'
                  }}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  autoComplete="off"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join('').length !== 8}
              className="btn w-100 mb-3 text-white"
              style={{ backgroundColor: 'var(--amber-500)' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Verifying...
                </>
              ) : 'Verify Email'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-muted mb-2">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              className="btn btn-link p-0 text-decoration-none fw-bold"
              style={{ color: 'var(--amber-500)' }}
            >
              {resendLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : cooldown > 0 ? (
                `Resend code in ${cooldown}s`
              ) : (
                'Resend code'
              )}
            </button>
          </div>

          <hr className="my-4" />

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
