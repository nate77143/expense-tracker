<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Automation</p>
        <h2 class="section-title">Recurring income, expenses, and transfers</h2>
        <p class="section-copy">Recurring rules now post into real accounts so scheduled activity follows the same balance logic as manual entries.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Active rules</span>
        <strong>{{ activeRuleCount }}</strong>
      </div>
    </div>

    <div class="content-grid">
      <section class="panel panel-strong">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Create recurring rule</h3>
            <p class="panel-copy">Choose whether the rule creates an income, expense, or transfer.</p>
          </div>
          <span class="tag">Rule</span>
        </div>

        <form class="form-shell" @submit.prevent="submitForm">
          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="rule-type">Type</label>
              <select id="rule-type" v-model="form.ruleType" class="form-select">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-description">Description</label>
              <input id="rule-description" v-model.trim="form.description" type="text" class="form-input" placeholder="Payroll, rent, bank withdrawal" required />
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="rule-amount">Amount (PHP)</label>
              <input id="rule-amount" v-model.number="form.amount" type="number" min="0" step="0.01" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-frequency">Frequency</label>
              <select id="rule-frequency" v-model="form.frequency" class="form-select">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="rule-interval">Repeat every</label>
              <input id="rule-interval" v-model.number="form.intervalCount" type="number" min="1" step="1" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-start">Start date</label>
              <input id="rule-start" v-model="form.startDate" type="date" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="rule-end">End date</label>
            <input id="rule-end" v-model="form.endDate" type="date" class="form-input" />
          </div>

          <div v-if="form.ruleType === 'income'" class="field-grid">
            <div class="form-group">
              <label class="form-label" for="rule-income-source">Income source</label>
              <input id="rule-income-source" v-model.trim="form.incomeSource" type="text" class="form-input" placeholder="Salary, part-time" />
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-income-account">Destination account</label>
              <select id="rule-income-account" v-model="form.incomeToAccountId" class="form-select">
                <option value="">Select account</option>
                <option v-for="account in assetAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </div>
          </div>

          <div v-if="form.ruleType === 'expense'" class="field-grid">
            <div class="form-group">
              <label class="form-label" for="rule-expense-category">Expense category</label>
              <input id="rule-expense-category" v-model.trim="form.expenseCategory" type="text" class="form-input" placeholder="Rent, groceries, subscriptions" />
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-expense-account">From account</label>
              <select id="rule-expense-account" v-model="form.expenseFromAccountId" class="form-select">
                <option value="">Select account</option>
                <option v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </div>
          </div>

          <div v-if="form.ruleType === 'expense'" class="form-group">
            <label class="form-label" for="rule-expense-merchant">Merchant</label>
            <input id="rule-expense-merchant" v-model.trim="form.expenseMerchant" type="text" class="form-input" placeholder="Optional merchant or payee" />
          </div>

          <div v-if="form.ruleType === 'transfer'" class="field-grid">
            <div class="form-group">
              <label class="form-label" for="rule-transfer-from">From account</label>
              <select id="rule-transfer-from" v-model="form.transferFromAccountId" class="form-select">
                <option value="">Select source</option>
                <option v-for="account in assetAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="rule-transfer-to">To account</label>
              <select id="rule-transfer-to" v-model="form.transferToAccountId" class="form-select">
                <option value="">Select destination</option>
                <option v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="rule-remarks">Remarks</label>
            <textarea id="rule-remarks" v-model="form.remarks" class="form-textarea" placeholder="Optional note copied into generated entries"></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Save recurring rule</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Run due rules</h3>
            <p class="panel-copy">Generate due recurring records immediately and refresh balances.</p>
          </div>
          <span class="tag tag-success">{{ dueRuleCount }} due</span>
        </div>

        <div class="empty-state" style="margin-bottom: 1rem;">
          <div class="empty-state-title">Recurring rules are tracker-specific</div>
          <p class="empty-state-copy">Each recurring rule belongs only to the currently active tracker.</p>
        </div>

        <button type="button" class="btn btn-success btn-block" :disabled="processing" @click="$emit('run-due-recurring')">
          {{ processing ? 'Running due items...' : 'Run due recurring rules now' }}
        </button>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Recurring rules</h3>
          <p class="panel-copy">Review what will run next and remove rules you no longer need.</p>
        </div>
      </div>

      <div v-if="sortedRules.length === 0" class="empty-state">
        <div class="empty-state-title">No recurring rules yet</div>
        <p class="empty-state-copy">Create a rule to automate repeating income, expenses, or transfers.</p>
      </div>

      <div v-else class="stack">
        <article v-for="rule in sortedRules" :key="rule.id" class="tracker-card">
          <div class="tracker-card-main">
            <div class="tracker-card-title">{{ rule.description }}</div>
            <div class="tracker-card-copy">{{ ruleSummary(rule) }}</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <span class="tag">{{ rule.ruleType }}</span>
              <span class="tag">Every {{ rule.intervalCount }} {{ rule.frequency === 'weekly' ? 'week' : 'month' }}{{ rule.intervalCount === 1 ? '' : 's' }}</span>
              <span class="tag" :class="rule.nextRunDate <= today ? 'tag-danger' : ''">Next run {{ formatDate(rule.nextRunDate) }}</span>
            </div>
          </div>

          <div class="tracker-card-actions">
            <button type="button" class="btn btn-danger" @click="handleDelete(rule)">Remove</button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { formatDate } from '../lib/formatters'
