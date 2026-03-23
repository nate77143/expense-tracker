<template>
  <section class="panel panel-strong">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Add expense</h3>
        <p class="panel-copy">Choose the account that paid for the expense so balances stay accurate.</p>
      </div>
      <span class="tag">Outgoing</span>
    </div>

    <form class="form-shell" @submit.prevent="submitForm">
      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="expense-date">Date</label>
          <input id="expense-date" v-model="form.date" type="date" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="expense-category">Category</label>
          <select id="expense-category" v-model="form.category" class="form-select" required>
            <option value="">Select a category</option>
            <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
          </select>
        </div>
      </div>

      <div v-if="form.category === 'Others'" class="form-group">
        <label class="form-label" for="custom-expense-category">Add new category</label>
        <div class="input-action-row">
          <input
            id="custom-expense-category"
            v-model="newCategory"
            type="text"
            class="form-input"
            placeholder="Examples: Pets, Education, Travel"
            @keydown.enter.prevent="handleAddCategory"
          />
          <button type="button" class="btn btn-secondary" @click="handleAddCategory">Add category</button>
        </div>
        <span class="field-help">{{ categoryHelpText }}</span>
      </div>

      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="expense-merchant">Merchant</label>
          <input id="expense-merchant" v-model.trim="form.merchant" type="text" class="form-input" placeholder="Store, payee, or biller" />
        </div>

        <div class="form-group">
          <label class="form-label" for="expense-account">Paid from</label>
          <select id="expense-account" v-model="form.fromAccountId" class="form-select" :disabled="activeAccounts.length === 0">
            <option value="">{{ activeAccounts.length === 0 ? 'No accounts available' : 'Select account' }}</option>
            <option v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
          </select>
          <span class="field-help">{{ selectedAccountHelp }}</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="expense-amount">Amount (PHP)</label>
        <input id="expense-amount" v-model.number="form.amount" type="number" min="0" step="0.01" class="form-input" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="expense-remarks">Remarks</label>
        <textarea id="expense-remarks" v-model="form.remarks" class="form-textarea" placeholder="Optional note about the expense"></textarea>
      </div>

      <button type="submit" class="btn btn-primary btn-block">Save expense</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { EXPENSE_CATEGORIES } from '../constants/categories'
import { getSavedExpenseCategories, normalizeCategoryName, saveExpenseCategories } from '../lib/expenseCategories'
import { formatCurrency } from '../lib/formatters'
import type { Account, CreditCard, Expense } from '../types'
import { getCreditCardAvailableCredit, getCreditCardOutstandingBalance } from '../lib/accountBalances'

const props = defineProps<{
  accounts: Account[]
  accountBalances: Record<string, number>
  creditCards: CreditCard[]
}>()

const emit = defineEmits<{
  submit: [expense: Omit<Expense, 'id' | 'trackerId'>]
}>()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  category: '',
  merchant: '',
  fromAccountId: '',
  amount: 0,
  remarks: ''
})

const customCategories = ref<string[]>([])
const newCategory = ref('')

const activeAccounts = computed(() => props.accounts.filter(account => account.isActive))
const categories = computed(() => [...EXPENSE_CATEGORIES, ...customCategories.value])
const selectedAccount = computed(() => props.accounts.find(account => account.id === form.value.fromAccountId) ?? null)
const selectedCreditCard = computed(() => props.creditCards.find(card => card.accountId === form.value.fromAccountId))

const categoryHelpText = computed(() => {
  if (customCategories.value.length === 0) {
    return 'Custom categories will be saved in this browser for future expense entries.'
  }

  return `${customCategories.value.length} custom categor${customCategories.value.length === 1 ? 'y' : 'ies'} saved in this browser.`
})

const selectedAccountHelp = computed(() => {
  const account = selectedAccount.value

  if (!account) {
    return 'Choose the account that paid this expense.'
  }

  const currentBalance = props.accountBalances[account.id] ?? 0

  if (account.accountType === 'credit_card' && selectedCreditCard.value) {
    return `Outstanding balance: ${formatCurrency(getCreditCardOutstandingBalance(selectedCreditCard.value, props.accountBalances))}. Available credit: ${formatCurrency(getCreditCardAvailableCredit(selectedCreditCard.value, props.accountBalances))}.`
  }

  return `Current balance in ${account.name}: ${formatCurrency(currentBalance)}.`
})

onMounted(() => {
  customCategories.value = getSavedExpenseCategories()
})

watch(
  activeAccounts,
  accounts => {
    if (accounts.length > 0 && !accounts.some(account => account.id === form.value.fromAccountId)) {
      form.value.fromAccountId = accounts[0].id
    }
  },
  { immediate: true }
)

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    merchant: '',
    fromAccountId: activeAccounts.value[0]?.id ?? '',
    amount: 0,
    remarks: ''
  }
}

const handleAddCategory = () => {
  const normalizedValue = normalizeCategoryName(newCategory.value)

  if (!normalizedValue) {
    window.alert('Please enter a category name first.')
    return
  }

  const categoryAlreadyExists = categories.value.some(category => category.toLowerCase() === normalizedValue.toLowerCase())

  if (categoryAlreadyExists) {
    form.value.category = categories.value.find(category => category.toLowerCase() === normalizedValue.toLowerCase()) ?? normalizedValue
    newCategory.value = ''
    window.alert('That category already exists, so it has been selected for you.')
    return
  }

  customCategories.value = [...customCategories.value, normalizedValue].sort((a, b) => a.localeCompare(b))
  saveExpenseCategories(customCategories.value)
  form.value.category = normalizedValue
  newCategory.value = ''
}

const submitForm = () => {
  if (!form.value.date || !form.value.category || !form.value.amount || !form.value.fromAccountId) {
    window.alert('Please fill in the required expense fields.')
    return
  }

  const account = selectedAccount.value
  if (!account) {
    window.alert('Please choose an account.')
    return
  }

  if (account.accountGroup === 'asset' && form.value.amount > (props.accountBalances[account.id] ?? 0)) {
    window.alert(`This expense is larger than the available balance in ${account.name}.`)
    return
  }

  if (account.accountType === 'credit_card' && selectedCreditCard.value) {
    const availableCredit = getCreditCardAvailableCredit(selectedCreditCard.value, props.accountBalances)
    if (form.value.amount > availableCredit) {
      window.alert(`This expense is larger than the available credit on ${selectedCreditCard.value.name}.`)
      return
    }
  }

  emit('submit', {
    date: form.value.date,
    category: form.value.category,
    merchant: form.value.merchant || undefined,
    fromAccountId: form.value.fromAccountId,
    amount: form.value.amount,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
