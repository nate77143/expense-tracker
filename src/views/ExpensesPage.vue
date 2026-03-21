<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Spend Control</p>
        <h2 class="section-title">Track every expense with context</h2>
        <p class="section-copy">
          Keep outgoing transactions organized by date, category, and notes so monthly reviews stay fast.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Total expenses</span>
        <strong class="amount-negative">{{ expenses.length }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <ExpenseForm @submit="handleAddExpense" />
      <TransactionList title="All expenses" :items="expenses" :show-delete="true" @delete="$emit('delete-expense', $event)" />
    </div>
  </section>
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
  emit('add-expense', {
    ...expenseData,
    id: Date.now().toString()
  })
}
</script>
