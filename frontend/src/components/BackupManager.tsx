import { useState, useEffect, useCallback, useRef } from 'react';
import { backupAPI } from '../services/api';
import { BackupRecord, BackupSchedule } from '../types';
import { RestoreConfirmModal } from './RestoreConfirmModal';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BackupManager() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [schedule, setSchedule] = useState<BackupSchedule>({
    interval: 'disabled',
    format: 'json',
    retention_days: 30,
  });
  const [creating, setCreating] = useState(false);
  const [createFormat, setCreateFormat] = useState<string>('json');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [restoreBackupId, setRestoreBackupId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleChanged, setScheduleChanged] = useState(false);

  const loadBackups = useCallback(async () => {
    try {
      const data = await backupAPI.list();
      setBackups(data.backups);
    } catch {
      // Silent fail on initial load
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    try {
      const data = await backupAPI.getSchedule();
      setSchedule(data.schedule);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    loadBackups();
    loadSchedule();
  }, [loadBackups, loadSchedule]);

  const handleCreate = async () => {
    setCreating(true);
    setMessage(null);
    try {
      await backupAPI.create(createFormat);
      setMessage({ type: 'success', text: 'Backup created successfully' });
      loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create backup' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    if (uploadInputRef.current) uploadInputRef.current.value = '';

    setUploading(true);
    setMessage(null);
    try {
      const data = await backupAPI.upload(file);
      setMessage({ type: 'success', text: 'Backup uploaded successfully' });
      await loadBackups();
      // Open restore modal for the uploaded backup
      setRestoreBackupId(data.backup.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload backup' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      await backupAPI.download(id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to download backup' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this backup? This cannot be undone.')) return;
    try {
      await backupAPI.delete(id);
      setMessage({ type: 'success', text: 'Backup deleted' });
      loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete backup' });
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    setMessage(null);
    try {
      const data = await backupAPI.updateSchedule(
        schedule.interval,
        schedule.format,
        schedule.retention_days
      );
      setSchedule(data.schedule);
      setScheduleChanged(false);
      setMessage({ type: 'success', text: 'Backup schedule updated' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update schedule' });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleRestoreComplete = () => {
    setRestoreBackupId(null);
    setMessage({ type: 'success', text: 'Backup restored successfully' });
    loadBackups();
  };

  return (
    <div className="profile-section mt-4">
      <h2>
        <i className="bi bi-cloud-arrow-up me-2"></i>
        Backups
      </h2>

      {message && (
        <div
          className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}
        >
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      {/* Create Backup */}
      <div className="info-group">
        <label>Create Backup</label>
        <p className="text-muted mb-2">Export your profile, whiskeys, and comments.</p>
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={createFormat}
            onChange={(e) => setCreateFormat(e.target.value)}
          >
            <option value="json">JSON (full backup)</option>
            <option value="csv">CSV (whiskeys only)</option>
          </select>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-download me-1"></i>
                Create Backup
              </>
            )}
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept=".json"
            className="d-none"
            onChange={handleUpload}
          />
          <button
            className="btn btn-outline-primary"
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Uploading...
              </>
            ) : (
              <>
                <i className="bi bi-upload me-1"></i>
                Upload Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backup History */}
      {backups.length > 0 && (
        <div className="info-group mt-4">
          <label>Backup History</label>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Whiskeys</th>
                  <th>Trigger</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{formatDate(backup.created_at)}</td>
                    <td>
                      <span
                        className={`badge bg-${backup.format === 'json' ? 'info' : 'secondary'}`}
                      >
                        {backup.format.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatBytes(backup.size_bytes)}</td>
                    <td>{backup.whiskey_count ?? '—'}</td>
                    <td>
                      <span
                        className={`badge bg-${backup.trigger_type === 'manual' ? 'primary' : backup.trigger_type === 'upload' ? 'warning' : 'success'}`}
                      >
                        {backup.trigger_type}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleDownload(backup.id)}
                          title="Download"
                        >
                          <i className="bi bi-download"></i>
                        </button>
                        {backup.format === 'json' && (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => setRestoreBackupId(backup.id)}
                            title="Restore"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(backup.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Configuration */}
      <div className="info-group mt-4">
        <label>Automatic Backups</label>
        <p className="text-muted mb-2">Schedule automatic backups of your collection.</p>
        <div className="row g-3 align-items-end">
          <div className="col-auto">
            <label className="form-label small">Frequency</label>
            <select
              className="form-select form-select-sm"
              value={schedule.interval}
              onChange={(e) => {
                setSchedule({ ...schedule, interval: e.target.value });
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
            <label className="form-label small">Format</label>
            <select
              className="form-select form-select-sm"
              value={schedule.format}
              onChange={(e) => {
                setSchedule({ ...schedule, format: e.target.value });
                setScheduleChanged(true);
              }}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
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
              value={schedule.retention_days}
              onChange={(e) => {
                setSchedule({ ...schedule, retention_days: parseInt(e.target.value, 10) || 30 });
                setScheduleChanged(true);
              }}
            />
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSaveSchedule}
              disabled={savingSchedule || !scheduleChanged}
            >
              {savingSchedule ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* Restore Modal */}
      {restoreBackupId && (
        <RestoreConfirmModal
          backupId={restoreBackupId}
          onClose={() => setRestoreBackupId(null)}
          onRestoreComplete={handleRestoreComplete}
        />
      )}
    </div>
  );
}
