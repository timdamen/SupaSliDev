import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { dev } from './commands/dev.js';
import { create } from './commands/create.js';
import { present } from './commands/present.js';
import { exportPdf } from './commands/export.js';
import { deploy } from './commands/deploy.js';
import { importPresentation } from './commands/import.js';

const program = new Command();

program.name('supaslidev').description('Supaslidev presentation management CLI').version('0.1.0');

program
  .command('dev', { isDefault: true })
  .description('Start the Supaslidev UI and development server')
  .action(async () => {
    await dev();
  });

program
  .command('new')
  .description('Create a new presentation')
  .argument('[name]', 'Name of the presentation')
  .action(async (name?: string) => {
    await create(name);
  });

program
  .command('present')
  .description('Start a presentation dev server')
  .argument('<name>', 'Name of the presentation to start')
  .option('-q, --quiet', 'Suppress version divergence warnings')
  .action(async (name: string, options: { quiet?: boolean }) => {
    await present(name, options);
  });

program
  .command('export')
  .description('Export a presentation to PDF')
  .argument('<name>', 'Name of the presentation to export')
  .option('-o, --output <path>', 'Output path for the PDF')
  .option('-q, --quiet', 'Suppress version divergence warnings')
  .action(async (name: string, options: { output?: string; quiet?: boolean }) => {
    await exportPdf(name, options);
  });

program
  .command('deploy')
  .description('Build and prepare a presentation for deployment')
  .argument('<name>', 'Name of the presentation to deploy')
  .option('-o, --output <path>', 'Output directory for deployment files')
  .option('-q, --quiet', 'Suppress version divergence warnings')
  .action(async (name: string, options: { output?: string; quiet?: boolean }) => {
    await deploy(name, options);
  });

program
  .command('import')
  .description('Import an existing Slidev presentation')
  .argument('<source>', 'Path to existing Slidev presentation directory')
  .argument('[name]', 'Name for the imported presentation')
  .action(async (source: string, name?: string) => {
    await importPresentation(source, name);
  });

export async function run(): Promise<void> {
  await program.parseAsync();
}

function isMainModule(): boolean {
  if (!process.argv[1]) return false;

  try {
    const scriptPath = realpathSync(process.argv[1]);
    const modulePath = realpathSync(fileURLToPath(import.meta.url));
    return scriptPath === modulePath;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  run();
}
