import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto py-4" style={{ backgroundColor: 'var(--zinc-900)', color: 'var(--zinc-300)', borderTop: '1px solid var(--zinc-800)' }}>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-1">
              <strong>Whiskey Canon</strong> - Track, taste, and treasure your whiskey collection
            </p>
            <p className="mb-1 small">
              © 2025-2026 Whiskey Canon. All rights reserved.
            </p>
            <p className="mb-0 small">
              <Link to="/privacy" className="text-decoration-none me-3" style={{ color: 'var(--amber-500)' }}>
                Privacy Policy
              </Link>
              <span style={{ color: 'var(--zinc-600)' }}>|</span>
              <Link to="/terms" className="text-decoration-none ms-3" style={{ color: 'var(--amber-500)' }}>
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
