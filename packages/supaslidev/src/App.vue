<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AppHeader from './components/AppHeader.vue';
import PresentationCard from './components/PresentationCard.vue';
import CreatePresentationDialog from './components/CreatePresentationDialog.vue';
import EmptyState from './components/EmptyState.vue';
import type { Presentation } from './types';
import presentationsData from './data/presentations.json';
import { useServers } from './composables/useServers';

const { startPolling, stopPolling, stopAllServers } = useServers();

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
      <UContainer class="py-6 sm:py-8 lg:py-10">
        <AppHeader />

        <template v-if="presentations.length === 0">
          <EmptyState
            icon="i-lucide-presentation"
            title="No presentations yet"
            description="Create your first presentation to get started with supaslidev."
          >
            <UButton class="font-mono" @click="isDialogOpen = true">
              <template #leading>
                <span class="opacity-70">$</span>
              </template>
              create presentation
            </UButton>
          </EmptyState>
        </template>

        <template v-else>
          <div class="flex items-center justify-between mb-6">
            <p class="text-muted font-mono text-sm">
              {{ filteredPresentations.length }} presentation{{
                filteredPresentations.length !== 1 ? 's' : ''
              }}
            </p>
            <UButton class="btn-new font-mono" @click="isDialogOpen = true">
              <template #leading>
                <span class="opacity-70">$</span>
              </template>
              new
            </UButton>
          </div>

          <div class="mb-6 flex justify-center">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Search presentations by title..."
              class="filter-input max-w-md w-full"
              size="lg"
            />
          </div>

          <div
            v-if="filteredPresentations.length > 0"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <PresentationCard
              v-for="presentation in filteredPresentations"
              :key="presentation.id"
              :presentation="presentation"
            />
          </div>

          <EmptyState
            v-else
            icon="i-lucide-search-x"
            title="No presentations found"
            description="Try adjusting your search query."
          >
            <UButton variant="soft" class="font-mono" @click="searchQuery = ''">
              <template #leading>
                <span class="opacity-70">$</span>
              </template>
              clear search
            </UButton>
          </EmptyState>
        </template>

        <CreatePresentationDialog
          :open="isDialogOpen"
          @close="isDialogOpen = false"
          @created="handlePresentationCreated"
        />
      </UContainer>
    </div>
  </UApp>
</template>
