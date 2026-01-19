<script setup lang="ts">
defineProps<{
  background?: string
}>()
</script>

<template>
  <div class="slidev-layout cover">
    <div
      v-if="$props.background"
      class="cover-background"
      :style="{ backgroundImage: `url(${$props.background})` }"
    />
    <div class="cover-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  position: relative;
  text-align: center;
}

.cover-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.2;
  z-index: 0;
}

.cover-content {
  position: relative;
  z-index: 1;
  max-width: 80%;
}

.cover :deep(h1) {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.cover :deep(p) {
  font-size: 1.25rem;
  opacity: 0.8;
}
</style>
