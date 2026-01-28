<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  code: string;
}>();

const container = ref<HTMLElement | null>(null);
const svg = ref('');

onMounted(async () => {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
  });

  const render = async () => {
    if (!container.value || !props.code) return;

    try {
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      const { svg: renderedSvg } = await mermaid.render(id, props.code);
      svg.value = renderedSvg;
    } catch (e) {
      console.error('Mermaid rendering error:', e);
      svg.value = `<pre class="text-red-500">Failed to render diagram</pre>`;
    }
  };

  render();
  watch(() => props.code, render);
});
</script>

<template>
  <div ref="container" class="mermaid-container my-4 flex justify-center">
    <div v-html="svg" class="mermaid-diagram" />
  </div>
</template>

<style>
.mermaid-container {
  overflow-x: auto;
}
.mermaid-diagram svg {
  max-width: 100%;
  height: auto;
}
</style>
