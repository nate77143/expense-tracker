<template>
  <div class="app-shell">
    <main v-if="authLoading" class="main-content auth-main">
      <section class="page-frame">
        <div class="panel panel-strong">
          <p class="eyebrow">Secure Access</p>
          <h1 class="section-title">Checking your session</h1>
          <p class="section-copy">Connecting to Supabase and restoring your account session.</p>
        </div>
      </section>
    </main>

    <template v-else-if="session && isApproved">
      <Navigation
        :current-page="visiblePage"
        :user-email="session.user.email ?? ''"
        :is-admin="isAdmin"
        :trackers="trackers"
        :active-tracker-id="activeTrackerId"
        @navigate="handleNavigatePage"
        @select-tracker="activeTrackerId = $event"
        @logout="handleLogout"
      />

      <main class="main-content">
        <section class="page-frame">
          <header class="page-heading">
            <div>
              <h1 class="page-title">{{ activePage.heading }}</h1>
              <p class="page-heading-copy">{{ activePage.description }}</p>
            </div>
          </header>

          <div v-if="trackers.length === 0" class="status-banner">
            No trackers found yet. Open the Trackers page to create your first workspace.
          </div>

          <div v-if="workspaceNotice" class="status-banner status-banner-warning">
            {{ workspaceNotice }}
          </div>

          <div v-if="financeNotice" class="status-banner status-banner-warning">
            {{ financeNotice }}
          </div>

          <div v-if="cardNotice" class="status-banner status-banner-warning">
            {{ cardNotice }}
          </div>

          <div v-if="activityNotice" class="status-banner status-banner-warning">
            {{ activityNotice }}
          </div>

          <div
            v-if="automationNotice"
            class="status-banner"
            :class="automationNoticeTone === 'warning' ? 'status-banner-warning' : ''"
          >
            {{ automationNotice }}
          </div>

          <div v-if="!hasConfiguredAdminEmails && !isAdmin" class="status-banner">
            Admin access can be enabled later by setting `VITE_ADMIN_EMAILS` in the frontend and `ADMIN_EMAILS` in the server runtime.
          </div>

          <div v-if="loading" class="status-banner">
            Syncing data for {{ activeTracker?.name ?? 'the selected tracker' }}.
          </div>

          <div v-else-if="supabaseError" class="status-banner status-banner-warning">
            {{ supabaseError }}
          </div>

          <Dashboard
            v-if="visiblePage === 'dashboard'"
            :expenses="expenses"
            :incomes="incomes"
            :savings="savings"
            :credit-cards="creditCards"
            :credit-card-transactions="creditCardTransactions"
            :credit-card-name-map="creditCardNameMap"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
          />
          <ExpensesPage
            v-else-if="visiblePage === 'expenses'"
            :expenses="expenses"
            :incomes="incomes"
            :savings="savings"
            :credit-cards="creditCards"
            :credit-card-transactions="creditCardTransactions"
            :credit-card-name-map="creditCardNameMap"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            @add-expense="addExpense"
            @delete-expense="deleteExpense"
          />
          <IncomePage
            v-else-if="visiblePage === 'income'"
            :incomes="incomes"
            :expenses="expenses"
            :credit-card-transactions="creditCardTransactions"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            @add-income="addIncome"
            @delete-income="deleteIncome"
          />
          <SavingsPage
            v-else-if="visiblePage === 'savings'"
            :savings="savings"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            @add-saving="addSaving"
            @delete-saving="deleteSaving"
          />
          <CreditCardsPage
            v-else-if="visiblePage === 'cards'"
            :credit-cards="creditCards"
            :credit-card-transactions="creditCardTransactions"
            :savings="savings"
            :incomes="incomes"
            :expenses="expenses"
            :active-tracker-id="activeTrackerId"
            @add-credit-card="addCreditCardEntry"
            @delete-credit-card="deleteCreditCardEntry"
            @add-credit-card-payment="addCreditCardPaymentEntry"
          />
          <RecurringPage
            v-else-if="visiblePage === 'recurring'"
            :recurring-transactions="recurringTransactions"
            :credit-cards="creditCards"
            :savings="savings"
            :active-tracker-id="activeTrackerId"
            :processing="processingRecurring"
            @add-recurring-transaction="addRecurringTransactionEntry"
            @delete-recurring-transaction="deleteRecurringTransactionEntry"
            @run-due-recurring="runRecurringTransactionsNow"
          />
          <ReportsPage v-else-if="visiblePage === 'reports'" :expenses="expenses" :savings="savings" />
          <TrackersPage
            v-else-if="visiblePage === 'trackers'"
            :trackers="trackers"
            :members="trackerMembers"
            :activity-logs="auditLogs"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            :current-user-email="session.user.email ?? ''"
            @select-tracker="activeTrackerId = $event"
            @create-tracker="handleCreateTracker"
            @add-member="handleAddTrackerMember"
            @remove-member="handleRemoveTrackerMember"
            @delete-tracker="handleDeleteTracker"
          />
          <SettingsPage
            v-else-if="visiblePage === 'settings' && isAdmin"
            :current-user-id="session.user.id"
          />
        </section>
      </main>
    </template>

    <main v-else-if="session" class="main-content auth-main">
      <section class="page-frame">
        <div class="auth-layout">
          <section class="auth-hero panel panel-strong">
            <p class="eyebrow">Approval Required</p>
            <h1 class="auth-title">Your account is waiting for administrator approval</h1>
            <p class="auth-copy">
              Sign-up was successful, but access to the application is still restricted until an admin approves your account.
            </p>

            <div class="summary-grid">
              <div class="summary-card">
                <span class="label-muted">Signed in as</span>
                <strong>{{ session.user.email ?? 'your account' }}</strong>
              </div>
              <div class="summary-card">
                <span class="label-muted">Status</span>
                <strong>Pending approval</strong>
              </div>
            </div>
          </section>

          <section class="auth-card panel">
            <div class="panel-header">
              <div>
                <h2 class="card-title">Please contact administrator</h2>
                <p class="panel-copy">
                  Ask an administrator to approve your account from the Settings page. After approval, sign in again to access your trackers.
                </p>
              </div>
              <span class="tag tag-danger">Restricted</span>
            </div>

            <div class="status-banner status-banner-warning">
              This approval step helps limit who can use the application.
            </div>

            <button type="button" class="btn btn-secondary btn-block" @click="handleLogout">
              Sign out
            </button>
          </section>
        </div>
      </section>
    </main>

    <main v-else class="main-content auth-main">
      <section class="page-frame">
        <AuthPanel />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Session } from '@supabase/supabase-js'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AuthPanel from './components/AuthPanel.vue'
