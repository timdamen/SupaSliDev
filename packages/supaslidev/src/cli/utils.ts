import { dirname, join } from 'node:path';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { load as loadYaml } from 'js-yaml';

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

export interface VersionDivergence {
  dependency: string;
  pinnedVersion: string;
  catalogVersion: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PnpmWorkspace {
  catalog?: Record<string, string>;
}

export function getCatalog(projectRoot: string): Record<string, string> {
  const workspaceYamlPath = join(projectRoot, 'pnpm-workspace.yaml');

  if (!existsSync(workspaceYamlPath)) {
    return {};
  }

  const content = readFileSync(workspaceYamlPath, 'utf-8');
  const workspace = loadYaml(content) as PnpmWorkspace;

  return workspace.catalog ?? {};
}

export function getVersionDivergences(
  projectRoot: string,
  presentationName: string,
): VersionDivergence[] {
  const presentationDir = join(projectRoot, 'presentations', presentationName);
  const packageJsonPath = join(presentationDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return [];
  }

  const catalog = getCatalog(projectRoot);
  if (Object.keys(catalog).length === 0) {
    return [];
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
  const divergences: VersionDivergence[] = [];

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const [dep, version] of Object.entries(allDeps)) {
    if (version === 'catalog:' || version === 'catalog:default') {
      continue;
    }

    const catalogVersion = catalog[dep];
    if (catalogVersion && version !== catalogVersion) {
      divergences.push({
        dependency: dep,
        pinnedVersion: version,
        catalogVersion,
      });
    }
  }

  return divergences;
}

export function printVersionDivergenceWarning(divergences: VersionDivergence[]): void {
  if (divergences.length === 0) {
    return;
  }

  const maxDepLength = Math.max(...divergences.map((d) => d.dependency.length));
  const maxPinnedLength = Math.max(...divergences.map((d) => d.pinnedVersion.length));

  const lines: string[] = [];
  for (const { dependency, pinnedVersion, catalogVersion } of divergences) {
    const depPadded = dependency.padEnd(maxDepLength);
    const pinnedPadded = pinnedVersion.padEnd(maxPinnedLength);
    lines.push(`  ${depPadded}  ${pinnedPadded} -> ${catalogVersion}`);
  }

  const contentWidth = Math.max(...lines.map((l) => l.length)) + 2;
  const titleLine = '  Version Divergence Warning';
  const boxWidth = Math.max(contentWidth, titleLine.length + 2);

  console.error('');
  console.error('┌' + '─'.repeat(boxWidth) + '┐');
  console.error('│' + titleLine.padEnd(boxWidth) + '│');
  console.error('├' + '─'.repeat(boxWidth) + '┤');
  for (const line of lines) {
    console.error('│' + line.padEnd(boxWidth) + '│');
  }
  console.error('├' + '─'.repeat(boxWidth) + '┤');
  console.error('│' + '  Use "catalog:" to sync with workspace versions'.padEnd(boxWidth) + '│');
  console.error('└' + '─'.repeat(boxWidth) + '┘');
  console.error('');
}
