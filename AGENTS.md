# Supaslidev - AI Agent Context

Monorepo toolkit for managing multiple [Slidev](https://sli.dev/) presentations with pnpm workspaces.

## Quick Reference

**Slidev Docs**: https://sli.dev/llms.txt (fetch for syntax/features)

## Structure

- `packages/cli/` - `create-supaslidev`: scaffolds new workspaces
- `packages/dashboard/` - `@supaslidev/dashboard`: manages presentations (UI + CLI)
- `playground/` - test workspace for local development

## Key Commands

```bash
pnpm dashboard                 # Interactive dashboard
pnpm dashboard create <name>   # New presentation
pnpm dashboard dev <name>      # Dev server
pnpm dashboard export <name>   # Export PDF
pnpm dashboard deploy <name>   # Build for deployment
pnpm test                      # Run tests
pnpm lint                      # Linting
pnpm typecheck                 # Type checking
```

## Architecture

- **pnpm Catalog**: Dependency versions in `pnpm-workspace.yaml`, referenced as `catalog:` in package.json
- **Workspace State**: `.supaslidev/state.json` tracks workspace version and migrations
- **Dashboard Server**: `packages/dashboard/server/api.js` manages Slidev dev server processes

## Entry Points

| Package   | CLI Entry          | UI Entry      |
| --------- | ------------------ | ------------- |
| cli       | `src/cli.ts`       | -             |
| dashboard | `src/cli/index.ts` | `src/App.vue` |

## Testing

- E2E tests in `packages/*/tests/e2e/`
- Run with `pnpm test`
- Playground used for integration testing
