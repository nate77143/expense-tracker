<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Snapshot</p>
        <h2 class="section-title">Cash flow at a glance</h2>
        <p class="section-copy">
          Stay on top of income, expenses, and available savings with a clean view of where money is moving right now.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Net position</span>
        <strong :class="netBalance >= 0 ? 'amount-positive' : 'amount-negative'">
          {{ formatCurrency(netBalance) }}
        </strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Total income</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalIncome) }}</strong>
        </div>
        <p class="metric-copy">All recorded earnings across salary, freelance work, and other sources.</p>
      </article>

      <article class="panel metric-card danger">
        <div>
          <p class="metric-label">Total expenses</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalExpenses) }}</strong>
        </div>
        <p class="metric-copy">Every outgoing transaction captured across your tracked categories.</p>
      </article>

      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Net balance</p>
          <strong class="metric-value">{{ formatCompactCurrency(netBalance) }}</strong>
        </div>
        <p class="metric-copy">{{ balanceCopy }}</p>
      </article>

      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Available savings</p>
          <strong class="metric-value">{{ formatCompactCurrency(availableSavings) }}</strong>
        </div>
        <p class="metric-copy">Savings records minus expenses that were explicitly paid from savings.</p>
      </article>
    </div>

    <div class="split-hero">
      <article class="panel panel-strong hero-card">
        <p class="eyebrow">Momentum</p>
        <h2 class="section-title">Spend intentionally, not reactively</h2>
        <p>
          Your latest records show how current spending compares with income and how much liquidity you are still
          protecting in savings.
        </p>

        <div class="hero-list">
          <div class="hero-list-item">
            <div>
              <p class="label-muted">Expense coverage ratio</p>
              <strong>{{ coverageRatio }}</strong>
            </div>
            <span class="tag" :class="netBalance >= 0 ? 'tag-success' : 'tag-danger'">
              {{ netBalance >= 0 ? 'Healthy cash flow' : 'Review spending' }}
            </span>
          </div>

          <div class="hero-list-item">
            <div>
              <p class="label-muted">Paid from savings</p>
              <strong>{{ formatCurrency(savingsFundedExpenses) }}</strong>
            </div>
            <span class="tag" :class="savingsFundedExpenses > 0 ? 'tag-danger' : 'tag-success'">
              {{ savingsFundedExpenses > 0 ? 'Savings used' : 'No savings used' }}
            </span>
          </div>

          <div class="hero-list-item">
            <div>
              <p class="label-muted">Recent activity</p>
              <strong>{{ recentActivityLabel }}</strong>
            </div>
            <span class="tag">{{ recentExpenses.length + recentIncomes.length }} entries</span>
          </div>

          <div class="hero-list-item">
            <div>
              <p class="label-muted">Savings movement</p>
              <strong>{{ savingsMovementLabel }}</strong>
            </div>
            <span class="tag" :class="savingsMovementTone">
              {{ savingsMovementDeltaLabel }}
            </span>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Savings by bank</h3>
            <p class="panel-copy">A quick look at how your recorded savings entries are distributed.</p>
          </div>
          <div class="panel-kpi">
            <span>Recorded savings</span>
            <strong class="amount-positive">{{ formatCurrency(totalRecordedSavings) }}</strong>
          </div>
        </div>

        <div v-if="bankBreakdown.length === 0" class="empty-state">
          <div class="empty-state-title">No savings accounts yet</div>
          <p class="empty-state-copy">Add your first savings record to see account distribution here.</p>
        </div>

        <div v-else class="bank-list">
          <div v-for="bank in bankBreakdown" :key="bank.name" class="bank-item">
            <div style="display: flex; gap: 0.9rem; align-items: center;">
              <div class="bank-mark">{{ bank.initials }}</div>
              <div>
                <div class="bank-name">{{ bank.name }}</div>
                <div class="bank-copy">{{ bank.entries }} record{{ bank.entries === 1 ? '' : 's' }}</div>
              </div>
            </div>
            <strong class="saving-amount amount-positive">{{ formatCurrency(bank.amount) }}</strong>
          </div>
        </div>
      </article>
    </div>

    <div class="content-grid">
      <TransactionList title="Recent expenses" :items="recentExpenses" :show-delete="false" />
      <TransactionList title="Recent income" :items="recentIncomes" :is-income="true" :show-delete="false" />
    </div>

    <section class="page-section">
      <div class="section-header">
        <div>
          <p class="eyebrow">Trends</p>
          <h2 class="section-title">Expense movement over time</h2>
          <p class="section-copy">Switch between daily, weekly, and monthly views to see spending momentum clearly.</p>
        </div>
        <div class="segmented" role="tablist" aria-label="Dashboard trend range">
          <button
            v-for="view in views"
            :key="view"
            class="segment-button"
            :class="{ active: dashboardActiveView === view }"
            type="button"
            @click="dashboardActiveView = view"
          >
            {{ capitalize(view) }}
          </button>
        </div>
      </div>

      <div class="content-grid">
        <ExpenseTrendChart :view="dashboardActiveView" :points="dashboardTrendPoints" />
        <SavingsTrendChart :points="dashboardSavingsTrendPoints" />
      </div>
    </section>

    <div class="content-grid">
      <ReportSection title="This month's expenses" :items="currentMonthExpenses" />
      <CategoryChart title="Current category mix" :items="currentMonthExpenses" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CategoryChart from '../components/CategoryChart.vue'
