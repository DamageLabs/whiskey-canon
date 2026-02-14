import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupManager } from './BackupManager';
import { backupAPI } from '../services/api';

vi.mock('../services/api', () => ({
  backupAPI: {
    list: vi.fn(),
    getSchedule: vi.fn(),
    create: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    delete: vi.fn(),
    updateSchedule: vi.fn(),
  },
}));

// Mock RestoreConfirmModal to keep tests focused
vi.mock('./RestoreConfirmModal', () => ({
  RestoreConfirmModal: ({ onClose, onRestoreComplete }: any) => (
    <div data-testid="restore-modal">
      <button onClick={onClose}>Close</button>
      <button onClick={onRestoreComplete}>Confirm Restore</button>
    </div>
  ),
}));

const mockBackups = [
  {
    id: 1,
    user_id: 1,
    filename: 'backup-2024-01-01.json',
    format: 'json',
    trigger_type: 'manual',
    size_bytes: 2048,
    whiskey_count: 10,
    comment_count: 5,
    created_at: '2024-01-01T12:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    filename: 'backup-2024-01-02.csv',
    format: 'csv',
    trigger_type: 'scheduled',
    size_bytes: 1048576,
    whiskey_count: 10,
    comment_count: null,
    created_at: '2024-01-02T12:00:00Z',
  },
];

const mockSchedule = {
  interval: 'weekly',
  format: 'json',
  retention_days: 30,
};

