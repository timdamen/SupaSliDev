import { Command } from 'commander';
import pc from 'picocolors';

const program = new Command();

program
  .name('create-supaslidev')
  .description('CLI tool for scaffolding supaSliDev presentations')
  .version('0.1.0');

program
  .command('create')
  .description('Create a new supaSliDev presentation')
  .argument('[name]', 'Name of the presentation')
  .option('-t, --template <template>', 'Template to use', 'default')
  .action(async (name: string | undefined, options: { template: string }) => {
    console.log(pc.cyan('Creating new presentation...'));
    console.log(`Name: ${name ?? 'not specified'}`);
    console.log(`Template: ${options.template}`);
  });

export async function run(): Promise<void> {
  await program.parseAsync();
}
