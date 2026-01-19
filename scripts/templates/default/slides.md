---
theme: seriph
background: https://cover.sli.dev
title: {{name}}
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

# {{name}}

A Slidev presentation in the supaslidev monorepo

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space to continue <carbon:arrow-right class="inline"/>
  </span>
</div>

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
```

---

# Code Highlighting

Slidev supports code blocks with syntax highlighting:

```ts {all|1|3-4|all}
const greeting = 'Hello, Slidev!'

function sayHello() {
  console.log(greeting)
}
```

---
layout: center
class: text-center
---

# Start Creating!

Edit `slides.md` to add your content

[Slidev Documentation](https://sli.dev) · [supaslidev Shared Package](../packages/shared)
