<script setup lang="ts">
defineProps<{
  type?: 'success' | 'warning' | 'info' | 'danger';
}>();
</script>

<template>
  <ul
    class="my-4 list-none pl-0"
    :class="{
      'marker-success': type === 'success',
      'marker-warning': type === 'warning',
      'marker-info': type === 'info',
      'marker-danger': type === 'danger',
    }"
  >
    <slot />
  </ul>
</template>

<style scoped>
ul :deep(li) {
  position: relative;
  padding-left: 1.75rem;
  margin-bottom: 0.5rem;
}

ul :deep(li)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: currentColor;
}

.marker-success :deep(li)::before {
  background-color: rgb(34 197 94);
}

.marker-warning :deep(li)::before {
  background-color: rgb(234 179 8);
}

.marker-info :deep(li)::before {
  background-color: rgb(59 130 246);
}

.marker-danger :deep(li)::before {
  background-color: rgb(239 68 68);
}
</style>
