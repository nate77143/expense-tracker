<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Analytics</p>
        <h2 class="section-title">Read spending patterns with less noise</h2>
        <p class="section-copy">
          Compare daily, weekly, and monthly expense periods so category shifts and timing patterns stand out quickly.
        </p>
      </div>
      <div class="segmented" role="tablist" aria-label="Report view selector">
        <button
          v-for="view in views"
          :key="view"
          class="segment-button"
          :class="{ active: activeView === view }"
          type="button"
          @click="activeView = view"
        >
          {{ capitalize(view) }}
        </button>
      </div>
    </div>

    <div class="content-grid">
      <CategoryChart :title="`Expenses by Category (${capitalize(activeView)})`" :items="filteredExpenses" />
      <ExpenseTrendChart :view="activeView" :points="trendPoints" />
    </div>

    <SavingsTrendChart v-if="activeView === 'monthly'" :points="monthlySavingsTrendPoints" />

    <div v-if="activeView === 'daily'" class="stack">
      <ReportSection v-for="group in dailyReports" :key="group.date" :title="formatDate(group.date)" :items="group.items" />
    </div>

    <div v-else-if="activeView === 'weekly'" class="stack">
      <ReportSection
        v-for="group in weeklyReports"
        :key="group.weekStart"
        :title="`Week of ${formatDate(group.weekStart)}`"
        :items="group.items"
      />
    </div>

    <div v-else class="stack">
      <ReportSection v-for="group in monthlyReports" :key="group.month" :title="formatMonth(group.month)" :items="group.items" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CategoryChart from '../components/CategoryChart.vue'
import ExpenseTrendChart from '../components/ExpenseTrendChart.vue'
import ReportSection from '../components/ReportSection.vue'
import SavingsTrendChart from '../components/SavingsTrendChart.vue'
import { formatDate, formatMonth } from '../lib/formatters'
import type { DailyReport, Expense, MonthlyReport, Saving, WeeklyReport } from '../types'

const props = defineProps<{
  expenses: Expense[]
  savings: Saving[]
}>()

const activeView = ref<'daily' | 'weekly' | 'monthly'>('monthly')
const views: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly']

const dailyReports = computed((): DailyReport[] => {
  const grouped = props.expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    acc[expense.date] = acc[expense.date] ?? []
    acc[expense.date].push(expense)
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([date, items]) => ({
      date,
      items,
      total: items.reduce((sum, item) => sum + item.amount, 0)
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
})

const weeklyReports = computed((): WeeklyReport[] => {
  const grouped = props.expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    const date = new Date(`${expense.date}T00:00:00`)
    const dayOfWeek = date.getDay()
    const offset = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const weekStart = new Date(date)
    weekStart.setDate(offset)
    const key = weekStart.toISOString().split('T')[0]
    acc[key] = acc[key] ?? []
    acc[key].push(expense)
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([weekStart, items]) => {
      const startDate = new Date(`${weekStart}T00:00:00`)
      const weekEnd = new Date(startDate)
      weekEnd.setDate(startDate.getDate() + 6)

      return {
        weekStart,
        weekEnd: weekEnd.toISOString().split('T')[0],
        items,
        total: items.reduce((sum, item) => sum + item.amount, 0)
      }
    })
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
})

const monthlyReports = computed((): MonthlyReport[] => {
  const grouped = props.expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    const monthKey = expense.date.slice(0, 7)
    acc[monthKey] = acc[monthKey] ?? []
    acc[monthKey].push(expense)
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([month, items]) => ({
      month,
      items,
      total: items.reduce((sum, item) => sum + item.amount, 0)
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
})

const trendPoints = computed(() => {
  if (activeView.value === 'daily') {
    return dailyReports.value.map(group => ({ label: group.date.slice(5), value: group.total })).reverse()
  }

  if (activeView.value === 'weekly') {
    return weeklyReports.value
      .map(group => ({ label: `${group.weekStart.slice(5)}-${group.weekEnd.slice(5)}`, value: group.total }))
      .reverse()
  }

  return monthlyReports.value.map(group => ({ label: group.month, value: group.total })).reverse()
})

const monthlySavingsTrendPoints = computed(() => {
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

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
</script>
