<script setup lang="ts">
defineProps<{
  color?: string
}>()
</script>

<template>
  <div class="slidev-layout fact" :style="{ '--fact-color': $props.color }">
    <slot />
  </div>
</template>

<style scoped>
.fact {
  --fact-color: var(--slidev-theme-primary, #3b82f6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 3rem;
  text-align: center;
}

.fact :deep(h1),
.fact :deep(.fact-number) {
  font-size: 6rem;
  font-weight: 800;
  color: var(--fact-color);
  line-height: 1;
  margin: 0;
}

.fact :deep(p),
.fact :deep(.fact-label) {
  font-size: 1.5rem;
  margin-top: 1rem;
  opacity: 0.8;
}

.fact :deep(h2) {
  font-size: 2rem;
  font-weight: 600;
  margin-top: 0.5rem;
}
</style>
