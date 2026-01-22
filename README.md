# Supaslidev

A monorepo toolkit for managing multiple [Slidev](https://sli.dev) presentations with shared resources, components, and themes using pnpm workspaces.

## Features

- **Monorepo Structure**: Manage multiple presentations in a single workspace using pnpm workspaces
- **Interactive Dashboard**: Visual UI for managing and running presentations
- **Native Slidev CLI**: Uses the official Slidev wizard with automatic version management via pnpm catalog
- **Migration System**: Built-in migrations to keep workspaces up-to-date
- **Independent Development**: Run and build presentations individually or all at once

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Create a New Workspace

Use the scaffolding CLI to create a new Supaslidev workspace:

```bash
pnpm create supaslidev
```

This will guide you through creating a new workspace with your first presentation.

### Managing Presentations

Once inside a Supaslidev workspace, use the dashboard CLI:

```bash
# Start interactive dashboard UI
pnpm dashboard

# Create a new presentation
pnpm dashboard create my-presentation

# Start dev server for a presentation
pnpm dashboard dev my-presentation

# Export to PDF
pnpm dashboard export my-presentation

# Build for deployment
pnpm dashboard deploy my-presentation
```

## Commands Reference

### Dashboard CLI (within a workspace)

| Command                        | Description                         |
| ------------------------------ | ----------------------------------- |
| `pnpm dashboard`               | Start interactive dashboard UI      |
| `pnpm dashboard create <name>` | Create a new presentation           |
| `pnpm dashboard dev <name>`    | Start dev server for a presentation |
| `pnpm dashboard export <name>` | Export presentation to PDF          |
| `pnpm dashboard deploy <name>` | Build and prepare for deployment    |

### Workspace Commands

| Command          | Description                                         |
| ---------------- | --------------------------------------------------- |
| `pnpm install`   | Install all dependencies                            |
| `pnpm dev:all`   | Start dev servers for all presentations in parallel |
| `pnpm build:all` | Build all presentations                             |
| `pnpm lint`      | Run linting                                         |
| `pnpm typecheck` | Run TypeScript type checking                        |
| `pnpm test`      | Run tests                                           |

### Scaffolding CLI

| Command                     | Description                            |
| --------------------------- | -------------------------------------- |
| `pnpm create supaslidev`    | Create a new Supaslidev workspace      |
| `create-supaslidev status`  | Show workspace status and version info |
| `create-supaslidev migrate` | Run migrations to update workspace     |
| `create-supaslidev update`  | Check for CLI updates                  |

## Project Structure

A Supaslidev workspace has this structure:

```
my-workspace/
├── presentations/           # Your presentations live here
│   ├── my-first-deck/
│   │   ├── package.json    # Uses catalog: versions
│   │   └── slides.md       # Slidev markdown slides
│   └── another-deck/
├── packages/                # Shared packages (components, utils)
├── package.json
├── pnpm-workspace.yaml      # Workspace config with catalog
└── .supaslidev/             # Workspace state
    └── state.json
```

## Roadmap

- Share utils, components, and styles between presentations via shared packages

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
