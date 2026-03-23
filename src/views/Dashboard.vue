<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Snapshot</p>
        <h2 class="section-title">Account-based financial overview</h2>
        <p class="section-copy">See balances, net position, recent activity, and how income and spending are flowing through real accounts.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Net position</span>
        <strong :class="netPosition >= 0 ? 'amount-positive' : 'amount-negative'">{{ formatCurrency(netPosition) }}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Assets</p>
          <strong class="metric-value">{{ formatCompactCurrency(assetTotal) }}</strong>
        </div>
        <p class="metric-copy">Money currently held across cash, banks, savings, and e-wallets.</p>
      </article>

      <article class="panel metric-card danger">
        <div>
          <p class="metric-label">Liabilities</p>
          <strong class="metric-value">{{ formatCompactCurrency(liabilityTotal) }}</strong>
        </div>
        <p class="metric-copy">Outstanding balances still owed on credit cards and other liabilities.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Net position</p>
          <strong class="metric-value">{{ formatCompactCurrency(netPosition) }}</strong>
        </div>
        <p class="metric-copy">Assets minus liabilities across the active tracker.</p>
      </article>

      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Cash on hand</p>
          <strong class="metric-value">{{ formatCompactCurrency(cashOnHand) }}</strong>
        </div>
        <p class="metric-copy">Combined balance of accounts marked as cash.</p>
      </article>
    </div>

    <div class="content-grid">
      <section class="panel panel-strong hero-card">
        <p class="eyebrow">Flow</p>
        <h2 class="section-title">See where your money is</h2>
        <p>Income adds money to an account, expenses take money out, and transfers show how money moves between accounts.</p>

        <div class="hero-list">
          <div class="hero-list-item">
            <div>
              <p class="label-muted">This month income</p>
              <strong>{{ formatCurrency(currentMonthIncome) }}</strong>
            </div>
            <span class="tag tag-success">{{ incomeSourcesThisMonth }} source{{ incomeSourcesThisMonth === 1 ? '' : 's' }}</span>
          </div>

          <div class="hero-list-item">
            <div>
              <p class="label-muted">This month expenses</p>
              <strong>{{ formatCurrency(currentMonthExpensesTotal) }}</strong>
            </div>
            <span class="tag" :class="currentMonthExpensesTotal > currentMonthIncome ? 'tag-danger' : 'tag-success'">{{ currentMonthExpensesTotal > currentMonthIncome ? 'Review spend' : 'Within inflow' }}</span>
          </div>

          <div class="hero-list-item">
            <div>
              <p class="label-muted">Transfers this month</p>
              <strong>{{ formatCurrency(currentMonthTransfersTotal) }}</strong>
            </div>
            <span class="tag">{{ currentMonthTransfers.length }} movement{{ currentMonthTransfers.length === 1 ? '' : 's' }}</span>
          </div>

          <div class="hero-list-item">
            <div>
              <p class="label-muted">Largest account</p>
              <strong>{{ topAccount?.name ?? 'No account yet' }}</strong>
            </div>
            <span class="tag">{{ topAccount ? formatCurrency(displayBalance(topAccount)) : '--' }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Top account balances</h3>
            <p class="panel-copy">The largest balances in the tracker, ordered across assets and liabilities.</p>
          </div>
        </div>

        <div v-if="sortedAccounts.length === 0" class="empty-state">
          <div class="empty-state-title">No accounts yet</div>
          <p class="empty-state-copy">Create accounts to see balance distribution here.</p>
        </div>

        <div v-else class="bank-list">
          <div v-for="account in sortedAccounts.slice(0, 6)" :key="account.id" class="bank-item">
            <div style="display: flex; gap: 0.9rem; align-items: center;">
              <div class="bank-mark">{{ initials(account.name) }}</div>
              <div>
                <div class="bank-name">{{ account.name }}</div>
                <div class="bank-copy">{{ account.accountType.replace(/_/g, ' ') }}</div>
              </div>
            </div>
            <strong :class="account.accountGroup === 'liability' ? 'amount-negative' : 'amount-positive'">{{ formatCurrency(displayBalance(account)) }}</strong>
          </div>
        </div>
      </section>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Recent activity</h3>
            <p class="panel-copy">A unified look at recent incomes, expenses, and transfers.</p>
          </div>
        </div>

        <div v-if="recentActivity.length === 0" class="empty-state">
          <div class="empty-state-title">No activity yet</div>
          <p class="empty-state-copy">Tracker activity will appear here once entries are recorded.</p>
        </div>

        <div v-else class="stack list-scroll-shell">
          <article v-for="item in recentActivity" :key="item.id" class="transaction-item">
            <div class="transaction-main">
              <div class="transaction-title">{{ item.title }}</div>
              <div class="transaction-meta">{{ formatDate(item.date) }} · {{ item.subtitle }}</div>
            </div>
            <strong
              class="transaction-amount"
              :class="item.tone === 'positive' ? 'amount-positive' : item.tone === 'negative' ? 'amount-negative' : ''"
            >
              {{ item.tone === 'neutral' ? formatCurrency(item.amount) : formatCurrency(Math.abs(item.amount)) }}
            </strong>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Income by source</h3>
            <p class="panel-copy">The biggest income sources for the current month.</p>
          </div>
        </div>

        <div v-if="incomeBreakdown.length === 0" class="empty-state">
          <div class="empty-state-title">No income this month</div>
          <p class="empty-state-copy">Monthly source totals will appear here after income is recorded.</p>
        </div>

        <div v-else class="stack">
          <article v-for="item in incomeBreakdown" :key="item.name" class="report-row">
            <div>
              <div class="report-row-title">{{ item.name }}</div>
              <div class="report-row-copy">{{ item.entries }} entr{{ item.entries === 1 ? 'y' : 'ies' }}</div>
            </div>
            <strong class="amount-positive">{{ formatCurrency(item.total) }}</strong>
          </article>
        </div>
      </section>
    </div>

    <div class="content-grid">
      <ExpenseTrendChart :view="dashboardActiveView" :points="dashboardTrendPoints" />
      <CategoryChart title="Expense by Category" :items="currentMonthExpenses" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CategoryChart from '../components/CategoryChart.vue'
import ExpenseTrendChart from '../components/ExpenseTrendChart.vue'
import { getAssetTotal, getDisplayBalance, getLiabilityTotal, getNetPosition, sortAccountsForDisplay } from '../lib/accountBalances'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/formatters'
import type { Account, CreditCard, Expense, Income, Transfer, AccountAdjustment } from '../types'

const props = defineProps<{
  accounts: Account[]
  accountBalances: Record<string, number>
  incomes: Income[]
  expenses: Expense[]
  transfers: Transfer[]
  accountAdjustments: AccountAdjustment[]
  creditCards: CreditCard[]
}>()

const dashboardActiveView = ref<'daily' | 'weekly' | 'monthly'>('monthly')
const assetTotal = computed(() => getAssetTotal(props.accounts, props.accountBalances))
const liabilityTotal = computed(() => getLiabilityTotal(props.accounts, props.accountBalances))
const netPosition = computed(() => getNetPosition(props.accounts, props.accountBalances))
const sortedAccounts = computed(() => sortAccountsForDisplay(props.accounts.filter(account => account.isActive), props.accountBalances))
const topAccount = computed(() => sortedAccounts.value[0] ?? null)
const cashOnHand = computed(() => props.accounts.filter(account => account.accountType === 'cash').reduce((sum, account) => sum + (props.accountBalances[account.id] ?? 0), 0))
const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
const currentMonthIncomes = computed(() => props.incomes.filter(income => income.date.startsWith(currentMonthKey)))
const currentMonthExpenses = computed(() => props.expenses.filter(expense => expense.date.startsWith(currentMonthKey)))
const currentMonthTransfers = computed(() => props.transfers.filter(transfer => transfer.date.startsWith(currentMonthKey)))
const currentMonthIncome = computed(() => currentMonthIncomes.value.reduce((sum, income) => sum + income.amount, 0))
const currentMonthExpensesTotal = computed(() => currentMonthExpenses.value.reduce((sum, expense) => sum + expense.amount, 0))
const currentMonthTransfersTotal = computed(() => currentMonthTransfers.value.reduce((sum, transfer) => sum + transfer.amount, 0))
const incomeSourcesThisMonth = computed(() => new Set(currentMonthIncomes.value.map(income => income.source?.trim() || 'General income')).size)

const incomeBreakdown = computed(() => {
  const grouped = currentMonthIncomes.value.reduce<Record<string, { total: number; entries: number }>>((acc, income) => {
    const source = income.source?.trim() || 'General income'
    acc[source] = acc[source] ?? { total: 0, entries: 0 }
    acc[source].total += income.amount
    acc[source].entries += 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, total: value.total, entries: value.entries }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
})

const accountName = (accountId: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'
const displayBalance = (account: Account) => getDisplayBalance(account, props.accountBalances[account.id] ?? 0)
const initials = (value: string) => value.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('')

const recentActivity = computed(() => {
  return [
    ...props.incomes.map(income => ({
      id: `income-${income.id}`,
      date: income.date,
      amount: income.amount,
      tone: 'positive' as const,
      title: income.source?.trim() || 'Income',
      subtitle: `To ${accountName(income.toAccountId)}`
    })),
    ...props.expenses.map(expense => ({
      id: `expense-${expense.id}`,
      date: expense.date,
      amount: -expense.amount,
      tone: 'negative' as const,
      title: expense.category,
      subtitle: `From ${accountName(expense.fromAccountId)}`
    })),
    ...props.transfers.map(transfer => ({
      id: `transfer-${transfer.id}`,
      date: transfer.date,
      amount: transfer.amount,
      tone: 'neutral' as const,
      title: `${accountName(transfer.fromAccountId)} -> ${accountName(transfer.toAccountId)}`,
      subtitle: transfer.transferType.replace(/_/g, ' ')
    }))
  ]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 10)
})

const dashboardTrendPoints = computed(() => {
  if (dashboardActiveView.value === 'daily') {
    const grouped = props.expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.date] = (acc[expense.date] ?? 0) + expense.amount
      return acc
    }, {})

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, total]) => ({ label: date.slice(5), value: total }))
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

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([weekStart, total]) => ({ label: weekStart.slice(5), value: total }))
  }

  const grouped = props.expenses.reduce<Record<string, number>>((acc, expense) => {
    const monthKey = expense.date.slice(0, 7)
    acc[monthKey] = (acc[monthKey] ?? 0) + expense.amount
    return acc
  }, {})

  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, total]) => ({ label: month, value: total }))
})
</script>
