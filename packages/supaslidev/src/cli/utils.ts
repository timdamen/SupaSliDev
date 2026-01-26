import { dirname, join } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';

export function findProjectRoot(cwd: string = process.cwd()): string | null {
  let dir = cwd;

  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'presentations')) && existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    dir = dirname(dir);
  }

  if (existsSync(join(cwd, 'presentations'))) {
    return cwd;
  }

  return null;
}

export function getPresentations(presentationsDir: string): string[] {
  if (!existsSync(presentationsDir)) {
    return [];
  }

  return readdirSync(presentationsDir)
    .filter((name) => {
      const fullPath = join(presentationsDir, name);
      return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'slides.md'));
    })
    .sort();
}

export function printAvailablePresentations(presentations: string[]): void {
  console.error('\nAvailable presentations:');

  if (presentations.length === 0) {
    console.error('  No presentations found');
  } else {
    for (const name of presentations) {
      console.error(`  ${name}`);
    }
  }
}

export function createVercelConfig(): string {
  return (
    JSON.stringify(
      {
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
        rewrites: [{ source: '/(.*)', destination: '/index.html' }],
      },
      null,
      2,
    ) + '\n'
  );
}

export function createNetlifyConfig(): string {
  return `[build]
publish = "dist"
command = "npm run build"

[build.environment]
NODE_VERSION = "20"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
`;
}

export function createDeployPackageJson(name: string): string {
  return (
    JSON.stringify(
      {
        name: `${name}-deploy`,
        version: '1.0.0',
        private: true,
        scripts: {
          build: 'echo "Already built - static files ready in dist/"',
          start: 'npx serve dist',
        },
      },
      null,
      2,
    ) + '\n'
  );
}
