<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Transfers</p>
        <h2 class="section-title">Move money between accounts</h2>
        <p class="section-copy">Use transfers for payroll withdrawals, savings moves, e-wallet top-ups, and credit card payments.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Entries</span>
        <strong>{{ transfers.length }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <TransferForm :accounts="accounts" :account-balances="accountBalances" @submit="handleAddTransfer" />

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Recent transfers</h3>
            <p class="panel-copy">Review each movement from source account to destination account.</p>
          </div>
          <div class="panel-kpi">
            <span>Latest</span>
            <strong>{{ recentTransfers.length }}</strong>
          </div>
        </div>

        <div v-if="recentTransfers.length === 0" class="empty-state">
          <div class="empty-state-title">No transfers yet</div>
          <p class="empty-state-copy">Your cross-account movements will appear here after the first transfer.</p>
        </div>

        <div v-else class="stack list-scroll-shell">
          <article v-for="transfer in recentTransfers" :key="transfer.id" class="transaction-item">
            <div class="transaction-main">
              <div class="transaction-title">{{ accountName(transfer.fromAccountId) }} -> {{ accountName(transfer.toAccountId) }}</div>
              <div class="transaction-meta">{{ formatDate(transfer.date) }} · {{ transfer.transferType.replace(/_/g, ' ') }}</div>
              <div class="transaction-meta">{{ transfer.remarks || 'No remarks' }}</div>
              <div v-if="creatorLabel(transfer)" class="transaction-meta">Logged by {{ creatorLabel(transfer) }}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <strong class="amount-negative">{{ formatCurrency(transfer.amount) }}</strong>
              <button type="button" class="btn btn-danger" @click="handleDelete(transfer)">Remove</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TransferForm from '../components/TransferForm.vue'
import { formatCurrency, formatDate } from '../lib/formatters'
import type { Account, Transfer } from '../types'

const props = defineProps<{
  transfers: Transfer[]
  accounts: Account[]
  accountBalances: Record<string, number>
  activeTrackerId: string
  currentUserId: string
  currentUserName: string
}>()

const emit = defineEmits<{
  'add-transfer': [transfer: Transfer]
  'delete-transfer': [id: string]
}>()

const recentTransfers = computed(() =>
  props.transfers
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 20)
)

const accountName = (accountId: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'

const handleAddTransfer = (transferData: Omit<Transfer, 'id' | 'trackerId'>) => {
  emit('add-transfer', {
    ...transferData,
    id: Date.now().toString(),
    trackerId: props.activeTrackerId
  })
}

const handleDelete = (transfer: Transfer) => {
  const confirmed = window.confirm(`Remove this transfer from ${accountName(transfer.fromAccountId)} to ${accountName(transfer.toAccountId)}?`)

  if (!confirmed) {
    return
  }

  emit('delete-transfer', transfer.id)
}

const creatorLabel = (transfer: Transfer) => {
  if (transfer.createdByName?.trim()) {
    return transfer.createdByName.trim()
  }

  if (props.currentUserId && props.currentUserName && transfer.createdByUserId === props.currentUserId) {
    return props.currentUserName
  }

  return transfer.createdByEmail ?? ''
}
</script>
