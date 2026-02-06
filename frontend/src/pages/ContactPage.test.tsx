import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContactPage } from './ContactPage';

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

const renderContactPage = () => {
  return render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>
  );
};

const fillAndSubmitForm = () => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'general' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello, I have a question.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Message' }));
};

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Form rendering', () => {
    it('renders all form fields and submit button', () => {
      renderContactPage();

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('shows loading spinner during submission', async () => {
      let resolveResponse!: (value: any) => void;
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((resolve) => { resolveResponse = resolve; })
      );

      renderContactPage();
      fillAndSubmitForm();

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(document.querySelector('.spinner-border')).toBeInTheDocument();

      // Resolve to clean up
      resolveResponse(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }));
    });

    it('shows success message after successful submit', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ message: 'Message sent successfully' }), { status: 200 })
      );

      renderContactPage();
      fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Message Sent!')).toBeInTheDocument();
      });
    });

    it('shows error alert on failed submit', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
      );

      renderContactPage();
      fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('Post-submission', () => {
    it('"Send Another Message" button resets to form view', async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify({ message: 'Message sent successfully' }), { status: 200 })
      );

      renderContactPage();
      fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Message Sent!')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Send Another Message' }));

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument();
    });
  });
});
