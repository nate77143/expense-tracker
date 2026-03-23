<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Accounts</p>
        <h2 class="section-title">Keep real balances by account</h2>
        <p class="section-copy">Track payroll, cash, savings, e-wallets, and credit-card balances from one shared account model.</p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Active accounts</span>
        <strong>{{ activeAccounts.length }}</strong>
      </div>
    </div>

    <div class="stats-grid">
      <article class="panel metric-card success">
        <div>
          <p class="metric-label">Total assets</p>
          <strong class="metric-value">{{ formatCompactCurrency(assetTotal) }}</strong>
        </div>
        <p class="metric-copy">Cash, banks, savings, and e-wallet balances currently available.</p>
      </article>

      <article class="panel metric-card danger">
        <div>
          <p class="metric-label">Total liabilities</p>
          <strong class="metric-value">{{ formatCompactCurrency(liabilityTotal) }}</strong>
        </div>
        <p class="metric-copy">Credit cards and other liabilities still waiting to be paid down.</p>
      </article>

      <article class="panel metric-card brand">
        <div>
          <p class="metric-label">Net position</p>
          <strong class="metric-value">{{ formatCompactCurrency(netPosition) }}</strong>
        </div>
        <p class="metric-copy">Assets minus liabilities across the selected tracker.</p>
      </article>
    </div>

    <div class="content-grid">
      <AccountForm :disabled="!activeTrackerId" @submit="handleAddAccount" />

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Manual adjustment</h3>
            <p class="panel-copy">Use an adjustment for reconciliations or opening balances after account creation.</p>
          </div>
          <span class="tag">Adjustment</span>
        </div>

        <form class="form-shell" @submit.prevent="handleAddAdjustment">
          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="adjustment-account">Account</label>
              <select id="adjustment-account" v-model="adjustmentForm.accountId" class="form-select" :disabled="activeAccounts.length === 0">
                <option value="">{{ activeAccounts.length === 0 ? 'No accounts available' : 'Select account' }}</option>
                <option v-for="account in activeAccounts" :key="account.id" :value="account.id">{{ account.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="adjustment-date">Date</label>
              <input id="adjustment-date" v-model="adjustmentForm.date" type="date" class="form-input" required />
            </div>
          </div>

          <div class="field-grid">
            <div class="form-group">
              <label class="form-label" for="adjustment-amount">Amount (PHP)</label>
              <input id="adjustment-amount" v-model.number="adjustmentForm.amount" type="number" step="0.01" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="adjustment-reason">Reason</label>
              <select id="adjustment-reason" v-model="adjustmentForm.reason" class="form-select">
                <option value="manual_adjustment">Manual adjustment</option>
                <option value="reconciliation_fix">Reconciliation fix</option>
                <option value="opening_balance">Opening balance</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="adjustment-remarks">Remarks</label>
            <textarea id="adjustment-remarks" v-model="adjustmentForm.remarks" class="form-textarea" placeholder="Explain why this balance was corrected"></textarea>
          </div>

          <button type="submit" class="btn btn-secondary btn-block">Save adjustment</button>
        </form>
      </section>
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Account balances</h3>
          <p class="panel-copy">Review live balances by account and open a ledger for any balance that needs investigation.</p>
        </div>
      </div>

      <div v-if="sortedAccounts.length === 0" class="empty-state">
        <div class="empty-state-title">No accounts yet</div>
        <p class="empty-state-copy">Create your first account to start tracking real balances.</p>
      </div>

      <div v-else class="stack">
        <article v-for="account in sortedAccounts" :key="account.id" class="tracker-card" :class="{ active: account.id === selectedAccountId }">
          <div class="tracker-card-main">
            <div class="tracker-card-title">{{ account.name }}</div>
            <div class="tracker-card-copy">{{ accountTypeLabel(account.accountType) }}{{ account.institution ? ` · ${account.institution}` : '' }}</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <span class="tag">{{ account.accountGroup }}</span>
              <span v-if="linkedCreditCardName(account.id)" class="tag">Card: {{ linkedCreditCardName(account.id) }}</span>
            </div>
          </div>

          <div class="tracker-card-actions">
            <strong :class="balanceClass(account)">{{ formatCurrency(displayBalance(account)) }}</strong>
            <button type="button" class="btn btn-secondary" @click="selectedAccountId = account.id">Open ledger</button>
            <button type="button" class="btn btn-danger" @click="handleDeleteAccount(account)">Remove</button>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Account ledger</h3>
          <p class="panel-copy">Follow every inflow, outflow, transfer, and adjustment affecting the selected account.</p>
        </div>
        <div class="panel-kpi">
          <span>Selected</span>
          <strong>{{ selectedAccount?.name ?? 'None' }}</strong>
        </div>
      </div>

      <div v-if="!selectedAccount" class="empty-state">
        <div class="empty-state-title">Select an account</div>
        <p class="empty-state-copy">Choose an account above to inspect its ledger.</p>
      </div>

      <div v-else-if="displayLedgerRows.length === 0" class="empty-state">
        <div class="empty-state-title">No ledger entries yet</div>
        <p class="empty-state-copy">This account will show activity here after incomes, expenses, transfers, or adjustments are recorded.</p>
      </div>

      <div v-else class="ledger-shell">
        <div class="ledger-header">
          <span>Date</span>
          <span>Type</span>
          <span>Details</span>
          <span>Inflow</span>
          <span>Outflow</span>
          <span>Running balance</span>
          <span>Remarks</span>
        </div>

        <div class="ledger-list">
          <article v-for="row in displayLedgerRows" :key="row.id" class="ledger-row">
            <div class="ledger-cell">
              <span class="ledger-cell-label">Date</span>
              <span>{{ formatDate(row.date) }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Type</span>
              <span class="tag" :class="row.type === 'expense' || row.type === 'transfer_out' ? 'tag-danger' : row.type === 'income' || row.type === 'transfer_in' ? 'tag-success' : ''">
                {{ row.type.replace(/_/g, ' ') }}
              </span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Details</span>
              <span>{{ row.label }}</span>
              <span v-if="row.counterparty" class="ledger-remarks">{{ row.counterparty }}</span>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Inflow</span>
              <strong class="amount-positive">{{ row.inflow > 0 ? formatCurrency(row.inflow) : '--' }}</strong>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Outflow</span>
              <strong class="amount-negative">{{ row.outflow > 0 ? formatCurrency(row.outflow) : '--' }}</strong>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Running balance</span>
              <strong :class="selectedAccount.accountGroup === 'liability' ? 'amount-negative' : row.runningBalance >= 0 ? 'amount-positive' : 'amount-negative'">
                {{ formatCurrency(selectedAccount.accountGroup === 'liability' ? Math.abs(Math.min(row.runningBalance, 0)) : row.runningBalance) }}
              </strong>
            </div>

            <div class="ledger-cell">
              <span class="ledger-cell-label">Remarks</span>
              <span class="ledger-remarks">{{ row.remarks || 'No remarks' }}</span>
              <span v-if="creatorLabel(row)" class="ledger-remarks">Logged by {{ creatorLabel(row) }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AccountForm from '../components/AccountForm.vue'
import { buildAccountLedger } from '../lib/accountLedger'
import {
  getAssetTotal,
  getDisplayBalance,
  getLiabilityTotal,
  getNetPosition,
  sortAccountsForDisplay
} from '../lib/accountBalances'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/formatters'
import type { Account, AccountAdjustment, CreditCard, Expense, Income, Transfer } from '../types'

const props = defineProps<{
  accounts: Account[]
  accountBalances: Record<string, number>
  incomes: Income[]
  expenses: Expense[]
  transfers: Transfer[]
  accountAdjustments: AccountAdjustment[]
  creditCards: CreditCard[]
  activeTrackerId: string
  currentUserId: string
  currentUserName: string
}>()

const emit = defineEmits<{
  'add-account': [payload: { account: Omit<Account, 'id' | 'createdAt'>; openingBalance: number }]
  'add-account-adjustment': [adjustment: Omit<AccountAdjustment, 'id' | 'trackerId'>]
  'delete-account': [id: string]
}>()

const adjustmentForm = reactive({
  accountId: '',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  reason: 'manual_adjustment' as AccountAdjustment['reason'],
  remarks: ''
})

const activeAccounts = computed(() => props.accounts.filter(account => account.isActive))
const assetTotal = computed(() => getAssetTotal(props.accounts, props.accountBalances))
const liabilityTotal = computed(() => getLiabilityTotal(props.accounts, props.accountBalances))
const netPosition = computed(() => getNetPosition(props.accounts, props.accountBalances))
const sortedAccounts = computed(() => sortAccountsForDisplay(activeAccounts.value, props.accountBalances))

const selectedAccountId = ref('')

watch(
  activeAccounts,
  accounts => {
    if (accounts.length > 0 && !accounts.some(account => account.id === selectedAccountId.value)) {
      selectedAccountId.value = accounts[0].id
    }

    if (accounts.length > 0 && !accounts.some(account => account.id === adjustmentForm.accountId)) {
      adjustmentForm.accountId = accounts[0].id
    }
  },
  { immediate: true }
)

const selectedAccount = computed(() => props.accounts.find(account => account.id === selectedAccountId.value) ?? null)
const ledgerRows = computed(() => {
  if (!selectedAccount.value) {
    return []
  }

  return buildAccountLedger(
    selectedAccount.value.id,
    props.accounts,
    props.incomes,
    props.expenses,
    props.transfers,
    props.accountAdjustments
  )
})
const displayLedgerRows = computed(() => ledgerRows.value.slice().reverse())

const accountTypeLabel = (type: Account['accountType']) => type.replace(/_/g, ' ')
const displayBalance = (account: Account) => getDisplayBalance(account, props.accountBalances[account.id] ?? 0)
const balanceClass = (account: Account) => (account.accountGroup === 'liability' ? 'amount-negative' : displayBalance(account) >= 0 ? 'amount-positive' : 'amount-negative')

const linkedCreditCardName = (accountId: string) => props.creditCards.find(card => card.accountId === accountId)?.name ?? ''

const handleAddAccount = (payload: { account: Omit<Account, 'id' | 'createdAt' | 'trackerId'>; openingBalance: number }) => {
  emit('add-account', {
    account: {
      ...payload.account,
      trackerId: props.activeTrackerId
    },
    openingBalance: payload.openingBalance
  })
}

const handleAddAdjustment = () => {
  if (!adjustmentForm.accountId || !adjustmentForm.date || !adjustmentForm.amount) {
    window.alert('Please fill in the required adjustment fields.')
    return
  }

  emit('add-account-adjustment', {
    accountId: adjustmentForm.accountId,
    date: adjustmentForm.date,
    amount: adjustmentForm.amount,
    reason: adjustmentForm.reason,
    remarks: adjustmentForm.remarks
  })

  adjustmentForm.date = new Date().toISOString().split('T')[0]
  adjustmentForm.amount = 0
  adjustmentForm.reason = 'manual_adjustment'
  adjustmentForm.remarks = ''
}

const handleDeleteAccount = (account: Account) => {
  const confirmed = window.confirm(`Remove ${account.name}? Accounts with existing activity usually cannot be deleted until related records are removed.`)

  if (!confirmed) {
    return
  }

  emit('delete-account', account.id)
}

const creatorLabel = (row: { createdByName?: string | null; createdByEmail?: string | null; createdByUserId?: string | null }) => {
  if (row.createdByName?.trim()) {
    return row.createdByName.trim()
  }

  if (props.currentUserId && props.currentUserName && row.createdByUserId === props.currentUserId) {
    return props.currentUserName
  }

  return row.createdByEmail ?? ''
}
</script>
