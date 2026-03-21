<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h3 class="card-title">{{ chartTitle }}</h3>
        <p class="panel-copy">A ranked view of categories by spend for the selected data set.</p>
      </div>
      <div class="panel-kpi">
        <span>Total</span>
        <strong class="amount-negative">{{ formatCurrency(totalAmount) }}</strong>
      </div>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state-title">No chart data yet</div>
      <p class="empty-state-copy">Add expenses or change the reporting period to see category mix.</p>
    </div>

    <div v-else class="bar-list">
      <div v-for="[category, amount] in sortedCategoryTotals" :key="category" class="bar-row">
        <div class="bar-meta">
          <span>{{ category }}</span>
          <strong>{{ formatCurrency(amount) }}</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: `${barWidth(amount)}%` }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '../lib/formatters'
import type { Expense } from '../types'

const props = defineProps<{
  items: Expense[]
  title?: string
}>()

const categoryTotals = computed(() => {
  return props.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount
    return acc
  }, {})
})

const totalAmount = computed(() => Object.values(categoryTotals.value).reduce((sum, value) => sum + value, 0))

const sortedCategoryTotals = computed(() => {
  return Object.entries(categoryTotals.value).sort((a, b) => b[1] - a[1])
})

const maxAmount = computed(() => Math.max(1, ...Object.values(categoryTotals.value)))

const chartTitle = computed(() => props.title ?? 'Expense by category')

const barWidth = (amount: number) => (amount / maxAmount.value) * 100
</script>
