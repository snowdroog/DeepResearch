import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment configuration
    environment: 'happy-dom',

    // Setup files
    setupFiles: ['./src/test-utils/setup.ts'],

    // Include/exclude patterns
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'release', 'build'],

    // Globals
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'release/',
        'build/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/main/index.ts', // Entry point
        'src/preload/index.ts', // Preload script
        'src/renderer/main.tsx', // React entry point
      ],
      // Coverage thresholds - aiming for 70%+
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      all: true,
      clean: true,
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Isolate tests
    isolate: true,

    // Watch options
    watch: false,

    // Pool options for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
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

  // Define global constants for tests
  define: {
    'import.meta.vitest': 'undefined',
  },
});
