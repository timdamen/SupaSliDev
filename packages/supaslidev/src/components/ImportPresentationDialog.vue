<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Presentation } from '../types';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [presentation: Presentation];
}>();

const sourcePath = ref('');
const name = ref('');
const isSubmitting = ref(false);
const sourceError = ref('');
const nameError = ref('');
const touched = ref({ source: false, name: false });

const isValid = computed(() => {
  if (!sourcePath.value.trim()) return false;
  if (sourceError.value || nameError.value) return false;
  return true;
});

function validateSourcePath(value: string) {
  if (!touched.value.source) return;

  if (!value.trim()) {
    sourceError.value = 'Source path is required';
    return;
  }

  sourceError.value = '';
}

function validateName(value: string) {
  if (!touched.value.name) return;
  if (!value.trim()) {
    nameError.value = '';
    return;
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(value)) {
    nameError.value = 'Use lowercase letters, numbers, and hyphens only';
    return;
  }

  nameError.value = '';
}

watch(sourcePath, (value) => {
  if (touched.value.source) {
    validateSourcePath(value);
  }
});

watch(name, (value) => {
  if (touched.value.name) {
    validateName(value);
  }
});

function handleSourceBlur() {
  touched.value.source = true;
  validateSourcePath(sourcePath.value);
}

function handleNameBlur() {
  touched.value.name = true;
  validateName(name.value);
}

function resetForm() {
  sourcePath.value = '';
  name.value = '';
  sourceError.value = '';
  nameError.value = '';
  isSubmitting.value = false;
  touched.value = { source: false, name: false };
}

function handleClose() {
  resetForm();
  emit('close');
}

async function handleSubmit() {
  touched.value.source = true;
  validateSourcePath(sourcePath.value);
  if (!isValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const response = await fetch('/api/presentations/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: sourcePath.value,
        name: name.value || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.field === 'source') {
        sourceError.value = error.message;
      } else if (error.field === 'name') {
        nameError.value = error.message;
      } else {
        sourceError.value = error.message || 'Import failed';
      }
      return;
    }

    const presentation = await response.json();
    emit('imported', presentation);
    handleClose();
  } catch {
    sourceError.value = 'Failed to import presentation';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal :open="props.open" @close="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <UIcon name="i-lucide-import" class="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 class="text-lg font-semibold">Import Presentation</h2>
          <p class="text-sm text-muted">Import an existing Slidev presentation</p>
        </div>
      </div>
    </template>

    <template #body>
      <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
        <UFormField
          label="Source Path"
          required
          :error="sourceError"
          hint="Path to an existing Slidev presentation folder"
        >
          <UInput
            v-model="sourcePath"
            placeholder="/path/to/slidev-presentation"
            :color="sourceError ? 'error' : undefined"
            :ui="{ base: 'font-mono' }"
            class="w-full"
            autocomplete="off"
            @blur="handleSourceBlur"
          />
        </UFormField>

        <UFormField
          label="Name"
          :error="nameError"
          hint="Optional: Custom name for the imported presentation"
        >
          <UInput
            v-model="name"
            placeholder="my-presentation (optional)"
            :color="nameError ? 'error' : undefined"
            :ui="{ base: 'font-mono' }"
            class="w-full"
            autocomplete="off"
            @blur="handleNameBlur"
          />
        </UFormField>

        <div class="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <UIcon name="i-lucide-info" class="w-4 h-4 text-muted mt-0.5 shrink-0" />
          <p class="text-sm text-muted">
            The presentation will be copied to your workspace. Files like
            <code class="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">node_modules</code>
            and lock files will be ignored.
          </p>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="handleClose">
          Cancel
        </UButton>
        <UButton
          :disabled="!isValid || isSubmitting"
          :loading="isSubmitting"
          icon="i-lucide-import"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Importing...' : 'Import Presentation' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
