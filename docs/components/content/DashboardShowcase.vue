<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref<'dashboard' | 'palette' | 'import'>('dashboard');
const hoveredCard = ref<number | null>(null);

const mockPresentations = [
  { id: 'keynote-2025', title: 'Company Keynote 2025', theme: 'default', status: 'live' },
  { id: 'tech-talk', title: 'Vue 3 Deep Dive', theme: 'seriph', status: 'idle' },
  { id: 'onboarding', title: 'Team Onboarding', theme: 'apple-basic', status: 'idle' },
];

const validatedProjects = [
  { sourcePath: '~/talks/vue-conf-2025', suggestedName: 'vue-conf-2025', valid: true },
  { sourcePath: '~/work/client-pitch', suggestedName: 'client-pitch', valid: true },
];
</script>

<template>
  <section class="showcase">
    <div class="section-header">
      <span class="section-tag">&lt;interactive-preview /&gt;</span>
      <h2 class="section-title">Feature samples</h2>
      <p class="section-description">Explore the dashboard without leaving this page</p>
    </div>

    <div class="tabs">
      <button
        v-for="tab in [
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'palette', label: 'Command Palette' },
          { id: 'import', label: 'Import Projects' },
        ]"
        :key="tab.id"
        :class="['tab', { 'tab--active': activeTab === tab.id }]"
        @click="activeTab = tab.id as any"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="browser-window">
      <div class="browser-chrome">
        <div class="browser-dots">
          <span class="dot dot--red" />
          <span class="dot dot--yellow" />
          <span class="dot dot--green" />
        </div>
        <div class="browser-url">
          <UIcon name="i-lucide-lock" class="w-3 h-3 opacity-50" />
          <span>localhost:3000</span>
        </div>
        <div class="browser-actions">
          <UIcon name="i-lucide-minus" class="w-4 h-4 opacity-50" />
          <UIcon name="i-lucide-square" class="w-3 h-3 opacity-50" />
          <UIcon name="i-lucide-x" class="w-4 h-4 opacity-50" />
        </div>
      </div>

      <div class="browser-content">
        <Transition name="fade" mode="out-in">
          <div v-if="activeTab === 'dashboard'" key="dashboard" class="mock-dashboard">
            <div class="mock-header">
              <img src="/ssl-logo.png" class="mock-logo" />
              <span class="mock-brand">Supaslidev</span>
              <div class="mock-header-actions">
                <span class="mock-action-btn mock-action-btn--primary">
                  <UIcon name="i-lucide-plus" class="w-3 h-3" />
                  New
                </span>
                <span class="mock-action-btn">
                  <UIcon name="i-lucide-import" class="w-3 h-3" />
                  Import
                </span>
              </div>
              <div class="mock-search">
                <UIcon name="i-lucide-search" class="w-3 h-3" />
                <span>Search presentations...</span>
                <span class="mock-kbd">⌘K</span>
              </div>
            </div>

            <div class="mock-grid">
              <div
                v-for="(pres, index) in mockPresentations"
                :key="pres.id"
                :class="[
                  'mock-card',
                  {
                    'mock-card--hovered': hoveredCard === index,
                    'mock-card--live': pres.status === 'live',
                  },
                ]"
                @mouseenter="hoveredCard = index"
                @mouseleave="hoveredCard = null"
              >
                <div class="mock-card-header">
                  <UIcon name="i-lucide-folder" class="w-3 h-3 opacity-60" />
                  <span class="mock-path">~/{{ pres.id }}</span>
                  <span :class="['mock-status', `mock-status--${pres.status}`]">
                    <span v-if="pres.status === 'live'" class="status-dot" />
                    {{ pres.status }}
                  </span>
                </div>
                <div class="mock-card-body">
                  <span class="mock-prompt">❯</span>
                  <span class="mock-title">{{ pres.title }}</span>
                </div>
                <div class="mock-card-meta">
                  <span class="mock-theme">--theme={{ pres.theme }}</span>
                </div>
                <div class="mock-card-actions">
                  <span class="mock-btn mock-btn--green">$ dev</span>
                  <span class="mock-btn mock-btn--blue">$ export</span>
                  <span class="mock-btn">$ edit</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'palette'" key="palette" class="mock-palette">
            <div class="palette-overlay" />
            <div class="palette-modal">
              <div class="palette-input">
                <UIcon name="i-lucide-search" class="w-4 h-4 opacity-50" />
                <span class="palette-placeholder">Type a command or search...</span>
              </div>
              <div class="palette-results">
                <div class="palette-group">
                  <span class="palette-group-title">Actions</span>
                  <div class="palette-item palette-item--active">
                    <UIcon name="i-lucide-play" class="w-4 h-4" />
                    <span>Start Development Server</span>
                    <span class="palette-shortcut">⌘D</span>
                  </div>
                  <div class="palette-item">
                    <UIcon name="i-lucide-file-output" class="w-4 h-4" />
                    <span>Export to PDF</span>
                    <span class="palette-shortcut">⌘E</span>
                  </div>
                  <div class="palette-item">
                    <UIcon name="i-lucide-plus" class="w-4 h-4" />
                    <span>Create New Presentation</span>
                    <span class="palette-shortcut">⌘N</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else key="import" class="mock-import">
            <div class="import-overlay" />
            <div class="import-modal">
              <div class="import-header">
                <UIcon name="i-lucide-import" class="w-5 h-5" />
                <div class="import-header-text">
                  <span class="import-title">Import Presentations</span>
                  <span class="import-subtitle">Import existing Slidev presentations</span>
                </div>
                <span class="import-close">
                  <UIcon name="i-lucide-x" class="w-4 h-4" />
                </span>
              </div>

              <div class="import-body">
                <div class="import-input-group">
                  <label class="import-label">Source Path(s)</label>
                  <div class="import-input-row">
                    <div class="import-input">
                      <span class="import-input-text"
                        >~/talks/vue-conf-2025, ~/work/client-pitch</span
                      >
                    </div>
                    <span class="import-browse-btn">
                      <UIcon name="i-lucide-folder-open" class="w-4 h-4" />
                      Browse
                    </span>
                  </div>
                </div>

                <div class="import-dropzone">
                  <UIcon name="i-lucide-upload" class="w-6 h-6" />
                  <span>Drop folders here or click Browse</span>
                </div>

                <div class="import-validation">
                  <label class="import-label">Projects to Import</label>
                  <div class="import-validation-list">
                    <div
                      v-for="project in validatedProjects"
                      :key="project.sourcePath"
                      class="import-validation-item"
                    >
                      <UIcon name="i-lucide-check-circle" class="w-4 h-4 import-valid-icon" />
                      <span class="import-source-path">{{ project.sourcePath }}</span>
                      <UIcon name="i-lucide-arrow-right" class="w-3 h-3 import-arrow" />
                      <span class="import-suggested-name">{{ project.suggestedName }}</span>
                    </div>
                  </div>
                </div>

                <div class="import-info-box">
                  <UIcon name="i-lucide-info" class="w-4 h-4" />
                  <span
                    >Only presentation files will be copied. Dependencies
                    (<code>node_modules</code>, lock files) are excluded.</span
                  >
                </div>
              </div>

              <div class="import-footer">
                <span class="import-cancel-btn">Cancel</span>
                <span class="import-btn">
                  <UIcon name="i-lucide-import" class="w-4 h-4" />
                  Import 2 Presentations
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="browser-glow" />
    </div>
  </section>
