<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';
import AppHeader from './components/AppHeader.vue';
import PresentationCard from './components/PresentationCard.vue';
import CreatePresentationDialog from './components/CreatePresentationDialog.vue';
import EmptyState from './components/EmptyState.vue';
import type { Presentation } from './types';
import presentationsData from './data/presentations.json';
import { useServers } from './composables/useServers';
import { useToast } from '@nuxt/ui/composables';

const { startPolling, stopPolling, stopAllServers, startServer } = useServers();
const toast = useToast();

function handleExportError(message: string) {
  toast.add({
    title: 'Export Failed',
    description: message,
    color: 'error',
    icon: 'i-lucide-alert-circle',
  });
}

const isDialogOpen = ref(false);
const isCommandPaletteOpen = ref(false);

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    isCommandPaletteOpen.value = !isCommandPaletteOpen.value;
  }
}

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
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  stopPolling();
  stopAllServers();
  window.removeEventListener('beforeunload', handleBeforeUnload);
  window.removeEventListener('keydown', handleKeydown);
});

const presentations = ref<Presentation[]>(presentationsData);
const searchQuery = ref('');

async function handlePresentCommand(presentation: Presentation) {
  isCommandPaletteOpen.value = false;
  const result = await startServer(presentation.id);
  if (result.success && result.port) {
    setTimeout(() => {
      window.open(`http://localhost:${result.port}`, '_blank');
    }, 1500);
  }
}

const commandPaletteGroups = computed<CommandPaletteGroup[]>(() => [
  {
    id: 'presentations',
    label: 'Presentations',
    items: presentations.value.map(
      (p): CommandPaletteItem => ({
        label: p.title,
        suffix: p.description,
        icon: 'i-lucide-presentation',
        onSelect: () => handlePresentCommand(p),
      }),
    ),
  },
]);

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
        <AppHeader @open-command-palette="isCommandPaletteOpen = true" />

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

          <TransitionGroup
            v-if="filteredPresentations.length > 0"
            name="card"
            tag="div"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <PresentationCard
              v-for="presentation in filteredPresentations"
              :key="presentation.id"
              :presentation="presentation"
              @export-error="handleExportError"
            />
          </TransitionGroup>

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

        <UModal v-model:open="isCommandPaletteOpen">
          <template #body>
            <UCommandPalette
              :groups="commandPaletteGroups"
              placeholder="Search presentations..."
              class="h-80"
            />
          </template>
        </UModal>
      </UContainer>
    </div>
  </UApp>
</template>
