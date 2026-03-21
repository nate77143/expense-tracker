<template>
  <div>
    <h1 class="page-title">Reports</h1>

    <div class="report-filters">
      <button 
        class="filter-btn" 
        :class="{ active: activeView === 'daily' }"
        @click="activeView = 'daily'"
      >
        Daily
      </button>
      <button 
        class="filter-btn" 
        :class="{ active: activeView === 'weekly' }"
        @click="activeView = 'weekly'"
      >
        Weekly
      </button>
      <button 
        class="filter-btn" 
        :class="{ active: activeView === 'monthly' }"
        @click="activeView = 'monthly'"
      >
        Monthly
      </button>
    </div>

    <CategoryChart :title="`Expenses by Category (${activeView})`" :items="filteredExpenses" />
    <ExpenseTrendChart :view="activeView" :points="trendPoints" />

    <div v-if="activeView === 'daily'" class="reports-container">
      <ReportSection 
        v-for="group in dailyReports" 
        :key="group.date"
        :title="`${formatDate(group.date)}`"
        :items="group.items"
      />
    </div>

    <div v-else-if="activeView === 'weekly'" class="reports-container">
      <ReportSection 
        v-for="group in weeklyReports" 
        :key="group.weekStart"
        :title="`Week of ${formatDate(group.weekStart)}`"
        :items="group.items"
      />
    </div>

    <div v-else-if="activeView === 'monthly'" class="reports-container">
      <ReportSection 
        v-for="group in monthlyReports" 
        :key="group.month"
        :title="formatMonth(group.month)"
        :items="group.items"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ReportSection from '../components/ReportSection.vue'
import CategoryChart from '../components/CategoryChart.vue'
import ExpenseTrendChart from '../components/ExpenseTrendChart.vue'
import type { Expense, DailyReport, WeeklyReport, MonthlyReport } from '../types'

const props = defineProps<{
  expenses: Expense[]
}>()

const activeView = ref<'daily' | 'weekly' | 'monthly'>('monthly')

const dailyReports = computed((): DailyReport[] => {
  const grouped: Record<string, Expense[]> = {}
  props.expenses.forEach(expense => {
    if (!grouped[expense.date]) {
      grouped[expense.date] = []
    }
    grouped[expense.date].push(expense)
  })

  return Object.entries(grouped)
    .map(([date, items]) => ({
      date,
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0)
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
})

const weeklyReports = computed((): WeeklyReport[] => {
  const grouped: Record<string, Expense[]> = {}
  const weeks: Record<string, { weekStart: string; weekEnd: string }> = {}

  props.expenses.forEach(expense => {
    const date = new Date(expense.date + 'T00:00:00')
    const dayOfWeek = date.getDay()
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const weekStart = new Date(date.setDate(diff))
    const weekStartStr = weekStart.toISOString().split('T')[0]

    if (!grouped[weekStartStr]) {
      grouped[weekStartStr] = []
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      weeks[weekStartStr] = {
        weekStart: weekStartStr,
        weekEnd: weekEnd.toISOString().split('T')[0]
      }
    }
    grouped[weekStartStr].push(expense)
  })

  return Object.entries(grouped)
    .map(([weekStart, items]) => ({
      weekStart,
      weekEnd: weeks[weekStart].weekEnd,
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0)
    }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
})

const monthlyReports = computed((): MonthlyReport[] => {
  const grouped: Record<string, Expense[]> = {}

  props.expenses.forEach(expense => {
    const month = expense.date.substring(0, 7)
    if (!grouped[month]) {
      grouped[month] = []
    }
    grouped[month].push(expense)
  })

  return Object.entries(grouped)
    .map(([month, items]) => ({
      month,
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0)
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
})

const trendPoints = computed(() => {
  if (activeView.value === 'daily') {
    return dailyReports.value
      .map(group => ({ label: group.date.slice(5), value: group.total }))
      .reverse()
  }
  if (activeView.value === 'weekly') {
    return weeklyReports.value
      .map(group => ({ label: `${group.weekStart.slice(5)}-${group.weekEnd.slice(5)}`, value: group.total }))
      .reverse()
  }

  return monthlyReports.value
    .map(group => ({ label: group.month, value: group.total }))
    .reverse()
})

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const filteredExpenses = computed(() => {
  if (activeView.value === 'daily') {
    const today = new Date().toISOString().slice(0, 10)
    return props.expenses.filter(e => e.date === today)
  }
  if (activeView.value === 'weekly') {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return props.expenses.filter(e => {
      const d = new Date(e.date + 'T00:00:00')
      return d >= start && d <= end
    })
  }
  // monthly
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return props.expenses.filter(e => e.date.startsWith(`${year}-${month}`))
})
</script>

<style scoped>
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  color: var(--gray-900);
}

.report-filters {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.filter-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 2px solid var(--gray-300);
  background: white;
  border-radius: var(--radius-md);
  color: var(--gray-600);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.filter-btn.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.reports-container {
  display: grid;
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .report-filters {
    gap: var(--spacing-sm);
  }

  .filter-btn {
    flex: 1;
  }
}
</style>
