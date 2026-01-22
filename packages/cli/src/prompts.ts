import * as p from '@clack/prompts';
import pc from 'picocolors';

export interface ScaffoldOptions {
  projectName: string;
  presentationName: string;
  initGit: boolean;
}

function validateProjectName(value: string): string | undefined {
  if (!value.trim()) {
    return 'Project name is required';
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Project name must be lowercase alphanumeric with hyphens only';
  }
  if (value.startsWith('-') || value.endsWith('-')) {
    return 'Project name cannot start or end with a hyphen';
  }
  return undefined;
}

function validatePresentationName(value: string): string | undefined {
  if (!value.trim()) {
    return 'Presentation name is required';
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Presentation name must be lowercase alphanumeric with hyphens only';
  }
  if (value.startsWith('-') || value.endsWith('-')) {
    return 'Presentation name cannot start or end with a hyphen';
  }
  return undefined;
}

export async function promptForScaffoldOptions(): Promise<ScaffoldOptions | null> {
  p.intro(pc.cyan('Create a new supaSliDev workspace'));

  const projectName = await p.text({
    message: 'What is your project name?',
    placeholder: 'my-presentations',
    validate: validateProjectName,
  });

  if (p.isCancel(projectName)) {
    p.cancel('Operation cancelled');
    return null;
  }

  const presentationName = await p.text({
    message: 'What is the name of your first presentation?',
    placeholder: 'my-first-deck',
    defaultValue: 'my-first-deck',
    validate: validatePresentationName,
  });

  if (p.isCancel(presentationName)) {
    p.cancel('Operation cancelled');
    return null;
  }

  const initGit = await p.confirm({
    message: 'Initialize a git repository?',
    initialValue: true,
  });

  if (p.isCancel(initGit)) {
    p.cancel('Operation cancelled');
    return null;
  }

  p.outro(pc.green('Configuration complete!'));

  return {
    projectName,
    presentationName,
    initGit,
  };
}
