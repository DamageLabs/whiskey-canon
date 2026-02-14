import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must reset module between tests to clear cached token
let fetchCsrfToken: typeof import('./csrf').fetchCsrfToken;
let ensureCsrfToken: typeof import('./csrf').ensureCsrfToken;
let getCsrfHeaders: typeof import('./csrf').getCsrfHeaders;

beforeEach(async () => {
  vi.restoreAllMocks();
  // Re-import module to reset the cached csrfToken
  vi.resetModules();
  const mod = await import('./csrf');
  fetchCsrfToken = mod.fetchCsrfToken;
  ensureCsrfToken = mod.ensureCsrfToken;
  getCsrfHeaders = mod.getCsrfHeaders;
});

describe('csrf utilities', () => {
  describe('fetchCsrfToken', () => {
    it('fetches token from the server and returns it', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ token: 'abc123' }),
      });

      const token = await fetchCsrfToken();

      expect(token).toBe('abc123');
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/csrf-token', {
        credentials: 'include',
      });
    });

    it('overwrites previously cached token on subsequent calls', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve({ token: 'first' }) })
        .mockResolvedValueOnce({ json: () => Promise.resolve({ token: 'second' }) });

      const t1 = await fetchCsrfToken();
      const t2 = await fetchCsrfToken();

      expect(t1).toBe('first');
      expect(t2).toBe('second');
    });
  });

  describe('ensureCsrfToken', () => {
    it('fetches token on first call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ token: 'cached-token' }),
      });

      const token = await ensureCsrfToken();

      expect(token).toBe('cached-token');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns cached token on subsequent calls without refetching', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ token: 'cached-token' }),
      });

      await ensureCsrfToken();
      const token = await ensureCsrfToken();

      expect(token).toBe('cached-token');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCsrfHeaders', () => {
    it('returns headers object with x-csrf-token key', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ token: 'header-token' }),
      });

      const headers = await getCsrfHeaders();

      expect(headers).toEqual({ 'x-csrf-token': 'header-token' });
    });

    it('uses cached token from prior ensureCsrfToken call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ token: 'shared-token' }),
      });

      await ensureCsrfToken();
      const headers = await getCsrfHeaders();

      expect(headers).toEqual({ 'x-csrf-token': 'shared-token' });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
