# Project Overview

Supaslidev is a monorepo for managing multiple [Slidev](https://sli.dev/) presentations with shared resources, components, and themes using pnpm workspaces.

## Official Documentation

Before making changes to presentation content or configuration, consult:

- **Slidev Website**: https://sli.dev/
- **LLM-optimized docs**: https://sli.dev/llms.txt

Fetch the llms.txt file for up-to-date Slidev syntax, features, and best practices.

## Commands

| Command                               | Description                                         |
| ------------------------------------- | --------------------------------------------------- |
| `pnpm install`                        | Install all dependencies                            |
| `pnpm dashboard create <name>`        | Create a new presentation                           |
| `pnpm dashboard dev <name>`           | Start dev server for a presentation                 |
| `pnpm dev:all`                        | Start dev servers for all presentations in parallel |
| `pnpm build @supaslidev/<name> build` | Build a single presentation                         |
| `pnpm build:all`                      | Build all presentations                             |
| `pnpm dashboard export <name>`        | Export presentation to PDF                          |
| `pnpm dashboard deploy <name>`        | Deploy presentation                                 |
| `pnpm lint`                           | Run linting                                         |
| `pnpm typecheck`                      | Run TypeScript type checking                        |
| `pnpm coderabbit:auth`                | Authenticate with CodeRabbit CLI                    |
| `pnpm coderabbit:review`              | AI code review for uncommitted changes              |
| `pnpm coderabbit:review:committed`    | AI code review for committed changes                |
| `pnpm coderabbit:review:full`         | Full AI code review                                 |

## CodeRabbit Setup

CodeRabbit provides AI-powered code reviews. Install the CLI globally:

```bash
npm i -g coderabbit
```

Then authenticate with `pnpm coderabbit:auth` before using the review commands.

## Workflow Guidelines

1. **New presentations**: Use `pnpm dashboard create` to scaffold with correct catalog dependencies
2. **Catalog dependencies**: Add new shared dependencies to `pnpm-workspace.yaml` catalog section
3. **Slides syntax**: Slidev uses Markdown with YAML frontmatter - see https://sli.dev/llms.txt for syntax

## File Locations

- CLI packages live in `packages/cli/` and `packages/dashboard/`
- Playground for local development in `playground/`

## Key Architecture Decisions

- **pnpm Catalog**: Dependency versions are centralized in `pnpm-workspace.yaml`. Use `catalog:` as version in presentation `package.json` files.
