<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useColorMode } from '#imports';
import PresentationCard from './components/PresentationCard.vue';
import CreatePresentationDialog from './components/CreatePresentationDialog.vue';
import type { Presentation } from './types';
import presentationsData from './data/presentations.json';
import { useServers } from './composables/useServers';

const { startPolling, stopPolling, stopAllServers } = useServers();

const colorMode = useColorMode();
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light';
  },
});

const isDialogOpen = ref(false);

function handlePresentationCreated(presentation: Presentation) {
  presentations.value = [...presentations.value, presentation].sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

function handleBeforeUnload() {
  navigator.sendBeacon('/api/servers/stop-all');
}

onMounted(() => {
  startPolling();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  stopPolling();
  stopAllServers();
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

const presentations = ref<Presentation[]>(presentationsData);
const searchQuery = ref('');

const filteredPresentations = computed(() => {
  if (!searchQuery.value.trim()) {
    return presentations.value;
  }
  const query = searchQuery.value.toLowerCase();
  return presentations.value.filter((p) => p.title.toLowerCase().includes(query));
});
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default">
      <div class="max-w-7xl mx-auto p-8">
        <header class="mb-12">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h1
                class="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              >
                Supaslidev
              </h1>
              <p class="text-muted text-lg">Your presentations dashboard</p>
            </div>
            <div class="flex items-center gap-3">
              <UButton
                :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
                color="neutral"
                variant="ghost"
                size="lg"
                @click="isDark = !isDark"
              />
              <UButton icon="i-lucide-plus" @click="isDialogOpen = true">New Presentation</UButton>
            </div>
          </div>
        </header>

        <div class="mb-8 flex justify-center">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search presentations by title..."
            class="max-w-md w-full"
            size="lg"
          />
        </div>

        <div
          v-if="filteredPresentations.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <PresentationCard
            v-for="presentation in filteredPresentations"
            :key="presentation.id"
            :presentation="presentation"
          />
        </div>

        <div v-else class="text-center py-16 text-muted">
          <h3 class="text-xl mb-2 text-default">No presentations found</h3>
          <p>Try adjusting your search query</p>
        </div>

        <CreatePresentationDialog
          :open="isDialogOpen"
          @close="isDialogOpen = false"
          @created="handlePresentationCreated"
        />
      </div>
    </div>
  </UApp>
</template>
