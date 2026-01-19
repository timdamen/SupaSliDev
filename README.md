# supaSliDev

A monorepo for managing multiple [Slidev](https://sli.dev) presentations with shared resources, components, and themes.

## Features

- **Monorepo Structure**: Manage multiple presentations in a single repository using pnpm workspaces
- **Shared Resources**: Reusable components, styles, and themes across all presentations
- **Easy Presentation Creation**: CLI command to scaffold new presentations from templates
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

```bash
pnpm create:presentation my-presentation
```

You can specify a template:

```bash
pnpm create:presentation my-presentation --template=blank
pnpm create:presentation my-presentation --template=default
```

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
pnpm build <presentation-name>
```

Output is placed in `dist/<presentation-name>/`.

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
| `pnpm create:presentation <name>` | Create a new presentation |
| `pnpm dev @supaslidev/<name> dev` | Start dev server for a presentation |
| `pnpm dev:all` | Start dev servers for all presentations in parallel |
| `pnpm build <name>` | Build a single presentation |
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
├── scripts/
│   ├── build.mjs            # Build script
│   ├── create-presentation.mjs
│   └── templates/           # Presentation templates
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

## Available Templates

- **blank**: Minimal presentation with a single slide
- **default**: Sample presentation demonstrating Slidev features

## License

[MIT](LICENSE)
