<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';

const props = defineProps<{
  code?: string;
  language?: string;
  filename?: string;
  highlights?: number[];
  meta?: string;
  class?: string;
}>();

const isMermaid = computed(() => props.language === 'mermaid');

const container = ref<HTMLElement | null>(null);
const svg = ref('');
const error = ref<string | null>(null);

onMounted(async () => {
  if (!isMermaid.value) return;

  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
  });

  const render = async () => {
    if (!props.code) return;

    try {
      error.value = null;
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      const { svg: renderedSvg } = await mermaid.render(id, props.code);
      svg.value = renderedSvg;
    } catch (e) {
      console.error('Mermaid rendering error:', e);
      error.value = e instanceof Error ? e.message : 'Failed to render diagram';
    }
  };

  render();
  watch(() => props.code, render);
});
</script>

<template>
  <div
    v-if="isMermaid"
    ref="container"
    class="mermaid-container my-5 flex justify-center overflow-x-auto rounded-md border border-default bg-default p-4"
  >
    <div v-if="error" class="text-red-500 font-mono text-sm">{{ error }}</div>
    <div v-else v-html="svg" class="mermaid-diagram" />
  </div>
  <ProsePre v-else v-bind="props">
    <slot />
  </ProsePre>
</template>

<style>
.mermaid-diagram svg {
  width: auto;
  min-width: 800px;
  height: auto;
}
</style>
