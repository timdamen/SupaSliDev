<script setup lang="ts">
import { ImageLeftLayout } from '@supaslidev/shared/layouts'
</script>

<template>
  <ImageLeftLayout v-bind="$attrs">
    <slot />
  </ImageLeftLayout>
</template>
