import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhiskeyForm } from './WhiskeyForm';
import { lookupAPI } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  whiskeyAPI: {
    create: vi.fn(),
    update: vi.fn(),
  },
  lookupAPI: {
    lookupByName: vi.fn(),
    lookupByImage: vi.fn(),
  },
}));

// Mock useAuth
const mockUser = {
  id: 1,
  username: 'testuser',
  has_api_key: true,
  has_openai_key: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Mock CSRF
vi.mock('../utils/csrf', () => ({
  getCsrfHeaders: vi.fn().mockResolvedValue({}),
  fetchCsrfToken: vi.fn().mockResolvedValue('token'),
}));

const defaultProps = {
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe('WhiskeyForm - AI Lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Look Up button', () => {
    it('renders Look Up and Scan Label buttons', () => {
      render(<WhiskeyForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Look Up/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Scan Label/i })).toBeInTheDocument();
    });

    it('disables Look Up button when name is empty', () => {
      render(<WhiskeyForm {...defaultProps} />);

      const lookUpBtn = screen.getByRole('button', { name: /Look Up/i });
      expect(lookUpBtn).toBeDisabled();
    });

    it('enables Look Up button when name has text', () => {
      render(<WhiskeyForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Buffalo Trace', name: 'name' } });

      const lookUpBtn = screen.getByRole('button', { name: /Look Up/i });
      expect(lookUpBtn).not.toBeDisabled();
    });

    it('populates form fields on successful text lookup', async () => {
      vi.mocked(lookupAPI.lookupByName).mockResolvedValue({
        found: true,
        data: {
          name: 'Buffalo Trace',
          type: 'bourbon' as any,
          distillery: 'Buffalo Trace Distillery',
          region: 'Kentucky',
          country: 'United States',
          abv: 45,
          description: 'A great bourbon.',
        },
      });

      render(<WhiskeyForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Buffalo Trace', name: 'name' } });

      fireEvent.click(screen.getByRole('button', { name: /Look Up/i }));

      await waitFor(() => {
        expect(lookupAPI.lookupByName).toHaveBeenCalledWith('Buffalo Trace');
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Distillery *')).toHaveValue('Buffalo Trace Distillery');
      });

      expect(screen.getByLabelText('Region')).toHaveValue('Kentucky');
      expect(screen.getByLabelText('Country')).toHaveValue('United States');
    });

    it('shows error when whiskey is not found', async () => {
      vi.mocked(lookupAPI.lookupByName).mockResolvedValue({
        found: false,
      });

      render(<WhiskeyForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Unknown Whiskey', name: 'name' } });

      fireEvent.click(screen.getByRole('button', { name: /Look Up/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Could not identify that whiskey. Try a more specific name.')
        ).toBeInTheDocument();
      });
    });

    it('shows loading state while looking up', async () => {
      let resolvePromise: (value: any) => void;
      vi.mocked(lookupAPI.lookupByName).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<WhiskeyForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test', name: 'name' } });

      fireEvent.click(screen.getByRole('button', { name: /Look Up/i }));

      expect(screen.getByText('Looking up...')).toBeInTheDocument();

      resolvePromise!({ found: false });

      await waitFor(() => {
        expect(screen.queryByText('Looking up...')).not.toBeInTheDocument();
      });
    });

    it('handles API error gracefully', async () => {
      vi.mocked(lookupAPI.lookupByName).mockRejectedValue(new Error('Network error'));

      render(<WhiskeyForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test', name: 'name' } });

      fireEvent.click(screen.getByRole('button', { name: /Look Up/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('AI field indicators', () => {
    it('adds ai-suggested class to fields populated by lookup', async () => {
      vi.mocked(lookupAPI.lookupByName).mockResolvedValue({
        found: true,
        data: {
          name: 'Buffalo Trace',
          type: 'bourbon' as any,
          distillery: 'Buffalo Trace Distillery',
          region: 'Kentucky',
        },
      });

      render(<WhiskeyForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Buffalo Trace', name: 'name' } });

      fireEvent.click(screen.getByRole('button', { name: /Look Up/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Distillery *')).toHaveValue('Buffalo Trace Distillery');
      });

      // Check that ai-suggested class is applied
      expect(screen.getByLabelText('Distillery *').className).toContain('ai-suggested');
      expect(screen.getByLabelText('Region').className).toContain('ai-suggested');
    });

    it('clears ai-suggested class when user manually edits a field', async () => {
      vi.mocked(lookupAPI.lookupByName).mockResolvedValue({
        found: true,
        data: {
          name: 'Buffalo Trace',
          type: 'bourbon' as any,
          distillery: 'Buffalo Trace Distillery',
        },
      });

      render(<WhiskeyForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Buffalo Trace', name: 'name' } });
      fireEvent.click(screen.getByRole('button', { name: /Look Up/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Distillery *').className).toContain('ai-suggested');
      });

      // Edit the distillery field manually
      const distilleryInput = screen.getByLabelText('Distillery *');
      fireEvent.change(distilleryInput, {
        target: { value: 'My Custom Distillery', name: 'distillery' },
      });

      expect(distilleryInput.className).not.toContain('ai-suggested');
    });
  });

  describe('API key tooltip', () => {
    it('shows generic message when no key from either provider', () => {
      // Temporarily override mockUser to have no keys
      const originalHasApiKey = mockUser.has_api_key;
      const originalHasOpenaiKey = mockUser.has_openai_key;
      mockUser.has_api_key = false;
      mockUser.has_openai_key = false;

      render(<WhiskeyForm {...defaultProps} />);

      const lookUpBtn = screen.getByRole('button', { name: /Look Up/i });
      expect(lookUpBtn).toHaveAttribute(
        'title',
        'Add an AI API key in Profile settings to enable lookups'
      );

      // Restore
      mockUser.has_api_key = originalHasApiKey;
      mockUser.has_openai_key = originalHasOpenaiKey;
    });

    it('does not show tooltip when OpenAI key exists but no Anthropic key', () => {
      const originalHasApiKey = mockUser.has_api_key;
      const originalHasOpenaiKey = mockUser.has_openai_key;
      mockUser.has_api_key = false;
      mockUser.has_openai_key = true;

      render(<WhiskeyForm {...defaultProps} />);

      const lookUpBtn = screen.getByRole('button', { name: /Look Up/i });
      expect(lookUpBtn).not.toHaveAttribute('title');

      mockUser.has_api_key = originalHasApiKey;
      mockUser.has_openai_key = originalHasOpenaiKey;
    });

    it('does not show tooltip when Ollama is the active provider', () => {
      const originalHasApiKey = mockUser.has_api_key;
      const originalHasOpenaiKey = mockUser.has_openai_key;
      const originalAiProvider = (mockUser as any).ai_provider;
      mockUser.has_api_key = false;
      mockUser.has_openai_key = false;
      (mockUser as any).ai_provider = 'ollama';

      render(<WhiskeyForm {...defaultProps} />);

      const lookUpBtn = screen.getByRole('button', { name: /Look Up/i });
      expect(lookUpBtn).not.toHaveAttribute('title');

      mockUser.has_api_key = originalHasApiKey;
      mockUser.has_openai_key = originalHasOpenaiKey;
      (mockUser as any).ai_provider = originalAiProvider;
    });
  });

  describe('Scan Label (image lookup)', () => {
    it('renders a hidden file input for image upload', () => {
      render(<WhiskeyForm {...defaultProps} />);

      const fileInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]'
      );
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('d-none');
    });

    it('calls lookupByImage when a file is selected', async () => {
      vi.mocked(lookupAPI.lookupByImage).mockResolvedValue({
        found: true,
        data: {
          name: 'Lagavulin 16',
          type: 'scotch' as any,
          distillery: 'Lagavulin',
        },
      });

      render(<WhiskeyForm {...defaultProps} />);

      const fileInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]'
      ) as HTMLInputElement;

      const file = new File(['image data'], 'label.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(lookupAPI.lookupByImage).toHaveBeenCalledWith(file);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Distillery *')).toHaveValue('Lagavulin');
      });
    });

    it('shows error when image lookup fails to identify', async () => {
      vi.mocked(lookupAPI.lookupByImage).mockResolvedValue({
        found: false,
      });

      render(<WhiskeyForm {...defaultProps} />);

      const fileInput = document.querySelector(
        'input[type="file"][accept="image/jpeg,image/png,image/webp"]'
      ) as HTMLInputElement;

      const file = new File(['image data'], 'label.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Could not identify the whiskey from that image. Try a clearer label photo.'
          )
        ).toBeInTheDocument();
      });
    });
  });
});
