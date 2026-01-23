<script setup lang="ts"></script>

<template>
  <div class="py-12">
    <h2
      v-if="$slots.title"
      class="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white"
    >
      <slot name="title" />
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <slot />
    </div>
  </div>
</template>
