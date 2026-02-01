<p align="center">
  <img src="public/ssl-logo.png" alt="Supaslidev Logo" width="150" />
</p>

<h1 align="center">Supaslidev</h1>

<p align="center">
  <strong>Manage all your Slidev presentations from one place.</strong>
</p>

## Why Supaslidev?

[Slidev](https://sli.dev/) is awesome for creating developer-friendly presentations—write in Markdown, use Vue components, version control your slides like code.

But managing multiple presentations? Not so developer-friendly. Scattered folders, version drift between decks, and no unified way to run, export, or update them.

Supaslidev fixes that. One workspace, shared dependencies, and an interactive dashboard to manage all your presentations in one place.

## Features

- **One Workspace, Many Presentations** — Keep all your decks organized under one roof with shared configuration
- **Interactive Dashboard** — Browse, run, and manage presentations from a visual UI
- **Centralized Dependencies** — pnpm catalog ensures every presentation uses the same Slidev version
- **One-Command Exports** — Generate PDFs or build for deployment without switching directories
- **Built-in Migrations** — Stay up to date as Supaslidev evolves

## Quick Start

```bash
# Create a new workspace
pnpm create supaslidev

# Navigate to your workspace
cd my-workspace

# Open the interactive dashboard
pnpm dev

# Or create a presentation directly
pnpm new my-talk
```

## Documentation

For detailed guides, configuration options, and CLI reference, visit the [documentation](https://www.supasli.dev/).

## Contributing

Contributions are welcome! Check out [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
