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
      <ExpenseForm :savings-banks="availableSavingsBanks" @submit="handleAddExpense" />
      <TransactionList title="All expenses" :items="expenses" :show-delete="true" @delete="$emit('delete-expense', $event)" />
    </div>
  </section>
</template>

<script setup lang="ts">
import ExpenseForm from '../components/ExpenseForm.vue'
import TransactionList from '../components/TransactionList.vue'
import { computed } from 'vue'
import type { Expense, Saving } from '../types'

const props = defineProps<{
  expenses: Expense[]
  savings: Saving[]
  activeTrackerId: string
}>()

const emit = defineEmits<{
  'add-expense': [expense: Expense]
  'delete-expense': [id: string]
}>()

const availableSavingsBanks = computed(() => {
  const banks = props.savings.map(item => item.bank.trim()).filter(Boolean)
  return [...new Set(banks)].sort((a, b) => a.localeCompare(b))
})

const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'trackerId'>) => {
  emit('add-expense', {
    ...expenseData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}
</script>
