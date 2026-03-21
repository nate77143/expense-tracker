<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h3 class="card-title">{{ title }}</h3>
        <p class="panel-copy">Individual transactions for this reporting period, with a quick summary above.</p>
      </div>
      <div class="panel-kpi">
        <span>Period total</span>
        <strong class="amount-negative">{{ formatCurrency(totalAmount) }}</strong>
      </div>
    </div>

    <div v-if="displayItems.length === 0" class="empty-state">
      <div class="empty-state-title">No expenses in this period</div>
      <p class="empty-state-copy">Try a different time range or add some transactions first.</p>
    </div>

    <div v-else class="stack">
      <div class="summary-grid">
        <div class="summary-card">
          <span class="label-muted">Transactions</span>
          <strong>{{ displayItems.length }}</strong>
        </div>
        <div class="summary-card">
          <span class="label-muted">Categories</span>
          <strong>{{ categoryCount }}</strong>
        </div>
        <div class="summary-card">
          <span class="label-muted">Average spend</span>
          <strong>{{ formatCurrency(averageAmount) }}</strong>
        </div>
      </div>

      <article v-for="item in displayItems" :key="item.id" class="report-row">
        <div>
          <div class="report-row-title">{{ item.category }}</div>
          <div class="report-row-copy">{{ formatDate(item.date) }}</div>
          <div v-if="item.remarks" class="report-row-copy">{{ item.remarks }}</div>
        </div>
        <strong class="amount-negative">-{{ formatCurrency(item.amount) }}</strong>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDate } from '../lib/formatters'
import type { Expense } from '../types'

const props = defineProps<{
  title: string
  items: Expense[]
}>()

const displayItems = computed(() => props.items.slice().sort((a, b) => b.date.localeCompare(a.date)))

const totalAmount = computed(() => props.items.reduce((sum, item) => sum + item.amount, 0))

const categoryCount = computed(() => new Set(props.items.map(item => item.category)).size)

const averageAmount = computed(() => {
  if (props.items.length === 0) {
    return 0
  }

  return totalAmount.value / props.items.length
})
</script>
