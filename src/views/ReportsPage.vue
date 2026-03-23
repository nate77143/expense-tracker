<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reports</p>
        <h2 class="section-title">Advanced finance reporting</h2>
        <p class="section-copy">Review income, expenses, transfers, and balance trends from the same account-based ledger.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Selected range</span>
        <strong>{{ selectedRange.label }}</strong>
      </div>
    </div>

    <div class="segmented" role="tablist" aria-label="Report view selector">
      <button v-for="view in views" :key="view" class="segment-button" :class="{ active: activeView === view }" type="button" @click="activeView = view">
        {{ capitalize(view) }}
      </button>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Income</p>
          <strong class="metric-value">{{ formatCompactCurrency(selectedIncomeTotal) }}</strong>
        </div>
        <p class="metric-copy">Money received during the selected reporting window.</p>
      </article>

      <article class="panel metric-card danger">
        <div>
          <p class="metric-label">Expenses</p>
          <strong class="metric-value">{{ formatCompactCurrency(selectedExpenseTotal) }}</strong>
        </div>
        <p class="metric-copy">Money spent from source accounts in the same period.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Net cash flow</p>
          <strong class="metric-value">{{ formatCompactCurrency(selectedNetCashFlow) }}</strong>
        </div>
        <p class="metric-copy">Income minus expenses. Transfers are tracked separately because they only move money around.</p>
      </article>

      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Transfer volume</p>
          <strong class="metric-value">{{ formatCompactCurrency(selectedTransferVolume) }}</strong>
        </div>
        <p class="metric-copy">Internal movements between payroll, cash, savings, e-wallets, and cards.</p>
      </article>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Cash flow trend</h3>
            <p class="panel-copy">Compare income, expenses, and net cash flow across recent periods.</p>
          </div>
          <div class="panel-kpi">
            <span>{{ capitalize(activeView) }} net</span>
            <strong :class="selectedNetCashFlow >= 0 ? 'amount-positive' : 'amount-negative'">{{ formatCurrency(selectedNetCashFlow) }}</strong>
          </div>
        </div>

        <div v-if="cashFlowTrendPoints.length === 0" class="empty-state">
          <div class="empty-state-title">No cash flow data yet</div>
          <p class="empty-state-copy">Add income or expenses to populate the trend.</p>
        </div>

        <div v-else class="chart-frame">
          <apexchart type="line" :options="cashFlowChartOptions" :series="cashFlowChartSeries" height="320"></apexchart>
        </div>
      </section>

      <CategoryChart :title="`Expenses by Category (${capitalize(activeView)})`" :items="filteredExpenses" />
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Income by source</h3>
            <p class="panel-copy">Which income streams contributed the most in the selected period.</p>
          </div>
          <div class="panel-kpi">
            <span>Sources</span>
            <strong class="amount-positive">{{ incomeSourceBreakdown.length }}</strong>
          </div>
        </div>

        <div v-if="incomeSourceBreakdown.length === 0" class="empty-state">
          <div class="empty-state-title">No income in this period</div>
          <p class="empty-state-copy">Income sources will appear here once records are added.</p>
        </div>

        <div v-else class="stack">
          <article v-for="item in incomeSourceBreakdown" :key="item.name" class="report-row">
            <div>
              <div class="report-row-title">{{ item.name }}</div>
              <div class="report-row-copy">{{ item.entries }} entr{{ item.entries === 1 ? 'y' : 'ies' }}</div>
            </div>
            <strong class="amount-positive">{{ formatCurrency(item.total) }}</strong>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Income by destination account</h3>
            <p class="panel-copy">See which accounts actually received the period's income.</p>
          </div>
          <div class="panel-kpi">
            <span>Accounts</span>
            <strong class="amount-positive">{{ incomeDestinationBreakdown.length }}</strong>
          </div>
        </div>

        <div v-if="incomeDestinationBreakdown.length === 0" class="empty-state">
          <div class="empty-state-title">No destination data yet</div>
          <p class="empty-state-copy">Income destination accounts will appear here after income is recorded.</p>
        </div>

        <div v-else class="stack">
          <article v-for="item in incomeDestinationBreakdown" :key="item.name" class="report-row">
            <div>
              <div class="report-row-title">{{ item.name }}</div>
              <div class="report-row-copy">{{ item.entries }} deposit{{ item.entries === 1 ? '' : 's' }}</div>
            </div>
            <strong class="amount-positive">{{ formatCurrency(item.total) }}</strong>
          </article>
        </div>
      </section>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Expenses by source account</h3>
            <p class="panel-copy">Spot which accounts funded the most spending in the selected period.</p>
          </div>
          <div class="panel-kpi">
            <span>Accounts</span>
            <strong class="amount-negative">{{ expenseAccountBreakdown.length }}</strong>
          </div>
        </div>

        <div v-if="expenseAccountBreakdown.length === 0" class="empty-state">
          <div class="empty-state-title">No expense account data yet</div>
          <p class="empty-state-copy">Expenses in the selected period will be grouped here.</p>
        </div>

        <div v-else class="stack">
          <article v-for="item in expenseAccountBreakdown" :key="item.name" class="report-row">
            <div>
              <div class="report-row-title">{{ item.name }}</div>
              <div class="report-row-copy">{{ item.entries }} entr{{ item.entries === 1 ? 'y' : 'ies' }}</div>
            </div>
            <strong class="amount-negative">{{ formatCurrency(item.total) }}</strong>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Transfers by route</h3>
            <p class="panel-copy">See the largest internal money movements between accounts.</p>
          </div>
          <div class="panel-kpi">
            <span>Moves</span>
            <strong>{{ filteredTransfers.length }}</strong>
          </div>
        </div>

        <div v-if="transferRouteBreakdown.length === 0" class="empty-state">
          <div class="empty-state-title">No transfers in this period</div>
          <p class="empty-state-copy">Withdrawals, top-ups, savings moves, and card payments will appear here.</p>
        </div>

        <div v-else class="stack">
          <article v-for="item in transferRouteBreakdown" :key="item.name" class="report-row">
            <div>
              <div class="report-row-title">{{ item.name }}</div>
              <div class="report-row-copy">{{ item.entries }} movement{{ item.entries === 1 ? '' : 's' }}</div>
            </div>
            <strong>{{ formatCurrency(item.total) }}</strong>
          </article>
        </div>
      </section>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Balance trend</h3>
            <p class="panel-copy">Track how net position, cash on hand, and liabilities changed over recent months.</p>
          </div>
          <div class="panel-kpi">
            <span>Current net</span>
            <strong :class="latestBalanceSnapshot.netPosition >= 0 ? 'amount-positive' : 'amount-negative'">{{ formatCurrency(latestBalanceSnapshot.netPosition) }}</strong>
          </div>
        </div>

        <div v-if="balanceTrendPoints.length === 0" class="empty-state">
          <div class="empty-state-title">No balance trend yet</div>
          <p class="empty-state-copy">Balances will start charting once account activity is recorded.</p>
        </div>

        <div v-else class="chart-frame">
          <apexchart type="line" :options="balanceTrendChartOptions" :series="balanceTrendChartSeries" height="320"></apexchart>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Current vs previous {{ activeView }}</h3>
            <p class="panel-copy">A quick comparison to show whether money flow is improving or getting tighter.</p>
          </div>
          <div class="panel-kpi">
            <span>Previous range</span>
            <strong>{{ previousRange.shortLabel }}</strong>
          </div>
        </div>

        <div class="stack">
          <article v-for="item in comparisonRows" :key="item.label" class="report-row">
            <div>
              <div class="report-row-title">{{ item.label }}</div>
              <div class="report-row-copy">Previous: {{ formatCurrency(item.previous) }}</div>
            </div>
            <div style="text-align: right;">
              <strong :class="item.currentTone">{{ formatCurrency(item.current) }}</strong>
              <div class="report-row-copy" :class="item.deltaTone">{{ formatDelta(item.delta) }}</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CategoryChart from '../components/CategoryChart.vue'
