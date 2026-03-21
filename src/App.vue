<template>
  <div class="app">
    <Navigation :current-page="currentPage" @navigate="currentPage = $event" />
    
    <main class="main-content">
      <div v-if="loading" class="card" style="margin-bottom: 1rem;">Loading data from Supabase...</div>
      <div v-else-if="supabaseError" class="card" style="margin-bottom: 1rem; color: var(--danger);">
        {{ supabaseError }}
      </div>
        <Dashboard v-if="currentPage === 'dashboard'" :expenses="expenses" :incomes="incomes" :savings="savings" />
      <ExpensesPage v-else-if="currentPage === 'expenses'" :expenses="expenses" @add-expense="addExpense" @delete-expense="deleteExpense" />
      <IncomePage v-else-if="currentPage === 'income'" :incomes="incomes" @add-income="addIncome" @delete-income="deleteIncome" />
      <SavingsPage v-else-if="currentPage === 'savings'" :savings="savings" @add-saving="addSaving" @delete-saving="deleteSaving" />
      <ReportsPage v-else-if="currentPage === 'reports'" :expenses="expenses" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Navigation from './components/Navigation.vue'
import Dashboard from './views/Dashboard.vue'
import ExpensesPage from './views/ExpensesPage.vue'
import IncomePage from './views/IncomePage.vue'
import SavingsPage from './views/SavingsPage.vue'
import ReportsPage from './views/ReportsPage.vue'

import type { Expense, Income, Saving } from './types'
import { sampleExpenses, sampleIncomes, sampleSavings } from './data/sampleData'
import {
  fetchExpenses,
  fetchIncomes,
  insertExpense,
  insertIncome,
  deleteExpense as deleteExpenseApi,
  deleteIncome as deleteIncomeApi
} from './services/supabaseService'

const currentPage = ref<'dashboard' | 'expenses' | 'income' | 'savings' | 'reports'>('dashboard')
const expenses = ref<Expense[]>([])
const incomes = ref<Income[]>([])
const savings = ref<Saving[]>([])
const loading = ref(true)
const supabaseError = ref<string | null>(null)

const loadData = async () => {
  try {
    const { data: expenseData, error: expenseError } = await fetchExpenses()
    const { data: incomeData, error: incomeError } = await fetchIncomes()

    if (expenseError || incomeError) {
      supabaseError.value = 'Supabase table access failed, using sample data.'
      expenses.value = sampleExpenses
      incomes.value = sampleIncomes
    } else {
      expenses.value = expenseData ?? sampleExpenses
      incomes.value = incomeData ?? sampleIncomes
      savings.value = sampleSavings
    }
  } catch (error) {
    supabaseError.value = 'Error fetching supabase data; using sample data.'
    expenses.value = sampleExpenses
    incomes.value = sampleIncomes
    savings.value = sampleSavings
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const addExpense = async (expense: Expense) => {
  try {
    const { data, error } = await insertExpense({
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      remarks: expense.remarks
    })
    if (error || !data) throw error ?? new Error('Insert failed')
    expenses.value.unshift(data)
  } catch (err) {
    supabaseError.value = 'Failed to add expense to Supabase; added locally only.'
    expenses.value.unshift(expense)
  }
}

const deleteExpense = async (id: string) => {
  try {
    const { error } = await deleteExpenseApi(id)
    if (error) throw error
    expenses.value = expenses.value.filter(e => e.id !== id)
  } catch (err) {
    supabaseError.value = 'Failed to delete expense from Supabase; removed locally.'
    expenses.value = expenses.value.filter(e => e.id !== id)
  }
}

const addIncome = async (income: Income) => {
  try {
    const { data, error } = await insertIncome({
      date: income.date,
      amount: income.amount,
      source: income.source,
      remarks: income.remarks
    })
    if (error || !data) throw error ?? new Error('Insert failed')
    incomes.value.unshift(data)
  } catch (err) {
    supabaseError.value = 'Failed to add income to Supabase; added locally only.'
    incomes.value.unshift({
      ...income,
      id: Date.now().toString()
    })
  }
}

const deleteIncome = async (id: string) => {
  try {
    const { error } = await deleteIncomeApi(id)
    if (error) throw error
    incomes.value = incomes.value.filter(i => i.id !== id)
  } catch (err) {
    supabaseError.value = 'Failed to delete income from Supabase; removed locally.'
    incomes.value = incomes.value.filter(i => i.id !== id)
  }
}

const addSaving = (saving: Saving) => {
  savings.value.unshift(saving)
}

const deleteSaving = (id: string) => {
  savings.value = savings.value.filter(s => s.id !== id)
}

</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-md);
}

@media (max-width: 768px) {
  .main-content {
    padding: var(--spacing-lg) var(--spacing-sm);
  }
}
</style>
