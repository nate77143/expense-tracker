<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Credit Cards</p>
        <h2 class="section-title">Card metadata with account-backed balances</h2>
        <p class="section-copy">Card purchases now come from expense records on card accounts, and payments are normal transfers into those accounts.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Tracked cards</span>
        <strong>{{ creditCards.length }}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Outstanding</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalOutstanding) }}</strong>
        </div>
        <p class="metric-copy">Total amount currently owed across all tracked cards.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Available credit</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalAvailableCredit) }}</strong>
        </div>
        <p class="metric-copy">Combined unused credit remaining across the card portfolio.</p>
      </article>
    </div>

    <div class="content-grid">
      <section class="panel panel-strong">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Add credit card</h3>
            <p class="panel-copy">Each card creates a linked liability account so charges and payments affect one balance source.</p>
          </div>
          <span class="tag">Card setup</span>
        </div>

        <form class="form-shell" @submit.prevent="submitForm">
          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="card-name">Card name</label>
              <input id="card-name" v-model.trim="form.name" type="text" class="form-input" placeholder="BPI Visa" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="card-issuer">Issuer</label>
              <input id="card-issuer" v-model.trim="form.issuer" type="text" class="form-input" placeholder="BPI, RCBC, Security Bank" />
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="card-limit">Credit limit (PHP)</label>
              <input id="card-limit" v-model.number="form.limitAmount" type="number" min="0" step="0.01" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="card-opening-balance">Current owed balance (PHP)</label>
              <input id="card-opening-balance" v-model.number="form.openingBalance" type="number" min="0" step="0.01" class="form-input" />
              <span class="field-help">Enter what is already owed on this card today. It will be saved as a negative opening balance.</span>
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="card-statement-day">Statement day</label>
              <input id="card-statement-day" v-model.number="form.statementDay" type="number" min="1" max="31" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="card-due-day">Due day</label>
              <input id="card-due-day" v-model.number="form.dueDay" type="number" min="1" max="31" class="form-input" required />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Save credit card</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Card balances</h3>
            <p class="panel-copy">Each card balance comes from the linked liability account, not a separate transaction ledger.</p>
          </div>
        </div>

        <div v-if="creditCards.length === 0" class="empty-state">
          <div class="empty-state-title">No credit cards yet</div>
          <p class="empty-state-copy">Add your first card to start tracking liability balances and card-specific metadata.</p>
        </div>

        <div v-else class="stack">
          <article v-for="card in creditCards" :key="card.id" class="tracker-card">
            <div class="tracker-card-main">
              <div class="tracker-card-title">{{ card.name }}</div>
              <div class="tracker-card-copy">{{ card.issuer || 'Issuer not specified' }} · Statement day {{ card.statementDay }} · Due day {{ card.dueDay }}</div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="tag tag-danger">{{ formatCurrency(outstanding(card)) }} owed</span>
                <span class="tag tag-success">{{ formatCurrency(availableCredit(card)) }} available</span>
                <span class="tag">{{ utilizationLabel(card) }}</span>
              </div>
            </div>

            <div class="tracker-card-actions">
              <button type="button" class="btn btn-danger" @click="handleDelete(card)">Remove</button>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Recent card charges</h3>
            <p class="panel-copy">Charges are just expenses paid from a credit-card account.</p>
          </div>
        </div>

        <div v-if="recentCardExpenses.length === 0" class="empty-state">
          <div class="empty-state-title">No card charges yet</div>
          <p class="empty-state-copy">Use a credit card account in the Expenses page to see charges here.</p>
        </div>

        <div v-else class="stack list-scroll-shell">
          <article v-for="expense in recentCardExpenses" :key="expense.id" class="transaction-item">
            <div class="transaction-main">
              <div class="transaction-title">{{ expense.category }}</div>
              <div class="transaction-meta">{{ formatDate(expense.date) }} · {{ expense.merchant || 'No merchant' }}</div>
              <div class="transaction-meta">{{ accountName(expense.fromAccountId) }}</div>
            </div>
            <strong class="amount-negative">{{ formatCurrency(expense.amount) }}</strong>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Recent card payments</h3>
            <p class="panel-copy">Card payments are transfers whose destination account is a card account.</p>
          </div>
        </div>

        <div v-if="recentCardPayments.length === 0" class="empty-state">
          <div class="empty-state-title">No card payments yet</div>
          <p class="empty-state-copy">Use the Transfers page to pay down credit-card balances.</p>
        </div>

        <div v-else class="stack list-scroll-shell">
          <article v-for="transfer in recentCardPayments" :key="transfer.id" class="transaction-item">
            <div class="transaction-main">
              <div class="transaction-title">{{ accountName(transfer.fromAccountId) }} -> {{ accountName(transfer.toAccountId) }}</div>
              <div class="transaction-meta">{{ formatDate(transfer.date) }} · {{ transfer.transferType.replace(/_/g, ' ') }}</div>
              <div class="transaction-meta">{{ transfer.remarks || 'No remarks' }}</div>
            </div>
            <strong class="amount-positive">{{ formatCurrency(transfer.amount) }}</strong>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { getCreditCardAvailableCredit, getCreditCardOutstandingBalance } from '../lib/accountBalances'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/formatters'
