<script setup lang="ts">
import { TwoColsHeaderLayout } from '@supaslidev/shared/layouts'
</script>

<template>
  <TwoColsHeaderLayout>
    <template #header>
      <slot name="header" />
    </template>
    <template #left>
      <slot name="left" />
    </template>
    <template #right>
      <slot name="right" />
    </template>
  </TwoColsHeaderLayout>
</template>
