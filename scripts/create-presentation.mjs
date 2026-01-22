#!/usr/bin/env node

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const presentationsDir = join(rootDir, 'presentations');

function printUsage() {
  console.error('Usage: pnpm create:presentation <name>');
}

function createPresentation(name) {
  console.log(`\nCreating presentation "${name}" in presentations/${name}...\n`);

  const child = spawn('pnpm', ['create', 'slidev', name], {
    cwd: presentationsDir,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });

  let promptCount = 0;

  const sendResponse = () => {
    promptCount++;
    if (promptCount === 1) {
      child.stdin.write('y\n');
    } else if (promptCount === 2) {
      child.stdin.write('\x1B[B\x1B[B\n');
    }
  };

  const checkInterval = setInterval(sendResponse, 500);

  child.on('error', (err) => {
    clearInterval(checkInterval);
    console.error(`Failed to create presentation: ${err.message}`);
    process.exit(1);
  });

  child.on('close', (code) => {
    clearInterval(checkInterval);
    if (code === 0) {
      console.log(`\nPresentation created at presentations/${name}/`);
      console.log(`Run it with: pnpm dev ${name}`);
    }
    process.exit(code ?? 0);
  });
}

function main() {
  const args = process.argv.slice(2);
  const name = args[0];

  if (!name) {
    console.error('Error: Presentation name is required');
    printUsage();
    process.exit(1);
  }

  createPresentation(name);
}

main();
