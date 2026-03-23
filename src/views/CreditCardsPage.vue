<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Credit Monitoring</p>
        <h2 class="section-title">Track balances, limits, and payments</h2>
        <p class="section-copy">
          Use card-funded expenses from the Transactions page, then review utilization and log card payments here.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Tracked cards</span>
        <strong>{{ creditCards.length }}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card neutral">
        <div>
          <p class="metric-label">Outstanding balance</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalOutstandingBalance) }}</strong>
        </div>
        <p class="metric-copy">All unpaid card charges recorded across this tracker.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Available credit</p>
          <strong class="metric-value">{{ formatCompactCurrency(totalAvailableCredit) }}</strong>
        </div>
        <p class="metric-copy">Remaining room before the combined card limits are fully used.</p>
      </article>

      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Available income</p>
          <strong class="metric-value">{{ formatCompactCurrency(availableIncome) }}</strong>
        </div>
        <p class="metric-copy">Cash still available for income-funded expenses and card payments.</p>
      </article>
    </div>

    <div class="content-grid">
      <section class="panel panel-strong">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Add credit card</h3>
            <p class="panel-copy">Create a card profile with its issuer, limit, statement day, and due day.</p>
          </div>
          <span class="tag">Card setup</span>
        </div>

        <form class="form-shell" @submit.prevent="submitCardForm">
          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="card-name">Card name</label>
              <input id="card-name" v-model.trim="cardForm.name" type="text" class="form-input" placeholder="BPI Rewards" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="card-issuer">Issuer</label>
              <input id="card-issuer" v-model.trim="cardForm.issuer" type="text" class="form-input" placeholder="BPI, BDO, RCBC" />
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="card-limit">Credit limit (PHP)</label>
              <input id="card-limit" v-model.number="cardForm.limitAmount" type="number" min="0" step="0.01" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="card-statement-day">Statement day</label>
              <input id="card-statement-day" v-model.number="cardForm.statementDay" type="number" min="1" max="31" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="card-due-day">Due day</label>
            <input id="card-due-day" v-model.number="cardForm.dueDay" type="number" min="1" max="31" class="form-input" required />
          </div>

          <button type="submit" class="btn btn-primary btn-block">Save credit card</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Record card payment</h3>
            <p class="panel-copy">Track payments separately here so balances, utilization, and cash position stay accurate.</p>
          </div>
          <span class="tag tag-success">Payment</span>
        </div>

        <form class="form-shell" @submit.prevent="submitPaymentForm">
          <div class="form-group">
            <label class="form-label" for="payment-card">Credit card</label>
            <select id="payment-card" v-model="paymentForm.creditCardId" class="form-select" :disabled="creditCards.length === 0">
              <option value="">{{ creditCards.length === 0 ? 'No credit cards available' : 'Select a credit card' }}</option>
              <option v-for="card in creditCards" :key="card.id" :value="card.id">
                {{ `${card.name} (${formatCurrency(cardSummary(card.id).outstandingBalance)} due)` }}
              </option>
            </select>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="payment-date">Date</label>
              <input id="payment-date" v-model="paymentForm.date" type="date" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="payment-amount">Amount (PHP)</label>
              <input id="payment-amount" v-model.number="paymentForm.amount" type="number" min="0" step="0.01" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="payment-source">Paid from</label>
            <select id="payment-source" v-model="paymentForm.paymentSource" class="form-select">
              <option value="income">Income</option>
              <option value="savings">Savings</option>
            </select>
            <span class="field-help">
              {{
                paymentForm.paymentSource === 'income'
                  ? `Available income: ${formatCurrency(availableIncome)}`
                  : 'Paying from savings will also deduct the selected savings bank balance.'
              }}
            </span>
          </div>

          <div v-if="paymentForm.paymentSource === 'savings'" class="form-group">
            <label class="form-label" for="payment-bank">Savings bank</label>
            <select id="payment-bank" v-model="paymentForm.paymentSourceBank" class="form-select" :disabled="availableSavingsBanks.length === 0">
              <option value="">{{ availableSavingsBanks.length === 0 ? 'No savings bank available' : 'Select a savings bank' }}</option>
              <option v-for="bank in availableSavingsBanks" :key="bank" :value="bank">
                {{ `${bank} (${formatCurrency(savingsBankBalances[bank] ?? 0)})` }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="payment-remarks">Remarks</label>
            <textarea
              id="payment-remarks"
              v-model="paymentForm.remarks"
              class="form-textarea"
              placeholder="Optional note about this payment"
            ></textarea>
          </div>

          <button type="submit" class="btn btn-success btn-block" :disabled="creditCards.length === 0">
            Save payment
          </button>
        </form>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Card overview</h3>
          <p class="panel-copy">See outstanding balances, utilization, and billing cycle details for each card.</p>
        </div>
      </div>

      <div v-if="creditCards.length === 0" class="empty-state">
        <div class="empty-state-title">No credit cards yet</div>
        <p class="empty-state-copy">Add your first card to start monitoring balances and payments.</p>
      </div>

      <div v-else class="stack">
        <article v-for="card in creditCards" :key="card.id" class="tracker-card">
          <div class="tracker-card-main">
            <div class="tracker-card-title">{{ card.name }}</div>
            <div class="tracker-card-copy">
              {{ card.issuer || 'Issuer not specified' }}.
              Statement day {{ card.statementDay }}, due day {{ card.dueDay }}.
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <span class="tag">{{ formatCurrency(cardSummary(card.id).outstandingBalance) }} due</span>
              <span class="tag tag-success">{{ formatCurrency(cardSummary(card.id).availableCredit) }} available</span>
              <span class="tag">{{ utilizationLabel(card.id) }}</span>
            </div>
          </div>

          <div class="tracker-card-actions">
            <button type="button" class="btn btn-danger" @click="handleDeleteCard(card.id)">Remove</button>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Recent card activity</h3>
          <p class="panel-copy">Charges come from credit-card-funded expenses. Payments recorded here lower your outstanding balance.</p>
        </div>
        <div class="panel-kpi">
          <span>Entries</span>
          <strong>{{ creditCardTransactions.length }}</strong>
        </div>
      </div>

      <div v-if="creditCardTransactions.length === 0" class="empty-state">
        <div class="empty-state-title">No card activity yet</div>
        <p class="empty-state-copy">Use a credit card as a payment source or record a payment to see activity here.</p>
      </div>

      <div v-else class="stack list-scroll-shell">
        <article v-for="transaction in recentTransactions" :key="transaction.id" class="transaction-item">
          <div class="transaction-main">
            <div class="transaction-title">
              {{ transaction.type === 'charge' ? transaction.category || 'Card charge' : 'Card payment' }}
            </div>
            <div class="transaction-meta">{{ formatDate(transaction.date) }}</div>
            <span class="tag" :class="transaction.type === 'payment' ? 'tag-success' : ''">
              {{ creditCardNames[transaction.creditCardId] ?? 'Credit card' }}
            </span>
            <div class="transaction-meta">
              {{
                transaction.type === 'payment'
                  ? transaction.paymentSource === 'savings' && transaction.paymentSourceBank
                    ? `Paid from savings via ${transaction.paymentSourceBank}`
                    : 'Paid from income'
                  : transaction.remarks || 'Recorded from a credit-card-funded expense'
              }}
            </div>
          </div>

          <strong class="transaction-amount" :class="transaction.type === 'payment' ? 'amount-positive' : 'amount-negative'">
            {{ transaction.type === 'payment' ? '-' : '+' }}{{ formatCurrency(transaction.amount) }}
          </strong>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/formatters'
import { buildSavingsBankBalanceMap } from '../lib/savingsBanks'
import type { CreditCard, CreditCardTransaction, Expense, Income, Saving } from '../types'

const props = defineProps<{
  creditCards: CreditCard[]
  creditCardTransactions: CreditCardTransaction[]
  savings: Saving[]
  incomes: Income[]
  expenses: Expense[]
  activeTrackerId: string
}>()

const emit = defineEmits<{
  'add-credit-card': [card: Omit<CreditCard, 'id' | 'createdAt'>]
  'delete-credit-card': [id: string]
  'add-credit-card-payment': [payment: Omit<CreditCardTransaction, 'id' | 'createdAt' | 'type'>]
}>()

const cardForm = reactive({
  name: '',
  issuer: '',
  limitAmount: 0,
  statementDay: 1,
  dueDay: 1
})

const paymentForm = reactive({
  creditCardId: '',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  paymentSource: 'income' as 'income' | 'savings',
  paymentSourceBank: '',
  remarks: ''
})

const savingsBankBalances = computed<Record<string, number>>(() => {
  return buildSavingsBankBalanceMap(props.savings)
})

const availableSavingsBanks = computed(() => Object.keys(savingsBankBalances.value).sort((a, b) => a.localeCompare(b)))

const incomeFundedExpenses = computed(() =>
  props.expenses.filter(expense => expense.fundingSource === 'income').reduce((sum, expense) => sum + expense.amount, 0)
)

const incomeFundedCardPayments = computed(() =>
  props.creditCardTransactions
    .filter(transaction => transaction.type === 'payment' && transaction.paymentSource === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
)

const availableIncome = computed(() => {
  return props.incomes.reduce((sum, income) => sum + income.amount, 0) - incomeFundedExpenses.value - incomeFundedCardPayments.value
})

const creditCardNames = computed<Record<string, string>>(() => {
  return props.creditCards.reduce<Record<string, string>>((map, card) => {
    map[card.id] = card.name
    return map
  }, {})
})

const cardSummary = (cardId: string) => {
  const card = props.creditCards.find(entry => entry.id === cardId)
  const outstandingBalance = props.creditCardTransactions
    .filter(transaction => transaction.creditCardId === cardId)
    .reduce((sum, transaction) => sum + (transaction.type === 'charge' ? transaction.amount : -transaction.amount), 0)
  const limitAmount = card?.limitAmount ?? 0

  return {
    outstandingBalance,
    limitAmount,
    availableCredit: limitAmount - outstandingBalance
  }
}

const totalOutstandingBalance = computed(() => {
  return props.creditCardTransactions.reduce(
    (sum, transaction) => sum + (transaction.type === 'charge' ? transaction.amount : -transaction.amount),
    0
  )
})

const totalAvailableCredit = computed(() => {
  return props.creditCards.reduce((sum, card) => sum + cardSummary(card.id).availableCredit, 0)
})

const recentTransactions = computed(() => {
  return props.creditCardTransactions
    .slice()
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date)
      if (byDate !== 0) {
        return byDate
      }

      return b.createdAt.localeCompare(a.createdAt)
    })
    .slice(0, 12)
})

