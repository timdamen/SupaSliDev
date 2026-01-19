# Deploying Presentations

This guide covers deploying individual Slidev presentations to popular hosting platforms.

## Quick Start

1. Prepare your presentation for deployment:
   ```bash
   pnpm prepare:deploy <presentation-name>
   ```

2. Deploy using your preferred platform (see sections below).

## Prepare for Deployment

The `prepare:deploy` command creates a standalone, deployable package:

```bash
pnpm prepare:deploy my-presentation
```

This creates `deploy/my-presentation/` containing:
- Built static files (HTML, CSS, JS)
- `vercel.json` for Vercel deployment
- `netlify.toml` for Netlify deployment
- `package.json` with build scripts

The output is self-contained and ready to deploy.

## Vercel Deployment

### Option 1: Deploy via CLI

```bash
# Install Vercel CLI globally (once)
npm i -g vercel

# Prepare and deploy
pnpm prepare:deploy my-presentation
cd deploy/my-presentation
vercel
```

Follow the prompts to link your Vercel account and deploy.

### Option 2: Deploy via Git

1. Prepare your presentation:
   ```bash
   pnpm prepare:deploy my-presentation
   ```

2. Push `deploy/my-presentation/` to a Git repository

3. Import the repository in [Vercel Dashboard](https://vercel.com/new)

4. Vercel auto-detects settings from `vercel.json`

### Option 3: Deploy from Presentation Directory

If you prefer deploying directly from the monorepo:

1. Navigate to your presentation:
   ```bash
   cd presentations/my-presentation
   ```

2. Ensure `vercel.json` exists (created automatically with new presentations)

3. Deploy:
   ```bash
   vercel
   ```

### Vercel Configuration

The `vercel.json` configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

| Setting | Description |
|---------|-------------|
| `buildCommand` | Runs `slidev build` via npm |
| `outputDirectory` | Slidev outputs to `dist/` |
| `rewrites` | SPA routing - all paths serve `index.html` |

## Netlify Deployment

### Option 1: Deploy via CLI

```bash
# Install Netlify CLI globally (once)
npm i -g netlify-cli

# Prepare and deploy
pnpm prepare:deploy my-presentation
cd deploy/my-presentation
netlify deploy --prod
```

### Option 2: Deploy via Git

1. Prepare your presentation:
   ```bash
   pnpm prepare:deploy my-presentation
   ```

2. Push `deploy/my-presentation/` to a Git repository

3. Import in [Netlify Dashboard](https://app.netlify.com/start)

4. Netlify auto-detects settings from `netlify.toml`

### Option 3: Drag and Drop

1. Build your presentation:
   ```bash
   pnpm build @supaslidev/my-presentation build
   ```

2. Drag the `presentations/my-presentation/dist/` folder to [Netlify Drop](https://app.netlify.com/drop)

### Netlify Configuration

The `netlify.toml` configuration:

```toml
[build]
publish = "dist"
command = "npm run build"

[build.environment]
NODE_VERSION = "20"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

| Setting | Description |
|---------|-------------|
| `publish` | Directory containing built files |
| `command` | Build command to run |
| `NODE_VERSION` | Node.js version for build |
| `redirects` | SPA routing configuration |

## Configuration Templates

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### netlify.toml

```toml
[build]
publish = "dist"
command = "npm run build"

[build.environment]
NODE_VERSION = "20"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

## Environment Variables

If your presentation uses environment variables, configure them in your platform:

**Vercel:**
- Dashboard: Project Settings > Environment Variables
- CLI: `vercel env add`

**Netlify:**
- Dashboard: Site Settings > Build & Deploy > Environment
- CLI: `netlify env:set KEY value`

## Custom Domains

Both platforms support custom domains:

**Vercel:**
1. Go to Project Settings > Domains
2. Add your domain
3. Configure DNS as instructed

**Netlify:**
1. Go to Site Settings > Domain Management
2. Add custom domain
3. Configure DNS as instructed

## Troubleshooting

### Build Fails with Module Not Found

The standalone deploy package includes all necessary dependencies. If building from the monorepo presentation directory fails:

```bash
# Ensure dependencies are installed
pnpm install

# Try the prepare:deploy approach instead
pnpm prepare:deploy my-presentation
```

### 404 on Page Refresh

Ensure SPA rewrites are configured. Both `vercel.json` and `netlify.toml` templates include this by default.

### Assets Not Loading

Check that `outputDirectory` (Vercel) or `publish` (Netlify) points to `dist`.

## Alternative Platforms

The built presentation is static HTML and works on any static hosting:

- **GitHub Pages**: Push `dist/` contents to `gh-pages` branch
- **Cloudflare Pages**: Similar to Netlify, auto-detects from config
- **AWS S3 + CloudFront**: Upload `dist/` to S3, configure CloudFront for SPA routing
- **Firebase Hosting**: Use `firebase deploy` with appropriate config

For these platforms, build locally first:

```bash
pnpm build @supaslidev/my-presentation build
# Output is in presentations/my-presentation/dist/
```
