import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto py-4" style={{ backgroundColor: '#5B9BD5', color: 'white' }}>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-1">
              <strong>Whiskey Canon</strong> - Track, taste, and treasure your whiskey collection
            </p>
            <p className="mb-1 small">
              © 2025 Whiskey Canon. All rights reserved.
            </p>
            <p className="mb-0 small">
              <Link to="/privacy" className="text-white text-decoration-none me-3" style={{ opacity: 0.8 }}>
                Privacy Policy
              </Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/terms" className="text-white text-decoration-none ms-3" style={{ opacity: 0.8 }}>
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
