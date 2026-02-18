import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { getCsrfHeaders } from '../utils/csrf';

interface AdminBackup {
  filename: string;
  size_bytes: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface WhiskeyWithOwner {
  id: number;
  name: string;
  type: string;
  distillery: string;
  region?: string;
  age?: number;
  abv?: number;
  size?: string;
  quantity?: number;
  msrp?: number;
  secondary_price?: number;
  rating?: number;
  created_by: number;
  created_at: string;
  owner_username: string;
  owner_email: string;
  owner_role: string;
}

type SortField =
  | 'owner_username'
  | 'name'
  | 'type'
  | 'distillery'
  | 'region'
  | 'age'
  | 'abv'
  | 'quantity'
  | 'msrp'
  | 'secondary_price'
  | 'rating';
type SortDirection = 'asc' | 'desc';

export function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [whiskeys, setWhiskeys] = useState<WhiskeyWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'whiskeys' | 'backups'>('users');
  const [sortField, setSortField] = useState<SortField>('owner_username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ email: string; firstName: string; lastName: string }>({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [adminBackups, setAdminBackups] = useState<AdminBackup[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [adminSchedule, setAdminSchedule] = useState<{
    interval: string;
    retention_days: number;
    last_run_at: string | null;
    next_run_at: string | null;
  }>({ interval: 'disabled', retention_days: 30, last_run_at: null, next_run_at: null });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleChanged, setScheduleChanged] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  async function loadData() {
    await Promise.all([loadUsers(), loadWhiskeys(), loadAdminBackups(), loadAdminSchedule()]);
  }

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWhiskeys() {
    try {
      const response = await fetch('/api/admin/whiskeys', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch whiskeys');
      }

      const data = await response.json();
      setWhiskeys(data.whiskeys);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function loadAdminBackups() {
    try {
      const response = await fetch('/api/admin/backups', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAdminBackups(data.backups);
      }
    } catch {
      // Silent fail
    }
  }

  async function loadAdminSchedule() {
    try {
      const response = await fetch('/api/admin/backups/schedule', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAdminSchedule(data);
        setScheduleChanged(false);
      }
    } catch {
      // Silent fail
    }
  }

  async function handleSaveAdminSchedule() {
    setSavingSchedule(true);
    setError('');
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch('/api/admin/backups/schedule', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders },
        body: JSON.stringify({
          interval: adminSchedule.interval,
          retentionDays: adminSchedule.retention_days,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save schedule');
      }

      const data = await response.json();
      setAdminSchedule(data);
      setScheduleChanged(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleCreateAdminBackup() {
    setCreatingBackup(true);
    setError('');
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create backup');
      }

      await loadAdminBackups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingBackup(false);
    }
  }

  async function handleDownloadAdminBackup(filename: string) {
    try {
      const response = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}/download`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to download backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteAdminBackup(filename: string) {
    if (!confirm(`Delete backup "${filename}"? This cannot be undone.`)) return;
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: csrfHeaders,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete backup');
      }

      await loadAdminBackups();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleImportAdminBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.db')) {
      setError('Only .db files can be imported');
      e.target.value = '';
      return;
    }

    setImportingBackup(true);
    setError('');
    try {
      const csrfHeaders = await getCsrfHeaders();
      const formData = new FormData();
      formData.append('backup', file);

      const response = await fetch('/api/admin/backups/import', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders,
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import backup');
      }

      await loadAdminBackups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImportingBackup(false);
      e.target.value = '';
    }
  }

  async function handleRestoreAdminBackup(filename: string) {
    if (
      !confirm(
        `Restore database from "${filename}"?\n\nThis will REPLACE all current data (users, whiskeys, comments) with the data from this backup. This action cannot be undone.\n\nAre you sure?`
      )
    )
      return;

    setRestoringBackup(filename);
    setError('');
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to restore backup');
      }

      const data = await response.json();
      alert(
        `${data.message}\n\nTables restored: ${data.tablesRestored.join(', ')}\n\nPlease reload the page to see updated data.`
      );
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRestoringBackup(null);
    }
  }

  async function handleRoleChange(userId: number, newRole: string) {
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleEditUser(u: User) {
    setEditingUserId(u.id);
    setEditForm({
      email: u.email,
      firstName: u.first_name || '',
      lastName: u.last_name || '',
    });
  }

  function handleCancelEdit() {
    setEditingUserId(null);
    setEditForm({ email: '', firstName: '', lastName: '' });
  }

  async function handleSaveUser(userId: number) {
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        credentials: 'include',
        body: JSON.stringify({
          email: editForm.email,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      await loadUsers();
      setEditingUserId(null);
      setEditForm({ email: '', firstName: '', lastName: '' });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteUser(userId: number, username: string) {
    if (
      !confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: csrfHeaders,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function getSortedAndFilteredWhiskeys(): WhiskeyWithOwner[] {
    let filtered = whiskeys;

    // Filter by user if selected
    if (selectedUserId !== 'all') {
      filtered = whiskeys.filter((w) => w.created_by === selectedUserId);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle undefined/null values
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      // Convert to lowercase for string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) {
      return '↕';
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: 'var(--zinc-950)' }}>
      {/* Header */}
      <nav
        className="navbar shadow-sm"
        style={{ backgroundColor: 'var(--zinc-900)', borderBottom: '1px solid var(--zinc-800)' }}
      >
        <div className="container-fluid px-4">
          <div
            className="navbar-brand mb-0 d-flex align-items-center gap-3"
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <span className="h4 mb-0" style={{ color: 'var(--amber-500)' }}>
              Admin Panel
            </span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light btn-sm">
              Back to Dashboard
            </button>
            <span style={{ color: 'var(--zinc-300)' }}>
              {user?.username}{' '}
              <span
                className="badge"
                style={{ backgroundColor: 'var(--amber-600)', color: 'white' }}
              >
                {user?.role}
              </span>
            </span>
            <button onClick={() => navigate('/profile')} className="btn btn-outline-light btn-sm">
              Profile
            </button>
            <button onClick={logout} className="btn btn-outline-light btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        <div className="row mb-4">
          <div className="col-12">
            <h2>Admin Panel</h2>
            <p className="text-muted">Manage user accounts and view all collections</p>
          </div>
        </div>

        {/* Summary Statistics */}
        {!loading && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div
                className="card shadow-sm border-0"
                style={{ borderLeft: '4px solid var(--amber-500)' }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Users</p>
                      <h3 className="mb-0">{users.length}</h3>
                    </div>
                    <div className="text-primary" style={{ fontSize: '2rem', opacity: 0.5 }}>
                      <i className="bi bi-people"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #70AD47' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Whiskeys</p>
                      <h3 className="mb-0">{whiskeys.length}</h3>
                    </div>
                    <div className="text-success" style={{ fontSize: '2rem', opacity: 0.5 }}>
                      <i className="bi bi-collection"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #FFC000' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Avg per User</p>
                      <h3 className="mb-0">
                        {users.length > 0 ? (whiskeys.length / users.length).toFixed(1) : 0}
                      </h3>
                    </div>
                    <div className="text-warning" style={{ fontSize: '2rem', opacity: 0.5 }}>
                      <i className="bi bi-graph-up"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #C5504B' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Admins</p>
                      <h3 className="mb-0">{users.filter((u) => u.role === 'admin').length}</h3>
                    </div>
                    <div className="text-danger" style={{ fontSize: '2rem', opacity: 0.5 }}>
                      <i className="bi bi-shield-check"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              style={
                activeTab === 'users'
                  ? {
                      backgroundColor: 'var(--amber-500)',
                      color: 'white',
                      borderColor: 'var(--amber-500)',
                    }
                  : {}
              }
              onClick={() => setActiveTab('users')}
            >
              User Management
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'whiskeys' ? 'active' : ''}`}
              style={
                activeTab === 'whiskeys'
                  ? {
                      backgroundColor: 'var(--amber-500)',
                      color: 'white',
                      borderColor: 'var(--amber-500)',
                    }
                  : {}
              }
              onClick={() => setActiveTab('whiskeys')}
            >
              All Collections ({getSortedAndFilteredWhiskeys().length} whiskeys)
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'backups' ? 'active' : ''}`}
              style={
                activeTab === 'backups'
                  ? {
                      backgroundColor: 'var(--amber-500)',
                      color: 'white',
                      borderColor: 'var(--amber-500)',
                    }
                  : {}
              }
              onClick={() => setActiveTab('backups')}
            >
              Database Backup
            </button>
          </li>
        </ul>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--amber-500)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Users Table */}
            {activeTab === 'users' && (
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ backgroundColor: 'var(--amber-500)', color: 'white' }}>
                        <tr>
                          <th>ID</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Collection</th>
                          <th>Created At</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const userWhiskeyCount = whiskeys.filter(
                            (w) => w.created_by === u.id
                          ).length;
                          return (
                            <tr key={u.id}>
                              <td>{u.id}</td>
                              <td>
                                <div className="fw-bold">{u.username}</div>
                                {editingUserId === u.id ? (
                                  <div className="d-flex gap-1 mt-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="First Name"
                                      value={editForm.firstName}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, firstName: e.target.value })
                                      }
                                    />
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Last Name"
                                      value={editForm.lastName}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, lastName: e.target.value })
                                      }
                                    />
                                  </div>
                                ) : (
                                  (u.first_name || u.last_name) && (
                                    <div className="text-muted small">
                                      {u.first_name} {u.last_name}
                                    </div>
                                  )
                                )}
                              </td>
                              <td>
                                {editingUserId === u.id ? (
                                  <input
                                    type="email"
                                    className="form-control form-control-sm"
                                    placeholder="Email"
                                    value={editForm.email}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, email: e.target.value })
                                    }
                                  />
                                ) : (
                                  u.email
                                )}
                              </td>
                              <td>
                                {u.id === user?.id ? (
                                  <span
                                    className="badge text-white text-capitalize"
                                    style={{ backgroundColor: 'var(--amber-500)' }}
                                  >
                                    {u.role}
                                  </span>
                                ) : (
                                  <select
                                    className="form-select form-select-sm"
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    style={{ width: 'auto' }}
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                  </select>
                                )}
                              </td>
                              <td>
                                <span className="badge bg-secondary">
                                  {userWhiskeyCount}{' '}
                                  {userWhiskeyCount === 1 ? 'whiskey' : 'whiskeys'}
                                </span>
                                {userWhiskeyCount > 0 && (
                                  <button
                                    onClick={() => {
                                      setSelectedUserId(u.id);
                                      setActiveTab('whiskeys');
                                    }}
                                    className="btn btn-sm btn-link p-0 ms-2"
                                    style={{ fontSize: '0.875rem' }}
                                  >
                                    View
                                  </button>
                                )}
                              </td>
                              <td>{new Date(u.created_at).toLocaleDateString()}</td>
                              <td className="text-center">
                                {u.id !== user?.id && (
                                  <div className="d-flex gap-1 justify-content-center">
                                    {editingUserId === u.id ? (
                                      <>
                                        <button
                                          onClick={() => handleSaveUser(u.id)}
                                          className="btn btn-sm btn-success"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="btn btn-sm btn-secondary"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleEditUser(u)}
                                          className="btn btn-sm btn-outline-primary"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(u.id, u.username)}
                                          className="btn btn-sm btn-outline-danger"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                                {u.id === user?.id && (
                                  <span className="text-muted small">(You)</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Whiskeys Table */}
            {activeTab === 'whiskeys' && (
              <>
                {/* User Filter */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Filter by User:</label>
                  <select
                    className="form-select"
                    style={{ width: 'auto' }}
                    value={selectedUserId}
                    onChange={(e) =>
                      setSelectedUserId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
                    }
                  >
                    <option value="all">All Users ({whiskeys.length} whiskeys)</option>
                    {users.map((u) => {
                      const userWhiskeyCount = whiskeys.filter((w) => w.created_by === u.id).length;
                      return (
                        <option key={u.id} value={u.id}>
                          {u.username} ({userWhiskeyCount} whiskeys)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="card shadow-sm">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: 'var(--amber-500)', color: 'white' }}>
                          <tr>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('owner_username')}
                            >
                              Owner {getSortIcon('owner_username')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('name')}
                            >
                              Name {getSortIcon('name')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('type')}
                            >
                              Type {getSortIcon('type')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('distillery')}
                            >
                              Distillery {getSortIcon('distillery')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('region')}
                            >
                              Region {getSortIcon('region')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('age')}
                            >
                              Age {getSortIcon('age')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('abv')}
                            >
                              ABV {getSortIcon('abv')}
                            </th>
                            <th>Size</th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('quantity')}
                            >
                              Qty {getSortIcon('quantity')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('msrp')}
                            >
                              MSRP {getSortIcon('msrp')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('secondary_price')}
                            >
                              Secondary {getSortIcon('secondary_price')}
                            </th>
                            <th
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              onClick={() => handleSort('rating')}
                            >
                              Rating {getSortIcon('rating')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSortedAndFilteredWhiskeys().map((w) => (
                            <tr key={w.id}>
                              <td>
                                <div>
                                  <span className="fw-bold">{w.owner_username}</span>
                                  <br />
                                  <span
                                    className="badge text-white text-capitalize"
                                    style={{
                                      backgroundColor: 'var(--amber-500)',
                                      fontSize: '0.7rem',
                                    }}
                                  >
                                    {w.owner_role}
                                  </span>
                                </div>
                              </td>
                              <td className="fw-bold">{w.name}</td>
                              <td>
                                <span className="badge bg-secondary text-capitalize">{w.type}</span>
                              </td>
                              <td>{w.distillery}</td>
                              <td>{w.region || '-'}</td>
                              <td>{w.age ? `${w.age} years` : '-'}</td>
                              <td>{w.abv ? `${w.abv}%` : '-'}</td>
                              <td>{w.size || '-'}</td>
                              <td>{w.quantity || '-'}</td>
                              <td>{w.msrp ? `$${w.msrp.toFixed(2)}` : '-'}</td>
                              <td>
                                {w.secondary_price ? `$${w.secondary_price.toFixed(2)}` : '-'}
                              </td>
                              <td>
                                {w.rating ? (
                                  <span
                                    className="badge"
                                    style={{ backgroundColor: '#FFD700', color: '#333' }}
                                  >
                                    ★ {w.rating.toFixed(1)}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Database Backup */}
            {activeTab === 'backups' && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-database-down me-2"></i>
                    Full Database Backup
                  </h5>
                  <p className="text-muted">
                    Create a complete copy of the SQLite database including all users, whiskeys,
                    comments, sessions, and settings.
                  </p>

                  <div className="d-flex gap-2 mb-4">
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateAdminBackup}
                      disabled={creatingBackup}
                    >
                      {creatingBackup ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Creating Backup...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-download me-1"></i>
                          Create Full Backup
                        </>
                      )}
                    </button>
                    <label
                      className={`btn btn-outline-primary mb-0 ${importingBackup ? 'disabled' : ''}`}
                    >
                      {importingBackup ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Importing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-upload me-1"></i>
                          Import Backup
                        </>
                      )}
                      <input
                        type="file"
                        accept=".db"
                        className="d-none"
                        onChange={handleImportAdminBackup}
                        disabled={importingBackup}
                      />
                    </label>
                  </div>

                  {adminBackups.length > 0 && (
                    <>
                      <h6>Backup History</h6>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead style={{ backgroundColor: 'var(--amber-500)', color: 'white' }}>
                            <tr>
                              <th>Filename</th>
                              <th>Size</th>
                              <th>Created</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminBackups.map((b) => (
                              <tr key={b.filename}>
                                <td className="text-break" style={{ maxWidth: '300px' }}>
                                  {b.filename}
                                </td>
                                <td>
                                  {b.size_bytes < 1024 * 1024
                                    ? `${(b.size_bytes / 1024).toFixed(1)} KB`
                                    : `${(b.size_bytes / (1024 * 1024)).toFixed(1)} MB`}
                                </td>
                                <td>
                                  {new Date(b.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="text-center">
                                  <div className="d-flex gap-1 justify-content-center">
                                    <button
                                      className="btn btn-sm btn-outline-warning"
                                      onClick={() => handleRestoreAdminBackup(b.filename)}
                                      disabled={restoringBackup === b.filename}
                                      title="Restore"
                                    >
                                      {restoringBackup === b.filename ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                      ) : (
                                        <>
                                          <i className="bi bi-arrow-counterclockwise"></i> Restore
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleDownloadAdminBackup(b.filename)}
                                      title="Download"
                                    >
                                      <i className="bi bi-download"></i> Download
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteAdminBackup(b.filename)}
                                      title="Delete"
                                    >
                                      <i className="bi bi-trash"></i> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {adminBackups.length === 0 && (
                    <p className="text-muted">
                      No backups yet. Create your first full database backup above.
                    </p>
                  )}

                  <hr className="my-4" />

                  <h5 className="mb-3">
                    <i className="bi bi-clock-history me-2"></i>
                    Automatic Backups
                  </h5>
                  <p className="text-muted mb-3">
                    Schedule automatic full database backups. Old backups are automatically pruned
                    based on retention settings.
                  </p>
                  <div className="row g-3 align-items-end">
                    <div className="col-auto">
                      <label className="form-label small">Frequency</label>
                      <select
                        className="form-select form-select-sm"
                        value={adminSchedule.interval}
                        onChange={(e) => {
                          setAdminSchedule({ ...adminSchedule, interval: e.target.value });
                          setScheduleChanged(true);
                        }}
                      >
                        <option value="disabled">Disabled</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="col-auto">
                      <label className="form-label small">Keep for (days)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '80px' }}
                        min={1}
                        max={365}
                        value={adminSchedule.retention_days}
                        onChange={(e) => {
                          setAdminSchedule({
                            ...adminSchedule,
                            retention_days: parseInt(e.target.value, 10) || 30,
                          });
                          setScheduleChanged(true);
                        }}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={handleSaveAdminSchedule}
                        disabled={savingSchedule || !scheduleChanged}
                      >
                        {savingSchedule ? 'Saving...' : 'Save Schedule'}
                      </button>
                    </div>
                  </div>
                  {adminSchedule.interval !== 'disabled' && (
                    <div className="mt-2 small text-muted">
                      {adminSchedule.last_run_at && (
                        <span className="me-3">
                          Last run:{' '}
                          {new Date(adminSchedule.last_run_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {adminSchedule.next_run_at && (
                        <span>
                          Next run:{' '}
                          {new Date(adminSchedule.next_run_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
