import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnhancedStats } from '../components/EnhancedStats';
import {
  applyFilters,
  defaultFilters,
  FilterPanel,
  type FilterState,
} from '../components/FilterPanel';
import { Footer } from '../components/Footer';
import { WhiskeyCard } from '../components/WhiskeyCard';
import { WhiskeyDetailModal } from '../components/WhiskeyDetailModal';
import { WhiskeyForm } from '../components/WhiskeyForm';
import { WhiskeyStats } from '../components/WhiskeyStats';
import { WhiskeyTable } from '../components/WhiskeyTable';
import { useAuth } from '../context/AuthContext';
import { whiskeyAPI } from '../services/api';
import type { CollectionTotals, PaginationMeta, Whiskey } from '../types';

export function DashboardPage() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWhiskey, setEditingWhiskey] = useState<Whiskey | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedWhiskey, setSelectedWhiskey] = useState<Whiskey | null>(null);
  const [showEnhancedStats, setShowEnhancedStats] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [collectionTotals, setCollectionTotals] = useState<CollectionTotals | undefined>(undefined);

  // Apply filters to whiskeys
  const filteredWhiskeys = useMemo(() => {
    return applyFilters(whiskeys, filters);
  }, [whiskeys, filters]);

  const canCreate = hasPermission('create:whiskey');
  const canUpdate = hasPermission('update:whiskey');
  const canDelete = hasPermission('delete:whiskey');

  const loadWhiskeys = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        const result = await whiskeyAPI.getAll({
          page: targetPage,
          limit: pageSize,
        });
        setWhiskeys(result.whiskeys);
        setPagination(result.pagination || null);
        setCollectionTotals(result.collectionTotals);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch(page);
    } else {
      loadWhiskeys(page);
    }
  }, [page, pageSize]);

  // Load initial data
  useEffect(() => {
    loadWhiskeys(1);
  }, []);

  async function handleSearch(targetPage = 1) {
    if (!searchTerm.trim()) {
      setPage(1);
      loadWhiskeys(1);
      return;
    }

    try {
      setLoading(true);
      const result = await whiskeyAPI.search(searchTerm, {
        page: targetPage,
        limit: pageSize,
      });
      setWhiskeys(result.whiskeys);
      setPagination(result.pagination || null);
      setCollectionTotals(result.collectionTotals);
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
      loadWhiskeys(page);
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
      setPage(1);
      await loadWhiskeys(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} whiskey(s)?`)) {
      return;
    }

    try {
      setBulkDeleting(true);
      const result = await whiskeyAPI.deleteMany(Array.from(selectedIds));
      setSelectedIds(new Set());
      alert(result.message);
      loadWhiskeys(page);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleOpenBottle(whiskey: Whiskey) {
    if (
      !confirm(
        `Open a bottle of ${whiskey.name}? This will split one bottle off (qty ${whiskey.quantity} → ${whiskey.quantity! - 1}) and mark it as opened.`
      )
    ) {
      return;
    }

    try {
      await whiskeyAPI.openBottle(whiskey.id);
      loadWhiskeys(page);
    } catch (err: any) {
      setError(err.message);
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
    loadWhiskeys(page);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    setSelectedIds(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPage(1);
    setSelectedIds(new Set());
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: 'var(--zinc-950)' }}>
      {/* Header */}
      <nav
        className="navbar shadow-sm"
        style={{
          backgroundColor: 'var(--zinc-900)',
          borderBottom: '1px solid var(--zinc-800)',
        }}
      >
        <div className="container-fluid px-4">
          <div
            className="navbar-brand mb-0 d-flex align-items-center gap-2"
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <span style={{ fontSize: '2rem' }}>🥃</span>
            <span className="fw-bold" style={{ color: 'var(--zinc-100)' }}>
              Whiskey Canon
            </span>
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    handleSearch(1);
                  }
                }}
              />
              <button
                onClick={() => {
                  setPage(1);
                  handleSearch(1);
                }}
                className="btn text-white"
                style={{ backgroundColor: 'var(--amber-600)' }}
              >
                Search
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="col-12 col-md-6">
            <div className="d-flex gap-2 flex-wrap justify-content-md-end">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${viewMode === 'cards' ? 'text-white' : ''}`}
                  style={
                    viewMode === 'cards'
                      ? { backgroundColor: 'var(--amber-600)' }
                      : {
                          borderColor: 'var(--amber-500)',
                          color: 'var(--amber-500)',
                        }
                  }
                  onClick={() => setViewMode('cards')}
                >
                  Cards
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'table' ? 'text-white' : ''}`}
                  style={
                    viewMode === 'table'
                      ? { backgroundColor: 'var(--amber-600)' }
                      : {
                          borderColor: 'var(--amber-500)',
                          color: 'var(--amber-500)',
                        }
                  }
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

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          whiskeys={whiskeys}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* Filter/Pagination Results Count */}
        {!loading && whiskeys.length > 0 && (
          <div className="mb-3">
            <span className="text-muted">
              {filteredWhiskeys.length !== whiskeys.length ? (
                <>
                  Showing{' '}
                  <strong style={{ color: 'var(--amber-500)' }}>{filteredWhiskeys.length}</strong>{' '}
                  of {pagination ? pagination.total : whiskeys.length} whiskeys (filtered)
                </>
              ) : pagination ? (
                <>
                  Showing <strong style={{ color: 'var(--amber-500)' }}>{whiskeys.length}</strong>{' '}
                  of {pagination.total} whiskeys
                </>
              ) : null}
            </span>
          </div>
        )}

        {/* Bulk Actions */}
        {canDelete && selectedIds.size > 0 && viewMode === 'table' && (
          <div className="d-flex gap-2 mb-3 align-items-center">
            <button onClick={handleBulkDelete} className="btn btn-danger" disabled={bulkDeleting}>
              <i className="bi bi-trash"></i> Delete Selected ({selectedIds.size})
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-outline-secondary btn-sm"
            >
              Clear Selection
            </button>
          </div>
        )}

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
              <li>
                <strong>{importResult.summary.imported}</strong> whiskeys imported successfully
              </li>
              {importResult.summary.skipped > 0 && (
                <li className="text-warning">
                  <strong>{importResult.summary.skipped}</strong> rows skipped
                </li>
              )}
              {importResult.summary.errors > 0 && (
                <li className="text-danger">
                  <strong>{importResult.summary.errors}</strong> rows had errors
                </li>
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
                    <li key={i} className="small">
                      {msg}
                    </li>
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
                    <li key={i} className="small">
                      {msg}
                    </li>
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
        {!loading && filteredWhiskeys.length > 0 && (
          <div className="mb-3">
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: showEnhancedStats ? 'var(--amber-600)' : 'var(--zinc-800)',
                color: showEnhancedStats ? 'white' : 'var(--amber-500)',
                border: '2px solid var(--amber-500)',
              }}
              onClick={() => setShowEnhancedStats(!showEnhancedStats)}
            >
              <i className={`bi bi-${showEnhancedStats ? 'bar-chart' : 'graph-up'} me-2`}></i>
              {showEnhancedStats ? 'Simple Stats' : 'Enhanced Statistics'}
            </button>
          </div>
        )}

        {/* Statistics */}
        {!loading && filteredWhiskeys.length > 0 && !showEnhancedStats && (
          <WhiskeyStats
            whiskeys={filteredWhiskeys}
            collectionTotals={collectionTotals}
            pagination={pagination}
          />
        )}
        {!loading && filteredWhiskeys.length > 0 && showEnhancedStats && <EnhancedStats />}

        {/* Content */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--amber-500)' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : whiskeys.length === 0 ? (
          <div className="text-center py-5">
            <h3 className="text-muted">No whiskeys found</h3>
            {canCreate && (
              <button
                onClick={() => setShowForm(true)}
                className="btn text-white mt-3"
                style={{ backgroundColor: 'var(--amber-600)' }}
              >
                Add your first whiskey
              </button>
            )}
          </div>
        ) : filteredWhiskeys.length === 0 ? (
          <div className="text-center py-5">
            <h3 className="text-muted">No whiskeys match your filters</h3>
            <p className="text-muted">Try adjusting your filter criteria</p>
            <button
              onClick={() => setFilters(defaultFilters)}
              className="btn btn-outline-secondary mt-2"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="row g-4">
            {filteredWhiskeys.map((whiskey) => (
              <div key={whiskey.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <WhiskeyCard
                  whiskey={whiskey}
                  onEdit={canUpdate ? handleEdit : undefined}
                  onDelete={canDelete ? handleDelete : undefined}
                  onOpenBottle={canUpdate ? handleOpenBottle : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <WhiskeyTable
            whiskeys={filteredWhiskeys}
            onRowClick={setSelectedWhiskey}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onOpenBottle={canUpdate ? handleOpenBottle : undefined}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            selectionEnabled={canDelete}
          />
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Rows per page:</span>
              <select
                className="form-select form-select-sm"
                style={{
                  width: 'auto',
                  backgroundColor: 'var(--zinc-800)',
                  color: 'var(--zinc-200)',
                  borderColor: 'var(--zinc-700)',
                }}
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <nav aria-label="Whiskey pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                    style={{
                      backgroundColor: 'var(--zinc-800)',
                      color: 'var(--zinc-200)',
                      borderColor: 'var(--zinc-700)',
                    }}
                  >
                    First
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    style={{
                      backgroundColor: 'var(--zinc-800)',
                      color: 'var(--zinc-200)',
                      borderColor: 'var(--zinc-700)',
                    }}
                  >
                    Prev
                  </button>
                </li>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNum)}
                        style={
                          page === pageNum
                            ? {
                                backgroundColor: 'var(--amber-600)',
                                borderColor: 'var(--amber-600)',
                                color: 'white',
                              }
                            : {
                                backgroundColor: 'var(--zinc-800)',
                                color: 'var(--zinc-200)',
                                borderColor: 'var(--zinc-700)',
                              }
                        }
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
                <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.totalPages}
                    style={{
                      backgroundColor: 'var(--zinc-800)',
                      color: 'var(--zinc-200)',
                      borderColor: 'var(--zinc-700)',
                    }}
                  >
                    Next
                  </button>
                </li>
                <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={page === pagination.totalPages}
                    style={{
                      backgroundColor: 'var(--zinc-800)',
                      color: 'var(--zinc-200)',
                      borderColor: 'var(--zinc-700)',
                    }}
                  >
                    Last
                  </button>
                </li>
              </ul>
            </nav>

            <span className="text-muted small">
              Page {page} of {pagination.totalPages}
            </span>
          </div>
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
          onOpenBottle={canUpdate ? handleOpenBottle : undefined}
        />
      )}

      <Footer />
    </div>
  );
}
