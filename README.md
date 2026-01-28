<p align="center">
  <img src="assets/ssl-logo.png" alt="Supaslidev Logo" width="150" />
</p>

<h1 align="center">Supaslidev</h1>

<p align="center">
  <strong>Manage all your Slidev presentations from one place.</strong>
</p>

## Why Supaslidev?

If you've ever juggled multiple [Slidev](https://sli.dev/) presentations, you know the pain: version drift between decks, repetitive setup for each new talk, and the hassle of navigating folder-to-folder just to export a few PDFs before a conference.

Supaslidev brings all your presentations into a single pnpm workspace with shared dependencies and an interactive dashboard. Update Slidev once, and every deck stays in sync.

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

For detailed guides, configuration options, and CLI reference, visit the [documentation](docs/).

## Contributing

Contributions are welcome! Check out [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
