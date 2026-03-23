<template>
  <section class="panel panel-strong">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Add account</h3>
        <p class="panel-copy">Create cash, bank, e-wallet, savings, or other balance-holding accounts for the tracker.</p>
      </div>
      <span class="tag">Account setup</span>
    </div>

    <div v-if="props.disabled" class="status-banner status-banner-warning">
      Select or create a tracker before adding accounts.
    </div>

    <form class="form-shell" @submit.prevent="submitForm">
      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="account-name">Account name</label>
          <input id="account-name" v-model.trim="form.name" type="text" class="form-input" placeholder="Cash, Payroll Account, GCash" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="account-type">Account type</label>
          <select id="account-type" v-model="form.accountType" class="form-select">
            <option v-for="option in accountTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>

      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="account-institution">Institution</label>
          <input id="account-institution" v-model.trim="form.institution" type="text" class="form-input" placeholder="BPI, BDO, Maya, Wallet" />
        </div>

        <div class="form-group">
          <label class="form-label" for="account-opening-balance">Opening balance (PHP)</label>
          <input id="account-opening-balance" v-model.number="form.openingBalance" type="number" step="0.01" class="form-input" placeholder="0.00" />
          <span class="field-help">
            {{ openingBalanceHelp }}
          </span>
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="props.disabled">Save account</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Account, AccountType } from '../types'

const props = withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  submit: [payload: { account: Omit<Account, 'id' | 'createdAt' | 'trackerId'>; openingBalance: number }]
}>()

const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'checking', label: 'Checking account' },
  { value: 'savings', label: 'Savings account' },
  { value: 'ewallet', label: 'E-wallet' },
  { value: 'other_asset', label: 'Other asset' },
  { value: 'other_liability', label: 'Other liability' }
]

const form = ref({
  name: '',
  accountType: 'cash' as AccountType,
  institution: '',
  openingBalance: 0
})

const accountGroup = computed<Account['accountGroup']>(() => {
  return form.value.accountType === 'credit_card' || form.value.accountType === 'other_liability' ? 'liability' : 'asset'
})

const openingBalanceHelp = computed(() => {
  if (accountGroup.value === 'liability') {
    return 'Use a positive number if this liability already has debt. The app will store it as money you owe.'
  }

  return 'Use a positive number if this account already holds money.'
})

const resetForm = () => {
  form.value = {
    name: '',
    accountType: 'cash',
    institution: '',
    openingBalance: 0
  }
}

const submitForm = () => {
  if (props.disabled) {
    window.alert('Select or create a tracker before adding accounts.')
    return
  }

  if (!form.value.name) {
    window.alert('Please enter an account name.')
    return
  }

  emit('submit', {
    account: {
      name: form.value.name,
      accountType: form.value.accountType,
      accountGroup: accountGroup.value,
      institution: form.value.institution,
      currencyCode: 'PHP',
      isActive: true,
      sortOrder: 0
    },
    openingBalance: form.value.openingBalance || 0
  })

  resetForm()
}
</script>
