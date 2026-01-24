import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import {
  findProjectRoot,
  getPresentations,
  printAvailablePresentations,
  createVercelConfig,
  createNetlifyConfig,
  createDeployPackageJson,
  getVersionDivergences,
  printVersionDivergenceWarning,
} from '../utils.js';

export interface DeployOptions {
  output?: string;
}

export async function deploy(name: string, options: DeployOptions): Promise<void> {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    console.error('Error: Could not find a Supaslidev project.');
    console.error('Make sure you are in a directory with a "presentations" folder.');
    process.exit(1);
  }

  const presentationsDir = join(projectRoot, 'presentations');
  const deployDir = join(projectRoot, 'deploy');
  const presentations = getPresentations(presentationsDir);

  if (!presentations.includes(name)) {
    console.error(`Error: Presentation "${name}" not found`);
    printAvailablePresentations(presentations);
    process.exit(1);
  }

  const presentationDir = join(presentationsDir, name);
  const presentationDistDir = join(presentationDir, 'dist');
  const outputDir = options.output ?? join(deployDir, name);
  const outputDistDir = join(outputDir, 'dist');

  const divergences = getVersionDivergences(projectRoot, name);
  printVersionDivergenceWarning(divergences);

  console.log('\n' + '='.repeat(50));
  console.log(`  Preparing deployment: ${name}`);
  console.log('='.repeat(50) + '\n');

  console.log('Step 1/3: Building presentation...');

  const slidev = spawn('npx', ['slidev', 'build'], {
    cwd: presentationDir,
    stdio: 'inherit',
    shell: true,
  });

  slidev.on('error', (err) => {
    console.error(`Failed to build presentation: ${err.message}`);
    process.exit(1);
  });

  slidev.on('close', (code) => {
    if (code !== 0) {
      console.error(`\nBuild failed with exit code ${code}`);
      process.exit(code ?? 1);
    }

    console.log('\nStep 2/3: Creating deploy package...');

    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true });
    }
    mkdirSync(outputDir, { recursive: true });

    cpSync(presentationDistDir, outputDistDir, { recursive: true });

    console.log('Step 3/3: Adding deployment configurations...');

    writeFileSync(join(outputDir, 'vercel.json'), createVercelConfig());
    writeFileSync(join(outputDir, 'netlify.toml'), createNetlifyConfig());
    writeFileSync(join(outputDir, 'package.json'), createDeployPackageJson(name));

    console.log('\n' + '='.repeat(50));
    console.log('  Deployment package ready!');
    console.log('='.repeat(50));
    console.log(`\n  Output: ${outputDir}/`);
    console.log('\n  Deploy with Vercel:');
    console.log(`    cd ${outputDir} && vercel`);
    console.log('\n  Deploy with Netlify:');
    console.log(`    cd ${outputDir} && netlify deploy --prod`);
    console.log('\n  Or push to Git and import in Vercel/Netlify dashboard.');
    console.log('');
  });
}
