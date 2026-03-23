<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Automation</p>
        <h2 class="section-title">Keep repeating transactions on schedule</h2>
        <p class="section-copy">
          Create reusable templates for recurring bills, income, savings activity, and card charges, then run due items any time.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Active rules</span>
        <strong>{{ activeRecurringCount }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <section class="panel panel-strong">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Create recurring transaction</h3>
            <p class="panel-copy">Pick a type, schedule, and destination details for each repeating entry.</p>
          </div>
          <span class="tag">Template</span>
        </div>

        <form class="form-shell" @submit.prevent="submitForm">
          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="recurring-type">Type</label>
              <select id="recurring-type" v-model="form.type" class="form-select">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="saving">Savings entry</option>
                <option value="credit_card_charge">Credit card charge</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="recurring-description">Description</label>
              <input
                id="recurring-description"
                v-model.trim="form.description"
                type="text"
                class="form-input"
                placeholder="Rent, payroll, emergency fund, Netflix"
                required
              />
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="recurring-amount">Amount (PHP)</label>
              <input id="recurring-amount" v-model.number="form.amount" type="number" min="0" step="0.01" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="recurring-frequency">Frequency</label>
              <select id="recurring-frequency" v-model="form.frequency" class="form-select">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="recurring-interval">Repeat every</label>
              <input id="recurring-interval" v-model.number="form.intervalCount" type="number" min="1" step="1" class="form-input" required />
              <span class="field-help">{{ form.frequency === 'weekly' ? 'Number of weeks between runs.' : 'Number of months between runs.' }}</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="recurring-start-date">Start date</label>
              <input id="recurring-start-date" v-model="form.startDate" type="date" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="recurring-end-date">End date</label>
            <input id="recurring-end-date" v-model="form.endDate" type="date" class="form-input" />
            <span class="field-help">Leave blank to keep the recurring transaction active until you remove it.</span>
          </div>

          <div v-if="form.type === 'expense'" class="field-grid">
            <div class="form-group">
              <label class="form-label" for="recurring-expense-category">Expense category</label>
              <input id="recurring-expense-category" v-model.trim="form.expenseCategory" type="text" class="form-input" placeholder="Rent, Utilities, Savings" />
            </div>

            <div class="form-group">
              <label class="form-label" for="recurring-expense-source">Paid from</label>
              <select id="recurring-expense-source" v-model="form.expenseFundingSource" class="form-select">
                <option value="income">Income</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit card</option>
              </select>
            </div>
          </div>

          <div v-if="form.type === 'expense' && form.expenseFundingSource === 'savings'" class="form-group">
            <label class="form-label" for="recurring-expense-bank">Savings bank</label>
            <select id="recurring-expense-bank" v-model="form.expenseFundingSourceBank" class="form-select">
              <option value="">{{ availableSavingsBanks.length === 0 ? 'No savings bank available' : 'Select a savings bank' }}</option>
              <option v-for="bank in availableSavingsBanks" :key="bank" :value="bank">{{ bank }}</option>
            </select>
          </div>

          <div v-if="form.type === 'expense' && isSavingsTransfer" class="form-group">
            <label class="form-label" for="recurring-expense-target-bank">Transfer to savings bank</label>
            <select id="recurring-expense-target-bank" v-model="form.expenseTargetSavingsBank" class="form-select">
              <option value="">{{ availableSavingsBanks.length === 0 ? 'No savings bank available' : 'Select a savings bank' }}</option>
              <option v-for="bank in availableSavingsBanks" :key="bank" :value="bank">{{ bank }}</option>
            </select>
          </div>

          <div
            v-if="
              (form.type === 'expense' && form.expenseFundingSource === 'credit_card') ||
              form.type === 'credit_card_charge'
            "
            class="form-group"
          >
            <label class="form-label" for="recurring-card">Credit card</label>
            <select id="recurring-card" v-model="form.creditCardId" class="form-select">
              <option value="">{{ creditCards.length === 0 ? 'No credit cards available' : 'Select a credit card' }}</option>
              <option v-for="card in creditCards" :key="card.id" :value="card.id">{{ card.name }}</option>
            </select>
          </div>

          <div v-if="form.type === 'credit_card_charge'" class="form-group">
            <label class="form-label" for="recurring-card-category">Charge category</label>
            <input id="recurring-card-category" v-model.trim="form.expenseCategory" type="text" class="form-input" placeholder="Subscriptions, Shopping" />
          </div>

          <div v-if="form.type === 'income'" class="form-group">
            <label class="form-label" for="recurring-income-source">Income source</label>
            <input id="recurring-income-source" v-model.trim="form.incomeSource" type="text" class="form-input" placeholder="Salary, allowance, freelance" />
          </div>

          <div v-if="form.type === 'saving'" class="form-group">
            <label class="form-label" for="recurring-savings-bank">Savings bank</label>
            <input id="recurring-savings-bank" v-model.trim="form.savingsBank" type="text" class="form-input" placeholder="BPI, BDO, CIMB" />
          </div>

          <div class="form-group">
            <label class="form-label" for="recurring-remarks">Remarks</label>
            <textarea
              id="recurring-remarks"
              v-model="form.remarks"
              class="form-textarea"
              placeholder="Optional note copied into each generated record"
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Save recurring transaction</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Run due items</h3>
            <p class="panel-copy">Generate any overdue recurring transactions immediately without waiting for a reload.</p>
          </div>
          <span class="tag tag-success">{{ dueRecurringCount }} due</span>
        </div>

        <div class="empty-state" style="margin-bottom: 1rem;">
          <div class="empty-state-title">Automation is tracker-specific</div>
          <p class="empty-state-copy">
            Each recurring template belongs to the active tracker and runs there only.
          </p>
        </div>

        <button type="button" class="btn btn-success btn-block" :disabled="processing" @click="$emit('run-due-recurring')">
          {{ processing ? 'Running due items...' : 'Run due recurring transactions now' }}
        </button>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Recurring templates</h3>
          <p class="panel-copy">Review what will run next and remove any template you no longer need.</p>
        </div>
        <div class="panel-kpi">
          <span>Total</span>
          <strong>{{ recurringTransactions.length }}</strong>
        </div>
      </div>

      <div v-if="recurringTransactions.length === 0" class="empty-state">
        <div class="empty-state-title">No recurring transactions yet</div>
        <p class="empty-state-copy">Create a template to automate repeating bills, income, savings, or card charges.</p>
      </div>

      <div v-else class="stack">
        <article v-for="transaction in sortedRecurringTransactions" :key="transaction.id" class="tracker-card">
          <div class="tracker-card-main">
            <div class="tracker-card-title">{{ transaction.description || typeLabel(transaction.type) }}</div>
            <div class="tracker-card-copy">{{ ruleSummary(transaction) }}</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <span class="tag">{{ typeLabel(transaction.type) }}</span>
              <span class="tag">{{ frequencyLabel(transaction) }}</span>
              <span class="tag" :class="transaction.nextRunDate <= today ? 'tag-danger' : ''">
                Next run {{ formatDate(transaction.nextRunDate) }}
              </span>
            </div>
          </div>

          <div class="tracker-card-actions">
            <button type="button" class="btn btn-danger" @click="handleDelete(transaction)">Remove</button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { formatDate } from '../lib/formatters'
import { buildSavingsBankSummaries } from '../lib/savingsBanks'
import type { CreditCard, RecurringTransaction, Saving } from '../types'

const props = defineProps<{
  recurringTransactions: RecurringTransaction[]
  creditCards: CreditCard[]
  savings: Saving[]
  activeTrackerId: string
  processing: boolean
}>()

const emit = defineEmits<{
  'add-recurring-transaction': [transaction: Omit<RecurringTransaction, 'id' | 'createdAt'>]
  'delete-recurring-transaction': [id: string]
  'run-due-recurring': []
}>()

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  type: 'expense' as RecurringTransaction['type'],
  description: '',
  amount: 0,
  frequency: 'monthly' as RecurringTransaction['frequency'],
  intervalCount: 1,
  startDate: today,
  endDate: '',
  expenseCategory: '',
  expenseFundingSource: 'income' as NonNullable<RecurringTransaction['expenseFundingSource']>,
  expenseFundingSourceBank: '',
  expenseTargetSavingsBank: '',
  incomeSource: '',
  savingsBank: '',
  creditCardId: '',
  remarks: ''
})

