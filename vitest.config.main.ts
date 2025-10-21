import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for Electron Main Process tests
 * Use Node environment for testing main process code
 */
export default defineConfig({
  test: {
    // Node environment for main process
    environment: 'node',

    // Setup files
    setupFiles: ['./src/test-utils/setup-main.ts'],

    // Include only main process tests
    include: ['src/main/**/*.test.{ts,tsx}', 'src/preload/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'release', 'build'],

    // Globals
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'release/',
        'build/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/main/index.ts',
        'src/preload/index.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Isolate tests
    isolate: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@preload': path.resolve(__dirname, './src/preload'),
    },
  },
});
