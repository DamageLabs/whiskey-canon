import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { whiskeyAPI, authAPI } from '../services/api';
import { Footer } from '../components/Footer';
import '../styles/ProfilePage.css';

interface ProfileFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Clear collection state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);
  const [collectionCount, setCollectionCount] = useState(0);

  // Visibility state
  const [showPublicConfirm, setShowPublicConfirm] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  // Fetch collection count on mount
  useEffect(() => {
    async function fetchCollectionCount() {
      try {
        const { whiskeys } = await whiskeyAPI.getAll();
        setCollectionCount(whiskeys.length);
      } catch (error) {
        console.error('Failed to fetch collection count:', error);
      }
    }
    fetchCollectionCount();
  }, []);

  const handleClearCollection = async () => {
    if (clearConfirmText !== 'DELETE') {
      return;
    }

    try {
      setClearing(true);
      const result = await whiskeyAPI.deleteAll();
      setCollectionCount(0);
      setShowClearConfirm(false);
      setClearConfirmText('');
      setMessage({ type: 'success', text: result.message || 'Collection cleared successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to clear collection' });
    } finally {
      setClearing(false);
    }
  };

  const handleVisibilityToggle = (makePublic: boolean) => {
    // If making public, show confirmation dialog first
    if (makePublic && !user?.is_profile_public) {
      setShowPublicConfirm(true);
      return;
    }
    // Otherwise, update visibility directly (for making private)
    updateVisibility(makePublic);
  };

  const updateVisibility = async (makePublic: boolean) => {
    try {
      setUpdatingVisibility(true);
      const result = await authAPI.updateVisibility(makePublic);
      if (setUser && result.user) {
        setUser(result.user);
      }
      setMessage({ type: 'success', text: result.message });
      setShowPublicConfirm(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update visibility' });
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate password fields if user is trying to change password
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setMessage({ type: 'error', text: 'Current password is required to change password' });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match' });
        return;
      }

      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
        return;
      }
    }

    setLoading(true);

    try {
      const updateData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user in context
      if (setUser && data.user) {
        setUser(data.user);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Only JPEG, PNG, GIF, and WebP images are allowed' });
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    setUploadingPhoto(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch('/api/auth/profile/photo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      // Update user in context
      if (setUser && data.user) {
        setUser(data.user);
      }

      setMessage({ type: 'success', text: 'Profile photo updated successfully' });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload photo' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }

    setUploadingPhoto(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/profile/photo', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete photo');
      }

      // Update user in context
      if (setUser && data.user) {
        setUser(data.user);
      }

      setMessage({ type: 'success', text: 'Profile photo deleted successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete photo' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="profile-page">
      {/* Navigation Bar */}
      <nav className="navbar shadow-sm mb-4" style={{ backgroundColor: 'var(--zinc-900)', borderBottom: '1px solid var(--zinc-800)' }}>
        <div className="container-fluid px-4">
          <div className="navbar-brand mb-0 d-flex align-items-center gap-3" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <span className="h4 mb-0" style={{ color: 'var(--amber-500)' }}>My Profile</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm">
              Back to Dashboard
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="btn btn-outline-light btn-sm">
                Admin Panel
              </button>
            )}
            <button onClick={logout} className="btn btn-outline-light btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={user.username}
                className="avatar-image"
              />
            ) : (
              <span className="avatar-text">{user.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h1>{user.username}</h1>
          <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
            {user.role}
          </span>
        </div>

        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`} role="alert">
            {message.text}
          </div>
        )}

        <div className="profile-content">
          {!isEditing ? (
            <div className="profile-view">
              <div className="profile-section">
                <h2>Personal Information</h2>
                {(user.first_name || user.last_name) && (
                  <div className="info-group">
                    <label>Name</label>
                    <p>{[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Not provided'}</p>
                  </div>
                )}
                <div className="info-group">
                  <label>Username</label>
                  <p>{user.username}</p>
                </div>
                <div className="info-group">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className="info-group">
                  <label>Role</label>
                  <p className="text-capitalize">{user.role}</p>
                </div>
                <div className="info-group">
                  <label>Member Since</label>
                  <p>{formatDate(user.created_at)}</p>
                </div>
                {user.created_at !== user.updated_at && (
                  <div className="info-group">
                    <label>Last Updated</label>
                    <p>{formatDate(user.updated_at)}</p>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              </div>

              {/* Profile Visibility */}
              <div className="profile-section mt-4">
                <h2>Profile Visibility</h2>
                <div className="info-group">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <label className="mb-1">Current Status</label>
                      <p className="mb-0">
                        {user.is_profile_public ? (
                          <span className="badge bg-success">
                            <i className="bi bi-globe me-1"></i>
                            Public
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            <i className="bi bi-lock me-1"></i>
                            Private
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                    {user.is_profile_public
                      ? 'Anyone can view your profile.'
                      : 'Only you can see your profile.'}
                  </p>
                  {user.is_profile_public && (
                    <p className="mb-3">
                      <a
                        href={`/u/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                        style={{ color: 'var(--amber-500)' }}
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i>
                        View your public profile
                      </a>
                    </p>
                  )}
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${!user.is_profile_public ? 'btn-secondary' : 'btn-outline-secondary'}`}
                      onClick={() => handleVisibilityToggle(false)}
                      disabled={updatingVisibility || !user.is_profile_public}
                    >
                      <i className="bi bi-lock me-1"></i>
                      Private
                    </button>
                    <button
                      type="button"
                      className={`btn ${user.is_profile_public ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleVisibilityToggle(true)}
                      disabled={updatingVisibility || user.is_profile_public}
                    >
                      <i className="bi bi-globe me-1"></i>
                      Public
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="profile-section mt-5" style={{ borderTop: '1px solid var(--danger, #dc3545)', paddingTop: '2rem' }}>
                <h2 className="text-danger">Danger Zone</h2>
                <div className="info-group">
                  <label>Clear Collection</label>
                  <p className="text-muted mb-3">
                    Permanently delete all whiskeys from your collection. This action cannot be undone.
                  </p>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={collectionCount === 0}
                  >
                    <i className="bi bi-trash3 me-2"></i>
                    Clear Collection {collectionCount > 0 && `(${collectionCount} whiskeys)`}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-edit">
              <div className="profile-section">
                <h2>Profile Photo</h2>
                <div className="photo-upload-section">
                  <div className="photo-preview-container">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="photo-preview" />
                    ) : user.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={user.username}
                        className="photo-preview"
                      />
                    ) : (
                      <div className="photo-placeholder">
                        <span>No photo</span>
                      </div>
                    )}
                  </div>
                  <div className="photo-controls">
                    <input
                      type="file"
                      id="photoInput"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handlePhotoChange}
                      className="photo-input"
                    />
                    <label htmlFor="photoInput" className="btn btn-secondary btn-sm">
                      Choose Photo
                    </label>
                    {photoFile && (
                      <button
                        type="button"
                        onClick={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="btn btn-primary btn-sm"
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    )}
                    {user.profile_photo && !photoFile && (
                      <button
                        type="button"
                        onClick={handlePhotoDelete}
                        disabled={uploadingPhoto}
                        className="btn btn-danger btn-sm"
                      >
                        {uploadingPhoto ? 'Deleting...' : 'Delete Photo'}
                      </button>
                    )}
                  </div>
                  <small className="form-text text-muted">
                    Allowed formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                  </small>
                </div>
              </div>

              <div className="profile-section">
                <h2>Personal Information</h2>

                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="form-control"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="form-control"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={formData.username}
                    disabled
                  />
                  <small className="form-text text-muted">Username cannot be changed</small>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="profile-section">
                <h2>Change Password</h2>
                <p className="text-muted">Leave blank to keep current password</p>

                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    className="form-control"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    className="form-control"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="profile-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Clear Collection Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: 'var(--zinc-900)', color: 'var(--zinc-100)' }}>
              <div className="modal-header border-danger">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Clear Entire Collection
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => { setShowClearConfirm(false); setClearConfirmText(''); }}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  This will permanently delete <strong>all {collectionCount} whiskeys</strong> from your collection.
                  This action cannot be undone.
                </p>
                <p className="mb-2">Type <strong>DELETE</strong> to confirm:</p>
                <input
                  type="text"
                  className="form-control"
                  value={clearConfirmText}
                  onChange={(e) => setClearConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  autoFocus
                />
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowClearConfirm(false); setClearConfirmText(''); }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleClearCollection}
                  disabled={clearConfirmText !== 'DELETE' || clearing}
                >
                  {clearing ? 'Deleting...' : 'Delete All Whiskeys'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Make Profile Public Confirmation Modal */}
      {showPublicConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: 'var(--zinc-900)', color: 'var(--zinc-100)' }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-globe me-2"></i>
                  Make Profile Public?
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPublicConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Making your profile public means <strong>anyone</strong> can view your profile information including:
                </p>
                <ul>
                  <li>Your username and display name</li>
                  <li>Your profile photo</li>
                  <li>When you joined</li>
                </ul>
                <p className="text-muted mb-0">
                  You can change this setting back to private at any time.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPublicConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => updateVisibility(true)}
                  disabled={updatingVisibility}
                >
                  {updatingVisibility ? 'Updating...' : 'Make Public'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
