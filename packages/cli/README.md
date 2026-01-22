# create-supaslidev

CLI tool for scaffolding and managing Supaslidev workspaces.

## Installation

```bash
# Create a new workspace (recommended)
pnpm create supaslidev

# Or install globally
pnpm add -g create-supaslidev
```

## Commands

### create (default)

Scaffolds a new Supaslidev workspace with interactive prompts.

```bash
create-supaslidev
# or
create-supaslidev create
```

### status

Shows workspace status including CLI version and available migrations.

```bash
create-supaslidev status
```

### migrate

Runs pending migrations to update workspace to latest version.

```bash
create-supaslidev migrate        # Preview migrations
create-supaslidev migrate --apply # Apply migrations
```

### update

Checks for CLI updates.

```bash
create-supaslidev update
```

## Development

```bash
# Build
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Architecture

- `src/cli.ts` - Command-line interface setup
- `src/create.ts` - Workspace scaffolding logic
- `src/commands/` - Individual command implementations
- `src/migrations/` - Migration system (runner, manifest, backup)
- `src/state.ts` - Workspace state management
- `templates/` - EJS templates for scaffolding
