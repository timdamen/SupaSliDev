import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { dev } from './commands/dev.js';
import { create } from './commands/create.js';
import { exportPdf } from './commands/export.js';
import { deploy } from './commands/deploy.js';

const program = new Command();

program
  .name('supaslidev')
  .description('Supaslidev dashboard and presentation management CLI')
  .version('0.1.0');

program
  .command('dev', { isDefault: true })
  .description('Start the dashboard UI and development server')
  .action(async () => {
    await dev();
  });

program
  .command('create')
  .description('Create a new presentation')
  .argument('[name]', 'Name of the presentation')
  .action(async (name?: string) => {
    await create(name);
  });

program
  .command('export')
  .description('Export a presentation to PDF')
  .argument('<name>', 'Name of the presentation to export')
  .option('-o, --output <path>', 'Output path for the PDF')
  .action(async (name: string, options: { output?: string }) => {
    await exportPdf(name, options);
  });

program
  .command('deploy')
  .description('Build and prepare a presentation for deployment')
  .argument('<name>', 'Name of the presentation to deploy')
  .option('-o, --output <path>', 'Output directory for deployment files')
  .action(async (name: string, options: { output?: string }) => {
    await deploy(name, options);
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
