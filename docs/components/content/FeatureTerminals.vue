<script setup lang="ts">
import { ref, onMounted } from 'vue';

const features = [
  {
    icon: 'i-lucide-layout-dashboard',
    command: 'supaslidev dashboard',
    color: 'teal',
    outputs: [
      '✓ Visual grid/list view of all presentations',
      '✓ Real-time server status indicators',
      '✓ One-click dev server launch',
      '✓ Integrated search and filtering',
    ],
  },
  {
    icon: 'i-lucide-command',
    command: 'supaslidev --cmd-palette',
    color: 'violet',
    outputs: [
      '✓ Keyboard-first navigation (⌘K)',
      '✓ Fuzzy search across all actions',
      '✓ Quick presentation switching',
      '✓ Instant command execution',
    ],
  },
  {
    icon: 'i-lucide-import',
    command: 'supaslidev import ./slides',
    color: 'amber',
    outputs: [
      '✓ Import existing Slidev projects',
      '✓ Auto-align dependencies',
      '✓ Preserve themes & configs',
      '✓ Batch import support',
    ],
  },
];

const visibleFeatures = ref<Set<number>>(new Set());

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          visibleFeatures.value.add(index);
        }
      });
    },
    { threshold: 0.2 },
  );

  document.querySelectorAll('.feature-terminal').forEach((el) => {
    observer.observe(el);
  });
});
</script>

<template>
  <section class="features">
    <div class="section-header">
      <span class="section-tag">/* features */</span>
      <h2 class="section-title">Features highlighted</h2>
      <p class="section-description">Powerful tools that work together seamlessly</p>
    </div>

    <div class="features-grid">
      <div
        v-for="(feature, index) in features"
        :key="feature.command"
        :data-index="index"
        :class="[
          'feature-terminal',
          `feature-terminal--${feature.color}`,
          { 'is-visible': visibleFeatures.has(index) },
        ]"
        :style="{ '--delay': `${index * 100}ms` }"
      >
        <div class="terminal-chrome">
          <span class="terminal-dot" />
          <span class="terminal-dot" />
          <span class="terminal-dot" />
        </div>

        <div class="terminal-body">
          <div class="command-line">
            <span class="prompt">$</span>
            <span class="command">{{ feature.command }}</span>
          </div>

          <div class="output-lines">
            <div
              v-for="(line, lineIndex) in feature.outputs"
              :key="lineIndex"
              class="output-line"
              :style="{ '--line-delay': `${index * 100 + lineIndex * 80 + 200}ms` }"
            >
              {{ line }}
            </div>
          </div>
        </div>

        <div class="feature-icon">
          <UIcon :name="feature.icon" class="w-6 h-6" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: 6rem 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--ui-text);
  margin: 1rem 0;
}

.section-description {
  color: var(--ui-text-muted);
  font-size: 1.125rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-terminal {
  --accent: #2ba4a9;
  background: var(--ui-bg);
  border: 1px solid var(--supaslidev-border);
  border-radius: 12px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay);
  position: relative;
}

.feature-terminal--teal {
  --accent: #2ba4a9;
}
.feature-terminal--violet {
  --accent: #8b5cf6;
}
.feature-terminal--amber {
  --accent: #f5ca35;
}
.feature-terminal--emerald {
  --accent: #27c93f;
}

.feature-terminal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.feature-terminal:hover {
  border-color: var(--accent);
  box-shadow:
    0 0 0 1px var(--accent),
    0 0 40px color-mix(in srgb, var(--accent) 20%, transparent);
}

.terminal-chrome {
  display: flex;
  gap: 6px;
  padding: 0.75rem 1rem;
  background: var(--supaslidev-header-bg);
  border-bottom: 1px solid var(--supaslidev-border);
}

.terminal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--supaslidev-border);
}

.terminal-body {
  padding: 1.25rem;
}

.command-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

.prompt {
  color: var(--accent);
}

.command {
  color: var(--ui-text);
}

.output-lines {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.output-line {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: #27c93f;
  opacity: 0;
  transform: translateX(-10px);
  animation: slideIn 0.4s ease forwards;
  animation-delay: var(--line-delay);
}

.feature-terminal:not(.is-visible) .output-line {
  animation: none;
  opacity: 0;
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feature-icon {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  color: var(--accent);
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.feature-terminal:hover .feature-icon {
  opacity: 0.8;
}
</style>