</template>

<style scoped>
.showcase {
  padding: 6rem 2rem;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(43, 164, 169, 0.02) 50%,
    transparent 100%
  );
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #2ba4a9;
  background: rgba(43, 164, 169, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(43, 164, 169, 0.2);
}

.section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--ui-text);
  margin: 1.5rem 0 1rem;
}

.section-description {
  color: var(--ui-text-muted);
  font-size: 1.125rem;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tab {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  color: var(--ui-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab:hover {
  border-color: var(--ui-border-accented);
  color: var(--ui-text);
}

.tab--active {
  background: rgba(43, 164, 169, 0.1);
  border-color: #2ba4a9;
  color: #2ba4a9;
}

.browser-window {
  max-width: 1000px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--supaslidev-border);
  background: var(--ui-bg);
  box-shadow:
    0 0 0 1px rgba(43, 164, 169, 0.1),
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 0 100px rgba(43, 164, 169, 0.05);
  position: relative;
}

.dark .browser-window {
  box-shadow:
    0 0 0 1px rgba(43, 164, 169, 0.1),
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 100px rgba(43, 164, 169, 0.1);
}

.browser-chrome {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--supaslidev-header-bg);
  border-bottom: 1px solid var(--supaslidev-border);
}

.browser-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot--red {
  background: #ff5f57;
}
.dot--yellow {
  background: #febc2e;
}
.dot--green {
  background: #28c840;
}

.browser-url {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  background: var(--ui-bg);
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.browser-actions {
  display: flex;
  gap: 0.75rem;
}

.browser-content {
  min-height: 400px;
  padding: 1.5rem;
}

.browser-glow {
  position: absolute;
  inset: -1px;
  border-radius: 12px;
  background: conic-gradient(
    from 180deg,
    transparent 50%,
    rgba(43, 164, 169, 0.1) 75%,
    transparent 100%
  );
  z-index: -1;
  animation: glowRotate 10s linear infinite;
}

@keyframes glowRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.mock-dashboard {
  background: var(--ui-bg);
}

.mock-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--supaslidev-border);
  margin-bottom: 1.5rem;
}

.mock-logo {
  width: 32px;
  height: 32px;
}

.mock-brand {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: var(--ui-text);
}

