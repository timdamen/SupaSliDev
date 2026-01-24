import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ui from '@nuxt/ui/vite';
import { resolve } from 'path';
import { existsSync, createReadStream } from 'fs';
import { basename, relative } from 'path';
import type { Plugin } from 'vite';

function serveExportsPlugin(): Plugin {
  return {
    name: 'serve-exports',
    configureServer(server) {
      server.middlewares.use('/exports', (req, res, next) => {
        const projectRoot = process.env.SUPASLIDEV_PROJECT_ROOT || resolve(process.cwd());
        const exportsDir = resolve(projectRoot, 'exports');
        const filePath = resolve(exportsDir, req.url?.slice(1) || '');

        const relativePath = relative(exportsDir, filePath);
        if (relativePath.startsWith('..') || !filePath.startsWith(exportsDir)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        if (existsSync(filePath) && filePath.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${basename(filePath)}"`);
          createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    vue(),
    ui({
      colors: {
        primary: 'indigo',
        secondary: 'violet',
        neutral: 'slate',
      },
    }),
    serveExportsPlugin(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
