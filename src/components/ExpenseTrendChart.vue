<template>
  <div class="card">
    <h2 class="card-title">Expense Trend ({{ viewLabel }})</h2>
    <p class="card-subtitle">{{ subtitle }}</p>
    <div v-if="points.length === 0" class="empty-state">
      <div class="empty-state-icon">📉</div>
      <div class="empty-state-text">No data for selected period</div>
    </div>
    <div v-else>
      <apexchart
        type="line"
        :options="chartOptions"
        :series="chartSeries"
        height="200"
      ></apexchart>
    </div>
    <div class="trend-summary">Total: {{ formatCurrency(total) }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TrendPoint = { label: string; value: number }

const props = defineProps<{
  points: TrendPoint[]
  view: 'daily' | 'weekly' | 'monthly'
}>()

const total = computed(() => props.points.reduce((sum, n) => sum + n.value, 0))

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  colors: ['#0d63b8'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  grid: { show: true },
  xaxis: {
    categories: props.points.map(p => p.label),
    labels: { style: { fontSize: '12px' } }
  },
  yaxis: {
    labels: {
      formatter: (value: number) => formatCurrency(value),
      style: { fontSize: '12px' }
    }
  },
  tooltip: {
    y: {
      formatter: (value: number) => formatCurrency(value)
    }
  }
}))

const chartSeries = computed(() => [{
  name: 'Expenses',
  data: props.points.map(p => p.value)
}])

const viewLabel = computed(() => {
  if (props.view === 'daily') return 'Daily'
  if (props.view === 'weekly') return 'Weekly'
  return 'Monthly'
})

const subtitle = computed(() => {
  const count = props.points.length
  if (props.view === 'daily') return `Last ${count} Days`
  if (props.view === 'weekly') return `Last ${count} Weeks`
  return `Last ${count} Months`
})

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('PHP', '₱')
}
</script>

<style scoped>
.card { background: white; border-radius: var(--radius-lg); padding: var(--spacing-lg); border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); }
.card-title { font-size: 1.25rem; font-weight: 600; color: var(--gray-900); margin-bottom: var(--spacing-md); }
.card-subtitle { font-size: 0.875rem; color: var(--gray-600); margin-bottom: var(--spacing-md); margin-top: -var(--spacing-sm); }
.trend-summary { margin-top: var(--spacing-md); font-size: 0.9rem; color: var(--gray-600); }
.empty-state { text-align: center; color: var(--gray-500); padding: var(--spacing-lg) 0; }
.empty-state-icon { font-size: 2rem; }
</style>