import { formatCompactCurrency, formatCurrency, formatDate, formatMonth } from '../lib/formatters'
import type { Account, AccountAdjustment, Expense, Income, Transfer } from '../types'

type ReportView = 'daily' | 'weekly' | 'monthly'
type DateRange = {
  start: string
  end: string
  label: string
  shortLabel: string
}

type BreakdownRow = {
  name: string
  total: number
  entries: number
}

type CashFlowTrendPoint = {
  label: string
  income: number
  expenses: number
  net: number
}

type BalanceTrendPoint = {
  label: string
  netPosition: number
  cashOnHand: number
  liabilities: number
}

const props = defineProps<{
  incomes: Income[]
  expenses: Expense[]
  transfers: Transfer[]
  accounts: Account[]
  accountAdjustments: AccountAdjustment[]
}>()

const activeView = ref<ReportView>('monthly')
const views: ReportView[] = ['daily', 'weekly', 'monthly']

const parseDate = (value: string) => new Date(`${value}T00:00:00`)
const toDateString = (value: Date) => value.toISOString().slice(0, 10)
const accountName = (accountId: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'
const monthKeyFromDate = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
const shortMonthLabel = (monthKey: string) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parseDate(`${monthKey}-01`))

const addDays = (value: Date, days: number) => {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

const addMonths = (value: Date, months: number) => {
  const next = new Date(value)
  next.setMonth(next.getMonth() + months)
  return next
}

const startOfWeek = (value: Date) => {
  const next = new Date(value)
  const dayOfWeek = next.getDay()
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  next.setDate(next.getDate() + offset)
  next.setHours(0, 0, 0, 0)
  return next
}

const endOfWeek = (start: Date) => {
  const next = addDays(start, 6)
  next.setHours(0, 0, 0, 0)
  return next
}

const getRangeForView = (view: ReportView, offset = 0): DateRange => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (view === 'daily') {
    const date = addDays(now, offset)
    const dateString = toDateString(date)
    return {
      start: dateString,
      end: dateString,
      label: formatDate(dateString),
      shortLabel: formatDate(dateString)
    }
  }

  if (view === 'weekly') {
    const anchor = addDays(now, offset * 7)
    const start = startOfWeek(anchor)
    const end = endOfWeek(start)
    const startString = toDateString(start)
    const endString = toDateString(end)
    return {
      start: startString,
      end: endString,
      label: `${formatDate(startString)} - ${formatDate(endString)}`,
      shortLabel: formatDate(startString)
    }
  }

  const anchor = addMonths(now, offset)
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  const monthKey = monthKeyFromDate(start)
  return {
    start: toDateString(start),
    end: toDateString(end),
    label: formatMonth(monthKey),
    shortLabel: formatMonth(monthKey)
  }
}

