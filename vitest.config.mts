import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@thunder-spark/shared': path.resolve(rootDir, 'packages/shared/src/index.ts'),
      '@thunder-spark/provider-core': path.resolve(rootDir, 'packages/provider-core/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.expo/**'],
  },
});
