<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { useColorMode } from '#imports';

interface CommandOption {
  label: string;
  onSelect: () => void;
}

const { commands } = defineProps<{
  commands: CommandOption[];
}>();

const emit = defineEmits<{
  'open-command-palette': [];
  'execute-command': [command: string];
}>();

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

const inputValue = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);
const selectedIndex = ref(0);

const filteredCommands = computed(() => {
  if (!inputValue.value.trim()) return [];

  const query = inputValue.value.toLowerCase();
  return commands.filter((cmd) => cmd.label.toLowerCase().includes(query));
});

const showDropdown = computed(() => isFocused.value && filteredCommands.value.length > 0);

const ghostText = computed(() => {
  if (!inputValue.value.trim()) return '';

  const query = inputValue.value.toLowerCase();
  const match = commands.find((cmd) => cmd.label.toLowerCase().startsWith(query));

  if (match) {
    return match.label.slice(inputValue.value.length);
  }
  return '';
});

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab' && ghostText.value) {
    event.preventDefault();
    inputValue.value = inputValue.value + ghostText.value;
  } else if (event.key === 'ArrowDown' && showDropdown.value) {
    event.preventDefault();
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1);
  } else if (event.key === 'ArrowUp' && showDropdown.value) {
    event.preventDefault();
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (showDropdown.value) {
      const selected = filteredCommands.value[selectedIndex.value];
      if (selected) {
        selected.onSelect();
        inputValue.value = '';
        inputRef.value?.blur();
      }
    } else if (inputValue.value.trim()) {
      emit('execute-command', inputValue.value.trim());
      inputValue.value = '';
      inputRef.value?.blur();
    }
  } else if (event.key === 'Escape') {
    inputValue.value = '';
    inputRef.value?.blur();
  }
}

function selectOption(option: CommandOption) {
  option.onSelect();
  inputValue.value = '';
  inputRef.value?.blur();
}

function handleInputChange() {
  selectedIndex.value = 0;
}

function handleHeaderClick() {
  inputRef.value?.focus();
}

function focusInput() {
  nextTick(() => {
    inputRef.value?.focus();
  });
}

defineExpose({ focusInput, inputRef });
</script>

<template>
  <header class="header">
    <div class="header-terminal">
      <div class="terminal-dots">
        <span class="terminal-dot terminal-dot--close" />
        <span class="terminal-dot terminal-dot--minimize" />
        <span class="terminal-dot terminal-dot--maximize" />
      </div>

      <div class="header-content" @click="handleHeaderClick">
        <div class="header-left">
          <div class="logo">
            <span class="logo-symbol">%</span>
          </div>

          <div class="input-wrapper">
            <input
              ref="inputRef"
              v-model="inputValue"
              type="text"
              class="terminal-input"
              placeholder="Type a command..."
              @keydown="handleInputKeydown"
              @input="handleInputChange"
              @focus="isFocused = true"
              @blur="isFocused = false"
            />
            <span v-if="ghostText" class="ghost-text"
              >{{ inputValue }}<span class="ghost-suffix">{{ ghostText }}</span></span
            >
          </div>

          <span v-if="!isFocused && !inputValue" class="logo-cursor" />
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

      <div v-if="showDropdown" class="dropdown">
        <button
          v-for="(option, index) in filteredCommands"
          :key="option.label"
          class="dropdown-item"
          :class="{ 'dropdown-item--selected': index === selectedIndex }"
          @mousedown.prevent="selectOption(option)"
          @mouseenter="selectedIndex = index"
        >
          {{ option.label }}
        </button>
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

.input-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.terminal-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ui-text);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875rem;
  caret-color: var(--ui-primary);
}

.terminal-input::placeholder {
  color: var(--ui-text-muted);
}

.ghost-text {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875rem;
  color: transparent;
  white-space: pre;
}

.ghost-suffix {
  color: var(--ui-text-dimmed);
  opacity: 0.5;
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

.dropdown {
  border-top: 1px solid var(--ui-border);
  max-height: 240px;
  overflow-y: auto;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1.5rem;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--ui-text);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover,
.dropdown-item--selected {
  background: var(--ui-bg-elevated);
}

.dropdown-item--selected {
  color: var(--ui-primary);
}
</style>
