import { Command } from 'commander';
import { create, type CreateOptions } from './create.js';

const program = new Command();

program
  .name('create-supaslidev')
  .description('CLI tool for scaffolding supaSliDev presentations')
  .version('0.1.0');

program
  .command('create', { isDefault: true })
  .description('Create a new supaSliDev workspace')
  .option('-n, --name <name>', 'Name of the workspace')
  .option('-p, --presentation <name>', 'Name of the first presentation')
  .option('-t, --template <template>', 'Template to use', 'default')
  .option('--git', 'Initialize a git repository')
  .option('--no-git', 'Skip git initialization')
  .option('--install', 'Run pnpm install after scaffolding')
  .option('--no-install', 'Skip pnpm install')
  .action(async (options: CreateOptions) => {
    await create(options);
  });

export async function run(): Promise<void> {
  await program.parseAsync();
}
