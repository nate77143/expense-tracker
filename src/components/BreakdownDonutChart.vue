<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h3 class="card-title">{{ title }}</h3>
        <p class="panel-copy">{{ copy }}</p>
      </div>
      <div class="panel-kpi">
        <span>{{ kpiLabel }}</span>
        <strong :class="toneClass">{{ formatCurrency(total) }}</strong>
      </div>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state-title">{{ emptyTitle }}</div>
      <p class="empty-state-copy">{{ emptyCopy }}</p>
    </div>

    <div v-else class="balance-visual-grid">
      <div class="chart-frame balance-visual-chart">
        <apexchart type="donut" :options="chartOptions" :series="chartSeries" height="280"></apexchart>
      </div>

      <div class="bank-list">
        <article v-for="(item, index) in items" :key="item.name" class="bank-item">
          <div style="display: flex; gap: 0.9rem; align-items: center;">
            <div class="bank-mark" :style="{ background: `${colors[index]}22`, color: colors[index] }">
              {{ initials(item.name) }}
            </div>
            <div>
              <div class="bank-name">{{ item.name }}</div>
              <div class="bank-copy">{{ item.entries }} {{ entryLabel(item.entries) }} · {{ itemPercent(item) }}</div>
            </div>
          </div>
          <strong :class="toneClass">{{ formatCurrency(item.total) }}</strong>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '../lib/formatters'

type BreakdownItem = {
  name: string
  total: number
  entries: number
}

const props = withDefaults(defineProps<{
  title: string
  copy: string
  items: BreakdownItem[]
  kpiLabel?: string
  emptyTitle?: string
  emptyCopy?: string
  tone?: 'positive' | 'negative' | 'neutral'
  singularLabel?: string
  pluralLabel?: string
}>(), {
  kpiLabel: 'Total',
  emptyTitle: 'No data yet',
  emptyCopy: 'Records will appear here once data is available.',
  tone: 'neutral',
  singularLabel: 'entry',
  pluralLabel: 'entries'
})

const colors = ['#1e4ed8', '#15803d', '#b45309', '#c2410c', '#0f766e', '#7c3aed']

const total = computed(() => props.items.reduce((sum, item) => sum + item.total, 0))
const chartSeries = computed(() => props.items.map(item => item.total))
const toneClass = computed(() => {
  if (props.tone === 'positive') return 'amount-positive'
  if (props.tone === 'negative') return 'amount-negative'
  return ''
})

const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
    toolbar: { show: false },
    parentHeightOffset: 0,
    redrawOnParentResize: true,
    redrawOnWindowResize: true,
    foreColor: '#52617a',
    fontFamily: 'Aptos, Segoe UI Variable, Segoe UI, sans-serif'
  },
  labels: props.items.map(item => item.name),
  colors,
  legend: { show: false },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  plotOptions: {
    pie: {
      customScale: 0.9,
      donut: {
        size: '68%',
        labels: {
          show: true,
          name: { show: true },
          value: {
            show: true,
            formatter: (value: string) => formatCurrency(Number(value))
          },
          total: {
            show: true,
            label: props.kpiLabel,
            formatter: () => formatCurrency(total.value)
          }
        }
      }
    }
  },
  tooltip: {
    theme: 'light',
    y: {
      formatter: (value: number) => formatCurrency(value)
    }
  }
}))

const initials = (value: string) => value.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('')
const entryLabel = (count: number) => count === 1 ? props.singularLabel : props.pluralLabel
const itemPercent = (item: BreakdownItem) => {
  if (!total.value) return '0%'
  return `${Math.round((item.total / total.value) * 100)}% of total`
}
</script>
