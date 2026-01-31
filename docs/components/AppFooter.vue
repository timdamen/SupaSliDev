<script setup lang="ts">
const appConfig = useAppConfig();
</script>

<template>
  <UFooter>
    <template #left>
      <div class="text-sm text-muted">Copyright © {{ new Date().getFullYear() }}</div>
    </template>

    <template #right>
      <UButton
        v-if="appConfig.github?.url"
        icon="i-simple-icons-github"
        :to="appConfig.github.url"
        target="_blank"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
        size="sm"
      />
      <UColorModeButton size="sm" />
    </template>
  </UFooter>
</template>