.mock-header-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.mock-action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  color: var(--ui-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mock-action-btn:hover {
  border-color: var(--ui-border-accented);
  color: var(--ui-text);
}

.mock-action-btn--primary {
  background: rgba(43, 164, 169, 0.1);
  border-color: rgba(43, 164, 169, 0.3);
  color: #2ba4a9;
}

.mock-action-btn--primary:hover {
  background: rgba(43, 164, 169, 0.2);
  border-color: #2ba4a9;
}

.mock-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  background: var(--ui-bg-elevated);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--ui-border);
}

.mock-kbd {
  background: var(--ui-bg);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  border: 1px solid var(--ui-border);
}

.mock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.mock-card {
  background: var(--ui-bg);
  border: 1px solid var(--supaslidev-border);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.mock-card--hovered {
  border-color: rgba(43, 164, 169, 0.5);
  box-shadow: 0 0 30px rgba(43, 164, 169, 0.2);
  transform: translateY(-2px);
}

.mock-card--live {
  border-color: rgba(39, 201, 63, 0.3);
}

.mock-card--live.mock-card--hovered {
  border-color: rgba(39, 201, 63, 0.5);
  box-shadow: 0 0 30px rgba(39, 201, 63, 0.2);
}

.mock-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mock-path {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--ui-text-muted);
}

.mock-status {
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mock-status--idle {
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
}

.mock-status--live {
  background: rgba(39, 201, 63, 0.1);
  color: #27c93f;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.mock-card-body {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mock-prompt {
  color: #27c93f;
  font-family: 'JetBrains Mono', monospace;
}

.mock-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ui-text);
}

.mock-card-meta {
  margin-bottom: 1rem;
}

.mock-theme {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--ui-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.mock-card-actions {
  display: flex;
  gap: 0.5rem;
}

.mock-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
  transition: all 0.2s ease;
}

.mock-btn--green {
  background: rgba(39, 201, 63, 0.1);
  color: #27c93f;
}

.mock-btn--blue {
  background: rgba(99, 102, 241, 0.1);
  color: var(--ui-primary);
}

.mock-palette {
  position: relative;
  min-height: 350px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2rem;
}

.palette-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.dark .palette-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.palette-modal {
  position: relative;
  width: 100%;
  max-width: 500px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.dark .palette-modal {
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.palette-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--ui-border);
}

.palette-placeholder {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}

.palette-results {
  padding: 0.5rem;
}

.palette-group-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ui-text-muted);
  padding: 0.5rem 0.75rem;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: var(--ui-text);
  transition: background 0.15s ease;
}

.palette-item--active {
  background: rgba(43, 164, 169, 0.1);
}

.palette-shortcut {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--ui-text-muted);
  background: var(--ui-bg-elevated);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.mock-import {
  position: relative;
  min-height: 350px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.import-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.dark .import-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.import-modal {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.dark .import-modal {
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.import-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--ui-border);
  color: #2ba4a9;
}

.import-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.import-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ui-text);
}

.import-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--ui-text-muted);
}

.import-close {
  margin-left: auto;
  color: var(--ui-text-muted);
  cursor: pointer;
  padding: 0.25rem;
}

.import-body {
  padding: 0.875rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.import-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--ui-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  display: block;
}

.import-input-group {
  display: flex;
  flex-direction: column;
}

.import-input-row {
  display: flex;
  gap: 0.5rem;
}

.import-input {
  flex: 1;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--ui-text);
  overflow: hidden;
}

.import-input-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.import-browse-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  color: var(--ui-text-muted);
  cursor: pointer;
  white-space: nowrap;
}

.import-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.875rem;
  border: 2px dashed var(--ui-border);
  border-radius: 8px;
  color: var(--ui-text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  transition: all 0.2s ease;
}

.import-validation {
  display: flex;
  flex-direction: column;
}

.import-validation-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.import-validation-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--ui-bg-elevated);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
}

.import-valid-icon {
  color: #27c93f;
  flex-shrink: 0;
}

.import-source-path {
  color: var(--ui-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import-arrow {
  color: var(--ui-text-muted);
  flex-shrink: 0;
  opacity: 0.5;
}

.import-suggested-name {
  color: #2ba4a9;
  font-weight: 500;
  flex-shrink: 0;
}

.import-info-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: var(--ui-text-muted);
  background: rgba(43, 164, 169, 0.05);
  border: 1px solid rgba(43, 164, 169, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  line-height: 1.5;
}

.import-info-box code {
  background: var(--ui-bg-elevated);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.6rem;
}

.import-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--ui-border);
  background: var(--ui-bg-elevated);
}

.import-cancel-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  color: var(--ui-text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.import-cancel-btn:hover {
  color: var(--ui-text);
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  background: linear-gradient(135deg, #2ba4a9 0%, #3ab8b8 100%);
  color: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(43, 164, 169, 0.3);
  transition: all 0.2s ease;
}

.import-btn:hover {
  box-shadow: 0 4px 12px rgba(43, 164, 169, 0.4);
  transform: translateY(-1px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
