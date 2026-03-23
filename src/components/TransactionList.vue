<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h3 class="card-title">{{ title }}</h3>
        <p class="panel-copy">
          {{ isIncome ? 'Latest incoming transactions and payment notes.' : 'Latest outgoing transactions and supporting details.' }}
        </p>
      </div>
      <div class="panel-kpi">
        <span>Total</span>
        <strong :class="isIncome ? 'amount-positive' : 'amount-negative'">{{ formatCurrency(totalAmount) }}</strong>
      </div>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state-title">No records yet</div>
      <p class="empty-state-copy">Entries will appear here once you start tracking activity.</p>
    </div>

    <div v-else class="stack" :class="scrollable ? 'list-scroll-shell' : 'list-flow-shell'">
      <article v-for="item in sortedItems" :key="item.id" class="transaction-item">
        <div class="transaction-main">
          <div class="transaction-title">{{ itemLabel(item) }}</div>
          <div class="transaction-meta">{{ formatDate(item.date) }}</div>
          <span class="tag" :class="isIncome ? 'tag-success' : ''">
            {{ itemLabel(item) }}
          </span>
          <div v-if="!isIncome && 'fundingSource' in item" class="transaction-meta">
            Paid from
            {{
              item.fundingSource === 'savings'
                ? item.fundingSourceBank
                  ? `savings via ${item.fundingSourceBank}`
                  : 'savings'
                : item.fundingSource === 'credit_card'
                  ? item.fundingSourceCardId
                    ? `credit card via ${creditCardNames[item.fundingSourceCardId] ?? 'selected card'}`
                    : 'credit card'
                  : 'income'
            }}
          </div>
          <div v-if="creatorLabel(item)" class="transaction-meta">
            Logged by {{ creatorLabel(item) }}
          </div>
          <div v-if="item.remarks" class="transaction-meta">{{ item.remarks }}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <strong class="transaction-amount" :class="isIncome ? 'amount-positive' : 'amount-negative'">
            {{ isIncome ? '+' : '-' }}{{ formatCurrency(item.amount) }}
          </strong>
          <button
            v-if="showDelete"
            type="button"
            class="btn btn-danger"
            aria-label="Delete record"
            @click="$emit('delete', item.id)"
          >
            Remove
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDate } from '../lib/formatters'
import type { Expense, Income } from '../types'

const props = defineProps<{
  title: string
  items: (Expense | Income)[]
  creditCardNames?: Record<string, string>
  isIncome?: boolean
  showDelete?: boolean
  scrollable?: boolean
  currentUserId?: string
  currentUserName?: string
}>()

defineEmits<{
  delete: [id: string]
}>()

const showDelete = computed(() => props.showDelete ?? true)
const creditCardNames = computed(() => props.creditCardNames ?? {})
const scrollable = computed(() => props.scrollable ?? true)

const sortedItems = computed(() => {
  return props.items.slice().sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) {
      return byDate
    }

    return 0
  })
})

const totalAmount = computed(() => props.items.reduce((sum, item) => sum + item.amount, 0))

const itemLabel = (item: Expense | Income) => {
  if ('category' in item) {
    return item.category
  }

  return item.source?.trim() || 'General income'
}

const creatorLabel = (item: Expense | Income) => {
  if (item.createdByName?.trim()) {
    return item.createdByName.trim()
  }

  if (props.currentUserId && props.currentUserName && item.createdByUserId === props.currentUserId) {
    return props.currentUserName
  }

  return item.createdByEmail ?? ''
}
</script>
