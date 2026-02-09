import { useState, useEffect } from 'react';
import { backupAPI } from '../services/api';
import { RestorePreview } from '../types';

interface RestoreConfirmModalProps {
  backupId: number;
  onClose: () => void;
  onRestoreComplete: () => void;
}

export function RestoreConfirmModal({ backupId, onClose, onRestoreComplete }: RestoreConfirmModalProps) {
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<'skip' | 'overwrite'>('skip');

  useEffect(() => {
    async function loadPreview() {
      try {
        const data = await backupAPI.restore(backupId, true);
        setPreview(data.preview || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load backup preview');
      } finally {
        setLoading(false);
      }
    }
    loadPreview();
  }, [backupId]);

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    try {
      await backupAPI.restore(backupId, false, conflictStrategy);
      onRestoreComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to restore backup');
      setRestoring(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Restore Backup
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading && (
              <div className="text-center py-3">
                <div className="spinner-border text-primary"></div>
                <p className="mt-2">Analyzing backup...</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            {preview && (
              <>
                <p>This backup contains:</p>
                <ul className="list-group mb-3">
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Whiskeys</span>
                    <strong>{preview.whiskeyCount}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Comments</span>
                    <strong>{preview.commentCount}</strong>
                  </li>
                </ul>

                {preview.duplicateWhiskeys > 0 && (
                  <div className="alert alert-warning">
                    <strong>{preview.duplicateWhiskeys}</strong> whiskey(s) already exist in your collection.
                    <div className="mt-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="conflictStrategy"
                          id="skipDuplicates"
                          checked={conflictStrategy === 'skip'}
                          onChange={() => setConflictStrategy('skip')}
                        />
                        <label className="form-check-label" htmlFor="skipDuplicates">
                          Skip duplicates (add only new whiskeys)
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="conflictStrategy"
                          id="overwriteDuplicates"
                          checked={conflictStrategy === 'overwrite'}
                          onChange={() => setConflictStrategy('overwrite')}
                        />
                        <label className="form-check-label" htmlFor="overwriteDuplicates">
                          Overwrite duplicates with backup data
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-muted small">
                  {preview.newWhiskeys} new whiskey(s) and {preview.newComments} comment(s) will be added.
                </p>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={restoring}>
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleRestore}
              disabled={loading || restoring || !!error}
            >
              {restoring ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Restoring...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  Restore
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
