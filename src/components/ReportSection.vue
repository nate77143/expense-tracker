<template>
  <div class="card">
    <div class="report-header">
      <h2 class="card-title">{{ title }}</h2>
      <div class="report-total">
        Total: <span class="amount">{{ formatCurrency(totalAmount) }}</span>
      </div>
    </div>

    <div v-if="displayItems.length === 0" class="empty-state">
      <div class="empty-state-icon">📊</div>
      <div class="empty-state-text">No expenses in this period</div>
    </div>

    <div v-else>
      <div class="report-breakdown">
        <div v-for="(amount, category) in categoryBreakdown" :key="category" class="breakdown-item">
          <span class="breakdown-label">{{ category }}</span>
          <span class="breakdown-amount">{{ formatCurrency(amount) }}</span>
        </div>
      </div>

      <div class="transaction-list">
        <div v-for="item in displayItems" :key="item.id" class="transaction-item">
          <div class="transaction-info">
            <div class="transaction-date">{{ formatDate(item.date) }}</div>
            <span class="transaction-category">{{ item.category }}</span>
            <div v-if="item.remarks" class="transaction-remarks">{{ item.remarks }}</div>
          </div>
          <span class="transaction-amount">-{{ formatCurrency(item.amount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense } from '../types'

const props = defineProps<{
  title: string
  items: Expense[]
}>()

const displayItems = computed(() => props.items)

const totalAmount = computed(() => {
  return props.items.reduce((sum, item) => sum + item.amount, 0)
})

const categoryBreakdown = computed(() => {
  const breakdown: Record<string, number> = {}
  props.items.forEach(item => {
    if (!breakdown[item.category]) {
      breakdown[item.category] = 0
    }
    breakdown[item.category] += item.amount
  })
  return breakdown
})

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

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
.card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.report-total {
  font-size: 1rem;
  color: var(--gray-600);
}

.amount {
  font-weight: 700;
  color: var(--primary);
  font-size: 1.25rem;
}

.report-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
}

.breakdown-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xs);
}

.breakdown-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--danger);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--gray-500);
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.empty-state-text {
  font-size: 1.125rem;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}

.transaction-item:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--gray-300);
}

.transaction-info {
  flex: 1;
}

.transaction-date {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-bottom: var(--spacing-xs);
}

.transaction-category {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: var(--spacing-sm);
}

.transaction-remarks {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-top: var(--spacing-xs);
}

.transaction-amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--danger);
  white-space: nowrap;
  margin-left: var(--spacing-md);
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .report-breakdown {
    grid-template-columns: repeat(2, 1fr);
  }

  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .transaction-amount {
    margin-left: 0;
    margin-top: var(--spacing-sm);
  }
}
</style>