describe('BackupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backupAPI.list).mockResolvedValue({ backups: mockBackups } as any);
    vi.mocked(backupAPI.getSchedule).mockResolvedValue({ schedule: mockSchedule } as any);
    window.confirm = vi.fn(() => true);
  });

  it('renders the Backups heading', async () => {
    render(<BackupManager />);
    expect(screen.getByText('Backups')).toBeInTheDocument();
  });

  it('loads backups and schedule on mount', async () => {
    render(<BackupManager />);
    await waitFor(() => {
      expect(backupAPI.list).toHaveBeenCalled();
      expect(backupAPI.getSchedule).toHaveBeenCalled();
    });
  });

  it('displays backup history table', async () => {
    render(<BackupManager />);
    await waitFor(() => {
      expect(screen.getByText('Backup History')).toBeInTheDocument();
    });
    // Badges in backup rows
    expect(screen.getByText('manual')).toBeInTheDocument();
    expect(screen.getByText('scheduled')).toBeInTheDocument();
    // Table has expected column headers
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Whiskeys')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('displays formatted file sizes', async () => {
    render(<BackupManager />);
    await waitFor(() => {
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });
  });

  describe('Create Backup', () => {
    it('creates a backup when button clicked', async () => {
      vi.mocked(backupAPI.create).mockResolvedValue({
        backup: mockBackups[0],
        message: 'ok',
      } as any);

      render(<BackupManager />);
      await waitFor(() => expect(backupAPI.list).toHaveBeenCalled());

      fireEvent.click(screen.getByRole('button', { name: /Create Backup/i }));

      await waitFor(() => {
        expect(backupAPI.create).toHaveBeenCalledWith('json');
        expect(screen.getByText('Backup created successfully')).toBeInTheDocument();
      });
    });

    it('shows error on create failure', async () => {
      vi.mocked(backupAPI.create).mockRejectedValue(new Error('Disk full'));

      render(<BackupManager />);
      await waitFor(() => expect(backupAPI.list).toHaveBeenCalled());

      fireEvent.click(screen.getByRole('button', { name: /Create Backup/i }));

      await waitFor(() => {
        expect(screen.getByText('Disk full')).toBeInTheDocument();
      });
    });

    it('uses selected format for creation', async () => {
      vi.mocked(backupAPI.create).mockResolvedValue({
        backup: mockBackups[0],
        message: 'ok',
      } as any);

      render(<BackupManager />);
      await waitFor(() => expect(backupAPI.list).toHaveBeenCalled());

      fireEvent.change(screen.getByDisplayValue('JSON (full backup)'), {
        target: { value: 'csv' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Create Backup/i }));

      await waitFor(() => {
        expect(backupAPI.create).toHaveBeenCalledWith('csv');
      });
    });
  });

  describe('Delete Backup', () => {
    it('deletes a backup after confirmation', async () => {
      vi.mocked(backupAPI.delete).mockResolvedValue({ message: 'ok' } as any);

      render(<BackupManager />);
      await waitFor(() => expect(screen.getByText('Backup History')).toBeInTheDocument());

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(backupAPI.delete).toHaveBeenCalledWith(1);
        expect(screen.getByText('Backup deleted')).toBeInTheDocument();
      });
    });

    it('does not delete when confirmation is cancelled', async () => {
      (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);

      render(<BackupManager />);
      await waitFor(() => expect(screen.getByText('Backup History')).toBeInTheDocument());

      const deleteButtons = screen.getAllByTitle('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(backupAPI.delete).not.toHaveBeenCalled();
    });
  });

  describe('Download Backup', () => {
    it('calls download API', async () => {
      vi.mocked(backupAPI.download).mockResolvedValue(undefined as any);

      render(<BackupManager />);
      await waitFor(() => expect(screen.getByText('Backup History')).toBeInTheDocument());

      const downloadButtons = screen.getAllByTitle('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(backupAPI.download).toHaveBeenCalledWith(1);
      });
    });

    it('shows error on download failure', async () => {
      vi.mocked(backupAPI.download).mockRejectedValue(new Error('Not found'));

      render(<BackupManager />);
      await waitFor(() => expect(screen.getByText('Backup History')).toBeInTheDocument());

      const downloadButtons = screen.getAllByTitle('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Not found')).toBeInTheDocument();
      });
    });
  });

  describe('Restore', () => {
    it('shows restore button only for JSON backups', async () => {
      render(<BackupManager />);
      await waitFor(() => expect(screen.getByText('Backup History')).toBeInTheDocument());

      const restoreButtons = screen.getAllByTitle('Restore');
      // Only the JSON backup (id=1) should have a restore button
      expect(restoreButtons).toHaveLength(1);
    });

    it('opens restore modal when restore clicked', async () => {
      render(<BackupManager />);
      await waitFor(() => expect(screen.getByText('Backup History')).toBeInTheDocument());

      fireEvent.click(screen.getByTitle('Restore'));

      expect(screen.getByTestId('restore-modal')).toBeInTheDocument();
    });

    it('shows success message after restore complete', async () => {
      render(<BackupManager />);
      await waitFor(() => expect(screen.getByText('Backup History')).toBeInTheDocument());

      fireEvent.click(screen.getByTitle('Restore'));
      fireEvent.click(screen.getByText('Confirm Restore'));

      await waitFor(() => {
        expect(screen.getByText('Backup restored successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Backup', () => {
    it('uploads a file and opens restore modal', async () => {
      vi.mocked(backupAPI.upload).mockResolvedValue({
        backup: { id: 3 },
        message: 'ok',
      } as any);

      render(<BackupManager />);
      await waitFor(() => expect(backupAPI.list).toHaveBeenCalled());

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{}'], 'backup.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(backupAPI.upload).toHaveBeenCalledWith(file);
        expect(screen.getByText('Backup uploaded successfully')).toBeInTheDocument();
        expect(screen.getByTestId('restore-modal')).toBeInTheDocument();
      });
    });

    it('shows error on upload failure', async () => {
      vi.mocked(backupAPI.upload).mockRejectedValue(new Error('Invalid file'));

      render(<BackupManager />);
      await waitFor(() => expect(backupAPI.list).toHaveBeenCalled());

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['bad'], 'backup.json', { type: 'application/json' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Invalid file')).toBeInTheDocument();
      });
    });
  });

  describe('Schedule', () => {
    it('renders schedule controls with loaded values', async () => {
      render(<BackupManager />);
      await waitFor(() => {
        const frequencySelect = screen.getByDisplayValue('Weekly');
        expect(frequencySelect).toBeInTheDocument();
      });
    });

    it('saves schedule changes', async () => {
      vi.mocked(backupAPI.updateSchedule).mockResolvedValue({
        schedule: { interval: 'daily', format: 'json', retention_days: 30 },
      } as any);

      render(<BackupManager />);
      await waitFor(() => expect(screen.getByDisplayValue('Weekly')).toBeInTheDocument());

      // Change frequency to trigger scheduleChanged
      fireEvent.change(screen.getByDisplayValue('Weekly'), {
        target: { value: 'daily' },
      });

      const saveBtn = screen.getByText('Save Schedule');
      expect(saveBtn).not.toBeDisabled();
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(backupAPI.updateSchedule).toHaveBeenCalledWith('daily', 'json', 30);
        expect(screen.getByText('Backup schedule updated')).toBeInTheDocument();
      });
    });

    it('disables save button when no changes', async () => {
      render(<BackupManager />);
      await waitFor(() => expect(screen.getByDisplayValue('Weekly')).toBeInTheDocument());

      expect(screen.getByText('Save Schedule')).toBeDisabled();
    });
  });

  describe('Message dismissal', () => {
    it('dismisses message when close button clicked', async () => {
      vi.mocked(backupAPI.create).mockResolvedValue({
        backup: mockBackups[0],
        message: 'ok',
      } as any);

      render(<BackupManager />);
      await waitFor(() => expect(backupAPI.list).toHaveBeenCalled());

      fireEvent.click(screen.getByRole('button', { name: /Create Backup/i }));
      await waitFor(() =>
        expect(screen.getByText('Backup created successfully')).toBeInTheDocument()
      );

      const closeBtn = document.querySelector('.btn-close') as HTMLElement;
      fireEvent.click(closeBtn);
      expect(screen.queryByText('Backup created successfully')).not.toBeInTheDocument();
    });
  });
});
