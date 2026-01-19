<script setup lang="ts">
import { CoverLayout } from '@supaslidev/shared/layouts'
</script>

<template>
  <CoverLayout v-bind="$attrs">
    <slot />
  </CoverLayout>
</template>
