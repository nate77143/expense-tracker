<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reports</p>
        <h2 class="section-title">Read expense patterns by category and account</h2>
        <p class="section-copy">The reporting layer now focuses on expense behavior while accounts handle the balance side of the story.</p>
      </div>
      <div class="segmented" role="tablist" aria-label="Report view selector">
        <button v-for="view in views" :key="view" class="segment-button" :class="{ active: activeView === view }" type="button" @click="activeView = view">
          {{ capitalize(view) }}
        </button>
      </div>
    </div>

    <div class="content-grid">
      <CategoryChart :title="`Expenses by Category (${capitalize(activeView)})`" :items="filteredExpenses" />
      <ExpenseTrendChart :view="activeView" :points="trendPoints" />
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Expense by account</h3>
          <p class="panel-copy">See which accounts are funding the selected reporting window.</p>
        </div>
      </div>

      <div v-if="accountBreakdown.length === 0" class="empty-state">
        <div class="empty-state-title">No account data yet</div>
        <p class="empty-state-copy">Expenses in the selected period will be grouped here.</p>
      </div>

      <div v-else class="stack">
        <article v-for="item in accountBreakdown" :key="item.name" class="report-row">
          <div>
            <div class="report-row-title">{{ item.name }}</div>
            <div class="report-row-copy">{{ item.entries }} entr{{ item.entries === 1 ? 'y' : 'ies' }}</div>
          </div>
          <strong class="amount-negative">{{ formatCurrency(item.total) }}</strong>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CategoryChart from '../components/CategoryChart.vue'
import ExpenseTrendChart from '../components/ExpenseTrendChart.vue'
import { formatCurrency } from '../lib/formatters'
import type { Account, Expense } from '../types'

const props = defineProps<{
  expenses: Expense[]
  accounts: Account[]
}>()

const activeView = ref<'daily' | 'weekly' | 'monthly'>('monthly')
const views: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly']

const accountName = (accountId: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'

const filteredExpenses = computed(() => {
  if (activeView.value === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    return props.expenses.filter(expense => expense.date === today)
  }

  if (activeView.value === 'weekly') {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return props.expenses.filter(expense => {
      const value = new Date(`${expense.date}T00:00:00`)
      return value >= start && value <= end
    })
  }

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return props.expenses.filter(expense => expense.date.startsWith(monthKey))
})

const accountBreakdown = computed(() => {
  const grouped = filteredExpenses.value.reduce<Record<string, { total: number; entries: number }>>((acc, expense) => {
    const name = accountName(expense.fromAccountId)
    acc[name] = acc[name] ?? { total: 0, entries: 0 }
    acc[name].total += expense.amount
    acc[name].entries += 1
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, total: value.total, entries: value.entries }))
    .sort((a, b) => b.total - a.total)
  })

const trendPoints = computed(() => {
  if (activeView.value === 'daily') {
    const grouped = props.expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.date] = (acc[expense.date] ?? 0) + expense.amount
      return acc
    }, {})

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, total]) => ({ label: date.slice(5), value: total }))
  }

  if (activeView.value === 'weekly') {
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

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
</script>
