import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable global test APIs (describe, test, expect, etc.)
    globals: true,

    // Use jsdom environment for Canvas testing
    environment: 'jsdom',

    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        'src/index.ts',
        'tests/',
        '*.config.*',
        'rollup.config.js',
        'examples/'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },

    // Test timeout
    testTimeout: 10000,

    // Reporter configuration
    reporters: ['verbose'],

    // Setup files
    setupFiles: ['./tests/setup.ts']
  },

  // Resolve configuration for better module resolution
  resolve: {
    alias: {
      '@': './src',
      '@esengine/nova-ecs': '../../dist/nova-ecs.esm.js',
      '@esengine/nova-ecs-math': '../nova-ecs-math/dist/nova-ecs-math.esm.js',
      '@esengine/nova-ecs-render-core': '../nova-ecs-render-core/dist/nova-ecs-render-core.esm.js'
    }
  }
});
