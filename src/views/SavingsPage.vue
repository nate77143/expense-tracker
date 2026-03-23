<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserves</p>
        <h2 class="section-title">Savings ledger by account</h2>
        <p class="section-copy">
          Review deposits, withdrawals, and savings transfers as a proper account ledger so balances stay easy to follow.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Savings accounts</span>
        <strong class="amount-positive">{{ accountCount }}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Current balance</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalBalance) }}</strong>
        </div>
        <p class="metric-copy">Net balance across all tracked savings accounts.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Total inflow</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalInflow) }}</strong>
        </div>
        <p class="metric-copy">All money recorded into savings through deposits and transfers.</p>
      </article>

      <article class="panel metric-card danger">
        <div>
          <p class="metric-label">Total outflow</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalOutflow) }}</strong>
        </div>
        <p class="metric-copy">All money recorded out of savings through withdrawals and transfers.</p>
      </article>

      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Ledger entries</p>
          <strong class="metric-value">{{ savings.length }}</strong>
        </div>
        <p class="metric-copy">Every savings transaction currently stored in this tracker.</p>
      </article>
    </div>

    <div class="content-grid">
      <SavingsForm @submit="handleAddSaving" />

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Account snapshot</h3>
            <p class="panel-copy">See the current balance per bank before drilling into the transaction ledger below.</p>
          </div>
          <div class="panel-kpi">
            <span>Tracked accounts</span>
            <strong class="amount-positive">{{ accountCount }}</strong>
          </div>
        </div>

        <div v-if="accountSummaries.length === 0" class="empty-state">
          <div class="empty-state-title">No savings accounts yet</div>
          <p class="empty-state-copy">Add your first savings transaction to start building an account ledger.</p>
        </div>

        <div v-else class="bank-list">
          <div v-for="account in accountSummaries" :key="account.bank" class="bank-item">
            <div style="display: flex; gap: 0.9rem; align-items: center;">
              <div class="bank-mark">{{ account.initials }}</div>
              <div>
                <div class="bank-name">{{ account.bank }}</div>
                <div class="bank-copy">{{ account.entries }} entr{{ account.entries === 1 ? 'y' : 'ies' }}</div>
              </div>
            </div>
            <strong class="saving-amount" :class="account.balance >= 0 ? 'amount-positive' : 'amount-negative'">
              {{ formatCurrency(account.balance) }}
            </strong>
          </div>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Savings ledger</h3>
          <p class="panel-copy">Filter by bank and date, then follow each inflow, outflow, and running balance in order.</p>
        </div>
        <div class="panel-kpi">
          <span>Filtered entries</span>
          <strong>{{ filteredSavings.length }}</strong>
        </div>
      </div>

      <div class="ledger-filters">
        <div class="form-group">
          <label class="form-label" for="savings-filter-bank">Bank</label>
          <select id="savings-filter-bank" v-model="selectedBank" class="form-select">
            <option value="">All banks</option>
            <option v-for="bank in availableBanks" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="savings-filter-from">From</label>
          <input id="savings-filter-from" v-model="dateFrom" type="date" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label" for="savings-filter-to">To</label>
          <input id="savings-filter-to" v-model="dateTo" type="date" class="form-input" />
        </div>

        <button v-if="selectedBank || dateFrom || dateTo" type="button" class="btn btn-secondary" @click="clearFilters">
          Clear filters
        </button>
      </div>

      <div v-if="ledgerRows.length === 0" class="empty-state">
        <div class="empty-state-title">No savings ledger entries</div>
        <p class="empty-state-copy">Try widening the filters or add a new savings transaction.</p>
      </div>

      <div v-else class="ledger-shell">
        <div class="ledger-header">
          <span>Date</span>
          <span>Bank</span>
          <span>Type</span>
          <span>Inflow</span>
          <span>Outflow</span>
          <span>Running balance</span>
          <span>Remarks</span>
          <span>Action</span>
        </div>

        <div class="ledger-list">
          <article v-for="row in displayLedgerRows" :key="row.id" class="ledger-row">
            <div class="ledger-cell">
              <span class="ledger-cell-label">Date</span>
              <span>{{ formatDate(row.date) }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Bank</span>
              <span>{{ row.bank }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Type</span>
              <span class="tag" :class="row.tone">{{ row.typeLabel }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Inflow</span>
              <strong class="amount-positive">{{ row.inflow > 0 ? formatCurrency(row.inflow) : '—' }}</strong>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Outflow</span>
              <strong class="amount-negative">{{ row.outflow > 0 ? formatCurrency(row.outflow) : '—' }}</strong>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Running balance</span>
              <strong :class="row.runningBalance >= 0 ? 'amount-positive' : 'amount-negative'">
                {{ formatCurrency(row.runningBalance) }}
              </strong>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Remarks</span>
              <span class="ledger-remarks">{{ row.remarks || 'No remarks' }}</span>
              <span v-if="creatorLabel(row)" class="ledger-remarks">
                Logged by {{ creatorLabel(row) }}
              </span>
            </div>

            <div class="ledger-cell ledger-action-cell">
              <span class="ledger-cell-label">Action</span>
              <button type="button" class="btn btn-danger" @click="$emit('delete-saving', row.id)">Remove</button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <SavingsTrendChart :points="monthlySavingsPoints" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/formatters'
import { buildSavingsBankSummaries, normalizeSavingsBankName } from '../lib/savingsBanks'
import SavingsForm from '../components/SavingsForm.vue'
import SavingsTrendChart from '../components/SavingsTrendChart.vue'
import type { Saving } from '../types'

type LedgerRow = Saving & {
  inflow: number
  outflow: number
  runningBalance: number
  typeLabel: 'Deposit' | 'Withdrawal' | 'Transfer In' | 'Transfer Out'
  tone: '' | 'tag-success' | 'tag-danger'
}

const props = defineProps<{
  savings: Saving[]
  activeTrackerId: string
  currentUserId: string
  currentUserName: string
}>()

const emit = defineEmits<{
  'add-saving': [saving: Saving]
  'delete-saving': [id: string]
}>()

const selectedBank = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const handleAddSaving = (savingData: Omit<Saving, 'id' | 'trackerId'>) => {
  emit('add-saving', {
    ...savingData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}

const availableBanks = computed(() => {
  return buildSavingsBankSummaries(props.savings).map(bank => bank.name)
})

const accountCount = computed(() => availableBanks.value.length)
const totalBalance = computed(() => props.savings.reduce((sum, saving) => sum + saving.amount, 0))
const totalInflow = computed(() => props.savings.filter(saving => saving.amount > 0).reduce((sum, saving) => sum + saving.amount, 0))
const totalOutflow = computed(() =>
  props.savings.filter(saving => saving.amount < 0).reduce((sum, saving) => sum + Math.abs(saving.amount), 0)
)

const accountSummaries = computed(() => {
  return buildSavingsBankSummaries(props.savings)
    .map(bank => ({
      bank: bank.name,
      balance: bank.balance,
      entries: bank.entries,
      initials: bank.name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? '')
        .join('')
    }))
    .sort((a, b) => b.balance - a.balance)
})

const filteredSavings = computed(() => {
  return props.savings
    .filter(saving => {
      if (selectedBank.value && normalizeSavingsBankName(saving.bank) !== normalizeSavingsBankName(selectedBank.value)) {
        return false
      }

      if (dateFrom.value && saving.date < dateFrom.value) {
        return false
      }

      if (dateTo.value && saving.date > dateTo.value) {
        return false
      }

      return true
    })
    .slice()
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date)
      if (byDate !== 0) {
        return byDate
      }

      return a.id.localeCompare(b.id)
    })
})

const resolveSavingsType = (saving: Saving): LedgerRow['typeLabel'] => {
  if (saving.sourceExpenseId) {
    return saving.amount >= 0 ? 'Transfer In' : 'Transfer Out'
  }

  if (saving.sourceCreditCardTransactionId) {
    return 'Transfer Out'
  }

  const remarks = saving.remarks?.toLowerCase() ?? ''

  if (remarks.startsWith('transfer from money movement') || remarks.startsWith('transfer from transaction')) {
    return 'Transfer In'
  }

  if (remarks.startsWith('deducted by money movement') || remarks.startsWith('deducted by transaction')) {
    return 'Transfer Out'
  }

  return saving.amount >= 0 ? 'Deposit' : 'Withdrawal'
}

const ledgerRows = computed<LedgerRow[]>(() => {
  const runningBalances = new Map<string, number>()
  let combinedBalance = 0

  return filteredSavings.value.map(saving => {
    const typeLabel = resolveSavingsType(saving)
    const inflow = saving.amount > 0 ? saving.amount : 0
    const outflow = saving.amount < 0 ? Math.abs(saving.amount) : 0

    const runningBalance = selectedBank.value
      ? (() => {
          const bankKey = normalizeSavingsBankName(saving.bank)
          const nextBalance = (runningBalances.get(bankKey) ?? 0) + saving.amount
          runningBalances.set(bankKey, nextBalance)
          return nextBalance
        })()
      : (() => {
          combinedBalance += saving.amount
          return combinedBalance
        })()

    return {
      ...saving,
      inflow,
      outflow,
      runningBalance,
      typeLabel,
      tone: typeLabel === 'Deposit' || typeLabel === 'Transfer In' ? 'tag-success' : 'tag-danger'
    }
  })
})

const displayLedgerRows = computed(() => ledgerRows.value.slice().reverse())

const monthlySavingsPoints = computed(() => {
  const grouped = props.savings.reduce<Record<string, number>>((acc, saving) => {
    const monthKey = saving.date.slice(0, 7)
    acc[monthKey] = (acc[monthKey] ?? 0) + saving.amount
    return acc
  }, {})

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({
      label: month,
      value: total
    }))
})

const clearFilters = () => {
  selectedBank.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

const creatorLabel = (saving: Saving) => {
  if (saving.createdByName?.trim()) {
    return saving.createdByName.trim()
  }

  if (props.currentUserId && props.currentUserName && saving.createdByUserId === props.currentUserId) {
    return props.currentUserName
  }

  return saving.createdByEmail ?? ''
}
</script>
