# @supaslidev/dashboard

The interactive dashboard and CLI for managing [Slidev](https://sli.dev/) presentations in a [Supaslidev](../../README.md) workspace.

This package provides two ways to work with your presentations: a visual dashboard UI for browsing and managing decks at a glance, and CLI commands for scripting and automation.

![Supaslidev Dashboard](../../assets/dashboard-screenshot.png)

## Features

- **Visual Dashboard** — Browse all presentations, start dev servers, and monitor running processes from one interface
- **CLI Commands** — Create, develop, export, and deploy presentations from the terminal
- **Process Management** — Run multiple Slidev dev servers simultaneously with status tracking
- **One-Command Exports** — Generate PDFs or build static sites without switching directories

## Usage

Within a Supaslidev workspace, you can access both the dashboard and CLI through pnpm scripts:

```bash
# Start the interactive dashboard
pnpm dev

# Or use CLI commands directly
pnpm new my-presentation
pnpm present my-presentation
```

## Commands

### dev

Launches the interactive dashboard UI in your browser.

```bash
supaslidev dev
```

The dashboard displays all presentations in your workspace. From here you can start dev servers, open presentations in your browser, and see which processes are running.

<!-- Screenshot: Dashboard UI showing presentation cards and status indicators -->

### new

Creates a new presentation using Slidev's setup wizard.

```bash
supaslidev new my-talk
```

The presentation is added to the `presentations/` directory with dependencies configured to use the workspace catalog.

### present

Starts a dev server for a specific presentation.

```bash
supaslidev present my-talk
```

Opens the presentation in your browser with hot reload enabled. You can run multiple presentations simultaneously.

<!-- Screenshot: Slidev dev server running with hot reload -->

### export

Exports a presentation to PDF.

```bash
supaslidev export my-talk

# Custom output directory
supaslidev export my-talk --output ./exports
```

### deploy

Builds a presentation as a static site for deployment.

```bash
supaslidev deploy my-talk

# Custom output directory
supaslidev deploy my-talk --output ./dist
```

## Documentation

For detailed guides on workspace setup, configuration options, and advanced usage, see the [full documentation](../../docs/).

## License

[MIT](../../LICENSE)
