import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Override the global config mock from test/setup.ts
vi.unmock('./config');

// Prevent dotenv from loading .env file during tests
vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}));

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear all config-related vars so each test controls its own state
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.SESSION_SECRET;
    delete process.env.FRONTEND_URL;
    delete process.env.DATABASE_PATH;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.CONTACT_EMAIL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses default values when env vars are not set', async () => {
    const { config } = await import('./config');

    expect(config.port).toBe(3000);
    expect(config.nodeEnv).toBe('development');
    expect(config.isProduction).toBe(false);
    expect(config.sessionSecret).toBe('whiskey-bible-secret');
    expect(config.frontendUrl).toBe('http://localhost:5173');
    expect(config.resendApiKey).toBeNull();
    expect(config.resendFromEmail).toBe('noreply@whiskey-canon.com');
    expect(config.contactEmail).toBe('noreply@whiskey-canon.com');
  });

  it('reads values from environment variables', async () => {
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'development';
    process.env.SESSION_SECRET = 'my-secret';
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.DATABASE_PATH = '/tmp/test.db';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'test@example.com';
    process.env.CONTACT_EMAIL = 'contact@example.com';

    const { config } = await import('./config');

    expect(config.port).toBe(8080);
    expect(config.sessionSecret).toBe('my-secret');
    expect(config.frontendUrl).toBe('https://example.com');
    expect(config.databasePath).toBe('/tmp/test.db');
    expect(config.resendApiKey).toBe('re_test_key');
    expect(config.resendFromEmail).toBe('test@example.com');
    expect(config.contactEmail).toBe('contact@example.com');
  });

  it('throws when SESSION_SECRET is missing in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://example.com';

    await expect(import('./config')).rejects.toThrow(
      'Missing required environment variable: SESSION_SECRET'
    );
  });

  it('throws when FRONTEND_URL is missing in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'prod-secret';

    await expect(import('./config')).rejects.toThrow(
      'Missing required environment variable: FRONTEND_URL'
    );
  });

  it('succeeds in production when required vars are set', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'prod-secret';
    process.env.FRONTEND_URL = 'https://example.com';

    const { config } = await import('./config');

    expect(config.isProduction).toBe(true);
    expect(config.sessionSecret).toBe('prod-secret');
    expect(config.frontendUrl).toBe('https://example.com');
  });

  it('falls back contactEmail to RESEND_FROM_EMAIL when CONTACT_EMAIL is not set', async () => {
    process.env.RESEND_FROM_EMAIL = 'from@example.com';

    const { config } = await import('./config');

    expect(config.contactEmail).toBe('from@example.com');
  });

  describe('validateConfig', () => {
    it('logs configuration without throwing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { validateConfig } = await import('./config');
      validateConfig();

      expect(consoleSpy).toHaveBeenCalledWith('Configuration loaded:');
      consoleSpy.mockRestore();
    });

    it('shows [not set] for missing resendApiKey', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { validateConfig } = await import('./config');
      validateConfig();

      const resendLog = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('resendApiKey')
      );
      expect(resendLog?.[0]).toContain('[not set]');
      expect(resendLog?.[0]).toContain('email features disabled');
      consoleSpy.mockRestore();
    });

    it('shows [set] for present resendApiKey', async () => {
      process.env.RESEND_API_KEY = 're_test';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { validateConfig } = await import('./config');
      validateConfig();

      const resendLog = consoleSpy.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('resendApiKey')
      );
      expect(resendLog?.[0]).toContain('[set]');
      expect(resendLog?.[0]).not.toContain('email features disabled');
      consoleSpy.mockRestore();
    });
  });
});
