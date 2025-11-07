import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
      thresholds: {
        lines: 60,
        functions: 75,
        branches: 55,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@tasky/shared': path.resolve(__dirname, 'node_modules/@tasky/shared/src/index.ts'),
    },
  },
});
