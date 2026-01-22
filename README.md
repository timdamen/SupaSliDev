# supaSliDev

A monorepo for managing multiple [Slidev](https://sli.dev) presentations with shared resources, components, and themes.

## Features

- **Monorepo Structure**: Manage multiple presentations in a single repository using pnpm workspaces
- **Native Slidev CLI**: Use the official Slidev wizard with automatic version management via pnpm catalog
- **Independent Development**: Run and build presentations individually
- **Consistent Tooling**: Shared TypeScript configuration and development scripts

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/supaSliDev.git
cd supaSliDev

# Install dependencies
pnpm install
```

### Create a New Presentation

Use the native Slidev CLI wizard to create presentations:

```bash
pnpm create:presentation my-presentation
```

The wizard guides you through setup and new presentations automatically inherit version management from the workspace catalog.

### Run a Presentation

```bash
pnpm dev <name>
```

Or run all presentations simultaneously:

```bash
pnpm dev:all
```

### Build a Presentation

```bash
pnpm build @supaslidev/<name> build
```

Output is placed in `presentations/<name>/dist/`.

### Deploy a Presentation

```bash
pnpm prepare:deploy <presentation-name>
```

This creates a standalone deployment package in `deploy/<presentation-name>/` with:

- Built static files
- `vercel.json` for Vercel
- `netlify.toml` for Netlify

Then deploy with your preferred platform:

```bash
cd deploy/<presentation-name>
vercel              # Deploy to Vercel
netlify deploy      # Deploy to Netlify
```

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

## Commands Reference

| Command                               | Description                                         |
| ------------------------------------- | --------------------------------------------------- |
| `pnpm install`                        | Install all dependencies                            |
| `pnpm create:presentation <name>`     | Create a new presentation                           |
| `pnpm dev <name>`                     | Start dev server for a presentation                 |
| `pnpm dev:all`                        | Start dev servers for all presentations in parallel |
| `pnpm build @supaslidev/<name> build` | Build a single presentation                         |
| `pnpm build:all`                      | Build all presentations                             |
| `pnpm export:pdf <name>`              | Export presentation to PDF                          |
| `pnpm prepare:deploy <name>`          | Prepare presentation for deployment                 |

## Project Structure

```
supaSliDev/
├── presentations/           # Individual presentations
│   └── <name>/
│       ├── slides.md        # Presentation content
│       ├── components/      # Presentation-specific components
│       └── package.json
├── scripts/                 # Build and deployment scripts
├── dist/                    # Built presentations
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Dependency Management with pnpm Catalog

This project uses [pnpm catalog](https://pnpm.io/catalogs) for centralized dependency version management. The catalog is defined in `pnpm-workspace.yaml`:

```yaml
catalog:
  '@slidev/cli': ^52.11.3
  '@slidev/theme-default': latest
  '@slidev/theme-seriph': latest
  vue: ^3.5.26
```

### How It Works

Instead of specifying versions in each presentation's `package.json`, use `catalog:` as the version:

```json
{
  "dependencies": {
    "@slidev/cli": "catalog:",
    "vue": "catalog:"
  }
}
```

### Benefits

- **Single source of truth**: Update versions in one place (`pnpm-workspace.yaml`)
- **Automatic inheritance**: New presentations created with `pnpm create slidev` automatically use catalog versions
- **Consistency**: All presentations use the same dependency versions
- **Easy upgrades**: Bump versions across all presentations by editing the catalog

### Adding New Catalog Entries

To add a new shared dependency:

1. Add the package and version to `pnpm-workspace.yaml`:

   ```yaml
   catalog:
     'new-package': ^1.0.0
   ```

2. Reference it in presentation `package.json` files:

   ```json
   {
     "dependencies": {
       "new-package": "catalog:"
     }
   }
   ```

3. Run `pnpm install` to update lockfile

## License

[MIT](LICENSE)
