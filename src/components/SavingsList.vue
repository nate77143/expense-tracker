<template>
  <section class="panel">
    <div class="panel-header">
      <div>
        <h3 class="card-title">{{ title }}</h3>
        <p class="panel-copy">See every recorded savings allocation grouped in one tidy list.</p>
      </div>
      <div class="panel-kpi">
        <span>Total saved</span>
        <strong class="amount-positive">{{ formatCurrency(totalAmount) }}</strong>
      </div>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <div class="empty-state-title">No savings records yet</div>
      <p class="empty-state-copy">Add a bank entry to start building your reserve summary.</p>
    </div>

    <div v-else class="stack list-scroll-shell">
      <article v-for="item in sortedItems" :key="item.id" class="saving-item">
        <div class="saving-main">
          <div class="saving-title">{{ item.bank }}</div>
          <div class="saving-meta">{{ formatDate(item.date) }}</div>
          <span class="tag tag-success">{{ item.bank }}</span>
          <div v-if="item.remarks" class="saving-meta">{{ item.remarks }}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <strong class="saving-amount" :class="item.amount >= 0 ? 'amount-positive' : 'amount-negative'">
            {{ formatCurrency(item.amount) }}
          </strong>
          <button type="button" class="btn btn-danger" @click="$emit('delete', item.id)">Remove</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDate } from '../lib/formatters'
import type { Saving } from '../types'

const props = defineProps<{
  title: string
  items: Saving[]
}>()

defineEmits<{
  delete: [id: string]
}>()

const sortedItems = computed(() => props.items.slice().sort((a, b) => b.date.localeCompare(a.date)))
const totalAmount = computed(() => props.items.reduce((sum, item) => sum + item.amount, 0))
</script>
