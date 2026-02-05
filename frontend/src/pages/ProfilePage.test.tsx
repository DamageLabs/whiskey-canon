import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { whiskeyAPI, authAPI } from '../services/api';
import { Role } from '../types';

// Mock the API
vi.mock('../services/api', () => ({
  whiskeyAPI: {
    getAll: vi.fn(),
    deleteAll: vi.fn(),
  },
  authAPI: {
    updateVisibility: vi.fn(),
  },
}));

// Mock user data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: Role.EDITOR,
  first_name: 'Test',
  last_name: 'User',
  is_profile_public: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock useAuth hook
const mockSetUser = vi.fn();
const mockLogout = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    setUser: mockSetUser,
    logout: mockLogout,
    loading: false,
    hasPermission: vi.fn(() => true),
  }),
}));

// Helper to render with router
const renderWithRouter = () => {
  return render(
    <BrowserRouter>
      <ProfilePage />
    </BrowserRouter>
  );
};

describe('ProfilePage - Clear Collection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Danger Zone section', () => {
    it('renders Danger Zone section with Clear Collection button', async () => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({ whiskeys: [] });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Clear Collection/i })).toBeInTheDocument();
    });

    it('displays collection count in button when whiskeys exist', async () => {
      const mockWhiskeys = [
        { id: 1, name: 'Whiskey 1' },
        { id: 2, name: 'Whiskey 2' },
        { id: 3, name: 'Whiskey 3' },
      ];
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({ whiskeys: mockWhiskeys as any });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Clear Collection \(3 whiskeys\)/)).toBeInTheDocument();
      });
    });

    it('disables Clear Collection button when collection is empty', async () => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({ whiskeys: [] });

      renderWithRouter();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Clear Collection/i });
        expect(button).toBeDisabled();
      });
    });

    it('enables Clear Collection button when collection has whiskeys', async () => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({
        whiskeys: [{ id: 1, name: 'Test' }] as any,
      });

      renderWithRouter();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Clear Collection/i });
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Clear Collection modal', () => {
    beforeEach(() => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({
        whiskeys: [{ id: 1 }, { id: 2 }] as any,
      });
    });

    it('opens modal when Clear Collection button is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      expect(screen.getByText('Clear Entire Collection')).toBeInTheDocument();
      expect(screen.getByText(/This will permanently delete/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type DELETE to confirm')).toBeInTheDocument();
    });

    it('shows correct whiskey count in modal', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      expect(screen.getByText(/all 2 whiskeys/)).toBeInTheDocument();
    });

    it('closes modal when Cancel button is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      expect(screen.getByText('Clear Entire Collection')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByText('Clear Entire Collection')).not.toBeInTheDocument();
    });

    it('closes modal when X button is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const closeButton = document.querySelector('.btn-close');
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton!);

      expect(screen.queryByText('Clear Entire Collection')).not.toBeInTheDocument();
    });

    it('clears confirmation text when modal is closed', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });
      expect(input).toHaveValue('DELETE');

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // Reopen modal
      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      expect(screen.getByPlaceholderText('Type DELETE to confirm')).toHaveValue('');
    });
  });

  describe('DELETE confirmation', () => {
    beforeEach(() => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({
        whiskeys: [{ id: 1 }, { id: 2 }] as any,
      });
    });

    it('disables Delete button when confirmation text is empty', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const deleteButton = screen.getByRole('button', { name: 'Delete All Whiskeys' });
      expect(deleteButton).toBeDisabled();
    });

    it('disables Delete button when confirmation text is incorrect', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'delete' } }); // lowercase

      const deleteButton = screen.getByRole('button', { name: 'Delete All Whiskeys' });
      expect(deleteButton).toBeDisabled();
    });

    it('enables Delete button when DELETE is typed correctly', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      const deleteButton = screen.getByRole('button', { name: 'Delete All Whiskeys' });
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe('API interaction', () => {
    beforeEach(() => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({
        whiskeys: [{ id: 1 }, { id: 2 }, { id: 3 }] as any,
      });
    });

    it('calls deleteAll API when confirmed', async () => {
      vi.mocked(whiskeyAPI.deleteAll).mockResolvedValue({
        message: 'Deleted 3 whiskeys',
        deleted: 3,
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Delete All Whiskeys' }));

      await waitFor(() => {
        expect(whiskeyAPI.deleteAll).toHaveBeenCalledTimes(1);
      });
    });

    it('shows success message after successful deletion', async () => {
      vi.mocked(whiskeyAPI.deleteAll).mockResolvedValue({
        message: 'Deleted 3 whiskeys',
        deleted: 3,
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Delete All Whiskeys' }));

      await waitFor(() => {
        expect(screen.getByText('Deleted 3 whiskeys')).toBeInTheDocument();
      });
    });

    it('closes modal after successful deletion', async () => {
      vi.mocked(whiskeyAPI.deleteAll).mockResolvedValue({
        message: 'Deleted 3 whiskeys',
        deleted: 3,
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Delete All Whiskeys' }));

      await waitFor(() => {
        expect(screen.queryByText('Clear Entire Collection')).not.toBeInTheDocument();
      });
    });

    it('updates collection count to 0 after deletion', async () => {
      vi.mocked(whiskeyAPI.deleteAll).mockResolvedValue({
        message: 'Deleted 3 whiskeys',
        deleted: 3,
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Clear Collection \(3 whiskeys\)/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Delete All Whiskeys' }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Clear Collection/i });
        expect(button).toBeDisabled();
        expect(button).not.toHaveTextContent('3 whiskeys');
      });
    });

    it('shows error message when deletion fails', async () => {
      vi.mocked(whiskeyAPI.deleteAll).mockRejectedValue(new Error('Network error'));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Delete All Whiskeys' }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows loading state while deleting', async () => {
      let resolveDelete: (value: any) => void;
      vi.mocked(whiskeyAPI.deleteAll).mockImplementation(
        () => new Promise((resolve) => { resolveDelete = resolve; })
      );

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Collection/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Collection/i }));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Delete All Whiskeys' }));

      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();

      // Resolve the promise
      resolveDelete!({ message: 'Done', deleted: 3 });

      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
      });
    });
  });

  describe('fetching collection count', () => {
    it('fetches collection count on mount', async () => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({ whiskeys: [] });

      renderWithRouter();

      await waitFor(() => {
        expect(whiskeyAPI.getAll).toHaveBeenCalledTimes(1);
      });
    });

    it('handles error when fetching collection count', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(whiskeyAPI.getAll).mockRejectedValue(new Error('Failed to fetch'));

      renderWithRouter();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch collection count:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});

// Create separate test suite for visibility toggle with different mock user
describe('ProfilePage - Profile Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(whiskeyAPI.getAll).mockResolvedValue({ whiskeys: [] });
  });

  describe('Visibility section', () => {
    it('renders Profile Visibility section', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
      });
    });

    it('shows Private badge when profile is private', async () => {
      renderWithRouter();

      await waitFor(() => {
        // There are two "Private" elements - the badge and the button
        // Use getAllByText and check the badge specifically
        const privateElements = screen.getAllByText(/Private/);
        const badge = privateElements.find(el => el.classList.contains('badge'));
        expect(badge).toBeInTheDocument();
      });
    });

    it('shows correct description for private profile', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Only you can see your profile.')).toBeInTheDocument();
      });
    });

    it('renders Private and Public toggle buttons', async () => {
      renderWithRouter();

      await waitFor(() => {
        const privateBtn = screen.getByRole('button', { name: /Private/i });
        const publicBtn = screen.getByRole('button', { name: /Public/i });
        expect(privateBtn).toBeInTheDocument();
        expect(publicBtn).toBeInTheDocument();
      });
    });

    it('disables Private button when profile is already private', async () => {
      renderWithRouter();

      await waitFor(() => {
        const privateBtn = screen.getByRole('button', { name: /Private/i });
        expect(privateBtn).toBeDisabled();
      });
    });

    it('enables Public button when profile is private', async () => {
      renderWithRouter();

      await waitFor(() => {
        const publicBtn = screen.getByRole('button', { name: /Public/i });
        expect(publicBtn).not.toBeDisabled();
      });
    });
  });

  describe('Make Public confirmation modal', () => {
    it('opens confirmation modal when clicking Public button', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      expect(screen.getByText('Make Profile Public?')).toBeInTheDocument();
    });

    it('shows warning about what will be visible', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      expect(screen.getByText(/Your username and display name/)).toBeInTheDocument();
      expect(screen.getByText(/Your profile photo/)).toBeInTheDocument();
      expect(screen.getByText(/When you joined/)).toBeInTheDocument();
    });

    it('closes modal when Cancel is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));
      expect(screen.getByText('Make Profile Public?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByText('Make Profile Public?')).not.toBeInTheDocument();
    });

    it('calls updateVisibility API when Make Public is confirmed', async () => {
      vi.mocked(authAPI.updateVisibility).mockResolvedValue({
        message: 'Profile is now public',
        user: { ...mockUser, is_profile_public: true },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      // Find the "Make Public" button in the modal (not the toggle button)
      const makePublicButtons = screen.getAllByRole('button', { name: /Make Public/i });
      const modalButton = makePublicButtons.find(btn => btn.classList.contains('btn-success'));
      fireEvent.click(modalButton!);

      await waitFor(() => {
        expect(authAPI.updateVisibility).toHaveBeenCalledWith(true);
      });
    });

    it('shows success message after making profile public', async () => {
      vi.mocked(authAPI.updateVisibility).mockResolvedValue({
        message: 'Profile is now public',
        user: { ...mockUser, is_profile_public: true },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      const makePublicButtons = screen.getAllByRole('button', { name: /Make Public/i });
      const modalButton = makePublicButtons.find(btn => btn.classList.contains('btn-success'));
      fireEvent.click(modalButton!);

      await waitFor(() => {
        expect(screen.getByText('Profile is now public')).toBeInTheDocument();
      });
    });

    it('closes modal after successful update', async () => {
      vi.mocked(authAPI.updateVisibility).mockResolvedValue({
        message: 'Profile is now public',
        user: { ...mockUser, is_profile_public: true },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      const makePublicButtons = screen.getAllByRole('button', { name: /Make Public/i });
      const modalButton = makePublicButtons.find(btn => btn.classList.contains('btn-success'));
      fireEvent.click(modalButton!);

      await waitFor(() => {
        expect(screen.queryByText('Make Profile Public?')).not.toBeInTheDocument();
      });
    });

    it('shows error message when API call fails', async () => {
      vi.mocked(authAPI.updateVisibility).mockRejectedValue(new Error('Network error'));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      const makePublicButtons = screen.getAllByRole('button', { name: /Make Public/i });
      const modalButton = makePublicButtons.find(btn => btn.classList.contains('btn-success'));
      fireEvent.click(modalButton!);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(whiskeyAPI.getAll).mockResolvedValue({ whiskeys: [] });
    });

    it('visibility toggle buttons are focusable', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Private/i })).toBeInTheDocument();
      });

      const privateButton = screen.getByRole('button', { name: /Private/i });
      const publicButton = screen.getByRole('button', { name: /Public/i });

      expect(privateButton).not.toHaveAttribute('tabindex', '-1');
      expect(publicButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('buttons have accessible names', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Private/i })).toBeInTheDocument();
      });

      // All buttons should have accessible names (text content or aria-label)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const hasAccessibleName = button.textContent?.trim() || button.getAttribute('aria-label');
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('modal is visible when triggered', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      // Modal should be visible with expected structure
      expect(screen.getByText('Make Profile Public?')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('modal has descriptive title', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      expect(screen.getByText('Make Profile Public?')).toBeInTheDocument();
    });

    it('modal Cancel button is keyboard accessible', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('toggle buttons indicate current state visually', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Private/i })).toBeInTheDocument();
      });

      const privateButton = screen.getByRole('button', { name: /Private/i });
      const publicButton = screen.getByRole('button', { name: /Public/i });

      // Private should be active (has btn-secondary class), Public should be inactive (btn-outline-success)
      expect(privateButton.classList.contains('btn-secondary')).toBe(true);
      expect(publicButton.classList.contains('btn-outline-success')).toBe(true);
    });

    it('success alert is present after visibility change', async () => {
      vi.mocked(authAPI.updateVisibility).mockResolvedValue({
        message: 'Profile is now public',
        user: { ...mockUser, is_profile_public: true },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      const makePublicButtons = screen.getAllByRole('button', { name: /Make Public/i });
      const modalButton = makePublicButtons.find(btn => btn.classList.contains('btn-success'));
      fireEvent.click(modalButton!);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Profile is now public');
      });
    });

    it('error alert is present when update fails', async () => {
      vi.mocked(authAPI.updateVisibility).mockRejectedValue(new Error('Server error'));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Public/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Public/i }));

      const makePublicButtons = screen.getAllByRole('button', { name: /Make Public/i });
      const modalButton = makePublicButtons.find(btn => btn.classList.contains('btn-success'));
      fireEvent.click(modalButton!);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Server error');
      });
    });
  });
});