import Navigation from './components/Navigation.vue'
import { addDaysToDateString, addMonthsToDateString, isDateOnOrBefore } from './lib/date'
import { findSavingsBankDisplayName, normalizeSavingsBankName } from './lib/savingsBanks'
import Dashboard from './views/Dashboard.vue'
import CreditCardsPage from './views/CreditCardsPage.vue'
import ExpensesPage from './views/ExpensesPage.vue'
import IncomePage from './views/IncomePage.vue'
import RecurringPage from './views/RecurringPage.vue'
import ReportsPage from './views/ReportsPage.vue'
import SavingsPage from './views/SavingsPage.vue'
import SettingsPage from './views/SettingsPage.vue'
import TrackersPage from './views/TrackersPage.vue'

import { hasConfiguredAdminEmails, isAdminUser } from './lib/admin'
import type {
  BudgetAuditLog,
  CreditCard,
  CreditCardTransaction,
  Expense,
  Income,
  RecurringTransaction,
  Saving,
  Tracker,
  TrackerMember,
  TrackerRole
} from './types'
import {
  getCurrentSession,
  signOutCurrentUser,
  subscribeToAuthChanges
} from './services/supabaseAuthService'
import {
  deleteCreditCardWithRelated,
  deleteCreditCardTransaction,
  deleteExpense as deleteExpenseApi,
  deleteIncome as deleteIncomeApi,
  deleteRecurringTransaction as deleteRecurringTransactionApi,
  deleteSaving as deleteSavingApi,
  fetchAuditLogs,
  fetchCreditCardTransactions,
  fetchCreditCards,
  fetchExpenses,
  fetchIncomes,
  fetchRecurringTransactions,
  fetchSavings,
  insertCreditCard,
  insertCreditCardTransaction,
  insertExpense,
  insertIncome,
  insertRecurringTransaction,
  insertSaving,
  updateRecurringTransaction
} from './services/supabaseService'
import {
  addTrackerMember,
  createTracker,
  deleteTracker as deleteTrackerApi,
  deleteTrackerMember,
  fetchTrackerMembers,
  fetchTrackersForUser
} from './services/trackerService'

type PageId =
  | 'dashboard'
  | 'expenses'
  | 'income'
  | 'savings'
  | 'cards'
  | 'recurring'
  | 'reports'
  | 'trackers'
  | 'settings'

type NoticeTone = 'default' | 'warning'

const currentPage = ref<PageId>('dashboard')
const session = ref<Session | null>(null)
const trackers = ref<Tracker[]>([])
const trackerMembers = ref<TrackerMember[]>([])
const auditLogs = ref<BudgetAuditLog[]>([])
const activeTrackerId = ref('')
const expenses = ref<Expense[]>([])
const incomes = ref<Income[]>([])
const savings = ref<Saving[]>([])
const creditCards = ref<CreditCard[]>([])
const creditCardTransactions = ref<CreditCardTransaction[]>([])
const recurringTransactions = ref<RecurringTransaction[]>([])
const loading = ref(false)
const authLoading = ref(true)
const processingRecurring = ref(false)
const supabaseError = ref<string | null>(null)
const workspaceNotice = ref<string | null>(null)
const financeNotice = ref<string | null>(null)
const cardNotice = ref<string | null>(null)
const activityNotice = ref<string | null>(null)
const automationNotice = ref<string | null>(null)
const automationNoticeTone = ref<NoticeTone>('default')
const authSubscription = ref<{ unsubscribe: () => void } | null>(null)

const pageDetails: Record<PageId, { heading: string; description: string }> = {
  dashboard: {
    heading: 'Financial overview',
    description: 'Monitor cash flow, savings momentum, card balances, and your latest transactions from one focused dashboard.'
  },
  expenses: {
    heading: 'Money transactions',
    description: 'Record outgoing spending and savings transfers here, while credit card payments stay in the Cards section.'
  },
  income: {
    heading: 'Income tracking',
    description: 'Log every income stream in one place so your cash position stays accurate and easy to review.'
  },
  savings: {
    heading: 'Savings accounts',
    description: 'Track balances by bank and keep longer-term funds visible alongside day-to-day finances.'
  },
  cards: {
    heading: 'Credit cards',
    description: 'Monitor balances, utilization, payment schedules, and recent card activity without leaving the tracker.'
  },
  recurring: {
    heading: 'Recurring transactions',
    description: 'Automate repeating bills, income, savings entries, and recurring credit card charges with clear next-run schedules.'
  },
  reports: {
    heading: 'Performance reports',
    description: 'Review daily, weekly, and monthly expense trends to spot patterns and improve decisions.'
  },
  trackers: {
    heading: 'Tracker workspaces',
    description: 'Create separate trackers for yourself and shared groups, then switch between them with the right members.'
  },
  settings: {
    heading: 'Admin settings',
    description: 'Manage administrative controls and user access for this expense tracker deployment.'
  }
}

const isAdmin = computed(() => {
  return isAdminUser(session.value?.user.email, session.value?.user.app_metadata?.role as string | undefined)
})

const isApproved = computed(() => {
  return isAdmin.value || session.value?.user.app_metadata?.approved === true
})

const activeTracker = computed(() => trackers.value.find(tracker => tracker.id === activeTrackerId.value) ?? null)

const visiblePage = computed<PageId>(() => {
  if (currentPage.value === 'settings' && !isAdmin.value) {
    return 'dashboard'
  }

  return currentPage.value
})

const activePage = computed(() => {
  return pageDetails[visiblePage.value]
})

const creditCardNameMap = computed<Record<string, string>>(() => {
  return creditCards.value.reduce<Record<string, string>>((map, card) => {
    map[card.id] = card.name
    return map
  }, {})
})

type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

const getSupabaseErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return 'Unknown Supabase error.'
}

const isTrackerSchemaError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as SupabaseErrorLike
  const message = `${candidate.message ?? ''} ${candidate.details ?? ''} ${candidate.hint ?? ''}`.toLowerCase()

  return (
    candidate.code === '42P01' ||
    candidate.code === '42703' ||
    message.includes('tracker_members') ||
    message.includes('trackers') ||
    message.includes('tracker_id') ||
    message.includes('savings') ||
    message.includes('credit_cards') ||
    message.includes('credit_card_transactions') ||
    message.includes('recurring_transactions') ||
    message.includes('does not exist') ||
    message.includes('column') ||
    message.includes('relation')
  )
}

