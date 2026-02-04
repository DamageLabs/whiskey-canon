import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test/**/*',
        // Entry point - hard to unit test
        'src/index.ts',
        // Seed scripts - one-time utilities
        'src/seed*.ts',
        'src/utils/seed*.ts',
        // Database utilities - one-time scripts
        'src/utils/database.ts',
        'src/utils/migrate.ts',
        'src/utils/add-*.ts',
        'src/utils/update-*.ts',
        'src/utils/remove-*.ts',
        // Email utilities - require external service mocking
        'src/utils/email.ts',
        'src/utils/verification.ts'
      ]
    }
  },
  esbuild: {
    target: 'node18'
  }
});
