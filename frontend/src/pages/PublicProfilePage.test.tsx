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

    it('calls getPublicStats with correct username', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'statsuser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('statsuser');

      await waitFor(() => {
        expect(usersAPI.getPublicStats).toHaveBeenCalledWith('statsuser');
      });
    });
  });

  describe('Stats rendering', () => {
    const mockPublicProfile = {
      id: 1,
      username: 'collector',
      role: Role.EDITOR,
      is_profile_public: true,
      created_at: '2024-01-01',
    };

    beforeEach(() => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({ profile: mockPublicProfile });
    });

    it('displays total bottles count', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Total Bottles')).toBeInTheDocument();
      });
    });

    it('displays average rating', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('8.5')).toBeInTheDocument();
        expect(screen.getByText('Avg Rating')).toBeInTheDocument();
      });
    });

    it('displays total distilleries count', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Distilleries')).toBeInTheDocument();
      });
    });

    it('displays countries count', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Countries')).toBeInTheDocument();
      });
    });

    it('displays whiskey type breakdown', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('Whiskey Types')).toBeInTheDocument();
        expect(screen.getByText(/Bourbon/)).toBeInTheDocument();
        expect(screen.getByText(/Scotch/)).toBeInTheDocument();
        // Both types have count 5, so there should be two "(5)" elements
        const countElements = screen.getAllByText('(5)');
        expect(countElements.length).toBe(2);
      });
    });

    it('displays top distilleries', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('Top Distilleries')).toBeInTheDocument();
        expect(screen.getByText('Buffalo Trace')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('displays countries represented', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('Countries Represented')).toBeInTheDocument();
        expect(screen.getByText('USA, Scotland')).toBeInTheDocument();
      });
    });

    it('displays dash for null average rating', async () => {
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({
        stats: { ...mockStats, averageRating: null },
      });

      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument();
      });
    });

    it('shows empty collection message when totalBottles is 0', async () => {
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({
        stats: {
          totalBottles: 0,
          typeBreakdown: [],
          topDistilleries: [],
          totalDistilleries: 0,
          averageRating: null,
          countriesRepresented: [],
        },
      });

      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText("This collector hasn't added any whiskeys yet.")).toBeInTheDocument();
      });
    });

    it('does not show stats section for empty collection', async () => {
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({
        stats: {
          totalBottles: 0,
          typeBreakdown: [],
          topDistilleries: [],
          totalDistilleries: 0,
          averageRating: null,
          countriesRepresented: [],
        },
      });

      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.queryByText('Collection Stats')).not.toBeInTheDocument();
      });
    });

    it('displays Collection Stats heading when user has whiskeys', async () => {
      renderWithRouter('collector');

      await waitFor(() => {
        expect(screen.getByText('Collection Stats')).toBeInTheDocument();
      });
    });
  });

  describe('Partial name data', () => {
    beforeEach(() => {
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });
    });

    it('displays only first name when last name is not set', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'firstonly',
          role: Role.EDITOR,
          first_name: 'John',
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('firstonly');

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });
    });

    it('displays only last name when first name is not set', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'lastonly',
          role: Role.EDITOR,
          last_name: 'Smith',
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('lastonly');

      await waitFor(() => {
        expect(screen.getByText('Smith')).toBeInTheDocument();
      });
    });

    it('handles very long names without breaking layout', async () => {
      const longName = 'Supercalifragilisticexpialidocious';
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'longname',
          role: Role.EDITOR,
          first_name: longName,
          last_name: longName,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('longname');

      await waitFor(() => {
        expect(screen.getByText(`${longName} ${longName}`)).toBeInTheDocument();
      });
    });

    it('handles special characters in username', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'user_name123',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('user_name123');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'user_name123' })).toBeInTheDocument();
        expect(screen.getByText("user_name123's Profile")).toBeInTheDocument();
      });
    });

    it('displays admin role badge correctly', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'adminuser',
          role: Role.ADMIN,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('adminuser');

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });

    it('displays editor role badge correctly', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'editoruser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });

      renderWithRouter('editoruser');

      await waitFor(() => {
        expect(screen.getByText('editor')).toBeInTheDocument();
      });
    });
  });

  describe('Malformed API responses', () => {
    it('handles profile response with missing optional fields', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'minimaluser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
          // Missing: first_name, last_name, profile_photo
        },
      });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderWithRouter('minimaluser');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'minimaluser' })).toBeInTheDocument();
      });

      // Should show avatar letter instead of photo
      expect(screen.getByText('M')).toBeInTheDocument();
      // Should not show Name section
      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });

    it('handles stats response with empty arrays', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'emptyuser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({
        stats: {
          totalBottles: 5,
          typeBreakdown: [],
          topDistilleries: [],
          totalDistilleries: 0,
          averageRating: 7.5,
          countriesRepresented: [],
        },
      });

      renderWithRouter('emptyuser');

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total bottles
      });

      // Should not show whiskey types section when empty
      expect(screen.queryByText('Whiskey Types')).not.toBeInTheDocument();
      // Should not show distilleries section when empty
      expect(screen.queryByText('Top Distilleries')).not.toBeInTheDocument();
      // Should not show countries section when empty
      expect(screen.queryByText('Countries Represented')).not.toBeInTheDocument();
    });

    it('handles profile with undefined created_at gracefully', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'nodateuser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '', // Empty string instead of valid date
        },
      });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderWithRouter('nodateuser');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'nodateuser' })).toBeInTheDocument();
      });

      // Page should still render even with invalid date
      expect(screen.getByText('Member Since')).toBeInTheDocument();
    });

    it('handles network error from getPublicProfile', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockRejectedValue(new Error('Network error'));

      renderWithRouter('networkuser');

      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
    });

    it('handles network error from getPublicStats', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'statserror',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });
      vi.mocked(usersAPI.getPublicStats).mockRejectedValue(new Error('Stats error'));

      renderWithRouter('statserror');

      // Component uses Promise.all, so if stats fails, the whole page shows error
      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
    });

    it('handles profile response with extra unexpected fields', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'extrafields',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
          // Extra unexpected fields
          unexpected_field: 'should be ignored',
          another_field: 12345,
        } as any,
      });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({ stats: mockStats });

      renderWithRouter('extrafields');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'extrafields' })).toBeInTheDocument();
      });

      // Should render normally despite extra fields
      expect(screen.getByText("extrafields's Profile")).toBeInTheDocument();
    });

    it('handles stats with zero values correctly', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'zerouser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({
        stats: {
          totalBottles: 0,
          typeBreakdown: [],
          topDistilleries: [],
          totalDistilleries: 0,
          averageRating: null,
          countriesRepresented: [],
        },
      });

      renderWithRouter('zerouser');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'zerouser' })).toBeInTheDocument();
      });

      // Should show empty collection message
      expect(screen.getByText("This collector hasn't added any whiskeys yet.")).toBeInTheDocument();
    });

    it('handles stats with single item in arrays', async () => {
      vi.mocked(usersAPI.getPublicProfile).mockResolvedValue({
        profile: {
          id: 1,
          username: 'singleuser',
          role: Role.EDITOR,
          is_profile_public: true,
          created_at: '2024-01-01',
        },
      });
      vi.mocked(usersAPI.getPublicStats).mockResolvedValue({
        stats: {
          totalBottles: 1,
          typeBreakdown: [{ type: 'bourbon', count: 1 }],
          topDistilleries: [{ distillery: 'Buffalo Trace', count: 1 }],
          totalDistilleries: 1,
          averageRating: 8.0,
          countriesRepresented: ['USA'],
        },
      });

      renderWithRouter('singleuser');

      await waitFor(() => {
        expect(screen.getByText('Total Bottles')).toBeInTheDocument();
        expect(screen.getByText('Bourbon')).toBeInTheDocument();
        expect(screen.getByText('Buffalo Trace')).toBeInTheDocument();
        expect(screen.getByText('USA')).toBeInTheDocument();
      });
    });
  });
});
