import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

export function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.map((e: any) => e.msg).join(', '));
        }
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <button onClick={() => navigate(-1)} className="btn btn-outline-light btn-sm">
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h1 className="mb-4" style={{ color: 'var(--amber-500)' }}>Contact Us</h1>
                <p className="text-muted mb-4">
                  Have a question, suggestion, or just want to talk whiskey? We'd love to hear from you.
                </p>

                <hr className="my-4" />

                {submitted ? (
                  <div className="text-center py-5">
                    <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: 'var(--amber-500)' }}></i>
                    <h3 className="mt-3" style={{ color: 'var(--zinc-100)' }}>Message Sent!</h3>
                    <p className="text-muted">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                    <button onClick={() => setSubmitted(false)} className="btn mt-3" style={{ backgroundColor: 'var(--amber-500)', color: '#000' }}>
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3 mb-md-0">
                        <label htmlFor="name" className="form-label" style={{ color: 'var(--zinc-300)' }}>Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label" style={{ color: 'var(--zinc-300)' }}>Email</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="subject" className="form-label" style={{ color: 'var(--zinc-300)' }}>Subject</label>
                      <select
                        className="form-select"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a subject...</option>
                        <option value="general">General Inquiry</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="account">Account Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="message" className="form-label" style={{ color: 'var(--zinc-300)' }}>Message</label>
                      <textarea
                        className="form-control"
                        id="message"
                        name="message"
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>

                    <button type="submit" className="btn" style={{ backgroundColor: 'var(--amber-500)', color: '#000' }} disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </form>
                )}

                <hr className="my-4" />

                <section>
                  <h2 className="h5 mb-3" style={{ color: 'var(--amber-500)' }}>Other Ways to Reach Us</h2>
                  <ul className="list-unstyled">
                    <li className="mb-2"><i className="bi bi-envelope me-2" style={{ color: 'var(--amber-500)' }}></i> support@whiskey-canon.com</li>
                    <li><i className="bi bi-github me-2" style={{ color: 'var(--amber-500)' }}></i> <a href="https://github.com/DamageLabs/whiskey-canon" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--zinc-300)' }}>DamageLabs/whiskey-canon</a></li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
