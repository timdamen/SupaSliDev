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

      <div
        class="header-content"
        role="button"
        tabindex="0"
        @click="$emit('open-command-palette')"
        @keydown.enter="$emit('open-command-palette')"
        @keydown.space.prevent="$emit('open-command-palette')"
      >
        <div class="header-left">
          <div class="logo">
            <span class="logo-symbol">%</span>
            <span class="logo-cursor" />
          </div>

          <span class="header-hint">Click to type a command...</span>
        </div>

        <div class="header-right" @click.stop>
          <div class="command-shortcut">
            <UKbd size="sm" class="command-kbd">{{ isMac ? '⌘' : 'Ctrl' }}</UKbd>
            <UKbd size="sm" class="command-kbd">K</UKbd>
          </div>

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
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.header-content:hover {
  background: var(--ui-bg-elevated);
}

.header-content:focus {
  outline: none;
  background: var(--ui-bg-elevated);
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
  font-size: 1rem;
}

.logo-cursor {
  width: 8px;
  height: 1.25rem;
  background: var(--ui-primary);
  animation: blink 1s step-end infinite;
}

.header-hint {
  color: var(--ui-text-muted);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875rem;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.command-shortcut {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.command-kbd {
  opacity: 0.7;
}

.theme-toggle {
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}
</style>
