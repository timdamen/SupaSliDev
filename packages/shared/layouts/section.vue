<template>
  <div class="slidev-layout section">
    <slot />
  </div>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.section :deep(h1) {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--slidev-theme-primary, #3b82f6), var(--slidev-theme-secondary, #8b5cf6));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.section :deep(p) {
  font-size: 1.5rem;
  opacity: 0.7;
  margin-top: 1rem;
}
</style>
