# @supaslidev/dashboard

Interactive dashboard and CLI for managing Slidev presentations in a Supaslidev workspace.

## Features

- Visual dashboard UI for managing presentations
- CLI commands for creating, developing, exporting, and deploying presentations
- Manages multiple Slidev dev server processes

## Usage

Within a Supaslidev workspace:

```bash
# Start interactive dashboard
pnpm dashboard

# Or use CLI commands directly
pnpm dashboard new my-presentation
pnpm dashboard present my-presentation
pnpm dashboard export my-presentation
pnpm dashboard deploy my-presentation
```

## Commands

### dev (default)

Starts the interactive dashboard UI for managing presentations.

```bash
supaslidev
# or
supaslidev dev
```

### new

Creates a new presentation using the Slidev wizard.

```bash
supaslidev new my-presentation
```

### present

Starts a dev server for a specific presentation.

```bash
supaslidev present my-presentation
```

### export

Exports a presentation to PDF.

```bash
supaslidev export my-presentation
supaslidev export my-presentation --output ./exports
```

### deploy

Builds a presentation for deployment.

```bash
supaslidev deploy my-presentation
supaslidev deploy my-presentation --output ./dist
```

## Development

```bash
# Start dashboard in dev mode
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Architecture

- `src/cli/` - CLI implementation
  - `index.ts` - Command setup
  - `commands/` - Individual commands
  - `utils.ts` - Shared utilities
- `src/App.vue` - Main dashboard Vue component
- `src/components/` - Vue components
- `server/api.js` - HTTP server for managing Slidev processes
