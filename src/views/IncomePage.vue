<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Revenue</p>
        <h2 class="section-title">Income ledger by source</h2>
        <p class="section-copy">
          Review income by source, filter by date, and follow the available balance so your cash position is easier to audit.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Income sources</span>
        <strong class="amount-positive">{{ sourceCount }}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Total income</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalIncome) }}</strong>
        </div>
        <p class="metric-copy">Every recorded deposit and payout across all sources.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Available income</p>
          <strong class="metric-value">{{ formatCompactCurrency(availableIncome) }}</strong>
        </div>
        <p class="metric-copy">Income still available after income-funded transactions and card payments.</p>
      </article>

      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Used by transactions</p>
          <strong class="metric-value">{{ formatCompactCurrency(incomeCommittedTotal) }}</strong>
        </div>
        <p class="metric-copy">Cash already used by transactions funded from income and card payments from income.</p>
      </article>

      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">This month net</p>
          <strong class="metric-value">{{ formatCompactCurrency(currentMonthNet) }}</strong>
        </div>
        <p class="metric-copy">This month's income minus deductions paid from income.</p>
      </article>
    </div>

    <div class="content-grid">
      <IncomeForm @submit="handleAddIncome" />

      <section class="panel source-summary-panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Source summary</h3>
            <p class="panel-copy">Gross income by source for {{ sourceSummaryDateLabel }}.</p>
          </div>
          <div class="panel-kpi">
            <span>Sources</span>
            <strong class="amount-positive">{{ sourceCount }}</strong>
          </div>
        </div>

        <div v-if="sourceBreakdown.length === 0" class="empty-state">
          <div class="empty-state-title">No source data yet</div>
          <p class="empty-state-copy">Add your first income entry to start grouping income by source.</p>
        </div>

        <div v-else class="stack list-scroll-shell source-summary-list">
          <article v-for="source in sourceBreakdown" :key="source.name" class="report-row">
            <div>
              <div class="report-row-title">{{ source.name }}</div>
              <div class="report-row-copy">{{ source.entries }} entr{{ source.entries === 1 ? 'y' : 'ies' }}</div>
            </div>
            <strong class="amount-positive">{{ formatCurrency(source.total) }}</strong>
          </article>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Income ledger</h3>
          <p class="panel-copy">Filter by source, type, and date, then inspect inflows and deductions with a true available balance.</p>
        </div>
        <div class="panel-kpi">
          <span>Filtered entries</span>
          <strong>{{ filteredLedgerRows.length }}</strong>
        </div>
      </div>

      <div class="ledger-filters">
        <div class="form-group">
          <label class="form-label" for="income-filter-source">Source</label>
          <select id="income-filter-source" v-model="selectedSource" class="form-select">
            <option value="">All sources</option>
            <option v-for="source in availableLedgerSources" :key="source" :value="source">{{ source }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="income-filter-type">Type</label>
          <select id="income-filter-type" v-model="selectedEntryType" class="form-select">
            <option value="">All types</option>
            <option v-for="option in entryTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="income-filter-from">From</label>
          <input id="income-filter-from" v-model="dateFrom" type="date" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label" for="income-filter-to">To</label>
          <input id="income-filter-to" v-model="dateTo" type="date" class="form-input" />
        </div>

        <button
          v-if="selectedSource || selectedEntryType || dateFrom || dateTo"
          type="button"
          class="btn btn-secondary"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <div v-if="filteredLedgerRows.length === 0" class="empty-state">
        <div class="empty-state-title">No income ledger entries</div>
        <p class="empty-state-copy">Try widening the filters or add a new income transaction.</p>
      </div>

      <div v-else class="income-ledger-shell">
        <div class="income-ledger-header">
          <span>Date</span>
          <span>Type</span>
          <span>Source</span>
          <span>Inflow</span>
          <span>Outflow</span>
          <span>Available balance</span>
          <span>Remarks</span>
          <span>Action</span>
        </div>

        <div class="income-ledger-list">
          <article v-for="row in displayLedgerRows" :key="row.id" class="income-ledger-row">
            <div class="ledger-cell">
              <span class="ledger-cell-label">Date</span>
              <span>{{ formatDate(row.date) }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Type</span>
              <span :class="['tag', entryTagClass(row.entryType)]">{{ row.typeLabel }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Source</span>
              <span>{{ row.sourceLabel }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Inflow</span>
              <strong v-if="row.inflow > 0" class="amount-positive">{{ formatCurrency(row.inflow) }}</strong>
              <span v-else class="label-muted">--</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Outflow</span>
              <strong v-if="row.outflow > 0" class="amount-negative">{{ formatCurrency(row.outflow) }}</strong>
              <span v-else class="label-muted">--</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Available balance</span>
              <strong :class="row.runningTotal >= 0 ? 'amount-positive' : 'amount-negative'">
                {{ formatCurrency(row.runningTotal) }}
              </strong>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Remarks</span>
              <span class="ledger-remarks">{{ row.remarks }}</span>
            </div>

            <div class="ledger-cell ledger-action-cell">
              <span class="ledger-cell-label">Action</span>
              <button v-if="row.canDelete" type="button" class="btn btn-danger" @click="$emit('delete-income', row.sourceId)">
                Remove
              </button>
              <span v-else class="label-muted">Derived</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Monthly cash summary</h3>
          <p class="panel-copy">A compact month-by-month view of income coming in, deductions going out, and net change.</p>
        </div>
      </div>

      <div v-if="monthlySummary.length === 0" class="empty-state">
        <div class="empty-state-title">No income history yet</div>
        <p class="empty-state-copy">Monthly cash movement will appear here once income entries exist.</p>
      </div>

      <div v-else class="stack">
        <article v-for="month in monthlySummary" :key="month.month" class="report-row">
          <div>
            <div class="report-row-title">{{ formatMonth(month.month) }}</div>
            <div class="report-row-copy">
              In {{ formatCurrency(month.inflow) }} • Out {{ formatCurrency(month.outflow) }} • {{ month.entries }} entr{{
                month.entries === 1 ? 'y' : 'ies'
              }}
            </div>
          </div>
          <strong :class="month.net >= 0 ? 'amount-positive' : 'amount-negative'">{{ formatCurrency(month.net) }}</strong>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import IncomeForm from '../components/IncomeForm.vue'
import { formatCompactCurrency, formatCurrency, formatDate, formatMonth } from '../lib/formatters'
import type { CreditCardTransaction, Expense, Income } from '../types'

type IncomeEntryType = 'income' | 'expense' | 'transfer' | 'card_payment'

type IncomeLedgerRow = {
  id: string
  sourceId: string
  date: string
  entryType: IncomeEntryType
  typeLabel: string
  sourceLabel: string
  inflow: number
  outflow: number
  delta: number
  runningTotal: number
  remarks: string
  canDelete: boolean
}

const props = defineProps<{
  incomes: Income[]
  expenses: Expense[]
  creditCardTransactions: CreditCardTransaction[]
  activeTrackerId: string
}>()

const emit = defineEmits<{
  'add-income': [income: Income]
  'delete-income': [id: string]
}>()

const selectedSource = ref('')
const selectedEntryType = ref<IncomeEntryType | ''>('')
const dateFrom = ref('')
const dateTo = ref('')

const entryTypeOptions = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense from income' },
  { value: 'transfer', label: 'Transfer to savings' },
  { value: 'card_payment', label: 'Card payment from income' }
] as const

const sourceLabel = (income: Income) => income.source?.trim() || 'General income'
const expenseEntryType = (expense: Expense): IncomeEntryType => (expense.category === 'Savings' ? 'transfer' : 'expense')
const expenseTypeLabel = (expense: Expense) =>
  expense.category === 'Savings' ? 'Transfer to savings' : 'Expense from income'
const expenseSourceLabel = (expense: Expense) =>
  expense.category === 'Savings' ? expense.targetSavingsBank?.trim() || 'Savings account' : expense.category?.trim() || 'Expense'
const expenseRemarks = (expense: Expense) =>
  expense.remarks?.trim() ||
  (expense.category === 'Savings' ? 'Transfer recorded from transactions.' : 'Expense recorded from transactions.')
const cardPaymentSourceLabel = (transaction: CreditCardTransaction) => transaction.merchant?.trim() || 'Credit card payment'
const cardPaymentRemarks = (transaction: CreditCardTransaction) =>
  transaction.remarks?.trim() || 'Credit card payment recorded from the Cards section.'
const typeSortOrder: Record<IncomeEntryType, number> = {
  income: 0,
  transfer: 1,
  expense: 2,
  card_payment: 3
}

const entryTagClass = (entryType: IncomeEntryType) => {
  if (entryType === 'income') {
    return 'tag-success'
  }

  if (entryType === 'transfer') {
    return ''
  }

  return 'tag-danger'
}

const handleAddIncome = (incomeData: Omit<Income, 'id' | 'trackerId'>) => {
  emit('add-income', {
    ...incomeData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}

const totalIncome = computed(() => props.incomes.reduce((sum, income) => sum + income.amount, 0))
const incomeFundedExpenses = computed(() =>
  props.expenses
    .filter(expense => expense.fundingSource === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0)
)
const incomeFundedCardPayments = computed(() =>
  props.creditCardTransactions
    .filter(transaction => transaction.type === 'payment' && transaction.paymentSource === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
)
const incomeCommittedTotal = computed(() => incomeFundedExpenses.value + incomeFundedCardPayments.value)
const availableIncome = computed(() => totalIncome.value - incomeCommittedTotal.value)

const availableSources = computed(() => {
  return [...new Set(props.incomes.map(sourceLabel))].sort((a, b) => a.localeCompare(b))
})

const sourceCount = computed(() => availableSources.value.length)

const sourceSummaryDateLabel = computed(() => {
  if (props.incomes.length === 0) {
    return 'all recorded dates'
  }

  const dates = props.incomes.map(income => income.date).sort((a, b) => a.localeCompare(b))
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]

  if (firstDate === lastDate) {
    return formatDate(firstDate)
  }

  return `${formatDate(firstDate)} to ${formatDate(lastDate)}`
})

const currentMonthKey = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

const currentMonthIncome = computed(() => {
  return props.incomes.filter(income => income.date.startsWith(currentMonthKey.value)).reduce((sum, income) => sum + income.amount, 0)
})

const sourceBreakdown = computed(() => {
  const grouped = props.incomes.reduce<Record<string, { total: number; entries: number }>>((acc, income) => {
    const source = sourceLabel(income)
    acc[source] = acc[source] ?? { total: 0, entries: 0 }
    acc[source].total += income.amount
    acc[source].entries += 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({
      name,
      total: value.total,
      entries: value.entries
    }))
    .sort((a, b) => b.total - a.total)
})

const allLedgerRows = computed<IncomeLedgerRow[]>(() => {
  const rows: IncomeLedgerRow[] = [
    ...props.incomes.map(income => ({
      id: `income-${income.id}`,
      sourceId: income.id,
      date: income.date,
      entryType: 'income' as const,
      typeLabel: 'Income',
      sourceLabel: sourceLabel(income),
      inflow: income.amount,
      outflow: 0,
      delta: income.amount,
      runningTotal: 0,
      remarks: income.remarks?.trim() || 'Income entry',
      canDelete: true
    })),
    ...props.expenses
      .filter(expense => expense.fundingSource === 'income')
      .map(expense => ({
        id: `expense-${expense.id}`,
        sourceId: expense.id,
        date: expense.date,
        entryType: expenseEntryType(expense),
        typeLabel: expenseTypeLabel(expense),
        sourceLabel: expenseSourceLabel(expense),
        inflow: 0,
        outflow: expense.amount,
        delta: -expense.amount,
        runningTotal: 0,
        remarks: expenseRemarks(expense),
        canDelete: false
      })),
    ...props.creditCardTransactions
      .filter(transaction => transaction.type === 'payment' && transaction.paymentSource === 'income')
      .map(transaction => ({
        id: `card-payment-${transaction.id}`,
        sourceId: transaction.id,
        date: transaction.date,
        entryType: 'card_payment' as const,
        typeLabel: 'Card payment from income',
        sourceLabel: cardPaymentSourceLabel(transaction),
        inflow: 0,
        outflow: transaction.amount,
        delta: -transaction.amount,
        runningTotal: 0,
        remarks: cardPaymentRemarks(transaction),
        canDelete: false
      }))
  ]

  rows.sort((left, right) => {
    const byDate = left.date.localeCompare(right.date)
    if (byDate !== 0) {
      return byDate
    }

    const byType = typeSortOrder[left.entryType] - typeSortOrder[right.entryType]
    if (byType !== 0) {
      return byType
    }

    return left.id.localeCompare(right.id)
  })

  let runningTotal = 0

  return rows.map(row => {
    runningTotal += row.delta

    return {
      ...row,
      runningTotal
    }
  })
})

const availableLedgerSources = computed(() => {
  return [...new Set(allLedgerRows.value.map(row => row.sourceLabel))].sort((a, b) => a.localeCompare(b))
})

const filteredLedgerRows = computed(() => {
  return allLedgerRows.value.filter(row => {
    if (selectedSource.value && row.sourceLabel !== selectedSource.value) {
      return false
    }

    if (selectedEntryType.value && row.entryType !== selectedEntryType.value) {
      return false
    }

    if (dateFrom.value && row.date < dateFrom.value) {
      return false
    }

    if (dateTo.value && row.date > dateTo.value) {
      return false
    }

    return true
  })
})

const displayLedgerRows = computed(() => filteredLedgerRows.value.slice().reverse())

const monthlySummary = computed(() => {
  const grouped = allLedgerRows.value.reduce<Record<string, { inflow: number; outflow: number; net: number; entries: number }>>(
    (acc, row) => {
      const month = row.date.slice(0, 7)
      acc[month] = acc[month] ?? { inflow: 0, outflow: 0, net: 0, entries: 0 }
      acc[month].inflow += row.inflow
      acc[month].outflow += row.outflow
      acc[month].net += row.delta
      acc[month].entries += 1
      return acc
    },
    {}
  )

  return Object.entries(grouped)
    .map(([month, value]) => ({
      month,
      inflow: value.inflow,
      outflow: value.outflow,
      net: value.net,
      entries: value.entries
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6)
})

const currentMonthCommitted = computed(() => {
  return allLedgerRows.value
    .filter(row => row.date.startsWith(currentMonthKey.value) && row.outflow > 0)
    .reduce((sum, row) => sum + row.outflow, 0)
})

const currentMonthNet = computed(() => currentMonthIncome.value - currentMonthCommitted.value)

const clearFilters = () => {
  selectedSource.value = ''
  selectedEntryType.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}
</script>