const utilizationLabel = (cardId: string) => {
  const summary = cardSummary(cardId)

  if (summary.limitAmount <= 0) {
    return 'No limit'
  }

  return `${Math.round((summary.outstandingBalance / summary.limitAmount) * 100)}% used`
}

const resetCardForm = () => {
  cardForm.name = ''
  cardForm.issuer = ''
  cardForm.limitAmount = 0
  cardForm.statementDay = 1
  cardForm.dueDay = 1
}

const resetPaymentForm = () => {
  paymentForm.creditCardId = ''
  paymentForm.date = new Date().toISOString().split('T')[0]
  paymentForm.amount = 0
  paymentForm.paymentSource = 'income'
  paymentForm.paymentSourceBank = ''
  paymentForm.remarks = ''
}

const submitCardForm = () => {
  if (!cardForm.name || !cardForm.limitAmount || cardForm.statementDay < 1 || cardForm.dueDay < 1) {
    window.alert('Please fill in all required card fields.')
    return
  }

  emit('add-credit-card', {
    trackerId: props.activeTrackerId,
    name: cardForm.name,
    issuer: cardForm.issuer,
    limitAmount: cardForm.limitAmount,
    statementDay: cardForm.statementDay,
    dueDay: cardForm.dueDay
  })

  resetCardForm()
}

