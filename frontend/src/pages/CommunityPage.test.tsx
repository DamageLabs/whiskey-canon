import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommunityPage } from './CommunityPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Footer to keep tests focused
vi.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

const mockProfiles = [
  {
    id: 1,
    username: 'bourbon_lover',
    role: 'editor',
    first_name: 'John',
    last_name: 'Doe',
    profile_photo: null,
    is_profile_public: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 2,
    username: 'scotch_fan',
    role: 'editor',
    first_name: null,
    last_name: null,
    profile_photo: 'https://example.com/photo.jpg',
    is_profile_public: true,
    created_at: '2026-02-01T00:00:00.000Z',
  },
];

const mockStats = {
  totalBottles: 42,
  typeBreakdown: [{ type: 'bourbon', count: 30 }],
  topDistilleries: [{ distillery: 'Buffalo Trace', count: 10 }],
  totalDistilleries: 5,
  averageRating: 8.5,
  countriesRepresented: ['USA'],
};

// Mock the API module
vi.mock('../services/api', () => ({
  usersAPI: {
    listPublicProfiles: vi.fn(),
    getPublicStats: vi.fn(),
  },
}));

import { usersAPI } from '../services/api';

const renderCommunityPage = () => {
  return render(
    <MemoryRouter>
      <CommunityPage />
    </MemoryRouter>
  );
};

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading spinner while fetching profiles', () => {
      vi.mocked(usersAPI.listPublicProfiles).mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      renderCommunityPage();

      expect(screen.getByText('Loading profiles...')).toBeInTheDocument();
      expect(document.querySelector('.spinner-border')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when fetch fails', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockRejectedValue(new Error('Network error'));

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Failed to load profiles')).toBeInTheDocument();
      });
    });

    it('shows Try Again button on error', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockRejectedValue(new Error('Network error'));

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no public profiles exist', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [] });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('No public profiles yet')).toBeInTheDocument();
      });
    });
  });

  describe('Profile cards', () => {
    it('renders profile cards with usernames', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: mockProfiles });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('bourbon_lover')).toBeInTheDocument();
        expect(screen.getByText('scotch_fan')).toBeInTheDocument();
      });
    });

    it('renders display name when available', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: mockProfiles });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('shows avatar initial when no profile photo', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [mockProfiles[0]] });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('B')).toBeInTheDocument();
      });
    });

    it('shows profile photo when available', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [mockProfiles[1]] });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        const img = screen.getByAltText('scotch_fan');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
      });
    });

    it('displays collection stats on cards', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [mockProfiles[0]] });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Bottles')).toBeInTheDocument();
        expect(screen.getByText('8.5')).toBeInTheDocument();
        expect(screen.getByText('Avg Rating')).toBeInTheDocument();
      });
    });

    it('navigates to profile on card click', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [mockProfiles[0]] });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('bourbon_lover')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('bourbon_lover').closest('.card')!);
      expect(mockNavigate).toHaveBeenCalledWith('/u/bourbon_lover');
    });

    it('shows collector count', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: mockProfiles });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('2 collectors')).toBeInTheDocument();
      });
    });
  });

  describe('Search/filter', () => {
    it('filters profiles by username', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: mockProfiles });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('bourbon_lover')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name or username...'), {
        target: { value: 'scotch' },
      });

      expect(screen.queryByText('bourbon_lover')).not.toBeInTheDocument();
      expect(screen.getByText('scotch_fan')).toBeInTheDocument();
      expect(screen.getByText('1 collector')).toBeInTheDocument();
    });

    it('filters profiles by first name', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: mockProfiles });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('bourbon_lover')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name or username...'), {
        target: { value: 'John' },
      });

      expect(screen.getByText('bourbon_lover')).toBeInTheDocument();
      expect(screen.queryByText('scotch_fan')).not.toBeInTheDocument();
    });

    it('shows empty search message when no results match', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: mockProfiles });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('bourbon_lover')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name or username...'), {
        target: { value: 'nonexistent' },
      });

      expect(screen.getByText('No profiles match your search')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders Community heading', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [] });

      renderCommunityPage();

      await waitFor(() => {
        expect(screen.getByText('Community')).toBeInTheDocument();
      });
    });

    it('renders Back button', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [] });

      renderCommunityPage();

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('navigates back when Back button clicked', async () => {
      vi.mocked(usersAPI.listPublicProfiles).mockResolvedValue({ profiles: [] });

      renderCommunityPage();

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