const inRange = (date: string, range: DateRange) => date >= range.start && date <= range.end

const selectedRange = computed(() => getRangeForView(activeView.value, 0))
const previousRange = computed(() => getRangeForView(activeView.value, -1))

const filteredIncomes = computed(() => props.incomes.filter(income => inRange(income.date, selectedRange.value)))
const filteredExpenses = computed(() => props.expenses.filter(expense => inRange(expense.date, selectedRange.value)))
const filteredTransfers = computed(() => props.transfers.filter(transfer => inRange(transfer.date, selectedRange.value)))

const previousIncomes = computed(() => props.incomes.filter(income => inRange(income.date, previousRange.value)))
const previousExpenses = computed(() => props.expenses.filter(expense => inRange(expense.date, previousRange.value)))
const previousTransfers = computed(() => props.transfers.filter(transfer => inRange(transfer.date, previousRange.value)))

const selectedIncomeTotal = computed(() => filteredIncomes.value.reduce((sum, income) => sum + income.amount, 0))
const selectedExpenseTotal = computed(() => filteredExpenses.value.reduce((sum, expense) => sum + expense.amount, 0))
const selectedNetCashFlow = computed(() => selectedIncomeTotal.value - selectedExpenseTotal.value)
const selectedTransferVolume = computed(() => filteredTransfers.value.reduce((sum, transfer) => sum + transfer.amount, 0))

const previousIncomeTotal = computed(() => previousIncomes.value.reduce((sum, income) => sum + income.amount, 0))
const previousExpenseTotal = computed(() => previousExpenses.value.reduce((sum, expense) => sum + expense.amount, 0))
const previousNetCashFlow = computed(() => previousIncomeTotal.value - previousExpenseTotal.value)
const previousTransferVolume = computed(() => previousTransfers.value.reduce((sum, transfer) => sum + transfer.amount, 0))

const buildBreakdown = <T,>(items: T[], labelFor: (item: T) => string, amountFor: (item: T) => number, limit = 6): BreakdownRow[] => {
  const grouped = items.reduce<Record<string, BreakdownRow>>((acc, item) => {
    const name = labelFor(item)
    acc[name] = acc[name] ?? { name, total: 0, entries: 0 }
    acc[name].total += amountFor(item)
    acc[name].entries += 1
    return acc
  }, {})

  return Object.values(grouped)
    .sort((left, right) => right.total - left.total)
    .slice(0, limit)
}