const availableSavingsBanks = computed(() => {
  return buildSavingsBankSummaries(props.savings).map(bank => bank.name)
})

const normalizedExpenseCategory = computed(() => form.expenseCategory.trim())
const isSavingsTransfer = computed(() => normalizedExpenseCategory.value.toLowerCase() === 'savings')

const activeRecurringCount = computed(() => props.recurringTransactions.filter(transaction => transaction.isActive).length)
const dueRecurringCount = computed(() =>
  props.recurringTransactions.filter(transaction => transaction.isActive && transaction.nextRunDate <= today).length
)

const sortedRecurringTransactions = computed(() => {
  return props.recurringTransactions
    .slice()
    .sort((a, b) => {
      const byNextRun = a.nextRunDate.localeCompare(b.nextRunDate)
      if (byNextRun !== 0) {
        return byNextRun
      }

      return a.description.localeCompare(b.description)
    })
})

const typeLabel = (type: RecurringTransaction['type']) => {
  if (type === 'credit_card_charge') return 'Card charge'
  if (type === 'saving') return 'Savings entry'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const frequencyLabel = (transaction: RecurringTransaction) => {
  return `Every ${transaction.intervalCount} ${transaction.frequency === 'weekly' ? 'week' : 'month'}${
    transaction.intervalCount === 1 ? '' : 's'
  }`
}

const ruleSummary = (transaction: RecurringTransaction) => {
  if (transaction.type === 'income') {
    return `${transaction.incomeSource || 'Income'} for ${transaction.amount.toFixed(2)}.`
  }

  if (transaction.type === 'saving') {
    return `${transaction.savingsBank || 'Savings'} for ${transaction.amount.toFixed(2)}.`
  }

  if (transaction.type === 'credit_card_charge') {
    const cardName = props.creditCards.find(card => card.id === transaction.creditCardId)?.name ?? 'credit card'
    return `${transaction.expenseCategory || 'Card charge'} to ${cardName}.`
  }

  return `${transaction.expenseCategory || 'Expense'} paid from ${transaction.expenseFundingSource || 'income'}.`
}

const resetForm = () => {
  form.type = 'expense'
  form.description = ''
  form.amount = 0
  form.frequency = 'monthly'
  form.intervalCount = 1
  form.startDate = today
  form.endDate = ''
  form.expenseCategory = ''
  form.expenseFundingSource = 'income'
  form.expenseFundingSourceBank = ''
  form.expenseTargetSavingsBank = ''
  form.incomeSource = ''
  form.savingsBank = ''
  form.creditCardId = ''
  form.remarks = ''
}

const submitForm = () => {
  if (!form.description || !form.amount || !form.startDate || !form.intervalCount) {
    window.alert('Please fill in all required recurring transaction fields.')
    return
  }

  if (form.type === 'expense') {
    if (!form.expenseCategory) {
      window.alert('Please enter an expense category for this recurring expense.')
      return
    }

    if (form.expenseFundingSource === 'savings' && !form.expenseFundingSourceBank) {
      window.alert('Please select which savings bank funds this recurring expense.')
      return
    }

    if (form.expenseFundingSource === 'credit_card' && !form.creditCardId) {
      window.alert('Please select a credit card for this recurring expense.')
      return
    }

    if (isSavingsTransfer.value && !form.expenseTargetSavingsBank) {
      window.alert('Please select which savings bank receives this recurring transfer.')
      return
    }
  }

  if (form.type === 'credit_card_charge' && !form.creditCardId) {
    window.alert('Please select a credit card for this recurring charge.')
    return
  }

  if (form.type === 'income' && !form.incomeSource) {
    window.alert('Please enter an income source.')
    return
  }

  if (form.type === 'saving' && !form.savingsBank) {
    window.alert('Please enter a savings bank.')
    return
  }

  emit('add-recurring-transaction', {
    trackerId: props.activeTrackerId,
    type: form.type,
    frequency: form.frequency,
    intervalCount: form.intervalCount,
    startDate: form.startDate,
    nextRunDate: form.startDate,
    endDate: form.endDate || undefined,
    isActive: true,
    amount: form.amount,
    description: form.description,
    remarks: form.remarks,
    expenseCategory: form.type === 'income' || form.type === 'saving' ? undefined : form.expenseCategory || undefined,
    expenseFundingSource:
      form.type === 'expense'
        ? isSavingsTransfer.value
          ? 'income'
          : form.expenseFundingSource
        : undefined,
    expenseFundingSourceBank: form.type === 'expense' && form.expenseFundingSource === 'savings' ? form.expenseFundingSourceBank : undefined,
    expenseTargetSavingsBank: form.type === 'expense' && isSavingsTransfer.value ? form.expenseTargetSavingsBank : undefined,
    incomeSource: form.type === 'income' ? form.incomeSource : undefined,
    savingsBank: form.type === 'saving' ? form.savingsBank : undefined,
    creditCardId:
      form.type === 'credit_card_charge' || (form.type === 'expense' && form.expenseFundingSource === 'credit_card')
        ? form.creditCardId
        : undefined,
    merchant: undefined
  })

  resetForm()
}

const handleDelete = (transaction: RecurringTransaction) => {
  const confirmed = window.confirm(`Remove recurring transaction "${transaction.description || typeLabel(transaction.type)}"?`)

  if (!confirmed) {
    return
  }

  emit('delete-recurring-transaction', transaction.id)
}
</script>