import type { Account, CreditCard, Expense, Transfer } from '../types'

const props = defineProps<{
  creditCards: CreditCard[]
  accounts: Account[]
  expenses: Expense[]
  transfers: Transfer[]
  accountBalances: Record<string, number>
  activeTrackerId: string
}>()

const emit = defineEmits<{
  'add-credit-card': [payload: Omit<CreditCard, 'id' | 'createdAt'> & { openingBalance: number }]
  'delete-credit-card': [id: string]
}>()

const form = reactive({
  name: '',
  issuer: '',
  limitAmount: 0,
  openingBalance: 0,
  statementDay: 1,
  dueDay: 1
})

const outstanding = (card: CreditCard) => getCreditCardOutstandingBalance(card, props.accountBalances)
const availableCredit = (card: CreditCard) => getCreditCardAvailableCredit(card, props.accountBalances)
const totalOutstanding = computed(() => props.creditCards.reduce((sum, card) => sum + outstanding(card), 0))
const totalAvailableCredit = computed(() => props.creditCards.reduce((sum, card) => sum + availableCredit(card), 0))

const creditCardAccountIds = computed(() => new Set(props.creditCards.map(card => card.accountId)))
const recentCardExpenses = computed(() =>
  props.expenses
    .filter(expense => creditCardAccountIds.value.has(expense.fromAccountId))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 12)
)
const recentCardPayments = computed(() =>
  props.transfers
    .filter(transfer => creditCardAccountIds.value.has(transfer.toAccountId))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 12)
)

const accountName = (accountId: string) => props.accounts.find(account => account.id === accountId)?.name ?? 'Unknown account'
const utilizationLabel = (card: CreditCard) => (card.limitAmount > 0 ? `${Math.round((outstanding(card) / card.limitAmount) * 100)}% used` : 'No limit')

const resetForm = () => {
  form.name = ''
  form.issuer = ''
  form.limitAmount = 0
  form.openingBalance = 0
  form.statementDay = 1
  form.dueDay = 1
}

const submitForm = () => {
  if (!form.name || !form.limitAmount || form.statementDay < 1 || form.dueDay < 1) {
    window.alert('Please fill in all required credit card fields.')
    return
  }

  emit('add-credit-card', {
    trackerId: props.activeTrackerId,
    accountId: '',
    name: form.name,
    issuer: form.issuer,
    limitAmount: form.limitAmount,
    statementDay: form.statementDay,
    dueDay: form.dueDay,
    openingBalance: form.openingBalance
  })

  resetForm()
}

const handleDelete = (card: CreditCard) => {
  const confirmed = window.confirm(`Remove ${card.name}? This only works if no expenses or payments still reference the linked card account.`)
  if (!confirmed) {
    return
  }

  emit('delete-credit-card', card.id)
}
</script>
