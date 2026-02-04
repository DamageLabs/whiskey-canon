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
        'src/index.ts',
        'src/seed*.ts',
        'src/utils/seed*.ts',
        'src/utils/add-*.ts',
        'src/utils/update-*.ts',
        'src/utils/migrate.ts',
        'src/utils/database.ts',
        'src/utils/remove-duplicates.ts'
      ]
    }
  },
  esbuild: {
    target: 'node18'
  }
});
