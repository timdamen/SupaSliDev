<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useColorMode } from '#imports';
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';
import AppHeader from './components/AppHeader.vue';
import PresentationCard from './components/PresentationCard.vue';
import CreatePresentationDialog from './components/CreatePresentationDialog.vue';
import EmptyState from './components/EmptyState.vue';
import type { Presentation } from './types';
import presentationsData from './data/presentations.json';
import { useServers } from './composables/useServers';
import { useToast } from '@nuxt/ui/composables';

const { startPolling, stopPolling, stopAllServers, startServer, exportPresentation } = useServers();
const toast = useToast();
const colorMode = useColorMode();

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
const initialSearchQuery = ref('');
const appHeaderRef = ref<InstanceType<typeof AppHeader> | null>(null);

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    isCommandPaletteOpen.value = !isCommandPaletteOpen.value;
    return;
  }

  if (isCommandPaletteOpen.value || isDialogOpen.value) {
    return;
  }

  const activeElement = document.activeElement;
  const isInputFocused =
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement?.getAttribute('contenteditable') === 'true';

  if (isInputFocused) {
    return;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const isTypingKey = event.key.length === 1 && !event.repeat;

  if (isTypingKey) {
    event.preventDefault();
    if (appHeaderRef.value?.inputRef) {
      appHeaderRef.value.inputRef.value = event.key;
      appHeaderRef.value.inputRef.dispatchEvent(new Event('input', { bubbles: true }));
      appHeaderRef.value.focusInput();
    }
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

async function handleExportCommand(presentation: Presentation) {
  isCommandPaletteOpen.value = false;
  const result = await exportPresentation(presentation.id);
  if (result.success && result.pdfPath) {
    window.open(result.pdfPath, '_blank');
  } else if (result.error) {
    handleExportError(result.error);
  }
}

function handleCreateCommand() {
  isCommandPaletteOpen.value = false;
  isDialogOpen.value = true;
}

function handleToggleThemeCommand() {
  isCommandPaletteOpen.value = false;
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}

const commandPaletteGroups = computed<CommandPaletteGroup[]>(() => [
  {
    id: 'actions',
    label: 'Actions',
    items: [
      {
        label: 'New',
        suffix: 'Create a new presentation',
        icon: 'i-lucide-plus',
        onSelect: handleCreateCommand,
      },
      {
        label: 'Toggle theme',
        suffix: colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
        onSelect: handleToggleThemeCommand,
      },
    ],
  },
  {
    id: 'presentations',
    label: 'Present',
    items: presentations.value.map(
      (p): CommandPaletteItem => ({
        label: `Present > ${p.title}`,
        suffix: 'Start dev server and open in browser',
        icon: 'i-lucide-play',
        onSelect: () => handlePresentCommand(p),
      }),
    ),
  },
  {
    id: 'export',
    label: 'Export',
    items: presentations.value.map(
      (p): CommandPaletteItem => ({
        label: `Export > ${p.title}`,
        suffix: 'Export to PDF',
        icon: 'i-lucide-download',
        onSelect: () => handleExportCommand(p),
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

const commandOptions = computed(() => {
  const options: { label: string; onSelect: () => void }[] = [
    { label: 'New', onSelect: handleCreateCommand },
    { label: 'Toggle theme', onSelect: handleToggleThemeCommand },
  ];

  presentations.value.forEach((p) => {
    options.push({
      label: `Present > ${p.title}`,
      onSelect: () => handlePresentCommand(p),
    });
    options.push({
      label: `Export > ${p.title}`,
      onSelect: () => handleExportCommand(p),
    });
  });

  return options;
});
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default">
      <UContainer class="py-6 sm:py-8 lg:py-10">
        <AppHeader
          ref="appHeaderRef"
          :commands="commandOptions"
          @open-command-palette="isCommandPaletteOpen = true"
        />

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

        <UModal v-model:open="isCommandPaletteOpen" @after-leave="initialSearchQuery = ''">
          <template #body>
            <UCommandPalette
              v-model:search-term="initialSearchQuery"
              :groups="commandPaletteGroups"
              :fuse="{
                fuseOptions: {
                  threshold: 0.4,
                  keys: ['label', 'suffix'],
                  ignoreLocation: true,
                },
                matchAllWhenSearchEmpty: true,
              }"
              placeholder="Search commands..."
              class="h-80"
            />
          </template>
        </UModal>
      </UContainer>
    </div>
  </UApp>
</template>
