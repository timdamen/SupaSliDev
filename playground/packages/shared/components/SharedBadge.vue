<script setup lang="ts">
defineProps<{
  text?: string;
}>();
</script>

<template>
  <span class="shared-badge">{{ text ?? 'Shared' }}</span>
</template>

<style scoped>
.shared-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 9999px;
}
</style>
