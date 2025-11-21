import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import logoSvg from '../assets/glencairn.webp';

export function PrivacyPolicyPage() {
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
            <button onClick={() => navigate(-1)} className="btn btn-outline-light btn-sm">
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-sm">
              <div className="card-body p-5">
                <h1 className="mb-4" style={{ color: '#5B9BD5' }}>Privacy Policy</h1>
                <p className="text-muted">Last updated: November 17, 2025</p>

                <hr className="my-4" />

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>1. Introduction</h2>
                  <p>
                    Welcome to Whiskey Canon ("we," "our," or "us"). We are committed to protecting your personal
                    information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
                    and safeguard your information when you use our whiskey collection management application.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>2. Information We Collect</h2>
                  <h3 className="h5 mb-2">Personal Information</h3>
                  <p>We collect the following personal information when you register and use our service:</p>
                  <ul>
                    <li><strong>Account Information:</strong> Username, email address, password (encrypted), first name, and last name</li>
                    <li><strong>Profile Information:</strong> Optional profile photo and any additional details you choose to provide</li>
                    <li><strong>Collection Data:</strong> Information about whiskeys in your collection, including names, types, ratings, tasting notes, and purchase details</li>
                  </ul>

                  <h3 className="h5 mb-2 mt-3">Automatically Collected Information</h3>
                  <ul>
                    <li><strong>Usage Data:</strong> Information about how you interact with our application</li>
                    <li><strong>Device Information:</strong> Browser type, operating system, and IP address</li>
                    <li><strong>Cookies:</strong> Session cookies for authentication and user experience</li>
                  </ul>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>3. How We Use Your Information</h2>
                  <p>We use your information for the following purposes:</p>
                  <ul>
                    <li>To provide and maintain our service</li>
                    <li>To manage your account and authenticate your access</li>
                    <li>To store and display your whiskey collection</li>
                    <li>To generate analytics and statistics about your collection</li>
                    <li>To communicate with you about service updates and features</li>
                    <li>To improve our application and user experience</li>
                    <li>To ensure the security of our service and prevent fraud</li>
                  </ul>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>4. Data Storage and Security</h2>
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal information:
                  </p>
                  <ul>
                    <li>Passwords are encrypted using industry-standard bcrypt hashing</li>
                    <li>Session data is stored securely with httpOnly cookies</li>
                    <li>Database access is restricted and monitored</li>
                    <li>Regular security updates and patches are applied</li>
                  </ul>
                  <p>
                    However, no method of transmission over the Internet or electronic storage is 100% secure.
                    While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>5. Data Sharing and Disclosure</h2>
                  <p>
                    We do not sell, trade, or rent your personal information to third parties. We may share your
                    information only in the following circumstances:
                  </p>
                  <ul>
                    <li><strong>With Your Consent:</strong> When you explicitly agree to share your information</li>
                    <li><strong>Legal Requirements:</strong> If required by law or to respond to legal process</li>
                    <li><strong>Protection of Rights:</strong> To protect the rights, property, or safety of Whiskey Canon, our users, or others</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  </ul>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>6. Your Privacy Rights</h2>
                  <p>You have the following rights regarding your personal information:</p>
                  <ul>
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> Update or correct your personal information through your profile settings</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                    <li><strong>Export:</strong> Export your collection data in CSV format</li>
                    <li><strong>Opt-Out:</strong> Opt out of non-essential communications</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us or use the available tools in your account settings.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>7. Cookies and Tracking</h2>
                  <p>
                    We use cookies and similar tracking technologies to maintain your session and improve your experience:
                  </p>
                  <ul>
                    <li><strong>Session Cookies:</strong> Essential for authentication and maintaining your logged-in state</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  </ul>
                  <p>
                    You can control cookies through your browser settings, but disabling cookies may affect functionality.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>8. Data Retention</h2>
                  <p>
                    We retain your personal information for as long as your account is active or as needed to provide
                    our services. If you request account deletion, we will remove your data within 30 days, except
                    where we are required to retain it for legal or regulatory purposes.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>9. Children's Privacy</h2>
                  <p>
                    Our service is not intended for individuals under the age of 21 (the legal drinking age in the
                    United States). We do not knowingly collect personal information from individuals under 21.
                    If we become aware that we have collected such information, we will take steps to delete it.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>10. International Users</h2>
                  <p>
                    If you are accessing our service from outside the United States, please be aware that your
                    information may be transferred to, stored, and processed in the United States where our servers
                    are located. By using our service, you consent to this transfer.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>11. Changes to This Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                    the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review
                    this Privacy Policy periodically for any changes.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>12. Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                  </p>
                  <ul className="list-unstyled">
                    <li><strong>Email:</strong> privacy@whiskeycanon.com</li>
                    <li><strong>Address:</strong> Whiskey Canon, Privacy Department</li>
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
