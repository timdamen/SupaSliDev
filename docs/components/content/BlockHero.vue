<script setup lang="ts">
defineProps<{
  cta?: [string, string];
  secondary?: [string, string];
}>();
</script>

<template>
  <div class="py-24 sm:py-32 text-center">
    <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
      <slot name="title" />
    </h1>
    <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
      <slot name="description" />
    </p>
    <div class="mt-10 flex items-center justify-center gap-x-6">
      <UButton v-if="cta" :to="cta[1]" size="lg">
        {{ cta[0] }}
      </UButton>
      <UButton v-if="secondary" :to="secondary[1]" variant="ghost" size="lg">
        {{ secondary[0] }}
      </UButton>
    </div>
  </div>
</template>