const incomeSourceBreakdown = computed(() => buildBreakdown(filteredIncomes.value, income => income.source?.trim() || 'General income', income => income.amount))
const incomeDestinationBreakdown = computed(() => buildBreakdown(filteredIncomes.value, income => accountName(income.toAccountId), income => income.amount))
const expenseAccountBreakdown = computed(() => buildBreakdown(filteredExpenses.value, expense => accountName(expense.fromAccountId), expense => expense.amount))
const transferRouteBreakdown = computed(() => buildBreakdown(filteredTransfers.value, transfer => `${accountName(transfer.fromAccountId)} -> ${accountName(transfer.toAccountId)}`, transfer => transfer.amount))

const cashFlowTrendPoints = computed<CashFlowTrendPoint[]>(() => {
  const points: CashFlowTrendPoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (activeView.value === 'daily') {
    for (let offset = -6; offset <= 0; offset += 1) {
      const current = addDays(today, offset)
      const key = toDateString(current)
      const income = props.incomes.filter(item => item.date === key).reduce((sum, item) => sum + item.amount, 0)
      const expenses = props.expenses.filter(item => item.date === key).reduce((sum, item) => sum + item.amount, 0)
      points.push({
        label: key.slice(5),
        income,
        expenses,
        net: income - expenses
      })
    }

    return points
  }

  if (activeView.value === 'weekly') {
    const currentWeekStart = startOfWeek(today)
    for (let offset = -7; offset <= 0; offset += 1) {
      const start = addDays(currentWeekStart, offset * 7)
      const end = endOfWeek(start)
      const range = { start: toDateString(start), end: toDateString(end), label: '', shortLabel: '' }
      const income = props.incomes.filter(item => inRange(item.date, range)).reduce((sum, item) => sum + item.amount, 0)
      const expenses = props.expenses.filter(item => inRange(item.date, range)).reduce((sum, item) => sum + item.amount, 0)
      points.push({
        label: range.start.slice(5),
        income,
        expenses,
        net: income - expenses
      })
    }

    return points
  }

  for (let offset = -5; offset <= 0; offset += 1) {
    const anchor = addMonths(today, offset)
    const monthKey = monthKeyFromDate(anchor)
    const income = props.incomes.filter(item => item.date.startsWith(monthKey)).reduce((sum, item) => sum + item.amount, 0)
    const expenses = props.expenses.filter(item => item.date.startsWith(monthKey)).reduce((sum, item) => sum + item.amount, 0)
    points.push({
      label: shortMonthLabel(monthKey),
      income,
      expenses,
      net: income - expenses
    })
  }

  return points
})

const buildBalanceMapAtDate = (endDate: string) => {
  const balances = props.accounts.reduce<Record<string, number>>((acc, account) => {
    acc[account.id] = 0
    return acc
  }, {})

  for (const income of props.incomes) {
    if (income.date <= endDate) {
      balances[income.toAccountId] = (balances[income.toAccountId] ?? 0) + income.amount
    }
  }

  for (const expense of props.expenses) {
    if (expense.date <= endDate) {
      balances[expense.fromAccountId] = (balances[expense.fromAccountId] ?? 0) - expense.amount
    }
  }

  for (const transfer of props.transfers) {
    if (transfer.date <= endDate) {
      balances[transfer.fromAccountId] = (balances[transfer.fromAccountId] ?? 0) - transfer.amount
      balances[transfer.toAccountId] = (balances[transfer.toAccountId] ?? 0) + transfer.amount
    }
  }

  for (const adjustment of props.accountAdjustments) {
    if (adjustment.date <= endDate) {
      balances[adjustment.accountId] = (balances[adjustment.accountId] ?? 0) + adjustment.amount
    }
  }

  return balances
}

const balanceTrendPoints = computed<BalanceTrendPoint[]>(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return Array.from({ length: 6 }, (_, index) => index - 5).map(offset => {
    const anchor = addMonths(now, offset)
    const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    const monthKey = monthKeyFromDate(anchor)
    const balanceMap = buildBalanceMapAtDate(toDateString(monthEnd))
    const netPosition = Object.values(balanceMap).reduce((sum, value) => sum + value, 0)
    const cashOnHand = props.accounts
      .filter(account => account.accountType === 'cash')
      .reduce((sum, account) => sum + (balanceMap[account.id] ?? 0), 0)
    const liabilities = props.accounts
      .filter(account => account.accountGroup === 'liability')
      .reduce((sum, account) => sum + Math.abs(Math.min(balanceMap[account.id] ?? 0, 0)), 0)

    return {
      label: shortMonthLabel(monthKey),
      netPosition,
      cashOnHand,
      liabilities
    }
  })
})

const latestBalanceSnapshot = computed(() => balanceTrendPoints.value[balanceTrendPoints.value.length - 1] ?? { netPosition: 0, cashOnHand: 0, liabilities: 0 })

