<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Presentation } from '../types';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  created: [presentation: Presentation];
}>();

const name = ref('');
const isSubmitting = ref(false);
const nameError = ref('');

const isValid = computed(() => {
  if (!name.value.trim()) return false;
  if (nameError.value) return false;
  return true;
});

function validateName(value: string) {
  if (!value.trim()) {
    nameError.value = 'Name is required';
    return;
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(value)) {
    nameError.value = 'Name must be a valid slug (lowercase letters, numbers, hyphens only)';
    return;
  }

  nameError.value = '';
}

watch(name, validateName);

function resetForm() {
  name.value = '';
  nameError.value = '';
  isSubmitting.value = false;
}

function handleClose() {
  resetForm();
  emit('close');
}

async function handleSubmit() {
  validateName(name.value);
  if (!isValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const response = await fetch('/api/presentations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.field === 'name') {
        nameError.value = error.message;
      }
      return;
    }

    const presentation = await response.json();
    emit('created', presentation);
    handleClose();
  } finally {
    isSubmitting.value = false;
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleClose();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose();
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-backdrop" @click="handleBackdropClick" @keydown="handleKeydown">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="dialog-header">
          <h2 id="dialog-title">Create New Presentation</h2>
          <button class="close-button" @click="handleClose" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <form class="dialog-form" @submit.prevent="handleSubmit">
          <div class="form-field">
            <label for="name">Name (slug) <span class="required">*</span></label>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="my-presentation"
              :class="{ 'input-error': nameError }"
            />
            <span v-if="nameError" class="error-message">{{ nameError }}</span>
            <span v-else class="field-hint">Lowercase letters, numbers, and hyphens only</span>
          </div>

          <p class="info-text">
            The presentation will be created using Slidev's default template. You can customize the
            title, theme, and content by editing slides.md after creation.
          </p>

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" @click="handleClose">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="!isValid || isSubmitting">
              <span v-if="isSubmitting" class="spinner"></span>
              {{ isSubmitting ? 'Creating...' : 'Create Presentation' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.dialog {
  background: var(--bg-card);
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.dialog-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition:
    color 0.2s,
    background 0.2s;
}

.close-button:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.1);
}

.dialog-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}

.required {
  color: #ef4444;
}

.form-field input {
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--text);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  font-family: inherit;
}

.form-field input::placeholder {
  color: var(--text-muted);
}

.form-field input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.info-text {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

.form-field input.input-error {
  border-color: #ef4444;
}

.form-field input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-muted);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
