<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Presentation } from '../types';
import { useServers } from '../composables/useServers';

const props = defineProps<{
  presentation: Presentation;
}>();

const { isRunning, getPort, startServer, stopServer, exportPresentation } = useServers();

const emit = defineEmits<{
  exportError: [message: string];
}>();

const loading = ref({
  dev: false,
  export: false,
});

const running = computed(() => isRunning(props.presentation.id));
const port = computed(() => getPort(props.presentation.id));

async function handleDev(event: Event) {
  event.preventDefault();
  event.stopPropagation();

  if (loading.value.dev) return;

  loading.value.dev = true;
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
    loading.value.dev = false;
  }
}

async function handleExport(event: Event) {
  event.preventDefault();
  event.stopPropagation();

  if (loading.value.export) return;

  loading.value.export = true;
  try {
    const result = await exportPresentation(props.presentation.id);
    if (result.success && result.pdfPath) {
      window.open(result.pdfPath, '_blank');
    } else {
      emit('exportError', result.error || 'Export failed');
    }
  } catch {
    emit('exportError', 'Failed to export presentation');
  } finally {
    loading.value.export = false;
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
    :as="running && port ? 'a' : 'div'"
    :href="running && port ? `http://localhost:${port}` : undefined"
    :target="running && port ? '_blank' : undefined"
    :rel="running && port ? 'noopener noreferrer' : undefined"
    :title="running && port ? `Open ${presentation.title}` : undefined"
    class="card terminal-card group transition-all duration-300"
    :class="{ 'terminal-card--running': running, 'cursor-default': !running }"
    :ui="{
      root: 'overflow-hidden',
      header: 'p-0 sm:px-0 bg-[var(--ui-bg-elevated)]',
      body: 'p-0 sm:p-0',
    }"
    @click="handleCardClick"
  >
    <template #header>
      <div class="terminal-header flex items-center px-4 py-3 gap-1.5 border-b border-default">
        <UIcon name="i-lucide-folder" class="chevron-icon" />
        <span class="font-mono text-xs text-muted opacity-70">~/{{ presentation.id }}</span>
        <div class="flex-1" />
        <UBadge
          v-if="running"
          color="success"
          variant="subtle"
          size="xs"
          class="terminal-badge terminal-badge--live font-mono uppercase tracking-wider"
        >
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
          live
        </UBadge>
        <UBadge
          v-else
          color="neutral"
          variant="subtle"
          size="xs"
          class="terminal-badge font-mono uppercase tracking-wider"
        >
          idle
        </UBadge>
      </div>
    </template>

    <div class="terminal-body p-5 space-y-5">
      <div class="terminal-prompt">
        <div class="flex items-start gap-2">
          <span class="text-[var(--ui-success)] font-mono text-sm shrink-0">❯</span>
          <div class="min-w-0">
            <h3
              class="card-title font-mono text-base font-semibold text-[var(--ui-text)] leading-tight truncate"
            >
              {{ presentation.title }}
            </h3>
            <p
              v-if="presentation.description"
              class="font-mono text-xs text-[var(--ui-text-muted)] mt-1 line-clamp-2 leading-relaxed"
            >
              {{ presentation.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="terminal-meta flex gap-2 flex-wrap items-center">
        <UBadge color="primary" variant="outline" size="xs" class="font-mono text-[10px]">
          --theme={{ presentation.theme }}
        </UBadge>
        <UBadge
          v-if="presentation.duration"
          color="neutral"
          variant="outline"
          size="xs"
          class="font-mono text-[10px]"
        >
          --duration={{ presentation.duration }}
        </UBadge>
      </div>

      <div class="terminal-actions flex gap-2">
        <UButton
          :color="running ? 'error' : 'success'"
          variant="soft"
          size="sm"
          class="present-button flex-1 terminal-btn font-mono"
          :loading="loading.dev"
          :disabled="loading.dev"
          @click="handleDev"
        >
          <template #leading>
            <span class="terminal-prompt-symbol">$</span>
          </template>
          {{ running ? 'stop' : 'dev' }}
          <template #trailing>
            <UKbd size="xs" class="terminal-kbd">D</UKbd>
          </template>
        </UButton>

        <UButton
          color="primary"
          variant="soft"
          size="sm"
          class="flex-1 terminal-btn font-mono"
          :loading="loading.export"
          :disabled="loading.export"
          @click="handleExport"
        >
          <template #leading>
            <span class="terminal-prompt-symbol">$</span>
          </template>
          export
          <template #trailing>
            <UKbd size="xs" class="terminal-kbd">E</UKbd>
          </template>
        </UButton>

        <!-- TODO: Re-enable when deploy functionality is implemented
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          class="flex-1 terminal-btn font-mono"
          :loading="loading.deploy"
          :disabled="loading.deploy"
          @click="handleDeploy"
        >
          <template #leading>
            <span class="terminal-prompt-symbol">$</span>
          </template>
          deploy
          <template #trailing>
            <UKbd size="xs" class="terminal-kbd">P</UKbd>
          </template>
        </UButton>
        -->
      </div>

      <div
        v-if="running && port"
        class="terminal-status font-mono text-xs text-[var(--ui-text-muted)] flex items-center gap-2 pt-3 border-t border-[var(--ui-border-muted)]"
      >
        <span class="text-[var(--ui-success)] animate-pulse">●</span>
        <code class="text-[var(--ui-success)]">localhost:{{ port }}</code>
        <span class="text-[var(--ui-text-dimmed)]">|</span>
        <span class="text-[var(--ui-text-dimmed)]">click to open</span>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.terminal-card {
  --terminal-glow-color: rgba(39, 201, 63, 0.2);
  --terminal-glow-strong: rgba(39, 201, 63, 0.4);
  border: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

.terminal-card:hover {
  border-color: var(--ui-border-accented);
  box-shadow:
    0 0 0 1px var(--ui-border-accented),
    0 0 30px var(--terminal-glow-color),
    0 8px 32px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.terminal-card--running {
  --terminal-glow-color: rgba(39, 201, 63, 0.25);
  border-color: rgba(39, 201, 63, 0.3);
}

.terminal-card--running:hover {
  box-shadow:
    0 0 0 1px rgba(39, 201, 63, 0.4),
    0 0 40px var(--terminal-glow-strong),
    0 8px 32px rgba(0, 0, 0, 0.15);
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: var(--ui-text-muted);
  transition: all 0.3s ease;
}

.terminal-card:hover .chevron-icon {
  color: var(--ui-text);
}

.terminal-prompt-symbol {
  color: var(--ui-text-muted);
  margin-right: 2px;
  opacity: 0.7;
}

.terminal-btn {
  transition: all 0.2s ease;
}

.terminal-btn:hover {
  text-shadow: 0 0 10px currentColor;
}

.terminal-btn:hover .terminal-kbd {
  opacity: 1;
  background: var(--ui-bg-elevated);
}

.terminal-kbd {
  opacity: 0.5;
  transition: opacity 0.2s ease;
  font-size: 9px;
}

.terminal-badge--live {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(39, 201, 63, 0.4);
  }
  50% {
    box-shadow: 0 0 12px rgba(39, 201, 63, 0.6);
  }
}
</style>
