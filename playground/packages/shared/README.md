# @supaslidev/shared

A local Slidev addon for sharing components, layouts, and styles across all presentations in your workspace.

## How It Works

This package follows the [Slidev addon pattern](https://sli.dev/guide/write-addon). Slidev automatically discovers and imports resources from the following directories:

- **components/** - Vue components available in all slides
- **layouts/** - Custom slide layouts
- **styles/** - Shared CSS/SCSS styles

## Using This Addon

Add the addon to your presentation's frontmatter:

```yaml
---
addons:
  - "@supaslidev/shared"
---
```

## Example: Using SharedBadge

The `SharedBadge` component is available globally once the addon is configured:

```md
---
addons:
  - "@supaslidev/shared"
---

# My Slide

<SharedBadge text="New" />
```

## Directory Structure

```
shared/
├── components/       # Vue components (auto-imported)
│   └── SharedBadge.vue
├── layouts/          # Custom layouts
├── styles/           # Shared styles
├── package.json
└── README.md
```

## Adding New Components

Create a `.vue` file in `components/`:

```vue
<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <div class="my-component">{{ label }}</div>
</template>
```

The component is immediately available in all presentations using this addon.
