import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import logoSvg from '../assets/glencairn.webp';

export function TermsOfServicePage() {
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
                <h1 className="mb-4" style={{ color: '#5B9BD5' }}>Terms of Service</h1>
                <p className="text-muted">Last updated: November 17, 2025</p>

                <hr className="my-4" />

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>1. Acceptance of Terms</h2>
                  <p>
                    Welcome to Whiskey Canon. By accessing or using our whiskey collection management application
                    ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to
                    these Terms, please do not use our Service.
                  </p>
                  <p>
                    These Terms constitute a legally binding agreement between you and Whiskey Canon. We reserve
                    the right to modify these Terms at any time, and your continued use of the Service after such
                    modifications constitutes acceptance of the updated Terms.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>2. Age Requirement</h2>
                  <p>
                    You must be at least 21 years of age (the legal drinking age in the United States) to use this
                    Service. By using the Service, you represent and warrant that you meet this age requirement.
                    We reserve the right to request proof of age at any time.
                  </p>
                  <p>
                    This Service is intended for personal whiskey collection management and educational purposes
                    related to whiskey appreciation. We do not promote or encourage excessive alcohol consumption.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>3. Account Registration</h2>
                  <p>To use the Service, you must create an account. You agree to:</p>
                  <ul>
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain the security of your password and account</li>
                    <li>Promptly update your account information if it changes</li>
                    <li>Accept responsibility for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                  <p>
                    You may not use another person's account without permission, create multiple accounts,
                    or transfer your account to another person without our written consent.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>4. User Roles and Permissions</h2>
                  <p>Our Service includes different user roles with varying levels of access:</p>
                  <ul>
                    <li><strong>Viewer:</strong> Can view their own whiskey collection</li>
                    <li><strong>Editor:</strong> Can view, add, and edit their own whiskey collection</li>
                    <li><strong>Admin:</strong> Has full access to all features, including user management</li>
                  </ul>
                  <p>
                    Your permissions are determined by your assigned role. Attempting to access features beyond
                    your permission level is prohibited and may result in account suspension.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>5. Acceptable Use</h2>
                  <p>You agree to use the Service only for lawful purposes. You must not:</p>
                  <ul>
                    <li>Violate any local, state, national, or international law</li>
                    <li>Infringe on the intellectual property rights of others</li>
                    <li>Upload or transmit viruses, malware, or other malicious code</li>
                    <li>Attempt to gain unauthorized access to any part of the Service</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Use automated systems (bots, scrapers) without our permission</li>
                    <li>Impersonate any person or entity</li>
                    <li>Harass, threaten, or harm other users</li>
                    <li>Post false, misleading, or fraudulent information</li>
                    <li>Use the Service for commercial purposes without authorization</li>
                  </ul>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>6. User Content</h2>
                  <p>
                    You retain ownership of the content you submit to the Service, including whiskey information,
                    ratings, tasting notes, and photos ("User Content"). By submitting User Content, you grant us
                    a non-exclusive, worldwide, royalty-free license to use, store, and display your content solely
                    for the purpose of providing and improving the Service.
                  </p>
                  <p>You represent and warrant that:</p>
                  <ul>
                    <li>You own or have the necessary rights to all User Content you submit</li>
                    <li>Your User Content does not violate any third-party rights</li>
                    <li>Your User Content complies with these Terms and applicable laws</li>
                  </ul>
                  <p>
                    We reserve the right to remove any User Content that violates these Terms or is otherwise
                    objectionable, without notice.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>7. Intellectual Property</h2>
                  <p>
                    The Service, including its design, functionality, text, graphics, logos, and software, is owned
                    by Whiskey Canon and protected by copyright, trademark, and other intellectual property laws.
                  </p>
                  <p>
                    You may not copy, modify, distribute, sell, or create derivative works from any part of the
                    Service without our express written permission. The Whiskey Canon name and logo are trademarks
                    of Whiskey Canon and may not be used without permission.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>8. Data Export and Portability</h2>
                  <p>
                    We provide tools to export your whiskey collection data in CSV format. You may export your
                    data at any time through your account settings. This ensures you maintain access to your
                    collection information even if you choose to discontinue using our Service.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>9. Third-Party Links and Services</h2>
                  <p>
                    The Service may contain links to third-party websites or services. We are not responsible
                    for the content, privacy practices, or terms of service of any third-party sites. We do not
                    endorse or make any representations about third-party sites or services.
                  </p>
                  <p>
                    Your use of third-party services is at your own risk and subject to their terms and conditions.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>10. Service Availability</h2>
                  <p>
                    We strive to provide reliable, uninterrupted service, but we cannot guarantee that the Service
                    will always be available or error-free. The Service may be unavailable due to:
                  </p>
                  <ul>
                    <li>Scheduled or emergency maintenance</li>
                    <li>Technical issues or system failures</li>
                    <li>Internet connectivity problems</li>
                    <li>Force majeure events</li>
                  </ul>
                  <p>
                    We are not liable for any loss or damage resulting from Service unavailability, interruptions,
                    or errors.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>11. Pricing and Payment</h2>
                  <p>
                    Currently, Whiskey Canon is provided free of charge. We reserve the right to introduce paid
                    features, subscriptions, or premium services in the future. If we do, we will provide advance
                    notice and you will have the option to accept or decline such paid services.
                  </p>
                  <p>
                    Any future payment terms will be clearly communicated, and you will only be charged if you
                    explicitly opt in to paid services.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>12. Termination</h2>
                  <p>
                    You may terminate your account at any time by contacting us or using the account deletion
                    feature in your settings. Upon termination, your right to use the Service immediately ceases.
                  </p>
                  <p>
                    We reserve the right to suspend or terminate your account and access to the Service at any
                    time, without notice, for conduct that we believe:
                  </p>
                  <ul>
                    <li>Violates these Terms or our policies</li>
                    <li>Is harmful to other users, us, or third parties</li>
                    <li>Exposes us to liability</li>
                    <li>Is fraudulent or illegal</li>
                  </ul>
                  <p>
                    Upon termination, we will delete your account and data in accordance with our Privacy Policy,
                    except where we are required to retain it for legal purposes.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>13. Disclaimers</h2>
                  <p>
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
                    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR
                    A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                  </p>
                  <p>
                    We do not warrant that:
                  </p>
                  <ul>
                    <li>The Service will meet your requirements</li>
                    <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                    <li>The results obtained from using the Service will be accurate or reliable</li>
                    <li>Any errors in the Service will be corrected</li>
                  </ul>
                  <p>
                    Information about whiskeys, including pricing, availability, and tasting notes, is provided
                    for informational purposes only. We do not guarantee the accuracy, completeness, or reliability
                    of any whiskey information displayed in the Service.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>14. Limitation of Liability</h2>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHISKEY CANON SHALL NOT BE LIABLE FOR ANY INDIRECT,
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
                    WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
                    INTANGIBLE LOSSES, RESULTING FROM:
                  </p>
                  <ul>
                    <li>Your use or inability to use the Service</li>
                    <li>Any unauthorized access to or use of our servers or your personal information</li>
                    <li>Any interruption or cessation of the Service</li>
                    <li>Any bugs, viruses, or other harmful code transmitted through the Service</li>
                    <li>Any errors or omissions in any content or any loss or damage incurred from use of content</li>
                  </ul>
                  <p>
                    IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS
                    PRIOR TO THE EVENT GIVING RISE TO LIABILITY, OR $100, WHICHEVER IS GREATER.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>15. Indemnification</h2>
                  <p>
                    You agree to indemnify, defend, and hold harmless Whiskey Canon, its officers, directors,
                    employees, and agents from and against any claims, liabilities, damages, losses, and expenses,
                    including reasonable attorneys' fees, arising out of or in any way connected with:
                  </p>
                  <ul>
                    <li>Your access to or use of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any third-party rights</li>
                    <li>Your User Content</li>
                  </ul>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>16. Dispute Resolution</h2>
                  <p>
                    Any disputes arising out of or relating to these Terms or the Service shall be resolved through
                    binding arbitration in accordance with the rules of the American Arbitration Association, rather
                    than in court, except that you may assert claims in small claims court if your claims qualify.
                  </p>
                  <p>
                    You and Whiskey Canon agree to waive any right to a jury trial or to participate in a class
                    action. All disputes will be resolved on an individual basis.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>17. Governing Law</h2>
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the United States
                    and the State of [Your State], without regard to its conflict of law provisions.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>18. Severability</h2>
                  <p>
                    If any provision of these Terms is found to be invalid or unenforceable by a court of competent
                    jurisdiction, the remaining provisions shall remain in full force and effect.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>19. Changes to Terms</h2>
                  <p>
                    We reserve the right to modify these Terms at any time. We will notify you of any material
                    changes by posting the new Terms on this page and updating the "Last updated" date.
                  </p>
                  <p>
                    Your continued use of the Service after any changes to these Terms constitutes acceptance of
                    those changes. If you do not agree to the modified Terms, you must stop using the Service.
                  </p>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>20. Contact Information</h2>
                  <p>
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <ul className="list-unstyled">
                    <li><strong>Email:</strong> legal@whiskeycanon.com</li>
                    <li><strong>Address:</strong> Whiskey Canon, Legal Department</li>
                  </ul>
                </section>

                <section className="mb-4">
                  <h2 className="h4 mb-3" style={{ color: '#5B9BD5' }}>21. Entire Agreement</h2>
                  <p>
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you
                    and Whiskey Canon regarding the Service and supersede all prior agreements and understandings.
                  </p>
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
