<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Revenue</p>
        <h2 class="section-title">Keep income records clean and current</h2>
        <p class="section-copy">
          Log earnings as they arrive so your balance, reporting, and savings decisions reflect real numbers.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Income entries</span>
        <strong class="amount-positive">{{ incomes.length }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <IncomeForm @submit="handleAddIncome" />
      <TransactionList
        title="All income"
        :items="incomes"
        :is-income="true"
        :show-delete="true"
        @delete="$emit('delete-income', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import IncomeForm from '../components/IncomeForm.vue'
import TransactionList from '../components/TransactionList.vue'
import type { Income } from '../types'

defineProps<{
  incomes: Income[]
}>()

const emit = defineEmits<{
  'add-income': [income: Income]
  'delete-income': [id: string]
}>()

const handleAddIncome = (incomeData: Omit<Income, 'id'>) => {
  emit('add-income', {
    ...incomeData,
    id: Date.now().toString()
  })
}
</script>
