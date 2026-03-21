<template>
  <div>
    <h1 class="page-title">Savings</h1>

    <div class="grid-2">
      <div>
        <SavingsForm @submit="handleAddSaving" />
      </div>
      <div>
        <SavingsList
          title="Bank Savings"
          :items="savings"
          @delete="$emit('delete-saving', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SavingsForm from '../components/SavingsForm.vue'
import SavingsList from '../components/SavingsList.vue'
import type { Saving } from '../types'

defineProps<{
  savings: Saving[]
}>()

const emit = defineEmits<{
  'add-saving': [saving: Saving]
  'delete-saving': [id: string]
}>()

const handleAddSaving = (savingData: Omit<Saving, 'id'>) => {
  const saving: Saving = {
    ...savingData,
    id: Date.now().toString()
  }
  emit('add-saving', saving)
}
</script>
