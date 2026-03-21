<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserves</p>
        <h2 class="section-title">Build a clearer picture of savings</h2>
        <p class="section-copy">
          Track each bank balance and note the purpose behind your savings so long-term planning stays grounded.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Savings accounts</span>
        <strong class="amount-positive">{{ savings.length }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <SavingsForm @submit="handleAddSaving" />
      <SavingsList title="Bank savings" :items="savings" @delete="$emit('delete-saving', $event)" />
    </div>
  </section>
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
  emit('add-saving', {
    ...savingData,
    id: Date.now().toString()
  })
}
</script>