const resetLocalData = () => {
  trackers.value = []
  trackerMembers.value = []
  activeTrackerId.value = ''
  expenses.value = []
  incomes.value = []
  savings.value = []
  creditCards.value = []
  creditCardTransactions.value = []
  recurringTransactions.value = []
  auditLogs.value = []
  supabaseError.value = null
  workspaceNotice.value = null
  financeNotice.value = null
  cardNotice.value = null
  activityNotice.value = null
  automationNotice.value = null
  automationNoticeTone.value = 'default'
  currentPage.value = 'dashboard'
}

const replaceTrackerMembers = (trackerId: string, members: TrackerMember[]) => {
  trackerMembers.value = [...trackerMembers.value.filter(member => member.trackerId !== trackerId), ...members]
}

const replaceLocalRecurringTransaction = (transaction: RecurringTransaction) => {
  recurringTransactions.value = recurringTransactions.value.map(entry => (entry.id === transaction.id ? transaction : entry))
}

const removeLocalExpense = (id: string) => {
  expenses.value = expenses.value.filter(expense => expense.id !== id)
}

const removeLocalIncome = (id: string) => {
  incomes.value = incomes.value.filter(income => income.id !== id)
}

const removeLocalSaving = (id: string) => {
  savings.value = savings.value.filter(saving => saving.id !== id)
}

const removeLocalSavings = (ids: string[]) => {
  if (ids.length === 0) {
    return
  }

  const idSet = new Set(ids)
  savings.value = savings.value.filter(saving => !idSet.has(saving.id))
}

const removeLocalCreditCard = (id: string) => {
  creditCards.value = creditCards.value.filter(card => card.id !== id)
  creditCardTransactions.value = creditCardTransactions.value.filter(transaction => transaction.creditCardId !== id)
}

const removeLocalCreditCardTransaction = (id: string) => {
  creditCardTransactions.value = creditCardTransactions.value.filter(transaction => transaction.id !== id)
}

const getCreditCardOutstandingBalance = (creditCardId: string) => {
  return creditCardTransactions.value
    .filter(transaction => transaction.creditCardId === creditCardId)
    .reduce((sum, transaction) => sum + (transaction.type === 'charge' ? transaction.amount : -transaction.amount), 0)
}

const getCreditCardAvailableLimit = (creditCardId: string) => {
  const card = creditCards.value.find(entry => entry.id === creditCardId)

  if (!card) {
    return 0
  }

  return card.limitAmount - getCreditCardOutstandingBalance(creditCardId)
}

