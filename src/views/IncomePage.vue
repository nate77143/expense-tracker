<template>
  <div>
    <h1 class="page-title">Income</h1>

    <div class="grid-2">
      <div>
        <IncomeForm @submit="handleAddIncome" />
      </div>
      <div>
        <TransactionList 
          title="All Income" 
          :items="incomes"
          is-income
          :show-delete="true"
          @delete="$emit('delete-income', $event)"
        />
      </div>
    </div>
  </div>
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
  const income: Income = {
    ...incomeData,
    id: Date.now().toString()
  }
  emit('add-income', income)
}
</script>

<style scoped>
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  color: var(--gray-900);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
