<template>
  <section class="panel panel-strong">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Add income</h3>
        <p class="panel-copy">Record where money came from and which account received it.</p>
      </div>
      <span class="tag tag-success">Incoming</span>
    </div>

    <form class="form-shell" @submit.prevent="submitForm">
      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="income-date">Date</label>
          <input id="income-date" v-model="form.date" type="date" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="income-amount">Amount (PHP)</label>
          <input id="income-amount" v-model.number="form.amount" type="number" min="0" step="0.01" class="form-input" required />
        </div>
      </div>

      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="income-source">Source</label>
          <input id="income-source" v-model.trim="form.source" type="text" class="form-input" placeholder="Salary, part-time, freelance" />
        </div>

        <div class="form-group">
          <label class="form-label" for="income-account">Destination account</label>
          <select id="income-account" v-model="form.toAccountId" class="form-select" :disabled="assetAccounts.length === 0">
            <option value="">{{ assetAccounts.length === 0 ? 'No asset accounts available' : 'Select account' }}</option>
            <option v-for="account in assetAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="income-remarks">Remarks</label>
        <textarea id="income-remarks" v-model="form.remarks" class="form-textarea" placeholder="Optional note about the payment"></textarea>
      </div>

      <button type="submit" class="btn btn-success btn-block">Save income</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Account, Income } from '../types'

const props = defineProps<{
  accounts: Account[]
}>()

const emit = defineEmits<{
  submit: [income: Omit<Income, 'id' | 'trackerId'>]
}>()

const assetAccounts = computed(() => props.accounts.filter(account => account.accountGroup === 'asset' && account.isActive))

const form = ref({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  source: '',
  toAccountId: '',
  remarks: ''
})

watch(
  assetAccounts,
  accounts => {
    if (accounts.length > 0 && !accounts.some(account => account.id === form.value.toAccountId)) {
      form.value.toAccountId = accounts[0].id
    }
  },
  { immediate: true }
)

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    source: '',
    toAccountId: assetAccounts.value[0]?.id ?? '',
    remarks: ''
  }
}

const submitForm = () => {
  if (!form.value.date || !form.value.amount || !form.value.toAccountId) {
    window.alert('Please fill in the required income fields.')
    return
  }

  emit('submit', {
    date: form.value.date,
    amount: form.value.amount,
    source: form.value.source,
    toAccountId: form.value.toAccountId,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
