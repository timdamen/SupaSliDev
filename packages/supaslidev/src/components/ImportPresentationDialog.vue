<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Presentation } from '../types';

type ImportStatus = 'idle' | 'validating' | 'importing' | 'success' | 'error';

interface ImportProject {
  path: string;
  name: string;
  isValid: boolean;
  error: string;
  status: ImportStatus;
}

function createEmptyImportProject(): ImportProject {
  return {
    path: '',
    name: '',
    isValid: false,
    error: '',
    status: 'idle',
  };
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [presentation: Presentation];
}>();

const importProject = ref<ImportProject>(createEmptyImportProject());
const isSubmitting = ref(false);
const nameError = ref('');
const touched = ref({ path: false, name: false });

const isValid = computed(() => {
  return importProject.value.isValid && !nameError.value;
});

function validatePath(value: string): { isValid: boolean; error: string } {
  if (!touched.value.path) {
    return { isValid: false, error: '' };
  }

  if (!value.trim()) {
    return { isValid: false, error: 'Source path is required' };
  }

  return { isValid: true, error: '' };
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

watch(
  () => importProject.value.path,
  (value) => {
    if (touched.value.path) {
      const validation = validatePath(value);
      importProject.value.isValid = validation.isValid;
      importProject.value.error = validation.error;
    }
  },
);

watch(
  () => importProject.value.name,
  (value) => {
    if (touched.value.name) {
      validateName(value);
    }
  },
);

function handlePathBlur() {
  touched.value.path = true;
  const validation = validatePath(importProject.value.path);
  importProject.value.isValid = validation.isValid;
  importProject.value.error = validation.error;
}

function handleNameBlur() {
  touched.value.name = true;
  validateName(importProject.value.name);
}

function resetForm() {
  importProject.value = createEmptyImportProject();
  nameError.value = '';
  isSubmitting.value = false;
  touched.value = { path: false, name: false };
}

function handleClose() {
  resetForm();
  emit('close');
}

async function handleSubmit() {
  touched.value.path = true;
  const validation = validatePath(importProject.value.path);
  importProject.value.isValid = validation.isValid;
  importProject.value.error = validation.error;

  if (!isValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  importProject.value.status = 'importing';

  try {
    const response = await fetch('/api/presentations/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: importProject.value.path,
        name: importProject.value.name || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      importProject.value.status = 'error';
      if (error.field === 'source') {
        importProject.value.error = error.message;
        importProject.value.isValid = false;
      } else if (error.field === 'name') {
        nameError.value = error.message;
      } else {
        importProject.value.error = error.message || 'Import failed';
        importProject.value.isValid = false;
      }
      return;
    }

    importProject.value.status = 'success';
    const presentation = await response.json();
    emit('imported', presentation);
    handleClose();
  } catch {
    importProject.value.status = 'error';
    importProject.value.error = 'Failed to import presentation';
    importProject.value.isValid = false;
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
          :error="importProject.error"
          hint="Path to an existing Slidev presentation folder"
        >
          <UInput
            v-model="importProject.path"
            placeholder="/path/to/slidev-presentation"
            :color="importProject.error ? 'error' : undefined"
            :ui="{ base: 'font-mono' }"
            class="w-full"
            autocomplete="off"
            @blur="handlePathBlur"
          />
        </UFormField>

        <UFormField
          label="Name"
          :error="nameError"
          hint="Optional: Custom name for the imported presentation"
        >
          <UInput
            v-model="importProject.name"
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
