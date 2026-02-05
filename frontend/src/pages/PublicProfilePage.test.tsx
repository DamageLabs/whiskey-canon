import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicProfilePage from './PublicProfilePage';
import { usersAPI } from '../services/api';
import { Role } from '../types';

// Mock the API
vi.mock('../services/api', () => ({
  usersAPI: {
    getPublicProfile: vi.fn(),
    getPublicStats: vi.fn(),
  },
}));

// Default mock stats
const mockStats = {
  totalBottles: 10,
  typeBreakdown: [{ type: 'bourbon', count: 5 }, { type: 'scotch', count: 5 }],
  topDistilleries: [{ distillery: 'Buffalo Trace', count: 3 }],
  totalDistilleries: 5,
  averageRating: 8.5,
  countriesRepresented: ['USA', 'Scotland'],
};

// Helper to render with router and params
const renderWithRouter = (username: string) => {
  return render(
    <MemoryRouter initialEntries={[`/u/${username}`]}>
      <Routes>
        <Route path="/u/:username" element={<PublicProfilePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('PublicProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for stats
    vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });
  });

  describe('Loading state', () => {
    it('shows loading spinner while fetching profile', async () => {
      let resolveProfile: (value: any) => void;
      vi.mocked(usersAPI.getPublicProfile).mockImplementation(
        () => new Promise((resolve) => { resolveProfile = resolve; })
      );

      renderWithRouter('testuser');

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Resolve to clean up
      resolveProfile!({ profile: { id: 1, username: 'testuser', role: Role.EDITOR, is_profile_public: true, created_at: '2024-01-01' } });
    });
  });

  describe('Public profile display', () => {
    const mockPublicProfile = {
      id: 1,
      username: 'testuser',
      role: Role.EDITOR,
      first_name: 'Test',
      last_name: 'User',
      profile_photo: '/uploads/profiles/test.jpg',
      is_profile_public: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({ profile: mockPublicProfile });
    });

    it('displays username in header', async () => {
      renderWithRouter('testuser');

      await waitFor(() => {
        expect(screen.getByText("testuser's Profile")).toBeInTheDocument();
      });
    });

    it('displays username in profile section', async () => {
      renderWithRouter('testuser');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'testuser' })).toBeInTheDocument();
      });
    });

    it('displays user role badge', async () => {
      renderWithRouter('testuser');

      await waitFor(() => {
        expect(screen.getByText('editor')).toBeInTheDocument();
      });
    });

    it('displays first and last name', async () => {
      renderWithRouter('testuser');

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('displays member since date', async () => {
      renderWithRouter('testuser');

      await waitFor(() => {
        expect(screen.getByText('Member Since')).toBeInTheDocument();
        // Date formatting can vary by locale, so just check the label exists
      });
    });

    it('displays profile photo when available', async () => {
      renderWithRouter('testuser');

      await waitFor(() => {
        const img = screen.getByAltText('testuser');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/uploads/profiles/test.jpg');
      });
    });

    it('displays avatar letter when no profile photo', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: { ...mockPublicProfile, profile_photo: undefined },
      });

      renderWithRouter('testuser');

      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument(); // First letter of 'testuser'
      });
    });
  });

  describe('Profile not found', () => {
    it('shows error for non-existent user', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockRejectedValue({ status: 404 });

      renderWithRouter('nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Profile not found')).toBeInTheDocument();
      });
    });

    it('shows error for private profile', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockRejectedValue({ status: 404 });

      renderWithRouter('privateuser');

      await waitFor(() => {
        expect(screen.getByText('Profile not found')).toBeInTheDocument();
        expect(screen.getByText('This profile may be private or does not exist.')).toBeInTheDocument();
      });
    });

    it('shows Go Home button on error page', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockRejectedValue({ status: 404 });

      renderWithRouter('nonexistent');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
      });
    });

    it('shows Go Back button on error page', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockRejectedValue({ status: 404 });

      renderWithRouter('nonexistent');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
      });
    });
  });

  describe('API errors', () => {
    it('shows generic error for non-404 errors', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockRejectedValue({ status: 500 });

      renderWithRouter('testuser');

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
    });
  });

  describe('Profile without name', () => {
    it('does not show Name section when first/last name are not set', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'anon',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('anon');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'anon' })).toBeInTheDocument();
      });

      // Name label should not exist
      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });
  });

  describe('API call', () => {
    it('calls getPublicProfile with correct username', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'myuser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('myuser');

      await waitFor(() => {
        expect(usersAPI.getPublicProfile).toHaveBeenCalledWith('myuser');
      });
    });
  });
});
