<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Presentation } from '../types';

const props = defineProps<{
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
</script>

<template>
  <UModal :open="props.open" @close="handleClose">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Create New Presentation</h2>
      </div>
    </template>

    <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
      <UFormField
        label="Name (slug)"
        required
        :error="nameError"
        hint="Lowercase letters, numbers, and hyphens only"
      >
        <UInput
          v-model="name"
          placeholder="my-presentation"
          :color="nameError ? 'error' : undefined"
          class="w-full"
        />
      </UFormField>

      <p class="text-sm text-muted">
        The presentation will be created using Slidev's default template. You can customize the
        title, theme, and content by editing slides.md after creation.
      </p>
    </form>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <UButton color="neutral" variant="outline" @click="handleClose">Cancel</UButton>
        <UButton :disabled="!isValid || isSubmitting" :loading="isSubmitting" @click="handleSubmit">
          {{ isSubmitting ? 'Creating...' : 'Create Presentation' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
