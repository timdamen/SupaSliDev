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
  <a
    :href="running && port ? `http://localhost:${port}` : '#'"
    class="card"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Open ${presentation.title}`"
    @click="handleCardClick"
  >
    <div
      class="card-image"
      :style="{
        backgroundImage: presentation.background ? `url(${presentation.background})` : undefined,
      }"
    >
      <div v-if="running" class="status-indicator" title="Server running" />
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ presentation.title }}</h3>
      <p v-if="presentation.description" class="card-description">
        {{ presentation.description }}
      </p>
      <div class="card-meta">
        <span class="badge badge-theme">{{ presentation.theme }}</span>
        <span v-if="presentation.duration" class="badge badge-duration">
          {{ presentation.duration }}
        </span>
      </div>
      <button
        class="present-button"
        :class="{ 'present-button--stop': running, 'present-button--loading': loading }"
        :disabled="loading"
        @click="handlePresent"
      >
        <span v-if="loading" class="button-spinner" />
        <span v-else>{{ running ? 'Stop' : 'Present' }}</span>
      </button>
    </div>
  </a>
</template>

<style scoped>
.status-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px #22c55e;
  z-index: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.card-image {
  position: relative;
}

.present-button {
  margin-top: 1rem;
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.present-button:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.present-button:active:not(:disabled) {
  transform: translateY(0);
}

.present-button--stop {
  background: #ef4444;
}

.present-button--stop:hover:not(:disabled) {
  background: #dc2626;
}

.present-button--loading {
  cursor: wait;
  opacity: 0.8;
}

.present-button:disabled {
  cursor: not-allowed;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