import ExpenseTrendChart from '../components/ExpenseTrendChart.vue'
import ReportSection from '../components/ReportSection.vue'
import SavingsTrendChart from '../components/SavingsTrendChart.vue'
import TransactionList from '../components/TransactionList.vue'
import { formatCompactCurrency, formatCurrency } from '../lib/formatters'
import type { Expense, Income, Saving } from '../types'

const props = defineProps<{
  expenses: Expense[]
  incomes: Income[]
  savings: Saving[]
}>()

const dashboardActiveView = ref<'daily' | 'weekly' | 'monthly'>('monthly')
const views: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly']

const totalExpenses = computed(() => props.expenses.reduce((sum, expense) => sum + expense.amount, 0))
const totalIncome = computed(() => props.incomes.reduce((sum, income) => sum + income.amount, 0))
const incomeFundedExpenses = computed(() =>
  props.expenses
    .filter(expense => expense.fundingSource !== 'savings')
    .reduce((sum, expense) => sum + expense.amount, 0)
)
const savingsFundedExpenses = computed(() =>
  props.expenses
    .filter(expense => expense.fundingSource === 'savings')
    .reduce((sum, expense) => sum + expense.amount, 0)
)
const netBalance = computed(() => totalIncome.value - incomeFundedExpenses.value)
const totalRecordedSavings = computed(() => props.savings.reduce((sum, saving) => sum + saving.amount, 0))
const availableSavings = computed(() => totalRecordedSavings.value - savingsFundedExpenses.value)

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const currentMonthKey = computed(() => getMonthKey(new Date()))

const previousMonthKey = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return getMonthKey(date)
})

const currentMonthSavingsTotal = computed(() => {
  const monthlySaved = props.savings
    .filter(saving => saving.date.startsWith(currentMonthKey.value))
    .reduce((sum, saving) => sum + saving.amount, 0)
  const monthlySavingsSpend = props.expenses
    .filter(expense => expense.fundingSource === 'savings' && expense.date.startsWith(currentMonthKey.value))
    .reduce((sum, expense) => sum + expense.amount, 0)

  return monthlySaved - monthlySavingsSpend
})

const previousMonthSavingsTotal = computed(() => {
  const monthlySaved = props.savings
    .filter(saving => saving.date.startsWith(previousMonthKey.value))
    .reduce((sum, saving) => sum + saving.amount, 0)
  const monthlySavingsSpend = props.expenses
    .filter(expense => expense.fundingSource === 'savings' && expense.date.startsWith(previousMonthKey.value))
    .reduce((sum, expense) => sum + expense.amount, 0)

  return monthlySaved - monthlySavingsSpend
})

const savingsMovementDelta = computed(() => currentMonthSavingsTotal.value - previousMonthSavingsTotal.value)

const savingsMovementLabel = computed(() => {
  if (currentMonthSavingsTotal.value === 0 && previousMonthSavingsTotal.value === 0) {
    return 'No savings entries yet'
  }

  return `${formatCurrency(currentMonthSavingsTotal.value)} saved this month`
})

