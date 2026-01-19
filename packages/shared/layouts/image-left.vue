<script setup lang="ts">
defineProps<{
  image: string
  imageClass?: string
}>()
</script>

<template>
  <div class="slidev-layout image-left">
    <div class="image-container">
      <img :src="$props.image" :class="$props.imageClass" alt="" />
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.image-left {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--slidev-theme-surface, #f8fafc);
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem 3rem;
  overflow: auto;
}

.content :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
</style>
