<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Presentation } from '../types';
import { useServers } from '../composables/useServers';

const props = defineProps<{
  presentation: Presentation;
}>();

const { isRunning, getPort, startServer, stopServer } = useServers();

const loading = ref(false);

const running = computed(() => isRunning(props.presentation.id));
const port = computed(() => getPort(props.presentation.id));

async function handlePresent(event: Event) {
  event.preventDefault();
  event.stopPropagation();

  if (loading.value) return;

  loading.value = true;
  try {
    if (running.value) {
      await stopServer(props.presentation.id);
    } else {
      const result = await startServer(props.presentation.id);
      if (result.success && result.port) {
        setTimeout(() => {
          window.open(`http://localhost:${result.port}`, '_blank');
        }, 1500);
      }
    }
  } finally {
    loading.value = false;
  }
}

function handleCardClick(event: Event) {
  if (running.value && port.value) {
    event.preventDefault();
    window.open(`http://localhost:${port.value}`, '_blank');
  }
}
</script>

<template>
  <UCard
    as="a"
    :href="running && port ? `http://localhost:${port}` : '#'"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Open ${presentation.title}`"
    class="group hover:-translate-y-1 transition-transform duration-200"
    @click="handleCardClick"
  >
    <template #header>
      <div
        class="h-44 -mx-4 -mt-4 bg-cover bg-center bg-elevated relative"
        :style="{
          backgroundImage: presentation.background ? `url(${presentation.background})` : undefined,
        }"
      >
        <div
          class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"
        />
        <div
          v-if="running"
          class="absolute top-3 right-3 w-3 h-3 bg-success rounded-full shadow-[0_0_8px_theme(colors.green.500)] animate-pulse z-10"
          title="Server running"
        />
      </div>
    </template>

    <h3 class="text-lg font-semibold mb-2">{{ presentation.title }}</h3>
    <p v-if="presentation.description" class="text-muted text-sm mb-4 line-clamp-2">
      {{ presentation.description }}
    </p>

    <div class="flex gap-2 flex-wrap items-center">
      <UBadge color="secondary" variant="subtle">{{ presentation.theme }}</UBadge>
      <UBadge v-if="presentation.duration" color="success" variant="subtle">
        {{ presentation.duration }}
      </UBadge>
    </div>

    <UButton
      class="mt-4 w-full"
      :color="running ? 'error' : 'primary'"
      :loading="loading"
      :disabled="loading"
      @click="handlePresent"
    >
      {{ running ? 'Stop' : 'Present' }}
    </UButton>
  </UCard>
</template>
