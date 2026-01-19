<script setup lang="ts">
import { FactLayout } from '@supaslidev/shared/layouts'
</script>

<template>
  <FactLayout v-bind="$attrs">
    <slot />
  </FactLayout>
</template>
