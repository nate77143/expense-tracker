<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Expenses</p>
        <h2 class="section-title">Track spending by account</h2>
        <p class="section-copy">Every expense now reduces the exact account that paid for it, including credit cards.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Entries</span>
        <strong>{{ expenses.length }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <ExpenseForm :accounts="accounts" :account-balances="accountBalances" :credit-cards="creditCards" @submit="handleAddExpense" />

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Expense filters</h3>
            <p class="panel-copy">Filter by category, account, or date range to inspect spending patterns quickly.</p>
          </div>
          <div class="panel-kpi">
            <span>Matching</span>
            <strong>{{ filteredExpenses.length }}</strong>
          </div>
        </div>

        <div class="ledger-filters transaction-filter-grid">
          <div class="form-group">
            <label class="form-label" for="expense-filter-category">Category</label>
            <select id="expense-filter-category" v-model="selectedCategory" class="form-select">
              <option value="">All categories</option>
              <option v-for="category in availableCategories" :key="category" :value="category">{{ category }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="expense-filter-account">From account</label>
            <select id="expense-filter-account" v-model="selectedAccountId" class="form-select">
              <option value="">All accounts</option>
              <option v-for="account in accounts" :key="account.id" :value="account.id">{{ account.name }}</option>
            </select>
          </div>

          <div class="form-group transaction-date-group">
            <label class="form-label">Date range</label>
            <div class="date-range-inputs">
              <input v-model="dateFrom" type="date" class="form-input" />
              <span class="date-range-separator">to</span>
              <input v-model="dateTo" type="date" class="form-input" />
            </div>
          </div>

          <button v-if="selectedCategory || selectedAccountId || dateFrom || dateTo" type="button" class="btn btn-secondary transaction-filter-clear" @click="clearFilters">
            Clear filters
          </button>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Expense ledger</h3>
          <p class="panel-copy">Review each expense with its funding account, merchant, and amount.</p>
        </div>
      </div>

      <div v-if="filteredExpenses.length === 0" class="empty-state">
        <div class="empty-state-title">No expenses found</div>
        <p class="empty-state-copy">Add an expense or widen the filters to see more records.</p>
      </div>

      <div v-else class="ledger-shell">
        <div class="ledger-header">
          <span>Date</span>
          <span>Category</span>
          <span>Merchant</span>
          <span>From account</span>
          <span>Amount</span>
          <span>Remarks</span>
          <span>Action</span>
        </div>

        <div class="ledger-list">
          <article v-for="expense in filteredExpenses" :key="expense.id" class="ledger-row">
            <div class="ledger-cell">
              <span class="ledger-cell-label">Date</span>
              <span>{{ formatDate(expense.date) }}</span>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Category</span>
              <span>{{ expense.category }}</span>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Merchant</span>
              <span>{{ expense.merchant || 'Not specified' }}</span>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">From account</span>
              <span>{{ accountName(expense.fromAccountId) }}</span>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Amount</span>
              <strong class="amount-negative">{{ formatCurrency(expense.amount) }}</strong>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Remarks</span>
              <span class="ledger-remarks">{{ expense.remarks || 'No remarks' }}</span>
              <span v-if="creatorLabel(expense)" class="ledger-remarks">Logged by {{ creatorLabel(expense) }}</span>
            </div>
            <div class="ledger-cell ledger-action-cell">
              <span class="ledger-cell-label">Action</span>
              <button type="button" class="btn btn-danger" @click="$emit('delete-expense', expense.id)">Remove</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ExpenseForm from '../components/ExpenseForm.vue'
import { formatCurrency, formatDate } from '../lib/formatters'
import type { Account, CreditCard, Expense } from '../types'

const props = defineProps<{
  expenses: Expense[]
  accounts: Account[]
  accountBalances: Record<string, number>
  creditCards: CreditCard[]
  activeTrackerId: string
  currentUserId: string
  currentUserName: string
}>()

const emit = defineEmits<{
  'add-expense': [expense: Expense]
  'delete-expense': [id: string]
}>()

const selectedCategory = ref('')
const selectedAccountId = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const availableCategories = computed(() => [...new Set(props.expenses.map(expense => expense.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)))
const filteredExpenses = computed(() =>
  props.expenses
    .filter(expense => {
      if (selectedCategory.value && expense.category !== selectedCategory.value) return false
      if (selectedAccountId.value && expense.fromAccountId !== selectedAccountId.value) return false
      if (dateFrom.value && expense.date < dateFrom.value) return false
      if (dateTo.value && expense.date > dateTo.value) return false
      return true
    })
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
)

const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'trackerId'>) => {
  emit('add-expense', {
    ...expenseData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}

const accountName = (accountId: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'

const clearFilters = () => {
  selectedCategory.value = ''
  selectedAccountId.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

const creatorLabel = (expense: Expense) => {
  if (expense.createdByName?.trim()) {
    return expense.createdByName.trim()
  }

  if (props.currentUserId && props.currentUserName && expense.createdByUserId === props.currentUserId) {
    return props.currentUserName
  }

  return expense.createdByEmail ?? ''
}
</script>
