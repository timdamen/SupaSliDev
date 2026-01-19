# supaSliDev

A monorepo for managing multiple [Slidev](https://sli.dev) presentations with shared resources, components, and themes.

## Features

- **Monorepo Structure**: Manage multiple presentations in a single repository using pnpm workspaces
- **Shared Resources**: Reusable components, styles, and themes across all presentations
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
cd presentations
pnpm create slidev my-presentation
```

The wizard guides you through setup and new presentations automatically inherit version management from the workspace catalog.

### Run a Presentation

```bash
pnpm dev @supaslidev/<name> dev
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

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `cd presentations && pnpm create slidev <name>` | Create a new presentation |
| `pnpm dev @supaslidev/<name> dev` | Start dev server for a presentation |
| `pnpm dev:all` | Start dev servers for all presentations in parallel |
| `pnpm build @supaslidev/<name> build` | Build a single presentation |
| `pnpm build:all` | Build all presentations |
| `pnpm build:pdf <name>` | Export presentation to PDF |
| `pnpm prepare:deploy <name>` | Prepare presentation for deployment |

## Project Structure

```
supaSliDev/
├── packages/
│   └── shared/              # Shared resources package
│       ├── components/      # Reusable Vue components
│       ├── styles/          # Shared CSS styles
│       ├── themes/          # Custom Slidev themes
│       └── snippets/        # Code snippets for demos
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

## Using Shared Resources

Import shared components and styles in your presentations:

```vue
<script setup>
import Counter from '@supaslidev/shared/components/Counter.vue'
</script>
```

```css
@import '@supaslidev/shared/styles/index.css';
```

## License

[MIT](LICENSE)
