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

interface ValidationResult {
  path: string;
  isValid: boolean;
  suggestedName: string | null;
  error: string | null;
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
const validationResults = ref<ValidationResult[]>([]);
const isValidating = ref(false);
let validationDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const validProjects = computed(() => {
  return validationResults.value.filter((r) => r.isValid);
});

const hasValidProjects = computed(() => {
  return validProjects.value.length > 0;
});

const isValid = computed(() => {
  return hasValidProjects.value && !nameError.value && !isValidating.value;
});

const hasMultiplePaths = computed(() => {
  return parsePaths(importProject.value.path).length > 1;
});

const showPreviewList = computed(() => {
  return validationResults.value.length > 0 || isValidating.value;
});

function parsePaths(input: string): string[] {
  return input
    .split(',')
    .map((path) => path.trim())
    .filter((path) => path.length > 0);
}

async function validatePathsOnServer(paths: string[]): Promise<ValidationResult[]> {
  if (paths.length === 0) return [];

  try {
    const response = await fetch('/api/presentations/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });

    if (!response.ok) {
      return paths.map((path) => ({
        path,
        isValid: false,
        suggestedName: null,
        error: 'Validation request failed',
      }));
    }

    return await response.json();
  } catch {
    return paths.map((path) => ({
      path,
      isValid: false,
      suggestedName: null,
      error: 'Failed to validate path',
    }));
  }
}

function triggerValidation(paths: string[]) {
  if (validationDebounceTimer) {
    clearTimeout(validationDebounceTimer);
  }

  if (paths.length === 0) {
    validationResults.value = [];
    isValidating.value = false;
    return;
  }

  isValidating.value = true;
  validationDebounceTimer = setTimeout(async () => {
    const results = await validatePathsOnServer(paths);
    validationResults.value = results;
    isValidating.value = false;

    const hasValid = results.some((r) => r.isValid);
    importProject.value.isValid = hasValid;
    importProject.value.error = hasValid ? '' : 'No valid projects found';
  }, 300);
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
      const paths = parsePaths(value);
      triggerValidation(paths);
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
  const paths = parsePaths(importProject.value.path);
  triggerValidation(paths);
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

function updatePathFromSelectedFolders() {
  const paths = selectedFolders.value.map((f) => f.path);
  importProject.value.path = paths.join(', ');
  touched.value.path = true;
  triggerValidation(paths);
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
  validationResults.value = [];
  isValidating.value = false;
  if (validationDebounceTimer) {
    clearTimeout(validationDebounceTimer);
    validationDebounceTimer = null;
  }
}

function handleClose() {
  resetForm();
  emit('close');
}

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return;

  const projectsToImport = validProjects.value;
  if (projectsToImport.length === 0) return;

  const isSingleProject = projectsToImport.length === 1;

  isSubmitting.value = true;
  importProject.value.status = 'importing';

  const importedPresentations: Presentation[] = [];
  const errors: string[] = [];

  for (const project of projectsToImport) {
    try {
      const response = await fetch('/api/presentations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: project.path,
          name: isSingleProject ? importProject.value.name || undefined : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        errors.push(`${project.path}: ${error.message}`);
        continue;
      }

      const presentation = await response.json();
      importedPresentations.push(presentation);
    } catch {
      errors.push(`${project.path}: Failed to import`);
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

        <div v-if="showPreviewList" class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-default">Projects to Import</label>
            <span v-if="isValidating" class="text-xs text-muted flex items-center gap-1">
              <UIcon name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
              Validating...
            </span>
            <span v-else-if="validationResults.length > 0" class="text-xs text-muted">
              {{ validProjects.length }} of {{ validationResults.length }} valid
            </span>
          </div>
          <div
            class="border border-default rounded-lg divide-y divide-default max-h-48 overflow-y-auto"
          >
            <div
              v-for="result in validationResults"
              :key="result.path"
              class="flex items-center gap-3 px-3 py-2"
              :class="result.isValid ? 'bg-success/5' : 'bg-error/5'"
            >
              <UIcon
                :name="result.isValid ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                class="w-4 h-4 shrink-0"
                :class="result.isValid ? 'text-success' : 'text-error'"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs truncate">{{ result.path }}</span>
                  <UIcon name="i-lucide-arrow-right" class="w-3 h-3 text-muted shrink-0" />
                  <span class="font-mono text-xs text-primary font-medium">
                    {{ result.suggestedName || '—' }}
                  </span>
                </div>
                <p v-if="result.error" class="text-xs text-error mt-0.5">{{ result.error }}</p>
              </div>
            </div>
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
          :disabled="!isValid || isSubmitting || isValidating"
          :loading="isSubmitting || isValidating"
          icon="i-lucide-import"
          @click="handleSubmit"
        >
          {{
            isSubmitting
              ? 'Importing...'
              : isValidating
                ? 'Validating...'
                : validProjects.length > 1
                  ? `Import ${validProjects.length} Presentations`
                  : validProjects.length === 1
                    ? 'Import Presentation'
                    : 'Import'
          }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
