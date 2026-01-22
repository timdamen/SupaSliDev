import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: 'esm',
  outDir: 'dist/cli',
  clean: true,
  hash: false,
  outputOptions: {
    banner: '#!/usr/bin/env node\n',
  },
});
