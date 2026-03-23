<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Transactions</p>
        <h2 class="section-title">Track outgoing transactions with context</h2>
        <p class="section-copy">
          Record everyday expenses, savings transfers, and which source funded each outgoing transaction.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Total entries</span>
        <strong class="amount-negative">{{ expenses.length }}</strong>
      </div>
    </div>

    <div class="status-banner">
      Credit card purchases are recorded here. Credit card payments should be logged from the Cards section.
    </div>

    <div class="content-grid">
      <ExpenseForm
        :savings-banks="availableSavingsBanks"
        :savings-bank-balances="savingsBankBalances"
        :credit-cards="creditCards"
        :credit-card-limits="creditCardLimits"
        :available-income="availableIncome"
        @submit="handleAddExpense"
      />

      <div class="stack">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h3 class="card-title">Transaction filters</h3>
              <p class="panel-copy">Narrow the transaction list by category, date, or funding source.</p>
            </div>
            <div class="panel-kpi">
              <span>Matching</span>
              <strong>{{ filteredExpenses.length }}</strong>
            </div>
          </div>

          <div class="ledger-filters transaction-filter-grid">
            <div class="form-group">
              <label class="form-label" for="transaction-filter-category">Category</label>
              <select id="transaction-filter-category" v-model="selectedCategory" class="form-select">
                <option value="">All categories</option>
                <option v-for="category in availableCategories" :key="category" :value="category">{{ category }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="transaction-filter-paid-from">Paid from</label>
              <select id="transaction-filter-paid-from" v-model="selectedFundingSource" class="form-select">
                <option value="">All sources</option>
                <option value="income">Income</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit card</option>
              </select>
            </div>

            <div class="form-group transaction-date-group">
              <label class="form-label">Date range</label>
              <div class="date-range-inputs">
                <input id="transaction-filter-from" v-model="dateFrom" type="date" class="form-input" />
                <span class="date-range-separator">to</span>
                <input id="transaction-filter-to" v-model="dateTo" type="date" class="form-input" />
              </div>
            </div>

            <button
              v-if="selectedCategory || selectedFundingSource || dateFrom || dateTo"
              type="button"
              class="btn btn-secondary transaction-filter-clear"
              @click="clearFilters"
            >
              Clear filters
            </button>
          </div>
        </section>

        <TransactionList
          title="All transactions"
          :items="filteredExpenses"
          :credit-card-names="creditCardNameMap"
          :show-delete="true"
          :scrollable="false"
          @delete="$emit('delete-expense', $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import ExpenseForm from '../components/ExpenseForm.vue'
import TransactionList from '../components/TransactionList.vue'
import { computed, ref } from 'vue'
import { buildSavingsBankBalanceMap, buildSavingsBankSummaries } from '../lib/savingsBanks'
import type { CreditCard, CreditCardTransaction, Expense, ExpenseFundingSource, Income, Saving } from '../types'

const props = defineProps<{
  expenses: Expense[]
  incomes: Income[]
  savings: Saving[]
  creditCards: CreditCard[]
  creditCardTransactions: CreditCardTransaction[]
  creditCardNameMap: Record<string, string>
  activeTrackerId: string
}>()

const emit = defineEmits<{
  'add-expense': [expense: Expense]
  'delete-expense': [id: string]
}>()

const selectedCategory = ref('')
const selectedFundingSource = ref<ExpenseFundingSource | ''>('')
const dateFrom = ref('')
const dateTo = ref('')

const availableSavingsBanks = computed(() => {
  return buildSavingsBankSummaries(props.savings).map(bank => bank.name)
})

const savingsBankBalances = computed<Record<string, number>>(() => {
  return buildSavingsBankBalanceMap(props.savings)
})

const creditCardLimits = computed<Record<string, { limitAmount: number; outstandingBalance: number; availableCredit: number }>>(() => {
  return props.creditCards.reduce<Record<string, { limitAmount: number; outstandingBalance: number; availableCredit: number }>>(
    (limits, card) => {
      const outstandingBalance = props.creditCardTransactions
        .filter(transaction => transaction.creditCardId === card.id)
        .reduce((sum, transaction) => sum + (transaction.type === 'charge' ? transaction.amount : -transaction.amount), 0)

      limits[card.id] = {
        limitAmount: card.limitAmount,
        outstandingBalance,
        availableCredit: card.limitAmount - outstandingBalance
      }

      return limits
    },
    {}
  )
})

const availableIncome = computed(() => {
  const totalIncome = props.incomes.reduce((sum, income) => sum + income.amount, 0)
  const incomeFundedMoves = props.expenses
    .filter(expense => expense.fundingSource === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const incomeFundedCardPayments = props.creditCardTransactions
    .filter(transaction => transaction.type === 'payment' && transaction.paymentSource === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  return totalIncome - incomeFundedMoves - incomeFundedCardPayments
})

const availableCategories = computed(() => {
  return [...new Set(props.expenses.map(expense => expense.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
})

const filteredExpenses = computed(() => {
  return props.expenses.filter(expense => {
    if (selectedCategory.value && expense.category !== selectedCategory.value) {
      return false
    }

    if (selectedFundingSource.value && expense.fundingSource !== selectedFundingSource.value) {
      return false
    }

    if (dateFrom.value && expense.date < dateFrom.value) {
      return false
    }

    if (dateTo.value && expense.date > dateTo.value) {
      return false
    }

    return true
  })
})

const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'trackerId'>) => {
  emit('add-expense', {
    ...expenseData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}

const clearFilters = () => {
  selectedCategory.value = ''
  selectedFundingSource.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}
</script>
