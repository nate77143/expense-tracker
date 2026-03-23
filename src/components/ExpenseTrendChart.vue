<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Expense trend</h3>
        <p class="panel-copy">{{ subtitle }}</p>
      </div>
      <div class="panel-kpi">
        <span>{{ viewLabel }} total</span>
        <strong class="amount-negative">{{ formatCurrency(total) }}</strong>
      </div>
    </div>

    <div v-if="points.length === 0" class="empty-state">
      <div class="empty-state-title">No trend data for this range</div>
      <p class="empty-state-copy">Record some expenses or switch views to populate the chart.</p>
    </div>

    <div v-else class="chart-frame">
      <apexchart type="line" :options="chartOptions" :series="chartSeries" height="280"></apexchart>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '../lib/formatters'

type TrendPoint = { label: string; value: number }

const props = defineProps<{
  points: TrendPoint[]
  view: 'daily' | 'weekly' | 'monthly'
}>()

const total = computed(() => props.points.reduce((sum, point) => sum + point.value, 0))

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    parentHeightOffset: 0,
    redrawOnParentResize: true,
    redrawOnWindowResize: true,
    foreColor: '#52617a',
    fontFamily: 'Aptos, Segoe UI Variable, Segoe UI, sans-serif'
  },
  colors: ['#1e4ed8'],
  dataLabels: { enabled: false },
  stroke: {
    curve: 'straight',
    width: 4
  },
  grid: {
    borderColor: 'rgba(116, 134, 166, 0.18)',
    strokeDashArray: 4
  },
  markers: {
    size: 6,
    hover: { size: 8 }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.32,
      opacityTo: 0.04,
      stops: [0, 90, 100]
    }
  },
  xaxis: {
    categories: props.points.map(point => point.label),
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false }
  },
  yaxis: {
    labels: {
      formatter: (value: number) => formatCurrency(value)
    }
  },
  tooltip: {
    theme: 'light',
    shared: false,
    intersect: true,
    y: {
      formatter: (value: number) => formatCurrency(value)
    }
  }
}))

const chartSeries = computed(() => [
  {
    name: 'Expenses',
    data: props.points.map(point => point.value)
  }
])

const viewLabel = computed(() => {
  if (props.view === 'daily') {
    return 'Daily'
  }

  if (props.view === 'weekly') {
    return 'Weekly'
  }

  return 'Monthly'
})

const subtitle = computed(() => {
  const count = props.points.length
  if (props.view === 'daily') {
    return `Daily spending across the last ${count} recorded day${count === 1 ? '' : 's'}.`
  }

  if (props.view === 'weekly') {
    return `Weekly spending across the last ${count} recorded week${count === 1 ? '' : 's'}.`
  }

  return `Monthly spending across the last ${count} recorded month${count === 1 ? '' : 's'}.`
})
</script>
