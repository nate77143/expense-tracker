<template>
  <div class="card">
    <h2 class="card-title">{{ chartTitle }}</h2>

    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state-icon">📉</div>
      <div class="empty-state-text">No data for chart</div>
    </div>

    <div v-else>
      <div class="chart-legend">
        <div class="chart-value">Total</div>
        <div class="chart-value">{{ formatCurrency(totalAmount) }}</div>
      </div>

      <div class="category-bars">
        <div v-for="(amount, category) in sortedCategoryTotals" :key="category" class="category-bar-row">
          <span class="category-name">{{ category }}</span>
          <div class="bar-container">
            <div class="bar-fill" :style="{ width: barWidth(amount) + '%' }"></div>
          </div>
          <span class="category-amount">{{ formatCurrency(amount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense } from '../types'

const props = defineProps<{
  items: Expense[]
  title?: string
}>()

const categoryTotals = computed(() => {
  const totals: Record<string, number> = {}
  props.items.forEach(item => {
    totals[item.category] = (totals[item.category] ?? 0) + item.amount
  })
  return totals
})

const totalAmount = computed(() => {
  return Object.values(categoryTotals.value).reduce((sum, val) => sum + val, 0)
})

const sortedCategoryTotals = computed(() => {
  return Object.entries(categoryTotals.value)
    .sort((a, b) => b[1] - a[1])
    .reduce((acc, [category, amount]) => {
      acc[category] = amount
      return acc
    }, {} as Record<string, number>)
})

const maxAmount = computed(() => {
  return Math.max(1, ...Object.values(categoryTotals.value))
})

const barWidth = (amount: number) => {
  return (amount / maxAmount.value) * 100
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('PHP', '₱')
}

const chartTitle = computed(() => props.title ?? 'Expense by Category')
</script>

<style scoped>
.card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
}

.chart-legend {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.chart-value {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.category-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-bar-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-name {
  width: 100px;
  color: var(--gray-700);
  font-size: 0.875rem;
  font-weight: 600;
}

.bar-container {
  height: 14px;
  background: var(--gray-200);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
}

.category-amount {
  font-size: 0.875rem;
  color: var(--gray-700);
  font-weight: 700;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--gray-500);
}

.empty-state-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-sm);
}

.empty-state-text {
  font-size: 1rem;
}
</style>
