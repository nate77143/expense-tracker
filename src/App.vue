<template>
  <div class="app-shell">
    <Navigation :current-page="currentPage" @navigate="currentPage = $event" />

    <main class="main-content">
      <section class="page-frame">
        <header class="page-banner">
          <div>
            <p class="eyebrow">Personal Finance Workspace</p>
            <h1 class="page-banner-title">{{ activePage.heading }}</h1>
            <p class="page-banner-copy">{{ activePage.description }}</p>
          </div>
          <div class="page-banner-metric">
            <span class="page-banner-label">Records loaded</span>
            <strong>{{ totalRecords }}</strong>
          </div>
        </header>

        <div v-if="loading" class="status-banner">
          Syncing the latest finance records from Supabase.
        </div>

        <div v-else-if="supabaseError" class="status-banner status-banner-warning">
          {{ supabaseError }}
        </div>

        <Dashboard
          v-if="currentPage === 'dashboard'"
          :expenses="expenses"
          :incomes="incomes"
          :savings="savings"
        />
        <ExpensesPage
          v-else-if="currentPage === 'expenses'"
          :expenses="expenses"
          @add-expense="addExpense"
          @delete-expense="deleteExpense"
        />
        <IncomePage
          v-else-if="currentPage === 'income'"
          :incomes="incomes"
          @add-income="addIncome"
          @delete-income="deleteIncome"
        />
        <SavingsPage
          v-else-if="currentPage === 'savings'"
          :savings="savings"
          @add-saving="addSaving"
          @delete-saving="deleteSaving"
        />
        <ReportsPage v-else-if="currentPage === 'reports'" :expenses="expenses" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Navigation from './components/Navigation.vue'
import Dashboard from './views/Dashboard.vue'
import ExpensesPage from './views/ExpensesPage.vue'
import IncomePage from './views/IncomePage.vue'
import SavingsPage from './views/SavingsPage.vue'
import ReportsPage from './views/ReportsPage.vue'

import type { Expense, Income, Saving } from './types'
import { sampleExpenses, sampleIncomes, sampleSavings } from './data/sampleData'
import {
  deleteExpense as deleteExpenseApi,
  deleteIncome as deleteIncomeApi,
  fetchExpenses,
  fetchIncomes,
  insertExpense,
  insertIncome
} from './services/supabaseService'

const currentPage = ref<'dashboard' | 'expenses' | 'income' | 'savings' | 'reports'>('dashboard')
const expenses = ref<Expense[]>([])
const incomes = ref<Income[]>([])
const savings = ref<Saving[]>([])
const loading = ref(true)
const supabaseError = ref<string | null>(null)

const pageDetails = {
  dashboard: {
    heading: 'Financial overview',
    description: 'Monitor cash flow, savings momentum, and your latest transactions from one focused dashboard.'
  },
  expenses: {
    heading: 'Expense management',
    description: 'Capture spend quickly and keep every outgoing transaction organized by category and date.'
  },
  income: {
    heading: 'Income tracking',
    description: 'Log every income stream in one place so your cash position stays accurate and easy to review.'
  },
  savings: {
    heading: 'Savings accounts',
    description: 'Track balances by bank and keep longer-term funds visible alongside day-to-day finances.'
  },
  reports: {
    heading: 'Performance reports',
    description: 'Review daily, weekly, and monthly expense trends to spot patterns and improve decisions.'
  }
} as const

const activePage = computed(() => pageDetails[currentPage.value])

const totalRecords = computed(() => {
  return expenses.value.length + incomes.value.length + savings.value.length
})

const loadData = async () => {
  try {
    const { data: expenseData, error: expenseError } = await fetchExpenses()
    const { data: incomeData, error: incomeError } = await fetchIncomes()

    if (expenseError || incomeError) {
      supabaseError.value = 'Supabase table access failed, so the app is showing sample data for now.'
      expenses.value = sampleExpenses
      incomes.value = sampleIncomes
      savings.value = sampleSavings
      return
    }

    expenses.value = expenseData ?? sampleExpenses
    incomes.value = incomeData ?? sampleIncomes
    savings.value = sampleSavings
  } catch (error) {
    supabaseError.value = 'The live data request failed, so the app fell back to the bundled sample data.'
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

    if (error || !data) {
      throw error ?? new Error('Insert failed')
    }

    expenses.value.unshift(data)
  } catch (err) {
    supabaseError.value = 'The expense could not be saved to Supabase, so it was added locally only.'
    expenses.value.unshift(expense)
  }
}

const deleteExpense = async (id: string) => {
  try {
    const { error } = await deleteExpenseApi(id)

    if (error) {
      throw error
    }

    expenses.value = expenses.value.filter(expense => expense.id !== id)
  } catch (err) {
    supabaseError.value = 'The expense could not be removed from Supabase, so it was removed locally only.'
    expenses.value = expenses.value.filter(expense => expense.id !== id)
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

    if (error || !data) {
      throw error ?? new Error('Insert failed')
    }

    incomes.value.unshift(data)
  } catch (err) {
    supabaseError.value = 'The income entry could not be saved to Supabase, so it was added locally only.'
    incomes.value.unshift({
      ...income,
      id: Date.now().toString()
    })
  }
}

const deleteIncome = async (id: string) => {
  try {
    const { error } = await deleteIncomeApi(id)

    if (error) {
      throw error
    }

    incomes.value = incomes.value.filter(income => income.id !== id)
  } catch (err) {
    supabaseError.value = 'The income entry could not be removed from Supabase, so it was removed locally only.'
    incomes.value = incomes.value.filter(income => income.id !== id)
  }
}

const addSaving = (saving: Saving) => {
  savings.value.unshift(saving)
}

const deleteSaving = (id: string) => {
  savings.value = savings.value.filter(saving => saving.id !== id)
}
</script>
