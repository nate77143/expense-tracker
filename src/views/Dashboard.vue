<template>
  <div>
    <h1 class="page-title">Dashboard</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Income</div>
        <div class="stat-value" style="color: var(--secondary)">
          {{ formatCurrency(totalIncome) }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Expenses</div>
        <div class="stat-value" style="color: var(--danger)">
          -{{ formatCurrency(totalExpenses) }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Net Balance</div>
        <div class="stat-value" :style="{ color: netBalance >= 0 ? 'var(--secondary)' : 'var(--danger)' }">
          {{ formatCurrency(netBalance) }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Savings</div>
        <div class="stat-value" style="color: var(--success)">
          {{ formatCurrency(totalSavings) }}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--spacing-lg);">
      <h2 class="card-title">Savings by Bank</h2>
      <div class="transaction-list" style="padding: 0; gap: var(--spacing-sm);">
        <div v-for="(amount, bank) in savingsByBank" :key="bank" class="transaction-item" style="padding: var(--spacing-sm); margin: 0;">
          <span>{{ bank }}</span>
          <strong>{{ formatCurrency(amount) }}</strong>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <TransactionList 
          title="Recent Expenses" 
          :items="recentExpenses"
          :show-delete="false"
          @delete="$emit('delete-expense', $event)"
        />
      </div>
      <div>
        <TransactionList 
          title="Recent Income" 
          :items="recentIncomes"
          :is-income="true"
          :show-delete="false"
          @delete="$emit('delete-income', $event)"
        />
      </div>
    </div>

    <div class="report-filters" style="margin-top: var(--spacing-xl);">
      <button 
        class="filter-btn" 
        :class="{ active: dashboardActiveView === 'daily' }"
        @click="dashboardActiveView = 'daily'"
      >
        Daily
      </button>
      <button 
        class="filter-btn" 
        :class="{ active: dashboardActiveView === 'weekly' }"
        @click="dashboardActiveView = 'weekly'"
      >
        Weekly
      </button>
      <button 
        class="filter-btn" 
        :class="{ active: dashboardActiveView === 'monthly' }"
        @click="dashboardActiveView = 'monthly'"
      >
        Monthly
      </button>
    </div>

    <ExpenseTrendChart :view="dashboardActiveView" :points="dashboardTrendPoints" />

    <div class="grid-2" style="margin-top: var(--spacing-xl); gap: var(--spacing-lg);">
      <ReportSection 
        title="This Month's Expenses"
        :items="currentMonthExpenses"
      />
      <CategoryChart 
        title="Category Breakdown"
        :items="currentMonthExpenses"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TransactionList from '../components/TransactionList.vue'
import ReportSection from '../components/ReportSection.vue'
import CategoryChart from '../components/CategoryChart.vue'
import ExpenseTrendChart from '../components/ExpenseTrendChart.vue'
import type { Expense, Income, Saving } from '../types'

const props = defineProps<{
  expenses: Expense[]
  incomes: Income[]
  savings: Saving[]
}>()

const dashboardActiveView = ref<'daily' | 'weekly' | 'monthly'>('monthly')

defineEmits<{
  'delete-expense': [id: string]
  'delete-income': [id: string]
}>()

const totalExpenses = computed(() => {
  return props.expenses.reduce((sum, e) => sum + e.amount, 0)
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('PHP', '₱')
}

const totalIncome = computed(() => {
  return props.incomes.reduce((sum, i) => sum + i.amount, 0)
})

const netBalance = computed(() => {
  return totalIncome.value - totalExpenses.value
})

const totalSavings = computed(() => {
  return props.savings.reduce((sum, s) => sum + s.amount, 0)
})

const savingsByBank = computed(() => {
  const byBank: Record<string, number> = {}
  props.savings.forEach(s => {
    byBank[s.bank] = (byBank[s.bank] ?? 0) + s.amount
  })
  return byBank
})

const recentExpenses = computed(() => {
  return props.expenses.slice().reverse().slice(0, 5)
})

const recentIncomes = computed(() => {
  return props.incomes.slice().reverse().slice(0, 5)
})

const dashboardTrendPoints = computed(() => {
  const toNumber = (value: number) => value

  if (dashboardActiveView.value === 'daily') {
    const grouped: Record<string, number> = {}
    props.expenses.forEach(e => {
      grouped[e.date] = (grouped[e.date] ?? 0) + e.amount
    })
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, total]) => ({ label: date.slice(5), value: toNumber(total) }))
  }

  if (dashboardActiveView.value === 'weekly') {
    const grouped: Record<string, number> = {}
    props.expenses.forEach(e => {
      const d = new Date(e.date + 'T00:00:00')
      const dayOfWeek = d.getDay()
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const weekStart = new Date(d)
      weekStart.setDate(diff)
      const weekKey = weekStart.toISOString().slice(0, 10)
      grouped[weekKey] = (grouped[weekKey] ?? 0) + e.amount
    })
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([weekStart, total]) => ({ label: weekStart.slice(5), value: toNumber(total) }))
  }

  const grouped: Record<string, number> = {}
  props.expenses.forEach(e => {
    const monthKey = e.date.slice(0, 7)
    grouped[monthKey] = (grouped[monthKey] ?? 0) + e.amount
  })

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ label: month, value: toNumber(total) }))
})

const currentMonthExpenses = computed(() => {
  const now = new Date()
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
  return props.expenses.filter(e => e.date.startsWith(currentMonth))
})
</script>

<style scoped>
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xl);
  color: var(--gray-900);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }
}

.report-filters {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-lg);
}

.filter-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  background: white;
  cursor: pointer;
}

.filter-btn.active {
  background: var(--secondary);
  color: white;
  border-color: var(--secondary);
}
</style>
