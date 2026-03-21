<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Monthly savings trend</h3>
        <p class="panel-copy">{{ subtitle }}</p>
      </div>
      <div class="panel-kpi">
        <span>Tracked total</span>
        <strong class="amount-positive">{{ formatCurrency(total) }}</strong>
      </div>
    </div>

    <div v-if="points.length === 0" class="empty-state">
      <div class="empty-state-title">No savings trend yet</div>
      <p class="empty-state-copy">Add a few savings entries to see monthly movement here.</p>
    </div>

    <div v-else class="chart-frame">
      <apexchart type="bar" :options="chartOptions" :series="chartSeries" height="280"></apexchart>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '../lib/formatters'

type TrendPoint = { label: string; value: number }

const props = defineProps<{
  points: TrendPoint[]
}>()

const total = computed(() => props.points.reduce((sum, point) => sum + point.value, 0))

const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    zoom: { enabled: false },
    foreColor: '#52617a',
    fontFamily: 'Aptos, Segoe UI Variable, Segoe UI, sans-serif'
  },
  colors: ['#17875f'],
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: '48%'
    }
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: 'rgba(116, 134, 166, 0.18)',
    strokeDashArray: 4
  },
  xaxis: {
    categories: props.points.map(point => point.label),
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
    y: {
      formatter: (value: number) => formatCurrency(value)
    }
  }
}))

const chartSeries = computed(() => [
  {
    name: 'Savings',
    data: props.points.map(point => point.value)
  }
])

const subtitle = computed(() => {
  const count = props.points.length
  return `Monthly savings totals across the last ${count} recorded month${count === 1 ? '' : 's'}.`
})
</script>
