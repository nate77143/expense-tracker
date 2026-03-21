<template>
  <div class="card">
    <h2 class="card-title">{{ title }}</h2>
    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state-icon">🧾</div>
      <div class="empty-state-text">No savings records yet</div>
    </div>
    <div v-else class="transaction-list">
      <div v-for="item in items" :key="item.id" class="transaction-item">
        <div>
          <div class="transaction-date">{{ formatDate(item.date) }}</div>
          <div class="transaction-category">{{ item.bank }}</div>
          <div v-if="item.remarks" class="transaction-remarks">{{ item.remarks }}</div>
        </div>
        <div class="transaction-actions">
          <span class="transaction-amount income">{{ formatCurrency(item.amount) }}</span>
          <button class="btn btn-danger" @click="$emit('delete', item.id)" title="Delete">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Saving } from '../types'

defineProps<{
  title: string
  items: Saving[]
}>()

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
