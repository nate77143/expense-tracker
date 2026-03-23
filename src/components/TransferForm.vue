<template>
  <section class="panel panel-strong">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Move money</h3>
        <p class="panel-copy">Record withdrawals, transfers, and credit card payments between accounts.</p>
      </div>
      <span class="tag">Transfer</span>
    </div>

    <form class="form-shell" @submit.prevent="submitForm">
      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="transfer-date">Date</label>
          <input id="transfer-date" v-model="form.date" type="date" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="transfer-amount">Amount (PHP)</label>
          <input id="transfer-amount" v-model.number="form.amount" type="number" min="0" step="0.01" class="form-input" required />
        </div>
      </div>

      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="transfer-from">From account</label>
          <select id="transfer-from" v-model="form.fromAccountId" class="form-select" :disabled="sourceAccounts.length === 0">
            <option value="">{{ sourceAccounts.length === 0 ? 'No source accounts available' : 'Select source account' }}</option>
            <option v-for="account in sourceAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="transfer-to">To account</label>
          <select id="transfer-to" v-model="form.toAccountId" class="form-select" :disabled="destinationAccounts.length === 0">
            <option value="">{{ destinationAccounts.length === 0 ? 'No destination accounts available' : 'Select destination account' }}</option>
            <option v-for="account in destinationAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="transfer-type">Transfer type</label>
        <select id="transfer-type" v-model="form.transferType" class="form-select">
          <option value="general">General transfer</option>
          <option value="cash_withdrawal">Cash withdrawal</option>
          <option value="savings_transfer">Savings transfer</option>
          <option value="credit_card_payment">Credit card payment</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="transfer-remarks">Remarks</label>
        <textarea id="transfer-remarks" v-model="form.remarks" class="form-textarea" placeholder="Optional note about this movement"></textarea>
      </div>

      <button type="submit" class="btn btn-primary btn-block">Save transfer</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Account, Transfer } from '../types'

const props = defineProps<{
  accounts: Account[]
  accountBalances: Record<string, number>
}>()

const emit = defineEmits<{
  submit: [transfer: Omit<Transfer, 'id' | 'trackerId'>]
}>()

const sourceAccounts = computed(() => props.accounts.filter(account => account.isActive && account.accountGroup === 'asset'))
const destinationAccounts = computed(() => props.accounts.filter(account => account.isActive))

const form = ref({
  date: new Date().toISOString().split('T')[0],
  fromAccountId: '',
  toAccountId: '',
  amount: 0,
  transferType: 'general' as Transfer['transferType'],
  remarks: ''
})

watch(
  sourceAccounts,
  accounts => {
    if (accounts.length > 0 && !accounts.some(account => account.id === form.value.fromAccountId)) {
      form.value.fromAccountId = accounts[0].id
    }
  },
  { immediate: true }
)

watch(
  destinationAccounts,
  accounts => {
    const validTargets = accounts.filter(account => account.id !== form.value.fromAccountId)
    if (validTargets.length > 0 && !validTargets.some(account => account.id === form.value.toAccountId)) {
      form.value.toAccountId = validTargets[0].id
    }
  },
  { immediate: true }
)

watch(
  () => form.value.fromAccountId,
  fromAccountId => {
    if (form.value.toAccountId === fromAccountId) {
      const fallback = destinationAccounts.value.find(account => account.id !== fromAccountId)
      form.value.toAccountId = fallback?.id ?? ''
    }
  }
)

const resetForm = () => {
  const defaultFrom = sourceAccounts.value[0]?.id ?? ''
  const defaultTo = destinationAccounts.value.find(account => account.id !== defaultFrom)?.id ?? ''
  form.value = {
    date: new Date().toISOString().split('T')[0],
    fromAccountId: defaultFrom,
    toAccountId: defaultTo,
    amount: 0,
    transferType: 'general',
    remarks: ''
  }
}

const submitForm = () => {
  if (!form.value.date || !form.value.amount || !form.value.fromAccountId || !form.value.toAccountId) {
    window.alert('Please fill in the required transfer fields.')
    return
  }

  if (form.value.fromAccountId === form.value.toAccountId) {
    window.alert('Transfer source and destination must be different accounts.')
    return
  }

  const availableBalance = props.accountBalances[form.value.fromAccountId] ?? 0
  if (form.value.amount > availableBalance) {
    const accountName = props.accounts.find(account => account.id === form.value.fromAccountId)?.name ?? 'the selected account'
    window.alert(`This transfer is larger than the available balance in ${accountName}.`)
    return
  }

  emit('submit', {
    date: form.value.date,
    fromAccountId: form.value.fromAccountId,
    toAccountId: form.value.toAccountId,
    amount: form.value.amount,
    transferType: form.value.transferType,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
