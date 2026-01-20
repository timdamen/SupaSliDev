<script setup lang="ts">
import { ref, computed } from 'vue'
import PresentationCard from './components/PresentationCard.vue'
import type { Presentation } from './types'
import presentationsData from './data/presentations.json'

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
      <h1>supaSliDev</h1>
      <p>Your presentations dashboard</p>
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
  </div>
</template>
