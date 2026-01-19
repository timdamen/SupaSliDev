# Contributing to supaSliDev

Thank you for your interest in contributing to supaSliDev! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/supaSliDev.git
   cd supaSliDev
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Making Changes

1. Make your changes in the appropriate directory:
   - `packages/shared/` for shared components, styles, or themes
   - `scripts/` for CLI tools and build scripts
   - `presentations/` for example presentations

2. Test your changes by running a presentation:
   ```bash
   pnpm dev @supaslidev/example dev
   ```

3. Run quality checks before committing:
   ```bash
   pnpm lint
   ```

### Commit Messages

Use clear, descriptive commit messages. We follow conventional commits:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example: `feat: add dark theme to shared themes`

### Pull Requests

1. Push your branch to your fork
2. Open a pull request against the `main` branch
3. Fill out the pull request template
4. Wait for review and address any feedback

## Project Structure

- **packages/shared/**: Shared components, styles, themes, and utilities
- **presentations/**: Individual Slidev presentations
- **scripts/**: CLI tools and build scripts
- **scripts/templates/**: Templates for new presentations

## Adding Shared Components

1. Create your component in `packages/shared/components/`
2. Export it from `packages/shared/index.ts` if needed
3. Test it in an example presentation

## Adding Themes

1. Create a CSS file in `packages/shared/themes/`
2. Register it in `packages/shared/themes/index.ts`
3. Document usage in your PR

## Dependency Management with pnpm Catalog

This project uses pnpm's catalog feature to manage shared dependency versions across all presentations. The catalog is defined in `pnpm-workspace.yaml`:

```yaml
catalog:
  '@slidev/cli': ^52.11.3
  '@slidev/theme-default': latest
  '@slidev/theme-seriph': latest
  vue: ^3.5.26
  '@vue/compiler-sfc': ^3.5.27
```

### Using Catalog in Presentations

When creating or updating presentations, use `catalog:` as the version specifier for shared dependencies:

```json
{
  "dependencies": {
    "@slidev/cli": "catalog:",
    "@slidev/theme-default": "catalog:",
    "vue": "catalog:"
  }
}
```

### Updating Shared Versions

To update a dependency version across all presentations:

1. Edit the version in `pnpm-workspace.yaml` under the `catalog:` section
2. Run `pnpm install` to apply the changes

### Adding New Shared Dependencies

1. Add the dependency and version to `pnpm-workspace.yaml`
2. Reference it with `catalog:` in the presentation's `package.json`

## Code Style

- Use TypeScript for scripts and type definitions
- Follow existing code patterns
- Keep components simple and reusable

## Questions?

Open an issue for any questions about contributing.