import type { Account, RecurringRule } from '../types'

const props = defineProps<{
  recurringRules: RecurringRule[]
  accounts: Account[]
  activeTrackerId: string
  processing: boolean
}>()

const emit = defineEmits<{
  'add-recurring-rule': [rule: Omit<RecurringRule, 'id' | 'createdAt'>]
  'delete-recurring-rule': [id: string]
  'run-due-recurring': []
}>()

const today = new Date().toISOString().split('T')[0]
const activeAccounts = computed(() => props.accounts.filter(account => account.isActive))
const assetAccounts = computed(() => props.accounts.filter(account => account.isActive && account.accountGroup === 'asset'))

const form = reactive({
  ruleType: 'expense' as RecurringRule['ruleType'],
  description: '',
  amount: 0,
  frequency: 'monthly' as RecurringRule['frequency'],
  intervalCount: 1,
  startDate: today,
  endDate: '',
  incomeSource: '',
  incomeToAccountId: '',
  expenseCategory: '',
  expenseMerchant: '',
  expenseFromAccountId: '',
  transferFromAccountId: '',
  transferToAccountId: '',
  remarks: ''
})

const activeRuleCount = computed(() => props.recurringRules.filter(rule => rule.isActive).length)
const dueRuleCount = computed(() => props.recurringRules.filter(rule => rule.isActive && rule.nextRunDate <= today).length)
const sortedRules = computed(() => props.recurringRules.slice().sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate) || a.description.localeCompare(b.description)))

const resetForm = () => {
  form.ruleType = 'expense'
  form.description = ''
  form.amount = 0
  form.frequency = 'monthly'
  form.intervalCount = 1
  form.startDate = today
  form.endDate = ''
  form.incomeSource = ''
  form.incomeToAccountId = assetAccounts.value[0]?.id ?? ''
  form.expenseCategory = ''
  form.expenseMerchant = ''
  form.expenseFromAccountId = activeAccounts.value[0]?.id ?? ''
  form.transferFromAccountId = assetAccounts.value[0]?.id ?? ''
  form.transferToAccountId = activeAccounts.value.find(account => account.id !== form.transferFromAccountId)?.id ?? ''
  form.remarks = ''
}

const submitForm = () => {
  if (!form.description || !form.amount || !form.startDate || !form.intervalCount) {
    window.alert('Please fill in the required recurring rule fields.')
    return
  }

  if (form.endDate && form.endDate < form.startDate) {
    window.alert('End date must be on or after the start date.')
    return
  }

  if (form.ruleType === 'income' && (!form.incomeSource || !form.incomeToAccountId)) {
    window.alert('Please complete the income source and destination account fields.')
    return
  }

  if (form.ruleType === 'expense' && (!form.expenseCategory || !form.expenseFromAccountId)) {
    window.alert('Please complete the recurring expense category and source account.')
    return
  }

  if (form.ruleType === 'transfer' && (!form.transferFromAccountId || !form.transferToAccountId || form.transferFromAccountId === form.transferToAccountId)) {
    window.alert('Please choose different source and destination accounts for the transfer rule.')
    return
  }

  emit('add-recurring-rule', {
    trackerId: props.activeTrackerId,
    ruleType: form.ruleType,
    frequency: form.frequency,
    intervalCount: form.intervalCount,
    startDate: form.startDate,
    nextRunDate: form.startDate,
    endDate: form.endDate || undefined,
    isActive: true,
    amount: form.amount,
    description: form.description,
    remarks: form.remarks || undefined,
    incomeSource: form.ruleType === 'income' ? form.incomeSource : undefined,
    incomeToAccountId: form.ruleType === 'income' ? form.incomeToAccountId : undefined,
    expenseCategory: form.ruleType === 'expense' ? form.expenseCategory : undefined,
    expenseMerchant: form.ruleType === 'expense' ? form.expenseMerchant || undefined : undefined,
    expenseFromAccountId: form.ruleType === 'expense' ? form.expenseFromAccountId : undefined,
    transferFromAccountId: form.ruleType === 'transfer' ? form.transferFromAccountId : undefined,
    transferToAccountId: form.ruleType === 'transfer' ? form.transferToAccountId : undefined
  })

  resetForm()
}

const accountName = (accountId?: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'
const ruleSummary = (rule: RecurringRule) => {
  if (rule.ruleType === 'income') {
    return `${rule.incomeSource || 'Income'} -> ${accountName(rule.incomeToAccountId)} for ${rule.amount.toFixed(2)}.`
  }

  if (rule.ruleType === 'transfer') {
    return `${accountName(rule.transferFromAccountId)} -> ${accountName(rule.transferToAccountId)} for ${rule.amount.toFixed(2)}.`
  }

  return `${rule.expenseCategory || 'Expense'} from ${accountName(rule.expenseFromAccountId)} for ${rule.amount.toFixed(2)}.`
}

const handleDelete = (rule: RecurringRule) => {
  const confirmed = window.confirm(`Remove recurring rule "${rule.description}"?`)
  if (!confirmed) {
    return
  }

  emit('delete-recurring-rule', rule.id)
}

resetForm()
</script>
