import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { whiskeyAPI } from '../services/api';
import { Whiskey, WhiskeyType } from '../types';
import { WhiskeyCard } from '../components/WhiskeyCard';
import { WhiskeyForm } from '../components/WhiskeyForm';
import { WhiskeyTable } from '../components/WhiskeyTable';
import { WhiskeyDetailModal } from '../components/WhiskeyDetailModal';
import { WhiskeyStats } from '../components/WhiskeyStats';
import { EnhancedStats } from '../components/EnhancedStats';
import { Footer } from '../components/Footer';
import logoSvg from '../assets/glencairn.webp';

export function DashboardPage() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWhiskey, setEditingWhiskey] = useState<Whiskey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<WhiskeyType | ''>('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedWhiskey, setSelectedWhiskey] = useState<Whiskey | null>(null);
  const [showEnhancedStats, setShowEnhancedStats] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const canCreate = hasPermission('create:whiskey');
  const canUpdate = hasPermission('update:whiskey');
  const canDelete = hasPermission('delete:whiskey');

  useEffect(() => {
    loadWhiskeys();
  }, [filterType]);

  async function loadWhiskeys() {
    try {
      setLoading(true);
      const filters = filterType ? { type: filterType } : undefined;
      const { whiskeys: data } = await whiskeyAPI.getAll(filters);
      setWhiskeys(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchTerm.trim()) {
      loadWhiskeys();
      return;
    }

    try {
      setLoading(true);
      const { whiskeys: data } = await whiskeyAPI.search(searchTerm);
      setWhiskeys(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this whiskey?')) {
      return;
    }

    try {
      await whiskeyAPI.delete(id);
      setWhiskeys(whiskeys.filter((w) => w.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleExport() {
    try {
      await whiskeyAPI.exportCSV();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError('');
      setImportResult(null);

      const result = await whiskeyAPI.importCSV(file);
      setImportResult(result);

      // Reload whiskeys to show imported items
      await loadWhiskeys();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  }

  function handleEdit(whiskey: Whiskey) {
    setEditingWhiskey(whiskey);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingWhiskey(null);
  }

  function handleFormSuccess() {
    handleFormClose();
    loadWhiskeys();
  }

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
            <button onClick={() => navigate('/analytics')} className="btn btn-outline-light btn-sm">
              📊 Analytics
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="btn btn-outline-light btn-sm">
                Admin Panel
              </button>
            )}
            <span className="text-white">
              {user?.username} <span className="badge bg-light" style={{ color: '#5B9BD5' }}>{user?.role}</span>
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
        {/* Controls */}
        <div className="row mb-4 g-3">
          {/* Search Bar */}
          <div className="col-12 col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search whiskeys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn text-white" style={{ backgroundColor: '#5B9BD5' }}>
                Search
              </button>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as WhiskeyType | '')}
              >
                <option value="">All Types</option>
                {Object.values(WhiskeyType).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>

              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${viewMode === 'cards' ? 'text-white' : ''}`}
                  style={viewMode === 'cards' ? { backgroundColor: '#5B9BD5' } : { borderColor: '#5B9BD5', color: '#5B9BD5' }}
                  onClick={() => setViewMode('cards')}
                >
                  Cards
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'table' ? 'text-white' : ''}`}
                  style={viewMode === 'table' ? { backgroundColor: '#5B9BD5' } : { borderColor: '#5B9BD5', color: '#5B9BD5' }}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>

              <button onClick={handleExport} className="btn btn-outline-secondary">
                <i className="bi bi-download"></i> Export CSV
              </button>

              {canCreate && (
                <>
                  <label className="btn btn-outline-primary mb-0" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-upload"></i> {importing ? 'Importing...' : 'Import CSV'}
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImport}
                      disabled={importing}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button onClick={() => setShowForm(true)} className="btn btn-success">
                    <i className="bi bi-plus-lg"></i> Add Whiskey
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

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

        {/* Import Result Alert */}
        {importResult && (
          <div className="alert alert-info alert-dismissible fade show" role="alert">
            <h5 className="alert-heading">
              <i className="bi bi-check-circle-fill"></i> Import Complete
            </h5>
            <p className="mb-2">
              <strong>Summary:</strong> {importResult.summary.total} rows processed
            </p>
            <ul className="mb-2">
              <li><strong>{importResult.summary.imported}</strong> whiskeys imported successfully</li>
              {importResult.summary.skipped > 0 && (
                <li className="text-warning"><strong>{importResult.summary.skipped}</strong> rows skipped</li>
              )}
              {importResult.summary.errors > 0 && (
                <li className="text-danger"><strong>{importResult.summary.errors}</strong> rows had errors</li>
              )}
            </ul>

            {/* Show skipped rows */}
            {importResult.skipped && importResult.skipped.length > 0 && (
              <details className="mb-2">
                <summary className="text-warning" style={{ cursor: 'pointer' }}>
                  View skipped rows ({importResult.skipped.length})
                </summary>
                <ul className="mt-2 mb-0">
                  {importResult.skipped.map((msg: string, i: number) => (
                    <li key={i} className="small">{msg}</li>
                  ))}
                </ul>
              </details>
            )}

            {/* Show error rows */}
            {importResult.errors && importResult.errors.length > 0 && (
              <details className="mb-2">
                <summary className="text-danger" style={{ cursor: 'pointer' }}>
                  View errors ({importResult.errors.length})
                </summary>
                <ul className="mt-2 mb-0">
                  {importResult.errors.map((msg: string, i: number) => (
                    <li key={i} className="small">{msg}</li>
                  ))}
                </ul>
              </details>
            )}

            <button
              type="button"
              className="btn-close"
              onClick={() => setImportResult(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Statistics Toggle */}
        {!loading && whiskeys.length > 0 && (
          <div className="mb-3">
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: showEnhancedStats ? '#5B9BD5' : 'white',
                color: showEnhancedStats ? 'white' : '#5B9BD5',
                border: '2px solid #5B9BD5'
              }}
              onClick={() => setShowEnhancedStats(!showEnhancedStats)}
            >
              <i className={`bi bi-${showEnhancedStats ? 'bar-chart' : 'graph-up'} me-2`}></i>
              {showEnhancedStats ? 'Simple Stats' : 'Enhanced Statistics'}
            </button>
          </div>
        )}

        {/* Statistics */}
        {!loading && whiskeys.length > 0 && !showEnhancedStats && <WhiskeyStats whiskeys={whiskeys} />}
        {!loading && whiskeys.length > 0 && showEnhancedStats && <EnhancedStats />}

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#5B9BD5' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : whiskeys.length === 0 ? (
          <div className="text-center py-5">
            <h3 className="text-muted">No whiskeys found</h3>
            {canCreate && (
              <button onClick={() => setShowForm(true)} className="btn text-white mt-3" style={{ backgroundColor: '#5B9BD5' }}>
                Add your first whiskey
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="row g-4">
            {whiskeys.map((whiskey) => (
              <div key={whiskey.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <WhiskeyCard
                  whiskey={whiskey}
                  onEdit={canUpdate ? handleEdit : undefined}
                  onDelete={canDelete ? handleDelete : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <WhiskeyTable
            whiskeys={whiskeys}
            onRowClick={setSelectedWhiskey}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <WhiskeyForm
          whiskey={editingWhiskey}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {selectedWhiskey && (
        <WhiskeyDetailModal
          whiskey={selectedWhiskey}
          onClose={() => setSelectedWhiskey(null)}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
        />
      )}

      <Footer />
    </div>
  );
}
