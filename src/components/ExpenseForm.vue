<template>
  <section class="panel panel-strong">
      <div class="panel-header">
        <div>
        <h3 class="card-title">Add transaction</h3>
        <p class="panel-copy">Record an outgoing expense or a savings transfer with the right source and context.</p>
        </div>
      <span class="tag">Transaction</span>
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
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
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
          <button type="button" class="btn btn-secondary" @click="handleAddCategory">
            Add category
          </button>
        </div>
        <span class="field-help">{{ categoryHelpText }}</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="expense-amount">Amount (PHP)</label>
        <input
          id="expense-amount"
          v-model.number="form.amount"
          type="number"
          min="0"
          step="0.01"
          class="form-input"
          placeholder="0.00"
          required
        />
        <span class="field-help">Use the exact transaction amount for cleaner reporting later.</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="expense-funding-source">Paid from</label>
        <select id="expense-funding-source" v-model="form.fundingSource" class="form-select" :disabled="form.category === 'Savings'">
          <option value="income">Income</option>
          <option value="savings">Savings</option>
          <option value="credit_card">Credit card</option>
        </select>
        <span class="field-help">
          {{
            form.category === 'Savings'
              ? `Savings transfers are treated as money moving out of income and into a savings bank. Available income: ${formatCurrency(availableIncomeBalance)}.`
              : form.fundingSource === 'credit_card'
                ? 'Choose which card funded this purchase so the outstanding balance stays in sync. Card payments are recorded from the Cards section.'
                : `Choose where this expense was funded from. New expenses default to income. Available income: ${formatCurrency(availableIncomeBalance)}.`
          }}
        </span>
      </div>

      <div v-if="form.category === 'Savings'" class="form-group">
        <label class="form-label" for="expense-target-savings-bank">Transfer to savings bank</label>
        <select
          id="expense-target-savings-bank"
          v-model="form.targetSavingsBank"
          class="form-select"
          :disabled="availableSavingsBanks.length === 0"
        >
          <option value="">
            {{ availableSavingsBanks.length === 0 ? 'No savings bank available' : 'Select a savings bank' }}
          </option>
          <option v-for="bank in availableSavingsBanks" :key="bank" :value="bank">
            {{ `${bank} (${formatCurrency(getSavingsBankBalance(bank))})` }}
          </option>
        </select>
        <span class="field-help">
          {{
            availableSavingsBanks.length === 0
              ? 'Add at least one savings record first before using the Savings category as a transfer.'
              : 'Saving this transaction will also create a matching savings record for the selected bank.'
          }}
        </span>
      </div>

      <div v-if="form.fundingSource === 'savings' && form.category !== 'Savings'" class="form-group">
        <label class="form-label" for="expense-funding-bank">Savings bank</label>
        <select
          id="expense-funding-bank"
          v-model="form.fundingSourceBank"
          class="form-select"
          :disabled="availableSavingsBanks.length === 0"
        >
          <option value="">
            {{ availableSavingsBanks.length === 0 ? 'No savings bank available' : 'Select a savings bank' }}
          </option>
          <option v-for="bank in availableSavingsBanks" :key="bank" :value="bank">
            {{ bank }}
          </option>
        </select>
        <span class="field-help">
          {{
            availableSavingsBanks.length === 0
              ? 'Add at least one savings record first before using savings as the payment source.'
              : form.fundingSourceBank
                ? `Choose which savings bank funded this expense. Available in ${form.fundingSourceBank}: ${formatCurrency(getSavingsBankBalance(form.fundingSourceBank))}.`
                : 'Choose which savings bank funded this expense.'
          }}
        </span>
      </div>

      <div v-if="form.fundingSource === 'credit_card' && form.category !== 'Savings'" class="form-group">
        <label class="form-label" for="expense-funding-card">Credit card</label>
        <select id="expense-funding-card" v-model="form.fundingSourceCardId" class="form-select" :disabled="availableCreditCards.length === 0">
          <option value="">{{ availableCreditCards.length === 0 ? 'No credit cards available' : 'Select a credit card' }}</option>
          <option v-for="card in availableCreditCards" :key="card.id" :value="card.id">
            {{ `${card.name} (${formatCurrency(card.availableCredit)} available)` }}
          </option>
        </select>
        <span class="field-help">
          {{
            availableCreditCards.length === 0
              ? 'Add a credit card first before using it as a payment source.'
              : form.fundingSourceCardId
                ? `Outstanding balance: ${formatCurrency(getCreditCardOutstandingBalance(form.fundingSourceCardId))}. Available credit: ${formatCurrency(getCreditCardAvailableCredit(form.fundingSourceCardId))}.`
                : 'Choose which credit card funded this movement.'
          }}
        </span>
      </div>

      <div class="form-group">
        <label class="form-label" for="expense-remarks">Remarks</label>
        <textarea
          id="expense-remarks"
          v-model="form.remarks"
          class="form-textarea"
          placeholder="Add context, merchant details, or payment notes"
        ></textarea>
      </div>

      <button type="submit" class="btn btn-primary btn-block">Save transaction</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { EXPENSE_CATEGORIES } from '../constants/categories'
