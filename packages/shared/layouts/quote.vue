<script setup lang="ts">
defineProps<{
  author?: string
  role?: string
}>()
</script>

<template>
  <div class="slidev-layout quote">
    <blockquote>
      <slot />
    </blockquote>
    <div v-if="$props.author" class="attribution">
      <span class="author">{{ $props.author }}</span>
      <span v-if="$props.role" class="role">{{ $props.role }}</span>
    </div>
  </div>
</template>

<style scoped>
.quote {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 3rem;
  text-align: center;
}

blockquote {
  font-size: 2rem;
  font-style: italic;
  line-height: 1.6;
  max-width: 800px;
  margin: 0;
  position: relative;
  color: var(--slidev-theme-text, #1e293b);
}

blockquote::before {
  content: '"';
  font-size: 6rem;
  position: absolute;
  top: -2rem;
  left: -2rem;
  color: var(--slidev-theme-primary, #3b82f6);
  opacity: 0.3;
  font-family: Georgia, serif;
  line-height: 1;
}

.attribution {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author {
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--slidev-theme-primary, #3b82f6);
}

.role {
  font-size: 1rem;
  opacity: 0.7;
}
</style>