const submitPaymentForm = () => {
  if (!paymentForm.creditCardId || !paymentForm.date || !paymentForm.amount) {
    window.alert('Please fill in all required payment fields.')
    return
  }

  if (paymentForm.paymentSource === 'income' && paymentForm.amount > availableIncome.value) {
    window.alert(`This payment is larger than your available income balance of ${formatCurrency(availableIncome.value)}.`)
    return
  }

  if (paymentForm.amount > cardSummary(paymentForm.creditCardId).outstandingBalance) {
    window.alert('This payment is larger than the outstanding balance on the selected card.')
    return
  }

  if (paymentForm.paymentSource === 'savings') {
    if (!paymentForm.paymentSourceBank) {
      window.alert('Please select which savings bank is funding this card payment.')
      return
    }

    if (paymentForm.amount > (savingsBankBalances.value[paymentForm.paymentSourceBank] ?? 0)) {
      window.alert('This payment is larger than the selected savings bank balance.')
      return
    }
  }

  emit('add-credit-card-payment', {
    trackerId: props.activeTrackerId,
    creditCardId: paymentForm.creditCardId,
    expenseId: null,
    date: paymentForm.date,
    amount: paymentForm.amount,
    paymentSource: paymentForm.paymentSource,
    paymentSourceBank: paymentForm.paymentSource === 'savings' ? paymentForm.paymentSourceBank : undefined,
    remarks: paymentForm.remarks
  })

  resetPaymentForm()
}

const handleDeleteCard = (cardId: string) => {
  const cardName = creditCardNames.value[cardId] ?? 'this card'
  const confirmed = window.confirm(`Remove ${cardName}? Related card activity will also be removed.`)

  if (!confirmed) {
    return
  }

  emit('delete-credit-card', cardId)
}
</script>
