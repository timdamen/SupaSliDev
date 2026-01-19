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
│       ├── layouts/      # Shared Slidev layouts
│       ├── snippets/     # Shared code snippets & utilities
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
layout: section
---

# Shared Layouts

Custom layouts from `@supaslidev/shared/layouts`

---
layout: two-cols-header
---

::header::

# Two Columns with Header

This layout provides a header area with two columns below.

::left::

**Left Column**

- First item
- Second item
- Third item

::right::

**Right Column**

- Feature A
- Feature B
- Feature C

---
layout: quote
author: "The supaslidev Team"
role: "Open Source Developers"
---

Shared layouts make it easy to maintain consistent slide designs across all your presentations.

---
layout: fact
---

# 6

Custom layouts available in `@supaslidev/shared/layouts`

---

# Using Shared Snippets

Import utilities from the shared package:

```ts
import { emptyArray, range, chunk } from '@supaslidev/shared'
import { formatNumber, formatCurrency } from '@supaslidev/shared/snippets'
import { delay, debounce } from '@supaslidev/shared/snippets/async'

const items = emptyArray<string>(5)
const numbers = range(1, 10)
const chunks = chunk([1, 2, 3, 4, 5, 6], 2)
const price = formatCurrency(1234.56)
```

Available snippets: `arrays`, `formatting`, `async`

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