import {
  getSavedExpenseCategories,
  normalizeCategoryName,
  saveExpenseCategories
} from '../lib/expenseCategories'
import { formatCurrency } from '../lib/formatters'
import type { CreditCard, Expense } from '../types'

const props = defineProps<{
  savingsBanks?: string[]
  savingsBankBalances?: Record<string, number>
  creditCards?: CreditCard[]
  creditCardLimits?: Record<string, { limitAmount: number; outstandingBalance: number; availableCredit: number }>
  availableIncome?: number
}>()

const emit = defineEmits<{
  submit: [expense: Omit<Expense, 'id' | 'trackerId'>]
}>()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  category: '',
  amount: 0,
  fundingSource: 'income' as Expense['fundingSource'],
  fundingSourceBank: '',
  fundingSourceCardId: '',
  targetSavingsBank: '',
  remarks: ''
})

const customCategories = ref<string[]>([])
const newCategory = ref('')

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    fundingSource: 'income',
    fundingSourceBank: '',
    fundingSourceCardId: '',
    targetSavingsBank: '',
    remarks: ''
  }
}

onMounted(() => {
  customCategories.value = getSavedExpenseCategories()
})

const categories = computed(() => [...EXPENSE_CATEGORIES, ...customCategories.value])
const availableSavingsBanks = computed(() => (props.savingsBanks ?? []).filter(Boolean))
const availableCreditCards = computed(() =>
  (props.creditCards ?? []).map(card => ({
    ...card,
    outstandingBalance: props.creditCardLimits?.[card.id]?.outstandingBalance ?? 0,
    availableCredit: props.creditCardLimits?.[card.id]?.availableCredit ?? card.limitAmount
  }))
)
const availableIncomeBalance = computed(() => props.availableIncome ?? 0)

const categoryHelpText = computed(() => {
  if (customCategories.value.length === 0) {
    return 'Custom categories will be saved in this browser for future expense entries.'
  }

  return `${customCategories.value.length} custom categor${customCategories.value.length === 1 ? 'y' : 'ies'} saved in this browser.`
})

const getSavingsBankBalance = (bank: string) => props.savingsBankBalances?.[bank] ?? 0
const getCreditCardOutstandingBalance = (cardId: string) => props.creditCardLimits?.[cardId]?.outstandingBalance ?? 0
const getCreditCardAvailableCredit = (cardId: string) => props.creditCardLimits?.[cardId]?.availableCredit ?? 0

const handleAddCategory = () => {
  const normalizedValue = normalizeCategoryName(newCategory.value)

  if (!normalizedValue) {
    alert('Please enter a category name first.')
    return
  }

  const categoryAlreadyExists = categories.value.some(
    category => category.toLowerCase() === normalizedValue.toLowerCase()
  )

  if (categoryAlreadyExists) {
    form.value.category = categories.value.find(
      category => category.toLowerCase() === normalizedValue.toLowerCase()
    ) ?? normalizedValue
    newCategory.value = ''
    alert('That category already exists, so it has been selected for you.')
    return
  }

  customCategories.value = [...customCategories.value, normalizedValue].sort((a, b) => a.localeCompare(b))
  saveExpenseCategories(customCategories.value)
  form.value.category = normalizedValue
  newCategory.value = ''
}

