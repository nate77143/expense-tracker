<template>
  <div class="card">
    <h2 class="card-title">{{ title }}</h2>
    
    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state-icon">📭</div>
      <div class="empty-state-text">No records yet</div>
    </div>

    <div v-else class="transaction-list">
      <div v-for="item in items" :key="item.id" class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-date">{{ formatDate(item.date) }}</div>
          <div>
            <span v-if="'category' in item" class="transaction-category">
              {{ item.category }}
            </span>
            <span v-else-if="isIncome && 'source' in item && item.source" class="transaction-category">
              {{ item.source }}
            </span>
            <span v-if="'remarks' in item && item.remarks" class="transaction-remarks">
              {{ item.remarks }}
            </span>
          </div>
        </div>
        <div class="transaction-actions">
          <span class="transaction-amount" :class="{ income: isIncome }">
            {{ isIncome ? '+' : '-' }}{{ formatCurrency(item.amount) }}
          </span>
          <button 
            v-if="showDelete"
            class="btn btn-danger"
            @click="$emit('delete', item.id)"
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Expense, Income } from '../types'

const props = defineProps<{
  title: string
  items: (Expense | Income)[]
  isIncome?: boolean
  showDelete?: boolean
}>()

const showDelete = computed(() => props.showDelete ?? true)

defineEmits<{
  delete: [id: string]
}>()

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

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
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
  gap: var(--spacing-md);
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
}

.transaction-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  white-space: nowrap;
}

.transaction-amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--danger);
}

.transaction-amount.income {
  color: var(--secondary);
}

.btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--danger);
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background-color: #DC2626;
}

@media (max-width: 768px) {
  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .transaction-actions {
    width: 100%;
    justify-content: space-between;
  }

  .transaction-amount {
    flex: 1;
    text-align: left;
  }
}
</style>
