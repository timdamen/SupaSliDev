<script setup lang="ts">
defineProps<{
  icon?: string;
}>();
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon v-if="icon" :name="icon" class="w-6 h-6 text-primary" />
        <h3 class="font-semibold text-gray-900 dark:text-white">
          <slot name="title" />
        </h3>
      </div>
    </template>
    <p class="text-gray-600 dark:text-gray-300">
      <slot name="description" />
    </p>
  </UCard>
</template>
