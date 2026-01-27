import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface StandaloneSlidevProject {
  path: string;
  name: string;
}

export function createStandaloneSlidevProject(
  baseDir: string,
  name: string,
): StandaloneSlidevProject {
  const projectPath = join(baseDir, name);

  mkdirSync(projectPath, { recursive: true });

  const packageJson = {
    name,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'slidev',
      build: 'slidev build',
      export: 'slidev export',
    },
    dependencies: {
      '@slidev/cli': '^0.50.0',
      '@slidev/theme-default': '^0.25.0',
      vue: '^3.5.0',
    },
  };

  writeFileSync(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

  const slidesContent = `---
theme: default
title: ${name}
---

# ${name}

Welcome to your presentation

---

# Slide 2

Content goes here
`;

  writeFileSync(join(projectPath, 'slides.md'), slidesContent);

  const gitignore = `node_modules
dist
.slidev
*.local
`;

  writeFileSync(join(projectPath, '.gitignore'), gitignore);

  return {
    path: projectPath,
    name,
  };
}