const cashFlowChartOptions = computed(() => ({
  chart: {
    type: 'line',
    stacked: false,
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#52617a',
    fontFamily: 'Aptos, Segoe UI Variable, Segoe UI, sans-serif'
  },
  colors: ['#15803d', '#b91c1c', '#1e4ed8'],
  dataLabels: { enabled: false },
  stroke: {
    width: [0, 0, 4],
    curve: 'smooth'
  },
  plotOptions: {
    bar: {
      columnWidth: '46%',
      borderRadius: 6
    }
  },
  grid: {
    borderColor: 'rgba(116, 134, 166, 0.18)',
    strokeDashArray: 4
  },
  xaxis: {
    categories: cashFlowTrendPoints.value.map(point => point.label),
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      formatter: (value: number) => formatCurrency(value)
    }
  },
  tooltip: {
    theme: 'light',
    shared: true,
    intersect: false,
    y: {
      formatter: (value: number) => formatCurrency(value)
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left'
  }
}))

const cashFlowChartSeries = computed(() => [
  {
    name: 'Income',
    type: 'column',
    data: cashFlowTrendPoints.value.map(point => point.income)
  },
  {
    name: 'Expenses',
    type: 'column',
    data: cashFlowTrendPoints.value.map(point => point.expenses)
  },
  {
    name: 'Net cash flow',
    type: 'line',
    data: cashFlowTrendPoints.value.map(point => point.net)
  }
])

const balanceTrendChartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#52617a',
    fontFamily: 'Aptos, Segoe UI Variable, Segoe UI, sans-serif'
  },
  colors: ['#1e4ed8', '#15803d', '#b45309'],
  dataLabels: { enabled: false },
  stroke: {
    curve: 'smooth',
    width: 4
  },
  grid: {
    borderColor: 'rgba(116, 134, 166, 0.18)',
    strokeDashArray: 4
  },
  markers: {
    size: 4,
    hover: { size: 6 }
  },
  xaxis: {
    categories: balanceTrendPoints.value.map(point => point.label),
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      formatter: (value: number) => formatCurrency(value)
    }
  },
  tooltip: {
    theme: 'light',
    shared: true,
    intersect: false,
    y: {
      formatter: (value: number) => formatCurrency(value)
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left'
  }
}))

const balanceTrendChartSeries = computed(() => [
  {
    name: 'Net position',
    data: balanceTrendPoints.value.map(point => point.netPosition)
  },
  {
    name: 'Cash on hand',
    data: balanceTrendPoints.value.map(point => point.cashOnHand)
  },
  {
    name: 'Liabilities',
    data: balanceTrendPoints.value.map(point => point.liabilities)
  }
])

const comparisonRows = computed(() => [
  {
    label: 'Income',
    current: selectedIncomeTotal.value,
    previous: previousIncomeTotal.value,
    delta: selectedIncomeTotal.value - previousIncomeTotal.value,
    currentTone: 'amount-positive',
    deltaTone: selectedIncomeTotal.value - previousIncomeTotal.value >= 0 ? 'amount-positive' : 'amount-negative'
  },
  {
    label: 'Expenses',
    current: selectedExpenseTotal.value,
    previous: previousExpenseTotal.value,
    delta: selectedExpenseTotal.value - previousExpenseTotal.value,
    currentTone: 'amount-negative',
    deltaTone: selectedExpenseTotal.value - previousExpenseTotal.value <= 0 ? 'amount-positive' : 'amount-negative'
  },
  {
    label: 'Net cash flow',
    current: selectedNetCashFlow.value,
    previous: previousNetCashFlow.value,
    delta: selectedNetCashFlow.value - previousNetCashFlow.value,
    currentTone: selectedNetCashFlow.value >= 0 ? 'amount-positive' : 'amount-negative',
    deltaTone: selectedNetCashFlow.value - previousNetCashFlow.value >= 0 ? 'amount-positive' : 'amount-negative'
  },
  {
    label: 'Transfer volume',
    current: selectedTransferVolume.value,
    previous: previousTransferVolume.value,
    delta: selectedTransferVolume.value - previousTransferVolume.value,
    currentTone: '',
    deltaTone: selectedTransferVolume.value - previousTransferVolume.value === 0 ? '' : selectedTransferVolume.value - previousTransferVolume.value > 0 ? 'amount-positive' : 'amount-negative'
  }
])

const formatDelta = (value: number) => `${value >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value))}`
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
</script>
