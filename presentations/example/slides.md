---
theme: seriph
background: https://cover.sli.dev
title: Example Presentation
info: |
  ## supaslidev Example

  This presentation demonstrates the monorepo structure with shared resources.
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
css: unocss
---

<style>
@import '@supaslidev/shared/themes/default.css';
@import '@supaslidev/shared/styles/index.css';
</style>

# Welcome to supaslidev

A monorepo for managing Slidev presentations

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space to continue <carbon:arrow-right class="inline"/>
  </span>
</div>

---

# Monorepo Structure

```
supaslidev/
├── packages/
│   └── shared/           # @supaslidev/shared
│       ├── components/   # Shared Vue components
│       ├── snippets/     # Shared code snippets
│       ├── styles/       # Shared CSS variables & utilities
│       └── themes/       # Shared theme presets
├── presentations/
│   ├── example/          # This presentation
│   ├── p-1/
│   ├── p-2/
│   └── p-3/
├── package.json          # Root workspace config
└── pnpm-workspace.yaml   # Workspace definition
```

---

# Using Shared Components

Import components from `@supaslidev/shared`:

```vue
<script setup>
import Counter from '@supaslidev/shared/components/Counter.vue'
</script>

<template>
  <Counter :count="10" />
</template>
```

<Counter :count="10" />

---

# Using Shared Utilities

Import utilities from the shared package:

```ts
import { emptyArray } from '@supaslidev/shared'

const items = emptyArray<string>(5)
// Creates: [undefined, undefined, undefined, undefined, undefined]
```

---

# Using Shared Themes & Styles

Import themes and styles in your presentation:

```html
<style>
@import '@supaslidev/shared/themes/default.css';
@import '@supaslidev/shared/styles/index.css';
</style>
```

Available themes: `default`, `corporate`, `vibrant`

<div class="flex gap-4 mt-8">
  <span class="supaslidev-badge">Primary</span>
  <span class="supaslidev-badge supaslidev-badge--secondary">Secondary</span>
  <span class="supaslidev-badge supaslidev-badge--accent">Accent</span>
</div>

<p class="supaslidev-gradient-text text-2xl mt-4 font-bold">Gradient Text Effect</p>

---
layout: center
class: text-center
---

# Get Started

```bash
# Install all dependencies
pnpm install

# Run this presentation
pnpm --filter @supaslidev/example dev

# Run all presentations
pnpm dev
```

[Documentation](https://sli.dev) · [GitHub](https://github.com)
