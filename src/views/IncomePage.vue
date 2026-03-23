<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Revenue</p>
        <h2 class="section-title">Income by source and destination</h2>
        <p class="section-copy">Review where income came from and which account received it so balances stay explainable.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Sources</span>
        <strong class="amount-positive">{{ sourceCount }}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Total income</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalIncome) }}</strong>
        </div>
        <p class="metric-copy">Every recorded inflow across all sources and receiving accounts.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">This month</p>
          <strong class="metric-value">{{ formatCompactCurrency(currentMonthIncome) }}</strong>
        </div>
        <p class="metric-copy">Income posted during the current month.</p>
      </article>

      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Top destination</p>
          <strong class="metric-value">{{ topDestination.label }}</strong>
        </div>
        <p class="metric-copy">{{ formatCompactCurrency(topDestination.total) }} received so far.</p>
      </article>
    </div>

    <div class="content-grid">
      <IncomeForm :accounts="accounts" @submit="handleAddIncome" />

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Income summary</h3>
            <p class="panel-copy">See the strongest sources and the accounts receiving most of the inflow.</p>
          </div>
        </div>

        <div v-if="incomes.length === 0" class="empty-state">
          <div class="empty-state-title">No income yet</div>
          <p class="empty-state-copy">Add an income entry to start building source and account history.</p>
        </div>

        <div v-else class="stack">
          <article v-for="item in sourceBreakdown" :key="item.name" class="report-row">
            <div>
              <div class="report-row-title">{{ item.name }}</div>
              <div class="report-row-copy">{{ item.entries }} entr{{ item.entries === 1 ? 'y' : 'ies' }}</div>
            </div>
            <strong class="amount-positive">{{ formatCurrency(item.total) }}</strong>
          </article>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Income ledger</h3>
          <p class="panel-copy">Follow each income entry from source to destination account.</p>
        </div>
        <div class="panel-kpi">
          <span>Entries</span>
          <strong>{{ sortedIncomes.length }}</strong>
        </div>
      </div>

      <div v-if="sortedIncomes.length === 0" class="empty-state">
        <div class="empty-state-title">No income ledger entries</div>
        <p class="empty-state-copy">Once income is recorded, it will appear here.</p>
      </div>

      <div v-else class="ledger-shell">
        <div class="ledger-header">
          <span>Date</span>
          <span>Source</span>
          <span>Destination</span>
          <span>Amount</span>
          <span>Remarks</span>
          <span>Action</span>
        </div>

        <div class="ledger-list">
          <article v-for="income in sortedIncomes" :key="income.id" class="ledger-row">
            <div class="ledger-cell">
              <span class="ledger-cell-label">Date</span>
              <span>{{ formatDate(income.date) }}</span>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Source</span>
              <span>{{ sourceLabel(income) }}</span>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Destination</span>
              <span>{{ accountName(income.toAccountId) }}</span>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Amount</span>
              <strong class="amount-positive">{{ formatCurrency(income.amount) }}</strong>
            </div>
            <div class="ledger-cell">
              <span class="ledger-cell-label">Remarks</span>
              <span class="ledger-remarks">{{ income.remarks || 'No remarks' }}</span>
              <span v-if="creatorLabel(income)" class="ledger-remarks">Logged by {{ creatorLabel(income) }}</span>
            </div>
            <div class="ledger-cell ledger-action-cell">
              <span class="ledger-cell-label">Action</span>
              <button type="button" class="btn btn-danger" @click="$emit('delete-income', income.id)">Remove</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IncomeForm from '../components/IncomeForm.vue'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/formatters'
import type { Account, Income } from '../types'

const props = defineProps<{
  incomes: Income[]
  accounts: Account[]
  activeTrackerId: string
  currentUserId: string
  currentUserName: string
}>()

const emit = defineEmits<{
  'add-income': [income: Income]
  'delete-income': [id: string]
}>()

const sortedIncomes = computed(() => props.incomes.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)))
const totalIncome = computed(() => props.incomes.reduce((sum, income) => sum + income.amount, 0))
const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
const currentMonthIncome = computed(() => props.incomes.filter(income => income.date.startsWith(currentMonthKey)).reduce((sum, income) => sum + income.amount, 0))

const sourceLabel = (income: Income) => income.source?.trim() || 'General income'
const sourceBreakdown = computed(() => {
  const grouped = props.incomes.reduce<Record<string, { total: number; entries: number }>>((acc, income) => {
    const source = sourceLabel(income)
    acc[source] = acc[source] ?? { total: 0, entries: 0 }
    acc[source].total += income.amount
    acc[source].entries += 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, total: value.total, entries: value.entries }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
})
const sourceCount = computed(() => new Set(props.incomes.map(sourceLabel)).size)

const destinationBreakdown = computed(() => {
  const grouped = props.incomes.reduce<Record<string, number>>((acc, income) => {
    const name = accountName(income.toAccountId)
    acc[name] = (acc[name] ?? 0) + income.amount
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total)
})

const topDestination = computed(() => destinationBreakdown.value[0] ?? { label: 'No account yet', total: 0 })

const accountName = (accountId: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'

const handleAddIncome = (incomeData: Omit<Income, 'id' | 'trackerId'>) => {
  emit('add-income', {
    ...incomeData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}

const creatorLabel = (income: Income) => {
  if (income.createdByName?.trim()) {
    return income.createdByName.trim()
  }

  if (props.currentUserId && props.currentUserName && income.createdByUserId === props.currentUserId) {
    return props.currentUserName
  }

  return income.createdByEmail ?? ''
}
</script>