const savingsMovementDeltaLabel = computed(() => {
  if (currentMonthSavingsTotal.value === 0 && previousMonthSavingsTotal.value === 0) {
    return 'Waiting for data'
  }

  if (savingsMovementDelta.value === 0) {
    return 'Flat vs last month'
  }

  const direction = savingsMovementDelta.value > 0 ? '+' : '-'
  return `${direction}${formatCurrency(Math.abs(savingsMovementDelta.value))} vs last month`
})

const savingsMovementTone = computed(() => {
  if (currentMonthSavingsTotal.value === 0 && previousMonthSavingsTotal.value === 0) {
    return ''
  }

  if (savingsMovementDelta.value > 0) {
    return 'tag-success'
  }

  if (savingsMovementDelta.value < 0) {
    return 'tag-danger'
  }

  return ''
})

const balanceCopy = computed(() => {
  if (netBalance.value >= 0) {
    return 'Income is covering income-funded spending while savings stay separated.'
  }

  return 'Income-funded spending is outpacing income, so it is a good time to review priorities.'
})

const coverageRatio = computed(() => {
  if (totalIncome.value === 0) {
    return '0%'
  }

  return `${Math.round((incomeFundedExpenses.value / totalIncome.value) * 100)}% of income`
})

const bankBreakdown = computed(() => {
  const grouped = props.savings.reduce<Record<string, { amount: number; entries: number }>>((acc, saving) => {
    const key = saving.bank.trim() || 'Unassigned'
    acc[key] = acc[key] ?? { amount: 0, entries: 0 }
    acc[key].amount += saving.amount
    acc[key].entries += 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({
      name,
      amount: value.amount,
      entries: value.entries,
      initials: name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? '')
        .join('')
    }))
    .sort((a, b) => b.amount - a.amount)
})

const recentExpenses = computed(() => props.expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5))
const recentIncomes = computed(() => props.incomes.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5))

const recentActivityLabel = computed(() => {
  const dates = [...recentExpenses.value, ...recentIncomes.value].map(item => item.date).sort().reverse()
  if (dates.length === 0) {
    return 'No recent activity'
  }

  return `Latest on ${dates[0]}`
})

const dashboardTrendPoints = computed(() => {
  if (dashboardActiveView.value === 'daily') {
    const grouped = props.expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.date] = (acc[expense.date] ?? 0) + expense.amount
      return acc
    }, {})

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, total]) => ({ label: date.slice(5), value: total }))
  }

  if (dashboardActiveView.value === 'weekly') {
    const grouped = props.expenses.reduce<Record<string, number>>((acc, expense) => {
      const date = new Date(`${expense.date}T00:00:00`)
      const dayOfWeek = date.getDay()
      const offset = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(date)
      weekStart.setDate(offset)
      const key = weekStart.toISOString().slice(0, 10)
      acc[key] = (acc[key] ?? 0) + expense.amount
      return acc
    }, {})

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([weekStart, total]) => ({ label: weekStart.slice(5), value: total }))
  }

  const grouped = props.expenses.reduce<Record<string, number>>((acc, expense) => {
    const monthKey = expense.date.slice(0, 7)
    acc[monthKey] = (acc[monthKey] ?? 0) + expense.amount
    return acc
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ label: month, value: total }))
})

const dashboardSavingsTrendPoints = computed(() => {
  const groupedSavings = props.savings.reduce<Record<string, number>>((acc, saving) => {
    const monthKey = saving.date.slice(0, 7)
    acc[monthKey] = (acc[monthKey] ?? 0) + saving.amount
    return acc
  }, {})

  const groupedSavingsSpend = props.expenses.reduce<Record<string, number>>((acc, expense) => {
    if (expense.fundingSource !== 'savings') {
      return acc
    }

    const monthKey = expense.date.slice(0, 7)
    acc[monthKey] = (acc[monthKey] ?? 0) + expense.amount
    return acc
  }, {})

  const monthKeys = [...new Set([...Object.keys(groupedSavings), ...Object.keys(groupedSavingsSpend)])].sort((a, b) =>
    a.localeCompare(b)
  )

  return monthKeys.slice(-6).map(month => ({
    label: month,
    value: (groupedSavings[month] ?? 0) - (groupedSavingsSpend[month] ?? 0)
  }))
})

const currentMonthExpenses = computed(() => {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return props.expenses.filter(expense => expense.date.startsWith(monthKey))
})

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
</script>
