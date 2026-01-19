<script setup lang="ts">
import { QuoteLayout } from '@supaslidev/shared/layouts'
</script>

<template>
  <QuoteLayout v-bind="$attrs">
    <slot />
  </QuoteLayout>
</template>