const syncFundingSourceBank = () => {
  if (form.value.category === 'Savings') {
    form.value.fundingSource = 'income'
    form.value.fundingSourceBank = ''
    return
  }

  if (form.value.fundingSource !== 'savings') {
    form.value.fundingSourceBank = ''
  } else if (availableSavingsBanks.value.length === 0) {
    form.value.fundingSourceBank = ''
  } else if (!availableSavingsBanks.value.includes(form.value.fundingSourceBank)) {
    form.value.fundingSourceBank = availableSavingsBanks.value[0]
  }

  if (form.value.fundingSource !== 'credit_card') {
    form.value.fundingSourceCardId = ''
    return
  }

  if (availableCreditCards.value.length === 0) {
    form.value.fundingSourceCardId = ''
    return
  }

  if (!availableCreditCards.value.some(card => card.id === form.value.fundingSourceCardId)) {
    form.value.fundingSourceCardId = availableCreditCards.value[0].id
  }
}

const syncTargetSavingsBank = () => {
  if (form.value.category !== 'Savings') {
    form.value.targetSavingsBank = ''
    return
  }

  if (availableSavingsBanks.value.length === 0) {
    form.value.targetSavingsBank = ''
    return
  }

  if (!availableSavingsBanks.value.includes(form.value.targetSavingsBank)) {
    form.value.targetSavingsBank = availableSavingsBanks.value[0]
  }
}

watch(
  () => form.value.fundingSource,
  () => {
    syncFundingSourceBank()
  }
)

watch(
  () => form.value.category,
  () => {
    syncFundingSourceBank()
    syncTargetSavingsBank()
  }
)

watch(
  availableSavingsBanks,
  () => {
    syncFundingSourceBank()
    syncTargetSavingsBank()
  },
  { immediate: true }
)

watch(
  availableCreditCards,
  () => {
    syncFundingSourceBank()
  },
  { immediate: true }
)

const submitForm = () => {
  if (!form.value.date || !form.value.category || !form.value.amount) {
    alert('Please fill in all required fields.')
    return
  }

  if (form.value.fundingSource === 'savings' && !form.value.fundingSourceBank) {
    alert('Please select which savings bank funded this expense.')
    return
  }

  if (form.value.fundingSource === 'income' && form.value.amount > availableIncomeBalance.value) {
    alert(`This movement is larger than your available income balance of ${formatCurrency(availableIncomeBalance.value)}.`)
    return
  }

  if (
    form.value.fundingSource === 'savings' &&
    form.value.fundingSourceBank &&
    form.value.amount > getSavingsBankBalance(form.value.fundingSourceBank)
  ) {
    alert(
      `This movement is larger than the available balance in ${form.value.fundingSourceBank} (${formatCurrency(getSavingsBankBalance(form.value.fundingSourceBank))}).`
    )
    return
  }

  if (form.value.fundingSource === 'credit_card' && !form.value.fundingSourceCardId) {
    alert('Please select which credit card funded this expense.')
    return
  }

  if (
    form.value.fundingSource === 'credit_card' &&
    form.value.fundingSourceCardId &&
    form.value.amount > getCreditCardAvailableCredit(form.value.fundingSourceCardId)
  ) {
    alert(
      `This movement is larger than the available credit on the selected card (${formatCurrency(getCreditCardAvailableCredit(form.value.fundingSourceCardId))}).`
    )
    return
  }

  if (form.value.category === 'Savings' && !form.value.targetSavingsBank) {
    alert('Please select which savings bank should receive this transfer.')
    return
  }

  emit('submit', {
    date: form.value.date,
    category: form.value.category,
    amount: form.value.amount,
    fundingSource: form.value.fundingSource,
    fundingSourceBank: form.value.fundingSource === 'savings' ? form.value.fundingSourceBank : undefined,
    fundingSourceCardId: form.value.fundingSource === 'credit_card' ? form.value.fundingSourceCardId : undefined,
    targetSavingsBank: form.value.category === 'Savings' ? form.value.targetSavingsBank : undefined,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
