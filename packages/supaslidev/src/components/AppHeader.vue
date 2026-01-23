<script setup lang="ts">
import { computed } from 'vue';
import { useColorMode } from '#imports';

const colorMode = useColorMode();
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light';
  },
});

const isMac = computed(() => {
  if (typeof navigator === 'undefined') return true;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
});
</script>

<template>
  <header class="header">
    <div class="header-terminal">
      <div class="terminal-dots">
        <span class="terminal-dot terminal-dot--close" />
        <span class="terminal-dot terminal-dot--minimize" />
        <span class="terminal-dot terminal-dot--maximize" />
      </div>

      <div class="header-content">
        <div class="header-left">
          <div class="logo">
            <span class="logo-symbol">❯</span>
            <h1 class="logo-text">supaslidev</h1>
            <span class="logo-cursor" />
          </div>

          <nav class="breadcrumbs">
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item breadcrumb-item--active">presentations</span>
          </nav>
        </div>

        <div class="header-right">
          <button
            class="command-palette-trigger"
            title="Open command palette"
            @click="$emit('open-command-palette')"
          >
            <UIcon name="i-lucide-command" class="command-icon" />
            <span class="command-text">Command</span>
            <UKbd size="sm" class="command-kbd">{{ isMac ? '⌘' : 'Ctrl' }}</UKbd>
            <UKbd size="sm" class="command-kbd">K</UKbd>
          </button>

          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            color="neutral"
            variant="ghost"
            size="md"
            class="theme-toggle"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="isDark = !isDark"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  margin-bottom: 2rem;
}

.header-terminal {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 0.75rem;
  overflow: hidden;
}

.terminal-dots {
  display: flex;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  background: var(--ui-bg-elevated);
  border-bottom: 1px solid var(--ui-border);
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: box-shadow 0.3s ease;
}

.terminal-dot--close {
  background: #ff5f56;
}

.terminal-dot--minimize {
  background: #ffbd2e;
}

.terminal-dot--maximize {
  background: #27c93f;
}

.header-terminal:hover .terminal-dot--close {
  box-shadow: 0 0 8px #ff5f56;
}

.header-terminal:hover .terminal-dot--minimize {
  box-shadow: 0 0 8px #ffbd2e;
}

.header-terminal:hover .terminal-dot--maximize {
  box-shadow: 0 0 8px #27c93f;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.logo-symbol {
  color: var(--ui-success);
  font-weight: 600;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(to right, var(--ui-primary), var(--ui-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-cursor {
  width: 2px;
  height: 1.25rem;
  background: var(--ui-primary);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.breadcrumbs {
  display: flex;
  align-items: center;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875rem;
}

.breadcrumb-separator {
  color: var(--ui-text-muted);
  margin: 0 0.25rem;
}

.breadcrumb-item {
  color: var(--ui-text-muted);
}

.breadcrumb-item--active {
  color: var(--ui-text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.command-palette-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.command-palette-trigger:hover {
  border-color: var(--ui-border-accented);
  color: var(--ui-text);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
}

.command-icon {
  width: 14px;
  height: 14px;
}

.command-text {
  display: none;
}

@media (min-width: 640px) {
  .command-text {
    display: inline;
  }
}

.command-kbd {
  opacity: 0.7;
}

.command-palette-trigger:hover .command-kbd {
  opacity: 1;
}

.theme-toggle {
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}
</style>
