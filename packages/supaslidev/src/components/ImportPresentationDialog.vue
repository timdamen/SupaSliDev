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

interface SelectedFolder {
  path: string;
  name: string;
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
  imported: [presentations: Presentation[]];
}>();

const importProject = ref<ImportProject>(createEmptyImportProject());
const isSubmitting = ref(false);
const nameError = ref('');
const touched = ref({ path: false, name: false });
const folderInputRef = ref<HTMLInputElement | null>(null);
const selectedFolders = ref<SelectedFolder[]>([]);
const isDraggingOver = ref(false);

const isValid = computed(() => {
  return importProject.value.isValid && !nameError.value;
});

const hasMultiplePaths = computed(() => {
  return parsePaths(importProject.value.path).length > 1;
});

function parsePaths(input: string): string[] {
  return input
    .split(',')
    .map((path) => path.trim())
    .filter((path) => path.length > 0);
}

function validatePath(value: string): { isValid: boolean; error: string } {
  if (!touched.value.path) {
    return { isValid: false, error: '' };
  }

  const paths = parsePaths(value);
  if (paths.length === 0) {
    return { isValid: false, error: 'At least one source path is required' };
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

function openFolderPicker() {
  folderInputRef.value?.click();
}

function handleFolderSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  const folderPaths = new Map<string, string>();

  for (const file of files) {
    const pathParts = file.webkitRelativePath.split('/');
    if (pathParts.length > 0) {
      const folderName = pathParts[0];
      if (!folderPaths.has(folderName)) {
        folderPaths.set(folderName, folderName);
      }
    }
  }

  const newFolders: SelectedFolder[] = [];
  for (const [name] of folderPaths) {
    if (!selectedFolders.value.some((f) => f.name === name)) {
      newFolders.push({ path: name, name });
    }
  }

  selectedFolders.value = [...selectedFolders.value, ...newFolders];
  updatePathFromSelectedFolders();

  input.value = '';
}

function removeSelectedFolder(index: number) {
  selectedFolders.value = selectedFolders.value.filter((_, i) => i !== index);
  updatePathFromSelectedFolders();
}

function updatePathFromSelectedFolders() {
  if (selectedFolders.value.length > 0) {
    importProject.value.path = selectedFolders.value.map((f) => f.path).join(', ');
    touched.value.path = true;
    const validation = validatePath(importProject.value.path);
    importProject.value.isValid = validation.isValid;
    importProject.value.error = validation.error;
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer?.types.includes('Files')) {
    isDraggingOver.value = true;
  }
}

function handleDragLeave(event: DragEvent) {
  const relatedTarget = event.relatedTarget as Node | null;
  const currentTarget = event.currentTarget as HTMLElement;
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    isDraggingOver.value = false;
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDraggingOver.value = false;

  const items = event.dataTransfer?.items;
  if (!items) return;

  const newFolders: SelectedFolder[] = [];

  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        const name = entry.name;
        if (
          !selectedFolders.value.some((f) => f.name === name) &&
          !newFolders.some((f) => f.name === name)
        ) {
          newFolders.push({ path: name, name });
        }
      }
    }
  }

  if (newFolders.length > 0) {
    selectedFolders.value = [...selectedFolders.value, ...newFolders];
    updatePathFromSelectedFolders();
  }
}

function resetForm() {
  importProject.value = createEmptyImportProject();
  nameError.value = '';
  isSubmitting.value = false;
  touched.value = { path: false, name: false };
  selectedFolders.value = [];
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

  const paths = parsePaths(importProject.value.path);
  const isSinglePath = paths.length === 1;

  isSubmitting.value = true;
  importProject.value.status = 'importing';

  const importedPresentations: Presentation[] = [];
  const errors: string[] = [];

  for (const path of paths) {
    try {
      const response = await fetch('/api/presentations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: path,
          name: isSinglePath ? importProject.value.name || undefined : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        errors.push(`${path}: ${error.message}`);
        continue;
      }

      const presentation = await response.json();
      importedPresentations.push(presentation);
    } catch {
      errors.push(`${path}: Failed to import`);
    }
  }

  if (importedPresentations.length > 0) {
    emit('imported', importedPresentations);
  }

  if (errors.length > 0) {
    importProject.value.status = 'error';
    importProject.value.error = errors.join('\n');
    importProject.value.isValid = false;
    isSubmitting.value = false;
    return;
  }

  importProject.value.status = 'success';
  handleClose();
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
          <h2 class="text-lg font-semibold">Import Presentations</h2>
          <p class="text-sm text-muted">Import existing Slidev presentations</p>
        </div>
      </div>
    </template>

    <template #body>
      <form
        class="flex flex-col gap-6 relative"
        @submit.prevent="handleSubmit"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <div
          v-if="isDraggingOver"
          class="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10"
        >
          <div class="flex flex-col items-center gap-2 text-primary">
            <UIcon name="i-lucide-folder-down" class="w-8 h-8" />
            <span class="font-medium">Drop folders here</span>
          </div>
        </div>

        <UFormField
          label="Source Path(s)"
          required
          :error="importProject.error"
          hint="Relative paths to Slidev presentations (comma-separated for multiple)"
        >
          <div class="flex gap-2">
            <UInput
              v-model="importProject.path"
              placeholder="../project-a, ../project-b"
              :color="importProject.error ? 'error' : undefined"
              :ui="{ base: 'font-mono' }"
              class="flex-1"
              autocomplete="off"
              @blur="handlePathBlur"
            />
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-folder-open"
              @click="openFolderPicker"
            >
              Browse
            </UButton>
            <input
              ref="folderInputRef"
              type="file"
              webkitdirectory
              multiple
              class="hidden"
              @change="handleFolderSelect"
            />
          </div>
        </UFormField>

        <div v-if="selectedFolders.length > 0" class="flex flex-col gap-2">
          <label class="text-sm font-medium text-default">Selected Folders</label>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="(folder, index) in selectedFolders"
              :key="folder.name"
              color="primary"
              variant="subtle"
              class="font-mono text-xs"
            >
              {{ folder.name }}
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                icon="i-lucide-x"
                class="ml-1 -mr-1"
                @click="removeSelectedFolder(index)"
              />
            </UBadge>
          </div>
        </div>

        <UFormField
          v-if="!hasMultiplePaths"
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
            {{ hasMultiplePaths ? 'Presentations' : 'The presentation' }} will be copied to your
            workspace. Files like
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
          {{
            isSubmitting
              ? 'Importing...'
              : hasMultiplePaths
                ? 'Import Presentations'
                : 'Import Presentation'
          }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
