import Database from 'better-sqlite3';
import { beforeEach, afterAll } from 'vitest';
import { createAllTables } from '../utils/schema';

// Create in-memory database for testing
export const testDb = new Database(':memory:');

// Enable foreign keys
testDb.pragma('foreign_keys = ON');

// Initialize schema from the shared source of truth
createAllTables(testDb);

// Clear tables before each test
beforeEach(() => {
  testDb.exec('DELETE FROM backups');
  testDb.exec('DELETE FROM backup_schedules');
  testDb.exec('DELETE FROM whiskey_comments');
  testDb.exec('DELETE FROM whiskeys');
  testDb.exec('DELETE FROM users');
  // Reset auto-increment counters
  testDb.exec(
    "DELETE FROM sqlite_sequence WHERE name='users' OR name='whiskeys' OR name='whiskey_comments' OR name='backups' OR name='backup_schedules'"
  );
});

// Close database after all tests
afterAll(() => {
  testDb.close();
});

// Mock the config and database modules
import { vi } from 'vitest';

vi.mock('../utils/config', () => ({
  config: {
    port: 3000,
    nodeEnv: 'test',
    isProduction: false,
    sessionSecret: 'test-secret',
    frontendUrl: 'http://localhost:5173',
    databasePath: ':memory:',
    resendApiKey: null,
    resendFromEmail: 'noreply@whiskey-canon.com',
    contactEmail: 'noreply@whiskey-canon.com',
  },
  validateConfig: vi.fn(),
}));

vi.mock('../utils/database', async () => {
  return {
    db: testDb,
    initializeDatabase: vi.fn(),
    closeDatabase: vi.fn(),
  };
});

// Mock rate limiters to pass through in tests — rate limiting is tested in rateLimiter.test.ts
vi.mock('../middleware/rateLimiter', () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  passwordResetLimiter: (_req: any, _res: any, next: any) => next(),
  contactLimiter: (_req: any, _res: any, next: any) => next(),
  backupLimiter: (_req: any, _res: any, next: any) => next(),
}));

// Mock CSRF to pass through in tests — CSRF is tested in csrf.test.ts
vi.mock('../middleware/csrf', () => ({
  csrfProtection: (_req: any, _res: any, next: any) => next(),
  generateToken: (_req: any, _res: any) => 'test-csrf-token',
}));

// Mock password policy to avoid external HIBP API calls in tests
vi.mock('../utils/password-policy', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/password-policy')>();
  return {
    ...original,
    isPasswordBreached: vi.fn().mockResolvedValue(false),
    validatePassword: vi.fn().mockImplementation(async (password: string) => {
      const result = original.checkPasswordComplexity(password);
      if (!result.isValid) {
        throw new Error(result.errors.join('. '));
      }
      // Skip HIBP check in tests by default
    }),
  };
});
