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

    <SavingsTrendChart :points="monthlySavingsPoints" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SavingsForm from '../components/SavingsForm.vue'
import SavingsList from '../components/SavingsList.vue'
import SavingsTrendChart from '../components/SavingsTrendChart.vue'
import type { Saving } from '../types'

const props = defineProps<{
  savings: Saving[]
  activeTrackerId: string
}>()

const emit = defineEmits<{
  'add-saving': [saving: Saving]
  'delete-saving': [id: string]
}>()

const handleAddSaving = (savingData: Omit<Saving, 'id' | 'trackerId'>) => {
  emit('add-saving', {
    ...savingData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}

const monthlySavingsPoints = computed(() => {
  const grouped = props.savings.reduce<Record<string, number>>((acc, saving) => {
    const monthKey = saving.date.slice(0, 7)
    acc[monthKey] = (acc[monthKey] ?? 0) + saving.amount
    return acc
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({
      label: month,
      value: total
    }))
})
</script>
