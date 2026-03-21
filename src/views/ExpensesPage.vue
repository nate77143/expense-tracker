<template>
  <div>
    <h1 class="page-title">Expenses</h1>

    <div class="grid-2">
      <div>
        <ExpenseForm @submit="handleAddExpense" />
      </div>
      <div>
        <TransactionList 
          title="All Expenses" 
          :items="expenses"
          :show-delete="true"
          @delete="$emit('delete-expense', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExpenseForm from '../components/ExpenseForm.vue'
import TransactionList from '../components/TransactionList.vue'
import type { Expense } from '../types'

defineProps<{
  expenses: Expense[]
}>()

const emit = defineEmits<{
  'add-expense': [expense: Expense]
  'delete-expense': [id: string]
}>()

const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
  const expense: Expense = {
    ...expenseData,
    id: Date.now().toString()
  }
  emit('add-expense', expense)
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