const getAvailableIncomeBalance = () => {
  const totalIncome = incomes.value.reduce((sum, income) => sum + income.amount, 0)
  const incomeFundedMoves = expenses.value
    .filter(expense => expense.fundingSource === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const incomeFundedCardPayments = creditCardTransactions.value
    .filter(transaction => transaction.type === 'payment' && transaction.paymentSource === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  return totalIncome - incomeFundedMoves - incomeFundedCardPayments
}

const getSavingsBankBalance = (bank: string) => {
  return savings.value
    .filter(saving => normalizeSavingsBankName(saving.bank) === normalizeSavingsBankName(bank))
    .reduce((sum, saving) => sum + saving.amount, 0)
}

const getCurrentUserDisplayName = () => {
  const firstName = String(session.value?.user.user_metadata?.first_name ?? '').trim()
  const lastName = String(session.value?.user.user_metadata?.last_name ?? '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  return fullName || String(session.value?.user.user_metadata?.full_name ?? '').trim() || null
}

const currentUserDisplayName = computed(() => getCurrentUserDisplayName() ?? session.value?.user.email ?? '')

const getRecordCreator = () => ({
  createdByName: getCurrentUserDisplayName(),
  createdByUserId: session.value?.user.id ?? null,
  createdByEmail: session.value?.user.email ?? null
})

const hasRecurringGeneratedRecord = (transactionId: string, runDate: string) => {
  return (
    expenses.value.some(
      expense => expense.sourceRecurringTransactionId === transactionId && expense.sourceRecurringRunDate === runDate
    ) ||
    incomes.value.some(
      income => income.sourceRecurringTransactionId === transactionId && income.sourceRecurringRunDate === runDate
    ) ||
    savings.value.some(
      saving => saving.sourceRecurringTransactionId === transactionId && saving.sourceRecurringRunDate === runDate
    ) ||
    creditCardTransactions.value.some(
      transaction =>
        transaction.sourceRecurringTransactionId === transactionId && transaction.sourceRecurringRunDate === runDate
    )
  )
}

const isDerivedSavingsRemark = (remarks: string | undefined, prefixes: string[]) => {
  const value = remarks?.trim().toLowerCase() ?? ''
  return prefixes.some(prefix => value.startsWith(prefix))
}

const findLegacySavingIdsForExpense = (expenseId: string) => {
  const expense = expenses.value.find(entry => entry.id === expenseId)

  if (!expense) {
    return []
  }

  const candidates = savings.value.filter(saving => {
    if (saving.sourceExpenseId || saving.sourceCreditCardTransactionId || saving.date !== expense.date) {
      return false
    }

    if (
      expense.category === 'Savings' &&
      expense.targetSavingsBank &&
      saving.amount === expense.amount &&
      normalizeSavingsBankName(saving.bank) === normalizeSavingsBankName(expense.targetSavingsBank) &&
      isDerivedSavingsRemark(saving.remarks, ['transfer from money movement', 'transfer from transaction'])
    ) {
      return true
    }

    if (
      expense.category !== 'Savings' &&
      expense.fundingSource === 'savings' &&
      expense.fundingSourceBank &&
      saving.amount === -expense.amount &&
      normalizeSavingsBankName(saving.bank) === normalizeSavingsBankName(expense.fundingSourceBank) &&
      isDerivedSavingsRemark(saving.remarks, ['deducted by money movement', 'deducted by transaction'])
    ) {
      return true
    }

    return false
  })

  return candidates.length === 1 ? [candidates[0].id] : []
}

const findLegacySavingIdsForCreditCardTransaction = (creditCardTransactionId: string) => {
  const transaction = creditCardTransactions.value.find(entry => entry.id === creditCardTransactionId)

  if (!transaction || transaction.type !== 'payment' || transaction.paymentSource !== 'savings' || !transaction.paymentSourceBank) {
    return []
  }

  const candidates = savings.value.filter(saving => {
    return (
      !saving.sourceExpenseId &&
      !saving.sourceCreditCardTransactionId &&
      saving.date === transaction.date &&
      saving.amount === -transaction.amount &&
      normalizeSavingsBankName(saving.bank) === normalizeSavingsBankName(transaction.paymentSourceBank as string) &&
      isDerivedSavingsRemark(saving.remarks, ['credit card payment'])
    )
  })

  return candidates.length === 1 ? [candidates[0].id] : []
}

const findLegacyExpenseIdForSaving = (saving: Saving) => {
  const candidates = expenses.value.filter(expense => {
    if (expense.date !== saving.date) {
      return false
    }

    if (
      saving.amount > 0 &&
      expense.category === 'Savings' &&
      expense.targetSavingsBank &&
      expense.amount === saving.amount &&
      normalizeSavingsBankName(expense.targetSavingsBank) === normalizeSavingsBankName(saving.bank) &&
      isDerivedSavingsRemark(saving.remarks, ['transfer from money movement', 'transfer from transaction'])
    ) {
      return true
    }

    if (
      saving.amount < 0 &&
      expense.category !== 'Savings' &&
      expense.fundingSource === 'savings' &&
      expense.fundingSourceBank &&
      expense.amount === Math.abs(saving.amount) &&
      normalizeSavingsBankName(expense.fundingSourceBank) === normalizeSavingsBankName(saving.bank) &&
      isDerivedSavingsRemark(saving.remarks, ['deducted by money movement', 'deducted by transaction'])
    ) {
      return true
    }

    return false
  })

  return candidates.length === 1 ? candidates[0].id : null
}

const findLegacyCreditCardTransactionIdForSaving = (saving: Saving) => {
  const candidates = creditCardTransactions.value.filter(transaction => {
    return (
      transaction.type === 'payment' &&
      transaction.paymentSource === 'savings' &&
      transaction.paymentSourceBank &&
      transaction.date === saving.date &&
      transaction.amount === Math.abs(saving.amount) &&
      normalizeSavingsBankName(transaction.paymentSourceBank) === normalizeSavingsBankName(saving.bank) &&
      isDerivedSavingsRemark(saving.remarks, ['credit card payment'])
    )
  })

  return candidates.length === 1 ? candidates[0].id : null
}

const getLinkedSavingIdsForExpense = (expenseId: string) => {
  const linkedSavings = savings.value.filter(saving => saving.sourceExpenseId === expenseId).map(saving => saving.id)
  return linkedSavings.length > 0 ? linkedSavings : findLegacySavingIdsForExpense(expenseId)
}

const getLinkedSavingIdsForCreditCardTransaction = (creditCardTransactionId: string) => {
  const linkedSavings = savings.value
    .filter(saving => saving.sourceCreditCardTransactionId === creditCardTransactionId)
    .map(saving => saving.id)

  return linkedSavings.length > 0 ? linkedSavings : findLegacySavingIdsForCreditCardTransaction(creditCardTransactionId)
}

const deleteExpenseWithSync = async (id: string) => {
  const linkedSavingIds = getLinkedSavingIdsForExpense(id)
  const { error } = await deleteExpenseApi(id)

  if (error) {
    throw error
  }

  removeLocalExpense(id)
  removeLocalSavings(linkedSavingIds)
  creditCardTransactions.value = creditCardTransactions.value.filter(transaction => transaction.expenseId !== id)
}

const deleteCreditCardTransactionWithSync = async (id: string) => {
  const transaction = creditCardTransactions.value.find(entry => entry.id === id)

  if (!transaction) {
    return
  }

  if (transaction.expenseId) {
    await deleteExpenseWithSync(transaction.expenseId)
    return
  }

  const linkedSavingIds = getLinkedSavingIdsForCreditCardTransaction(id)
  const { error } = await deleteCreditCardTransaction(id)

  if (error) {
    throw error
  }

  removeLocalCreditCardTransaction(id)
  removeLocalSavings(linkedSavingIds)
}

const buildAutoRemark = (description: string, remarks?: string) => {
  if (remarks?.trim()) {
    return remarks.trim()
  }

  return description.trim() || 'Generated by recurring transaction'
}

const getNextRecurringDate = (transaction: RecurringTransaction, fromDate: string) => {
  return transaction.frequency === 'weekly'
    ? addDaysToDateString(fromDate, transaction.intervalCount * 7)
    : addMonthsToDateString(fromDate, transaction.intervalCount)
}

const loadWorkspace = async () => {
  if (!session.value?.user.email) {
    resetLocalData()
    return
  }

  workspaceNotice.value = null

  try {
    const { trackers: loadedTrackers, trackerMembers: loadedMembers, error } = await fetchTrackersForUser(
      session.value.user.id,
      session.value.user.email
    )

    if (error) {
      throw error
    }

    trackers.value = loadedTrackers ?? []
    trackerMembers.value = loadedMembers ?? []

    if (trackers.value.length === 0) {
      activeTrackerId.value = ''
      currentPage.value = 'trackers'
      return
    }

    activeTrackerId.value = trackers.value.find(tracker => tracker.id === activeTrackerId.value)?.id ?? trackers.value[0].id
  } catch (error) {
    trackers.value = []
    trackerMembers.value = []
    activeTrackerId.value = ''
    currentPage.value = 'trackers'
    workspaceNotice.value = isTrackerSchemaError(error)
      ? 'Tracker tables are not ready in Supabase yet. Run supabase/migrations/20260321_multi_tracker_schema.sql in Supabase SQL Editor to make sharing live.'
      : `Could not load trackers from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const loadActiveTrackerMembers = async (trackerId: string) => {
  try {
    const { data, error } = await fetchTrackerMembers(trackerId)

    if (error) {
      throw error
    }

    replaceTrackerMembers(trackerId, data)
  } catch (error) {
    workspaceNotice.value = `Could not refresh tracker members from Supabase, so the app is keeping the latest local member list for now. ${getSupabaseErrorMessage(error)}`
  }
}

const loadAuditActivity = async (trackerId: string) => {
  if (!trackerId) {
    auditLogs.value = []
    return
  }

  activityNotice.value = null

  try {
    const { data, error } = await fetchAuditLogs(trackerId)

    if (error) {
      throw error
    }

    auditLogs.value = data ?? []
  } catch (error) {
    auditLogs.value = []
    activityNotice.value = `Could not load tracker activity from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const loadTrackerData = async (trackerId: string) => {
  if (!trackerId) {
    expenses.value = []
    incomes.value = []
    savings.value = []
    return
  }

  loading.value = true
  financeNotice.value = null
  supabaseError.value = null

  try {
    const [{ data: expenseData, error: expenseError }, { data: incomeData, error: incomeError }, { data: savingData, error: savingError }] =
      await Promise.all([fetchExpenses(trackerId), fetchIncomes(trackerId), fetchSavings(trackerId)])

    if (expenseError || incomeError || savingError) {
      throw expenseError ?? incomeError ?? savingError
    }

    if (
      expenseData?.some(expense => !expense.trackerId) ||
      incomeData?.some(income => !income.trackerId) ||
      savingData?.some(saving => !saving.trackerId)
    ) {
      throw new Error('tracker_id missing')
    }

    expenses.value = expenseData ?? []
    incomes.value = incomeData ?? []
    savings.value = savingData ?? []
  } catch (error) {
    expenses.value = []
    incomes.value = []
    savings.value = []
    financeNotice.value = isTrackerSchemaError(error)
      ? 'Tracker-specific finance tables are not ready in Supabase yet. Run supabase/migrations/20260321_multi_tracker_schema.sql to finish the database setup.'
      : `Could not load tracker data from Supabase. ${getSupabaseErrorMessage(error)}`
  } finally {
    loading.value = false
  }
}

const loadCreditCardData = async (trackerId: string) => {
  if (!trackerId) {
    creditCards.value = []
    creditCardTransactions.value = []
    return
  }

  cardNotice.value = null

  try {
    const [{ data: cardsData, error: cardsError }, { data: transactionsData, error: transactionsError }] = await Promise.all([
      fetchCreditCards(trackerId),
      fetchCreditCardTransactions(trackerId)
    ])

    if (cardsError || transactionsError) {
      throw cardsError ?? transactionsError
    }

    creditCards.value = cardsData ?? []
    creditCardTransactions.value = transactionsData ?? []
  } catch (error) {
    creditCards.value = []
    creditCardTransactions.value = []
    cardNotice.value = isTrackerSchemaError(error)
      ? 'Credit card tables are not ready in Supabase yet. Run the latest Supabase migrations to enable card monitoring.'
      : `Could not load credit card data from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const loadRecurringTemplateData = async (trackerId: string) => {
  if (!trackerId) {
    recurringTransactions.value = []
    return
  }

  try {
    const { data, error } = await fetchRecurringTransactions(trackerId)

    if (error) {
      throw error
    }

    recurringTransactions.value = data ?? []
  } catch (error) {
    recurringTransactions.value = []
    automationNotice.value = isTrackerSchemaError(error)
      ? 'Recurring transaction tables are not ready in Supabase yet. Run the latest Supabase migrations to enable automation.'
      : `Could not load recurring transactions from Supabase. ${getSupabaseErrorMessage(error)}`
    automationNoticeTone.value = 'warning'
  }
}

const persistSavingRecord = async (saving: Omit<Saving, 'id'>) => {
  const { data, error } = await insertSaving({
    ...getRecordCreator(),
    ...saving
  })

  if (error || !data) {
    throw error ?? new Error('Insert failed')
  }

  savings.value.unshift(data)
  return data
}

const persistIncomeRecord = async (income: Omit<Income, 'id'>) => {
  const { data, error } = await insertIncome({
    ...getRecordCreator(),
    ...income
  })

  if (error || !data) {
    throw error ?? new Error('Insert failed')
  }

  incomes.value.unshift(data)
  return data
}

const persistExpenseRecord = async (expense: Omit<Expense, 'id'>) => {
  if (expense.fundingSource === 'income' && expense.amount > getAvailableIncomeBalance()) {
    throw new Error('The selected income balance is not enough for this transaction.')
  }

  if (expense.fundingSource === 'savings') {
    if (!expense.fundingSourceBank) {
      throw new Error('Please select which savings bank funded this transaction.')
    }

    if (expense.amount > getSavingsBankBalance(expense.fundingSourceBank)) {
      throw new Error('The selected savings bank does not have enough balance for this transaction.')
    }
  }

  if (expense.fundingSource === 'credit_card') {
    if (!expense.fundingSourceCardId) {
      throw new Error('Please select which credit card funded this movement.')
    }

    if (expense.amount > getCreditCardAvailableLimit(expense.fundingSourceCardId)) {
      throw new Error('This movement is larger than the available credit on the selected card.')
    }
  }

  const { data, error } = await insertExpense({
    ...getRecordCreator(),
    trackerId: expense.trackerId,
    date: expense.date,
    category: expense.category,
    fundingSource: expense.fundingSource,
    fundingSourceBank: expense.fundingSourceBank,
    fundingSourceCardId: expense.fundingSourceCardId,
    targetSavingsBank: expense.targetSavingsBank,
    amount: expense.amount,
    remarks: expense.remarks
  })

  if (error || !data) {
    throw error ?? new Error('Insert failed')
  }

  expenses.value.unshift(data)

  const transferToSavings = expense.category === 'Savings' && expense.targetSavingsBank
  const spendFromSavings = expense.category !== 'Savings' && expense.fundingSource === 'savings' && expense.fundingSourceBank
  const spendFromCreditCard =
    expense.category !== 'Savings' && expense.fundingSource === 'credit_card' && expense.fundingSourceCardId

  if (transferToSavings || spendFromSavings) {
    const savingPayload = transferToSavings
      ? {
          trackerId: expense.trackerId,
          date: expense.date,
          bank: findSavingsBankDisplayName(savings.value, expense.targetSavingsBank as string),
          amount: expense.amount,
          sourceExpenseId: data.id,
          remarks: expense.remarks?.trim() ? `Transfer from transaction: ${expense.remarks.trim()}` : 'Transfer from transaction'
        }
      : {
          trackerId: expense.trackerId,
          date: expense.date,
          bank: findSavingsBankDisplayName(savings.value, expense.fundingSourceBank as string),
          amount: -expense.amount,
          sourceExpenseId: data.id,
          remarks: expense.remarks?.trim() ? `Deducted by transaction: ${expense.remarks.trim()}` : 'Deducted by transaction'
        }

    try {
      await persistSavingRecord(savingPayload)
    } catch (error) {
      await deleteExpenseApi(data.id)
      removeLocalExpense(data.id)
      throw error
    }
  }

  if (spendFromCreditCard) {
    const { data: transactionData, error: transactionError } = await insertCreditCardTransaction({
      ...getRecordCreator(),
      trackerId: expense.trackerId,
      creditCardId: expense.fundingSourceCardId as string,
      expenseId: data.id,
      date: expense.date,
      type: 'charge',
      amount: expense.amount,
      category: expense.category,
      remarks: expense.remarks
    })

    if (transactionError || !transactionData) {
      await deleteExpenseApi(data.id)
      removeLocalExpense(data.id)
      throw transactionError ?? new Error('Credit card sync insert failed')
    }

    creditCardTransactions.value.unshift(transactionData)
  }

  return data
}

const persistCreditCardPayment = async (
  payment: Omit<CreditCardTransaction, 'id' | 'createdAt' | 'type'>
) => {
  if (payment.amount > getCreditCardOutstandingBalance(payment.creditCardId)) {
    throw new Error('Payment amount is larger than the current outstanding balance on this card.')
  }

  if (payment.paymentSource === 'income' && payment.amount > getAvailableIncomeBalance()) {
    throw new Error('The selected income balance is not enough for this card payment.')
  }

  if (payment.paymentSource === 'savings') {
    if (!payment.paymentSourceBank) {
      throw new Error('Please select which savings bank is funding this card payment.')
    }

    if (payment.amount > getSavingsBankBalance(payment.paymentSourceBank)) {
      throw new Error('The selected savings bank does not have enough balance for this card payment.')
    }
  }

  const { data, error } = await insertCreditCardTransaction({
    ...getRecordCreator(),
    ...payment,
    type: 'payment'
  })

  if (error || !data) {
    throw error ?? new Error('Insert failed')
  }

  creditCardTransactions.value.unshift(data)

  if (payment.paymentSource === 'savings' && payment.paymentSourceBank) {
    try {
      await persistSavingRecord({
        trackerId: payment.trackerId,
        date: payment.date,
        bank: findSavingsBankDisplayName(savings.value, payment.paymentSourceBank),
        amount: -payment.amount,
        sourceCreditCardTransactionId: data.id,
        remarks: payment.remarks?.trim()
          ? `Credit card payment: ${payment.remarks.trim()}`
          : `Credit card payment to ${creditCardNameMap.value[payment.creditCardId] ?? 'card'}`
      })
    } catch (savingError) {
      await deleteCreditCardTransaction(data.id)
      removeLocalCreditCardTransaction(data.id)
      throw savingError
    }
  }

  return data
}

const createEntryFromRecurringTransaction = async (transaction: RecurringTransaction, runDate: string) => {
  const description = transaction.description.trim()
  const remarks = buildAutoRemark(description, transaction.remarks)

  if (hasRecurringGeneratedRecord(transaction.id, runDate)) {
    return
  }

  if (transaction.type === 'income') {
    await persistIncomeRecord({
      trackerId: transaction.trackerId,
      date: runDate,
      amount: transaction.amount,
      source: transaction.incomeSource?.trim() || description,
      sourceRecurringTransactionId: transaction.id,
      sourceRecurringRunDate: runDate,
      remarks
    })
    return
  }

  if (transaction.type === 'saving') {
    await persistSavingRecord({
      trackerId: transaction.trackerId,
      date: runDate,
      bank: findSavingsBankDisplayName(savings.value, transaction.savingsBank?.trim() || description || 'Savings'),
      amount: transaction.amount,
      sourceRecurringTransactionId: transaction.id,
      sourceRecurringRunDate: runDate,
      remarks
    })
    return
  }

  if (transaction.type === 'credit_card_charge') {
    if (!transaction.creditCardId) {
      throw new Error('This recurring credit card charge no longer has a card assigned.')
    }

    await persistExpenseRecord({
      trackerId: transaction.trackerId,
      date: runDate,
      category: transaction.expenseCategory?.trim() || 'Others',
      fundingSource: 'credit_card',
      fundingSourceCardId: transaction.creditCardId,
      sourceRecurringTransactionId: transaction.id,
      sourceRecurringRunDate: runDate,
      amount: transaction.amount,
      remarks
    })
    return
  }

  await persistExpenseRecord({
    trackerId: transaction.trackerId,
    date: runDate,
    category: transaction.expenseCategory?.trim() || 'Others',
    fundingSource: transaction.expenseFundingSource ?? 'income',
    fundingSourceBank: transaction.expenseFundingSourceBank,
    fundingSourceCardId: transaction.creditCardId,
    targetSavingsBank: transaction.expenseTargetSavingsBank,
    sourceRecurringTransactionId: transaction.id,
    sourceRecurringRunDate: runDate,
    amount: transaction.amount,
    remarks
  })
}

const processDueRecurringTransactions = async () => {
  if (processingRecurring.value || !activeTrackerId.value || recurringTransactions.value.length === 0) {
    return { appliedCount: 0, failures: [] as string[] }
  }

  processingRecurring.value = true
  const today = new Date().toISOString().split('T')[0]
  let appliedCount = 0
  const failures: string[] = []

  try {
    const activeTransactions = recurringTransactions.value
      .filter(transaction => transaction.isActive)
      .sort((left, right) => left.nextRunDate.localeCompare(right.nextRunDate))

    for (const transaction of activeTransactions) {
      let nextRunDate = transaction.nextRunDate
      let generatedCount = 0
      let attempts = 0

      while (
        attempts < 60 &&
        isDateOnOrBefore(nextRunDate, today) &&
        (!transaction.endDate || isDateOnOrBefore(nextRunDate, transaction.endDate))
      ) {
        attempts += 1

        try {
          await createEntryFromRecurringTransaction(transaction, nextRunDate)
          generatedCount += 1
          appliedCount += 1
          nextRunDate = getNextRecurringDate(transaction, nextRunDate)
        } catch (error) {
          failures.push(`${transaction.description || transaction.type}: ${getSupabaseErrorMessage(error)}`)
          break
        }
      }

      const shouldDeactivate = Boolean(transaction.endDate) && !isDateOnOrBefore(nextRunDate, transaction.endDate as string)

      if (generatedCount > 0 || shouldDeactivate) {
        const { data, error } = await updateRecurringTransaction(transaction.id, {
          nextRunDate,
          isActive: shouldDeactivate ? false : transaction.isActive
        })

        if (error || !data) {
          failures.push(`${transaction.description || transaction.type}: ${getSupabaseErrorMessage(error)}`)
          continue
        }

        replaceLocalRecurringTransaction(data)
      }
    }
  } finally {
    processingRecurring.value = false
  }

  return { appliedCount, failures }
}

const refreshActiveTrackerData = async (trackerId: string) => {
  await Promise.all([
    loadActiveTrackerMembers(trackerId),
    loadTrackerData(trackerId),
    loadCreditCardData(trackerId),
    loadRecurringTemplateData(trackerId),
    loadAuditActivity(trackerId)
  ])

  const { appliedCount, failures } = await processDueRecurringTransactions()

  if (appliedCount > 0) {
    await Promise.all([
      loadTrackerData(trackerId),
      loadCreditCardData(trackerId),
      loadRecurringTemplateData(trackerId),
      loadAuditActivity(trackerId)
    ])
  }

  if (appliedCount > 0 || failures.length > 0) {
    const parts = [
      appliedCount > 0 ? `Applied ${appliedCount} due recurring transaction${appliedCount === 1 ? '' : 's'}.` : '',
      failures.length > 0 ? `${failures.length} item${failures.length === 1 ? '' : 's'} still need attention.` : ''
    ].filter(Boolean)

    automationNotice.value = parts.join(' ')
    automationNoticeTone.value = failures.length > 0 ? 'warning' : 'default'
  } else {
    automationNotice.value = null
    automationNoticeTone.value = 'default'
  }
}

const syncSession = async (nextSession: Session | null) => {
  session.value = nextSession

  if (!nextSession) {
    resetLocalData()
    authLoading.value = false
    return
  }

  if (!isApproved.value) {
    resetLocalData()
    authLoading.value = false
    return
  }

  await loadWorkspace()
  authLoading.value = false
}

watch(isAdmin, value => {
  if (!value && currentPage.value === 'settings') {
    currentPage.value = 'dashboard'
  }
})

watch(activeTrackerId, async trackerId => {
  if (!trackerId || !session.value) {
    expenses.value = []
    incomes.value = []
    savings.value = []
    creditCards.value = []
    creditCardTransactions.value = []
    recurringTransactions.value = []
    auditLogs.value = []
    automationNotice.value = null
    return
  }

  await refreshActiveTrackerData(trackerId)
})

onMounted(async () => {
  const { session: currentSession } = await getCurrentSession()
  await syncSession(currentSession)

  const { data } = subscribeToAuthChanges((_event, nextSession) => {
    void syncSession(nextSession)
  })

  authSubscription.value = data.subscription
})

onUnmounted(() => {
  authSubscription.value?.unsubscribe()
})

const handleNavigatePage = (page: PageId) => {
  currentPage.value = page === 'settings' && !isAdmin.value ? 'dashboard' : page
}

const handleLogout = async () => {
  authLoading.value = true

  const { error } = await signOutCurrentUser()

  if (error) {
    await syncSession(null)
  }
}

const removeLocalTracker = (trackerId: string) => {
  trackers.value = trackers.value.filter(tracker => tracker.id !== trackerId)
  trackerMembers.value = trackerMembers.value.filter(member => member.trackerId !== trackerId)
  expenses.value = expenses.value.filter(expense => expense.trackerId !== trackerId)
  incomes.value = incomes.value.filter(income => income.trackerId !== trackerId)
  savings.value = savings.value.filter(saving => saving.trackerId !== trackerId)
  creditCards.value = creditCards.value.filter(card => card.trackerId !== trackerId)
  creditCardTransactions.value = creditCardTransactions.value.filter(transaction => transaction.trackerId !== trackerId)
  recurringTransactions.value = recurringTransactions.value.filter(transaction => transaction.trackerId !== trackerId)

  if (activeTrackerId.value === trackerId) {
    activeTrackerId.value = trackers.value[0]?.id ?? ''
  }

  if (trackers.value.length === 0) {
    currentPage.value = 'trackers'
  }
}

const handleCreateTracker = async (input: { name: string; description: string; isPersonal: boolean }) => {
  if (!session.value?.user.email) {
    return
  }

  try {
    const { tracker, ownerMembership, error } = await createTracker({
      ...input,
      ownerUserId: session.value.user.id,
      ownerEmail: session.value.user.email
    })

    if (error || !tracker || !ownerMembership) {
      throw error ?? new Error('Failed to create tracker.')
    }

    trackers.value = [...trackers.value, tracker]
    trackerMembers.value = [...trackerMembers.value, ownerMembership]
    activeTrackerId.value = tracker.id
    currentPage.value = 'dashboard'
    await loadAuditActivity(tracker.id)
  } catch (error) {
    workspaceNotice.value = `The tracker could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const handleAddTrackerMember = async (input: { trackerId: string; email: string; role: TrackerRole }) => {
  try {
    const { data, error } = await addTrackerMember(input)

    if (error || !data) {
      throw error ?? new Error('Failed to add tracker member.')
    }

    trackerMembers.value = [...trackerMembers.value, data]
    await loadAuditActivity(input.trackerId)
  } catch (error) {
    workspaceNotice.value = `The tracker member could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const handleRemoveTrackerMember = async (memberId: string) => {
  try {
    const { error } = await deleteTrackerMember(memberId)

    if (error) {
      throw error
    }

    trackerMembers.value = trackerMembers.value.filter(member => member.id !== memberId)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    workspaceNotice.value = `The tracker member could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const handleDeleteTracker = async (trackerId: string) => {
  try {
    const { error } = await deleteTrackerApi(trackerId)

    if (error) {
      throw error
    }

    removeLocalTracker(trackerId)
  } catch (error) {
    workspaceNotice.value = `The tracker could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addExpense = async (expense: Expense) => {
  try {
    await persistExpenseRecord({
      trackerId: expense.trackerId,
      date: expense.date,
      category: expense.category,
      fundingSource: expense.fundingSource,
      fundingSourceBank: expense.fundingSourceBank,
      fundingSourceCardId: expense.fundingSourceCardId,
      targetSavingsBank: expense.targetSavingsBank,
      amount: expense.amount,
      remarks: expense.remarks
    })
    await loadAuditActivity(expense.trackerId)
  } catch (error) {
    supabaseError.value = `The expense could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteExpense = async (id: string) => {
  try {
    await deleteExpenseWithSync(id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The expense could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addIncome = async (income: Income) => {
  try {
    await persistIncomeRecord({
      trackerId: income.trackerId,
      date: income.date,
      amount: income.amount,
      source: income.source,
      remarks: income.remarks
    })
    await loadAuditActivity(income.trackerId)
  } catch (error) {
    supabaseError.value = `The income entry could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteIncome = async (id: string) => {
  try {
    const income = incomes.value.find(entry => entry.id === id)

    if (!income) {
      return
    }

    if (getAvailableIncomeBalance() - income.amount < 0) {
      throw new Error(
        'This income entry is already supporting recorded income-funded transactions or card payments. Remove those deductions first.'
      )
    }

    const { error } = await deleteIncomeApi(id)

    if (error) {
      throw error
    }

    removeLocalIncome(id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The income entry could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addSaving = async (saving: Saving) => {
  try {
    await persistSavingRecord({
      trackerId: saving.trackerId,
      date: saving.date,
      bank: saving.bank,
      amount: saving.amount,
      remarks: saving.remarks
    })
    await loadAuditActivity(saving.trackerId)
  } catch (error) {
    supabaseError.value = `The savings entry could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteSaving = async (id: string) => {
  try {
    const saving = savings.value.find(entry => entry.id === id)

    if (!saving) {
      return
    }

    const sourceExpenseId = saving.sourceExpenseId ?? findLegacyExpenseIdForSaving(saving)
    const sourceCreditCardTransactionId =
      saving.sourceCreditCardTransactionId ?? findLegacyCreditCardTransactionIdForSaving(saving)

    if (sourceExpenseId) {
      await deleteExpenseWithSync(sourceExpenseId)
      await loadAuditActivity(activeTrackerId.value)
      return
    }

    if (sourceCreditCardTransactionId) {
      await deleteCreditCardTransactionWithSync(sourceCreditCardTransactionId)
      await loadAuditActivity(activeTrackerId.value)
      return
    }

    if (getSavingsBankBalance(saving.bank) - saving.amount < 0) {
      throw new Error(
        'This savings entry is already supporting recorded savings-funded transactions or card payments. Remove those deductions first.'
      )
    }

    const { error } = await deleteSavingApi(id)

    if (error) {
      throw error
    }

    removeLocalSaving(id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The savings entry could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addCreditCardEntry = async (card: Omit<CreditCard, 'id' | 'createdAt'>) => {
  try {
    const { data, error } = await insertCreditCard(card)

    if (error || !data) {
      throw error ?? new Error('Insert failed')
    }

    creditCards.value = [...creditCards.value, data]
    await loadAuditActivity(card.trackerId)
  } catch (error) {
    cardNotice.value = `The credit card could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteCreditCardEntry = async (id: string) => {
  try {
    const relatedExpenseIds = expenses.value
      .filter(expense => expense.fundingSource === 'credit_card' && expense.fundingSourceCardId === id)
      .map(expense => expense.id)
    const relatedStandaloneTransactionIds = creditCardTransactions.value
      .filter(transaction => transaction.creditCardId === id && !transaction.expenseId)
      .map(transaction => transaction.id)
    const relatedSavingIds = savings.value
      .filter(
        saving =>
          saving.sourceCreditCardTransactionId &&
          relatedStandaloneTransactionIds.includes(saving.sourceCreditCardTransactionId)
      )
      .map(saving => saving.id)

    const { error } = await deleteCreditCardWithRelated(id)

    if (error) {
      throw error
    }

    expenses.value = expenses.value.filter(expense => !relatedExpenseIds.includes(expense.id))
    creditCardTransactions.value = creditCardTransactions.value.filter(transaction => transaction.creditCardId !== id)
    removeLocalSavings(relatedSavingIds)
    removeLocalCreditCard(id)
    await loadRecurringTemplateData(activeTrackerId.value)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    cardNotice.value = `The credit card could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addCreditCardPaymentEntry = async (payment: Omit<CreditCardTransaction, 'id' | 'createdAt' | 'type'>) => {
  try {
    await persistCreditCardPayment(payment)
    await loadAuditActivity(payment.trackerId)
  } catch (error) {
    cardNotice.value = `The credit card payment could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addRecurringTransactionEntry = async (transaction: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
  try {
    const { data, error } = await insertRecurringTransaction(transaction)

    if (error || !data) {
      throw error ?? new Error('Insert failed')
    }

    recurringTransactions.value = [...recurringTransactions.value, data].sort((left, right) =>
      left.nextRunDate.localeCompare(right.nextRunDate)
    )
    await loadAuditActivity(transaction.trackerId)
  } catch (error) {
    automationNotice.value = `The recurring transaction could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
    automationNoticeTone.value = 'warning'
  }
}

const deleteRecurringTransactionEntry = async (id: string) => {
  try {
    const { error } = await deleteRecurringTransactionApi(id)

    if (error) {
      throw error
    }

    recurringTransactions.value = recurringTransactions.value.filter(transaction => transaction.id !== id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    automationNotice.value = `The recurring transaction could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
    automationNoticeTone.value = 'warning'
  }
}

const runRecurringTransactionsNow = async () => {
  if (!activeTrackerId.value) {
    return
  }

  const { appliedCount, failures } = await processDueRecurringTransactions()

  if (appliedCount > 0) {
    await Promise.all([
      loadTrackerData(activeTrackerId.value),
      loadCreditCardData(activeTrackerId.value),
      loadRecurringTemplateData(activeTrackerId.value),
      loadAuditActivity(activeTrackerId.value)
    ])
  }

  if (appliedCount === 0 && failures.length === 0) {
    automationNotice.value = 'No recurring transactions are due right now.'
    automationNoticeTone.value = 'default'
    return
  }

  const parts = [
    appliedCount > 0 ? `Applied ${appliedCount} due recurring transaction${appliedCount === 1 ? '' : 's'}.` : '',
    failures.length > 0 ? `${failures.length} item${failures.length === 1 ? '' : 's'} still need attention.` : ''
  ].filter(Boolean)

  automationNotice.value = parts.join(' ')
  automationNoticeTone.value = failures.length > 0 ? 'warning' : 'default'
}
</script>
