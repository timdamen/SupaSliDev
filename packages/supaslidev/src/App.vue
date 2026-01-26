<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useColorMode } from '#imports';
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui';
import AppHeader from './components/AppHeader.vue';
import PresentationCard from './components/PresentationCard.vue';
import CreatePresentationDialog from './components/CreatePresentationDialog.vue';
import ImportPresentationDialog from './components/ImportPresentationDialog.vue';
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
const isImportDialogOpen = ref(false);
const isCommandPaletteOpen = ref(false);
const initialSearchQuery = ref('');
const appHeaderRef = ref<InstanceType<typeof AppHeader> | null>(null);

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    isCommandPaletteOpen.value = !isCommandPaletteOpen.value;
    return;
  }

  if (isCommandPaletteOpen.value || isDialogOpen.value || isImportDialogOpen.value) {
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

function handlePresentationImported(imported: Presentation[]) {
  presentations.value = [...presentations.value, ...imported].sort((a, b) =>
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

function handleImportCommand() {
  isCommandPaletteOpen.value = false;
  isImportDialogOpen.value = true;
}

function handleToggleThemeCommand() {
  isCommandPaletteOpen.value = false;
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}

function findPresentationByName(name: string): Presentation | undefined {
  const normalizedName = name.toLowerCase().trim();
  return presentations.value.find(
    (p) => p.id.toLowerCase() === normalizedName || p.title.toLowerCase() === normalizedName,
  );
}

function handleExecuteCommand(command: string) {
  const parts = command.trim().split(/\s+/);
  const action = parts[0]?.toLowerCase();
  const arg = parts.slice(1).join(' ');

  if (action === 'new') {
    handleCreateCommand();
    return;
  }

  if (action === 'import') {
    handleImportCommand();
    return;
  }

  if (action === 'present') {
    if (!arg) {
      toast.add({
        title: 'Missing argument',
        description: 'Usage: present <presentation-name>',
        color: 'warning',
        icon: 'i-lucide-alert-triangle',
      });
      return;
    }
    const presentation = findPresentationByName(arg);
    if (!presentation) {
      toast.add({
        title: 'Presentation not found',
        description: `No presentation found with name "${arg}"`,
        color: 'warning',
        icon: 'i-lucide-alert-triangle',
      });
      return;
    }
    handlePresentCommand(presentation);
    return;
  }

  if (action === 'export') {
    if (!arg) {
      toast.add({
        title: 'Missing argument',
        description: 'Usage: export <presentation-name>',
        color: 'warning',
        icon: 'i-lucide-alert-triangle',
      });
      return;
    }
    const presentation = findPresentationByName(arg);
    if (!presentation) {
      toast.add({
        title: 'Presentation not found',
        description: `No presentation found with name "${arg}"`,
        color: 'warning',
        icon: 'i-lucide-alert-triangle',
      });
      return;
    }
    handleExportCommand(presentation);
    return;
  }

  toast.add({
    title: 'Unknown command',
    description: `"${action}" is not a recognized command. Try: new, import, present, export`,
    color: 'warning',
    icon: 'i-lucide-alert-triangle',
  });
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
        label: 'Import',
        suffix: 'Import an existing presentation',
        icon: 'i-lucide-import',
        onSelect: handleImportCommand,
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
  const options: { label: string; description?: string; onSelect: () => void }[] = [
    { label: 'New', description: 'Create a new presentation', onSelect: handleCreateCommand },
    {
      label: 'Import',
      description: 'Import an existing presentation',
      onSelect: handleImportCommand,
    },
    {
      label: 'Toggle theme',
      description: colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      onSelect: handleToggleThemeCommand,
    },
  ];

  presentations.value.forEach((p) => {
    options.push({
      label: `Present > ${p.title}`,
      description: 'Start dev server and open in browser',
      onSelect: () => handlePresentCommand(p),
    });
    options.push({
      label: `Export > ${p.title}`,
      description: 'Export to PDF',
      onSelect: () => handleExportCommand(p),
    });
  });

  return options;
});
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default flex flex-col">
      <UContainer class="py-6 sm:py-8 lg:py-10 flex-1">
        <AppHeader
          ref="appHeaderRef"
          :commands="commandOptions"
          @open-command-palette="isCommandPaletteOpen = true"
          @execute-command="handleExecuteCommand"
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

        <ImportPresentationDialog
          :open="isImportDialogOpen"
          @close="isImportDialogOpen = false"
          @imported="handlePresentationImported"
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

      <footer class="footer">
        <p class="footer-text">
          Built on
          <a href="https://sli.dev" target="_blank" rel="noopener" class="footer-link">Sli.dev</a>
          by
          <a href="https://github.com/antfu" target="_blank" rel="noopener" class="footer-link"
            >Anthony Fu</a
          >, Created with ❤️ by
          <a href="https://github.com/timdamen" target="_blank" rel="noopener" class="footer-link"
            >Tim Damen</a
          >
          in 🇳🇱
        </p>
      </footer>
    </div>
  </UApp>
</template>

<style scoped>
.footer {
  margin-top: auto;
  padding: 2rem 0;
  text-align: center;
}

.footer-text {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.footer-link {
  color: var(--ui-primary);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>
