import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import contactRoutes from './contact';
import { sendContactEmail } from '../utils/email';

// Mock the email module
vi.mock('../utils/email', () => ({
  sendContactEmail: vi.fn(),
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/contact', contactRoutes);
  return app;
};

const validPayload = {
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'General Inquiry',
  message: 'Hello, I have a question about whiskey.',
};

describe('Contact Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
    vi.mocked(sendContactEmail).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Validation', () => {
    it('returns 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, name: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e: any) => e.path === 'name')).toBe(true);
    });

    it('returns 400 when email is invalid', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e: any) => e.path === 'email')).toBe(true);
    });

    it('returns 400 when subject is missing', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, subject: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e: any) => e.path === 'subject')).toBe(true);
    });

    it('returns 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, message: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e: any) => e.path === 'message')).toBe(true);
    });

    it('returns 400 when name exceeds 200 characters', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, name: 'a'.repeat(201) });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e: any) => e.path === 'name')).toBe(true);
    });

    it('returns 400 when message exceeds 5000 characters', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, message: 'a'.repeat(5001) });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e: any) => e.path === 'message')).toBe(true);
    });
  });

  describe('Successful submission', () => {
    it('returns 200 with success message when all fields valid', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Message sent successfully');
    });

    it('calls sendContactEmail with correct arguments', async () => {
      await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(sendContactEmail).toHaveBeenCalledWith(
        validPayload.name,
        validPayload.email,
        validPayload.subject,
        validPayload.message
      );
    });
  });

  describe('Email failure', () => {
    it('returns 500 when sendContactEmail returns false', async () => {
      vi.mocked(sendContactEmail).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to send message. Please try again later.');
    });

    it('returns 500 when sendContactEmail throws', async () => {
      vi.mocked(sendContactEmail).mockRejectedValue(new Error('SMTP error'));

      const response = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to send message. Please try again later.');
    });
  });

  describe('Rate limiting', () => {
    it('returns 429 after 5 requests from same IP', async () => {
      // Advance time past the 15-minute window to clear any entries from earlier tests
      vi.useFakeTimers();
      vi.advanceTimersByTime(16 * 60 * 1000);

      const rateLimitApp = createTestApp();

      // Send 5 successful requests
      for (let i = 0; i < 5; i++) {
        const res = await request(rateLimitApp)
          .post('/api/contact')
          .send(validPayload);
        expect(res.status).toBe(200);
      }

      // 6th request should be rate limited
      const response = await request(rateLimitApp)
        .post('/api/contact')
        .send(validPayload);

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Too many requests. Please try again later.');

      vi.useRealTimers();
    });
  });
});
