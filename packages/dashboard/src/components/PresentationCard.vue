<script setup lang="ts">
import type { Presentation } from '../types'

defineProps<{
  presentation: Presentation
}>()
</script>

<template>
  <a
    :href="`http://localhost:3030`"
    class="card"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Open ${presentation.title}`"
  >
    <div
      class="card-image"
      :style="{ backgroundImage: presentation.background ? `url(${presentation.background})` : undefined }"
    />
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
    </div>
  </a>
</template>
