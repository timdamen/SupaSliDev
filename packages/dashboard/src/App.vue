<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import PresentationCard from './components/PresentationCard.vue'
import CreatePresentationDialog from './components/CreatePresentationDialog.vue'
import type { Presentation } from './types'
import presentationsData from './data/presentations.json'
import { useServers } from './composables/useServers'

const { startPolling, stopPolling, stopAllServers } = useServers()

const isDialogOpen = ref(false)

function handlePresentationCreated(presentation: Presentation) {
  presentations.value = [...presentations.value, presentation].sort((a, b) =>
    a.title.localeCompare(b.title)
  )
}

function handleBeforeUnload() {
  navigator.sendBeacon('/api/servers/stop-all')
}

onMounted(() => {
  startPolling()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  stopPolling()
  stopAllServers()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const presentations = ref<Presentation[]>(presentationsData)
const searchQuery = ref('')

const filteredPresentations = computed(() => {
  if (!searchQuery.value.trim()) {
    return presentations.value
  }
  const query = searchQuery.value.toLowerCase()
  return presentations.value.filter((p) =>
    p.title.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-content">
        <div class="header-text">
          <h1>supaSliDev</h1>
          <p>Your presentations dashboard</p>
        </div>
        <button class="btn-new" @click="isDialogOpen = true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          New Presentation
        </button>
      </div>
    </header>

    <div class="filter-container">
      <input
        v-model="searchQuery"
        type="text"
        class="filter-input"
        placeholder="Search presentations by title..."
      />
    </div>

    <div v-if="filteredPresentations.length > 0" class="grid">
      <PresentationCard
        v-for="presentation in filteredPresentations"
        :key="presentation.id"
        :presentation="presentation"
      />
    </div>

    <div v-else class="no-results">
      <h3>No presentations found</h3>
      <p>Try adjusting your search query</p>
    </div>

    <CreatePresentationDialog
      :open="isDialogOpen"
      @close="isDialogOpen = false"
      @created="handlePresentationCreated"
    />
  </div>
</template>
