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

          <div v-if="workspaceNotice" class="status-banner status-banner-warning">{{ workspaceNotice }}</div>
          <div v-if="supabaseError" class="status-banner status-banner-warning">{{ supabaseError }}</div>
          <div v-if="automationNotice" class="status-banner" :class="automationNoticeTone === 'warning' ? 'status-banner-warning' : ''">{{ automationNotice }}</div>
          <div v-if="loading" class="status-banner">Syncing data for {{ activeTracker?.name ?? 'the selected tracker' }}.</div>

          <Dashboard
            v-if="visiblePage === 'dashboard'"
            :accounts="accounts"
            :account-balances="accountBalances"
            :incomes="incomes"
            :expenses="expenses"
            :transfers="transfers"
            :account-adjustments="accountAdjustments"
            :credit-cards="creditCards"
          />
          <ExpensesPage
            v-else-if="visiblePage === 'expenses'"
            :expenses="expenses"
            :accounts="accounts"
            :account-balances="accountBalances"
            :credit-cards="creditCards"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            @add-expense="addExpense"
            @delete-expense="deleteExpense"
          />
          <IncomePage
            v-else-if="visiblePage === 'income'"
            :incomes="incomes"
            :accounts="accounts"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            @add-income="addIncome"
            @delete-income="deleteIncome"
          />
          <AccountsPage
            v-else-if="visiblePage === 'accounts'"
            :accounts="accounts"
            :account-balances="accountBalances"
            :incomes="incomes"
            :expenses="expenses"
            :transfers="transfers"
            :account-adjustments="accountAdjustments"
            :credit-cards="creditCards"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            @add-account="addAccountEntry"
            @add-account-adjustment="addAccountAdjustmentEntry"
            @delete-account="deleteAccountEntry"
          />
          <TransfersPage
            v-else-if="visiblePage === 'transfers'"
            :transfers="transfers"
            :accounts="accounts"
            :account-balances="accountBalances"
            :active-tracker-id="activeTrackerId"
            :current-user-id="session.user.id"
            :current-user-name="currentUserDisplayName"
            @add-transfer="addTransferEntry"
            @delete-transfer="deleteTransferEntry"
          />
          <CreditCardsPage
            v-else-if="visiblePage === 'cards'"
            :credit-cards="creditCards"
            :accounts="accounts"
            :expenses="expenses"
            :transfers="transfers"
            :account-balances="accountBalances"
            :active-tracker-id="activeTrackerId"
            @add-credit-card="addCreditCardEntry"
            @delete-credit-card="deleteCreditCardEntry"
          />
          <RecurringPage
            v-else-if="visiblePage === 'recurring'"
            :recurring-rules="recurringRules"
            :accounts="accounts"
            :active-tracker-id="activeTrackerId"
            :processing="processingRecurring"
            @add-recurring-rule="addRecurringRuleEntry"
            @delete-recurring-rule="deleteRecurringRuleEntry"
            @run-due-recurring="runRecurringRulesNow"
          />
          <ReportsPage
            v-else-if="visiblePage === 'reports'"
            :incomes="incomes"
            :expenses="expenses"
            :transfers="transfers"
            :accounts="accounts"
            :account-adjustments="accountAdjustments"
          />
          <TrackersPage
            v-else-if="visiblePage === 'trackers'"
            :trackers="trackers"
            :members="trackerMembers"
            :activity-logs="auditLogs"
            :accounts="accounts"
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
          <SettingsPage v-else-if="visiblePage === 'settings' && isAdmin" :current-user-id="session.user.id" />
        </section>
      </main>
    </template>

    <main v-else-if="session" class="main-content auth-main">
      <section class="page-frame">
        <div class="auth-layout">
          <section class="auth-hero panel panel-strong">
            <p class="eyebrow">Approval Required</p>
            <h1 class="auth-title">Your account is waiting for administrator approval</h1>
            <p class="auth-copy">Sign-up was successful, but access to the application is still restricted until an admin approves your account.</p>
            <div class="summary-grid">
              <div class="summary-card"><span class="label-muted">Signed in as</span><strong>{{ session.user.email ?? 'your account' }}</strong></div>
              <div class="summary-card"><span class="label-muted">Status</span><strong>Pending approval</strong></div>
            </div>
          </section>

          <section class="auth-card panel">
            <div class="panel-header">
              <div>
                <h2 class="card-title">Please contact administrator</h2>
                <p class="panel-copy">Ask an administrator to approve your account from the Settings page. After approval, sign in again to access your trackers.</p>
              </div>
              <span class="tag tag-danger">Restricted</span>
            </div>
            <div class="status-banner status-banner-warning">This approval step helps limit who can use the application.</div>
            <button type="button" class="btn btn-secondary btn-block" @click="handleLogout">Sign out</button>
          </section>
        </div>
      </section>
    </main>

    <main v-else class="main-content auth-main">
      <section class="page-frame"><AuthPanel /></section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Session } from '@supabase/supabase-js'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AuthPanel from './components/AuthPanel.vue'
import Navigation from './components/Navigation.vue'
import { isAdminUser } from './lib/admin'
import { buildAccountBalanceMap, getCreditCardAvailableCredit } from './lib/accountBalances'
import { addDaysToDateString, addMonthsToDateString, isDateOnOrBefore } from './lib/date'
import {
  deleteAccount,
  deleteAccountAdjustment,
  deleteCreditCardWithAccount,
  deleteExpense as deleteExpenseApi,
  deleteIncome as deleteIncomeApi,
  deleteRecurringRule,
  deleteTransfer,
  fetchAccountAdjustments,
  fetchAccounts,
  fetchAuditLogs,
  fetchCreditCards,
  fetchExpenses,
  fetchIncomes,
  fetchRecurringRules,
  fetchTransfers,
  createCreditCardWithAccount,
  createAccountWithOpeningBalance,
  insertAccountAdjustment,
  insertExpense,
  insertIncome,
  insertRecurringRule,
  insertTransfer,
  updateRecurringRule
} from './services/supabaseService'
import { getCurrentSession, signOutCurrentUser, subscribeToAuthChanges } from './services/supabaseAuthService'
import {
  addTrackerMember,
  createTracker,
  deleteTracker as deleteTrackerApi,
  deleteTrackerMember,
  fetchTrackerMembers,
  fetchTrackersForUser
} from './services/trackerService'
import type { Account, AccountAdjustment, BudgetAuditLog, CreditCard, Expense, Income, RecurringRule, Tracker, TrackerMember, TrackerRole, Transfer } from './types'
import AccountsPage from './views/AccountsPage.vue'
import CreditCardsPage from './views/CreditCardsPage.vue'
import Dashboard from './views/Dashboard.vue'
import ExpensesPage from './views/ExpensesPage.vue'
import IncomePage from './views/IncomePage.vue'
import RecurringPage from './views/RecurringPage.vue'
import ReportsPage from './views/ReportsPage.vue'
import SettingsPage from './views/SettingsPage.vue'
import TrackersPage from './views/TrackersPage.vue'
import TransfersPage from './views/TransfersPage.vue'

type PageId = 'dashboard' | 'expenses' | 'income' | 'accounts' | 'transfers' | 'cards' | 'recurring' | 'reports' | 'trackers' | 'settings'
type NoticeTone = 'default' | 'warning'

const currentPage = ref<PageId>('dashboard')
const session = ref<Session | null>(null)
const trackers = ref<Tracker[]>([])
const trackerMembers = ref<TrackerMember[]>([])
const auditLogs = ref<BudgetAuditLog[]>([])
const activeTrackerId = ref('')
const accounts = ref<Account[]>([])
const incomes = ref<Income[]>([])
const expenses = ref<Expense[]>([])
const transfers = ref<Transfer[]>([])
const accountAdjustments = ref<AccountAdjustment[]>([])
const creditCards = ref<CreditCard[]>([])
const recurringRules = ref<RecurringRule[]>([])
const loading = ref(false)
const authLoading = ref(true)
const processingRecurring = ref(false)
const supabaseError = ref<string | null>(null)
const workspaceNotice = ref<string | null>(null)
const automationNotice = ref<string | null>(null)
const automationNoticeTone = ref<NoticeTone>('default')
const authSubscription = ref<{ unsubscribe: () => void } | null>(null)

const pageDetails: Record<PageId, { heading: string; description: string }> = {
  dashboard: { heading: 'Financial overview', description: 'Monitor balances, liabilities, and account-based cash flow from one focused dashboard.' },
  expenses: { heading: 'Expenses', description: 'Record spending from the exact account that paid for it, including credit cards.' },
  income: { heading: 'Income tracking', description: 'Log every income source and the destination account that received the money.' },
  accounts: { heading: 'Accounts', description: 'Track cash, payroll, savings, e-wallets, and card balances in one unified account model.' },
  transfers: { heading: 'Transfers', description: 'Move money between accounts for withdrawals, savings moves, top-ups, and card payments.' },
  cards: { heading: 'Credit cards', description: 'Manage card metadata while balances flow through linked liability accounts.' },
  recurring: { heading: 'Recurring rules', description: 'Automate repeating account-based income, expenses, and transfers.' },
  reports: { heading: 'Performance reports', description: 'Review income, expenses, transfers, and balance trends across your accounts.' },
  trackers: { heading: 'Tracker workspaces', description: 'Create separate trackers for yourself and shared groups, then switch between them safely.' },
  settings: { heading: 'Admin settings', description: 'Manage administrative controls and user access for this expense tracker deployment.' }
}

const isAdmin = computed(() => isAdminUser(session.value?.user.email, session.value?.user.app_metadata?.role as string | undefined))
const isApproved = computed(() => isAdmin.value || session.value?.user.app_metadata?.approved === true)
const activeTracker = computed(() => trackers.value.find(tracker => tracker.id === activeTrackerId.value) ?? null)
const visiblePage = computed<PageId>(() => (currentPage.value === 'settings' && !isAdmin.value ? 'dashboard' : currentPage.value))
const activePage = computed(() => pageDetails[visiblePage.value])
const currentUserDisplayName = computed(() => {
  const firstName = String(session.value?.user.user_metadata?.first_name ?? '').trim()
  const lastName = String(session.value?.user.user_metadata?.last_name ?? '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return fullName || String(session.value?.user.user_metadata?.full_name ?? '').trim() || (session.value?.user.email ?? '')
})
const accountBalances = computed(() => buildAccountBalanceMap(accounts.value, incomes.value, expenses.value, transfers.value, accountAdjustments.value))

const getRecordCreator = () => ({ createdByName: currentUserDisplayName.value || null, createdByUserId: session.value?.user.id ?? null, createdByEmail: session.value?.user.email ?? null })
const getSupabaseErrorMessage = (error: unknown) => (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown Supabase error.')

const resetLocalData = () => {
  trackers.value = []
  trackerMembers.value = []
  activeTrackerId.value = ''
  accounts.value = []
  incomes.value = []
  expenses.value = []
  transfers.value = []
  accountAdjustments.value = []
  creditCards.value = []
  recurringRules.value = []
  auditLogs.value = []
  supabaseError.value = null
  workspaceNotice.value = null
  automationNotice.value = null
  automationNoticeTone.value = 'default'
  currentPage.value = 'dashboard'
}

const replaceTrackerMembers = (trackerId: string, members: TrackerMember[]) => {
  trackerMembers.value = [...trackerMembers.value.filter(member => member.trackerId !== trackerId), ...members]
}
const loadWorkspace = async () => {
  if (!session.value?.user.email) return
  workspaceNotice.value = null
  loading.value = true

  try {
    const { trackers: nextTrackers, trackerMembers: nextMembers, error } = await fetchTrackersForUser(session.value.user.id, session.value.user.email)
    if (error || !nextTrackers || !nextMembers) throw error ?? new Error('Failed to load trackers.')
    trackers.value = nextTrackers
    trackerMembers.value = nextMembers
    if (!nextTrackers.some(tracker => tracker.id === activeTrackerId.value)) activeTrackerId.value = nextTrackers[0]?.id ?? ''
  } catch (error) {
    workspaceNotice.value = `Could not load tracker workspaces from Supabase. ${getSupabaseErrorMessage(error)}`
  } finally {
    loading.value = false
  }
}

const loadActiveTrackerMembers = async (trackerId: string) => {
  const { data, error } = await fetchTrackerMembers(trackerId)
  if (error) {
    workspaceNotice.value = `Could not refresh tracker members from Supabase. ${getSupabaseErrorMessage(error)}`
    return
  }
  replaceTrackerMembers(trackerId, data)
}

const loadTrackerData = async (trackerId: string) => {
  loading.value = true
  supabaseError.value = null

  try {
    const [accountsResult, incomesResult, expensesResult, transfersResult, adjustmentsResult, cardsResult, rulesResult] = await Promise.all([
      fetchAccounts(trackerId),
      fetchIncomes(trackerId),
      fetchExpenses(trackerId),
      fetchTransfers(trackerId),
      fetchAccountAdjustments(trackerId),
      fetchCreditCards(trackerId),
      fetchRecurringRules(trackerId)
    ])

    const error = accountsResult.error ?? incomesResult.error ?? expensesResult.error ?? transfersResult.error ?? adjustmentsResult.error ?? cardsResult.error ?? rulesResult.error
    if (error) throw error

    accounts.value = accountsResult.data
    incomes.value = incomesResult.data
    expenses.value = expensesResult.data
    transfers.value = transfersResult.data
    accountAdjustments.value = adjustmentsResult.data
    creditCards.value = cardsResult.data
    recurringRules.value = rulesResult.data
  } catch (error) {
    supabaseError.value = `Could not load finance data from Supabase. ${getSupabaseErrorMessage(error)}`
  } finally {
    loading.value = false
  }
}

const loadAuditActivity = async (trackerId: string) => {
  const { data, error } = await fetchAuditLogs(trackerId, 30)
  if (error) {
    workspaceNotice.value = `Could not load audit activity from Supabase. ${getSupabaseErrorMessage(error)}`
    return
  }
  auditLogs.value = data
}

const hasRecurringGeneratedRecord = (ruleId: string, runDate: string) => (
  incomes.value.some(item => item.sourceRecurringRuleId === ruleId && item.sourceRecurringRunDate === runDate) ||
  expenses.value.some(item => item.sourceRecurringRuleId === ruleId && item.sourceRecurringRunDate === runDate) ||
  transfers.value.some(item => item.sourceRecurringRuleId === ruleId && item.sourceRecurringRunDate === runDate)
)

const getNextRecurringDate = (rule: RecurringRule, currentRunDate: string) => (
  rule.frequency === 'weekly' ? addDaysToDateString(currentRunDate, 7 * rule.intervalCount) : addMonthsToDateString(currentRunDate, rule.intervalCount)
)

const buildAutoRemark = (description: string, remarks?: string) => {
  const trimmedRemarks = remarks?.trim() ?? ''
  return trimmedRemarks ? `Generated from recurring rule: ${description} · ${trimmedRemarks}` : `Generated from recurring rule: ${description}`
}

const getTransferType = (fromAccountId: string, toAccountId: string): Transfer['transferType'] => {
  const fromAccount = accounts.value.find(account => account.id === fromAccountId)
  const toAccount = accounts.value.find(account => account.id === toAccountId)

  if (toAccount?.accountType === 'credit_card') return 'credit_card_payment'
  if (fromAccount?.accountType === 'checking' && toAccount?.accountType === 'cash') return 'cash_withdrawal'
  if (toAccount?.accountType === 'savings') return 'savings_transfer'
  return 'general'
}

const persistIncomeRecord = async (income: Omit<Income, 'id'>) => {
  const { data, error } = await insertIncome({ ...getRecordCreator(), ...income })
  if (error || !data) throw error ?? new Error('Insert failed')
  incomes.value.unshift(data)
  return data
}

const persistExpenseRecord = async (expense: Omit<Expense, 'id'>) => {
  const account = accounts.value.find(item => item.id === expense.fromAccountId)
  if (!account) throw new Error('The selected expense account could not be found.')

  const currentBalance = accountBalances.value[account.id] ?? 0
  if (account.accountGroup === 'asset' && expense.amount > currentBalance) throw new Error('The selected account does not have enough balance for this expense.')

  if (account.accountType === 'credit_card') {
    const card = creditCards.value.find(item => item.accountId === account.id)
    if (!card) throw new Error('The selected credit card account is missing its card metadata.')
    if (expense.amount > getCreditCardAvailableCredit(card, accountBalances.value)) throw new Error('This expense is larger than the available credit on the selected card.')
  }

  const { data, error } = await insertExpense({ ...getRecordCreator(), ...expense })
  if (error || !data) throw error ?? new Error('Insert failed')
  expenses.value.unshift(data)
  return data
}

const persistTransferRecord = async (transfer: Omit<Transfer, 'id'>) => {
  if (transfer.fromAccountId === transfer.toAccountId) throw new Error('Transfer source and destination must be different accounts.')

  const fromAccount = accounts.value.find(account => account.id === transfer.fromAccountId)
  if (!fromAccount) throw new Error('The selected source account could not be found.')
  if (fromAccount.accountGroup !== 'asset') throw new Error('Transfers can only be sent from asset accounts.')
  if (transfer.amount > (accountBalances.value[fromAccount.id] ?? 0)) throw new Error('The selected source account does not have enough balance for this transfer.')

  const { data, error } = await insertTransfer({ ...getRecordCreator(), ...transfer, transferType: transfer.transferType || getTransferType(transfer.fromAccountId, transfer.toAccountId) })
  if (error || !data) throw error ?? new Error('Insert failed')
  transfers.value.unshift(data)
  return data
}

const persistAccountAdjustmentRecord = async (adjustment: Omit<AccountAdjustment, 'id'>) => {
  const { data, error } = await insertAccountAdjustment({ ...getRecordCreator(), ...adjustment })
  if (error || !data) throw error ?? new Error('Insert failed')
  accountAdjustments.value.unshift(data)
  return data
}

const persistRecurringRuleRecord = async (rule: Omit<RecurringRule, 'id' | 'createdAt'>) => {
  const { data, error } = await insertRecurringRule(rule)
  if (error || !data) throw error ?? new Error('Insert failed')
  recurringRules.value = [...recurringRules.value, data].sort((left, right) => left.nextRunDate.localeCompare(right.nextRunDate))
  return data
}
const createEntryFromRecurringRule = async (rule: RecurringRule, runDate: string) => {
  if (hasRecurringGeneratedRecord(rule.id, runDate)) return

  const description = rule.description.trim()
  const remarks = buildAutoRemark(description, rule.remarks)

  if (rule.ruleType === 'income') {
    if (!rule.incomeToAccountId) throw new Error('Recurring income rule is missing a destination account.')

    await persistIncomeRecord({
      trackerId: rule.trackerId,
      date: runDate,
      amount: rule.amount,
      source: rule.incomeSource?.trim() || description,
      toAccountId: rule.incomeToAccountId,
      sourceRecurringRuleId: rule.id,
      sourceRecurringRunDate: runDate,
      remarks
    })
    return
  }

  if (rule.ruleType === 'expense') {
    if (!rule.expenseFromAccountId || !rule.expenseCategory) throw new Error('Recurring expense rule is missing a category or source account.')

    await persistExpenseRecord({
      trackerId: rule.trackerId,
      date: runDate,
      amount: rule.amount,
      category: rule.expenseCategory,
      merchant: rule.expenseMerchant,
      fromAccountId: rule.expenseFromAccountId,
      sourceRecurringRuleId: rule.id,
      sourceRecurringRunDate: runDate,
      remarks
    })
    return
  }

  if (!rule.transferFromAccountId || !rule.transferToAccountId) throw new Error('Recurring transfer rule is missing one of its accounts.')

  await persistTransferRecord({
    trackerId: rule.trackerId,
    date: runDate,
    amount: rule.amount,
    fromAccountId: rule.transferFromAccountId,
    toAccountId: rule.transferToAccountId,
    transferType: getTransferType(rule.transferFromAccountId, rule.transferToAccountId),
    sourceRecurringRuleId: rule.id,
    sourceRecurringRunDate: runDate,
    remarks
  })
}

const processDueRecurringRules = async () => {
  if (processingRecurring.value || !activeTrackerId.value || recurringRules.value.length === 0) return { appliedCount: 0, failures: [] as string[] }

  processingRecurring.value = true
  const today = new Date().toISOString().split('T')[0]
  let appliedCount = 0
  const failures: string[] = []

  try {
    const activeRules = recurringRules.value.filter(rule => rule.isActive).sort((left, right) => left.nextRunDate.localeCompare(right.nextRunDate))

    for (const rule of activeRules) {
      let nextRunDate = rule.nextRunDate
      let generatedCount = 0
      let attempts = 0

      while (attempts < 60 && isDateOnOrBefore(nextRunDate, today) && (!rule.endDate || isDateOnOrBefore(nextRunDate, rule.endDate))) {
        attempts += 1

        try {
          await createEntryFromRecurringRule(rule, nextRunDate)
          generatedCount += 1
          appliedCount += 1
          nextRunDate = getNextRecurringDate(rule, nextRunDate)
        } catch (error) {
          failures.push(`${rule.description || rule.ruleType}: ${getSupabaseErrorMessage(error)}`)
          break
        }
      }

      const shouldDeactivate = Boolean(rule.endDate) && !isDateOnOrBefore(nextRunDate, rule.endDate as string)
      if (generatedCount > 0 || shouldDeactivate) {
        const { data, error } = await updateRecurringRule(rule.id, { nextRunDate, isActive: shouldDeactivate ? false : rule.isActive })
        if (error || !data) {
          failures.push(`${rule.description || rule.ruleType}: ${getSupabaseErrorMessage(error)}`)
          continue
        }
        recurringRules.value = recurringRules.value.map(item => (item.id === data.id ? data : item))
      }
    }
  } finally {
    processingRecurring.value = false
  }

  return { appliedCount, failures }
}

const refreshActiveTrackerData = async (trackerId: string) => {
  await Promise.all([loadActiveTrackerMembers(trackerId), loadTrackerData(trackerId), loadAuditActivity(trackerId)])
  const { appliedCount, failures } = await processDueRecurringRules()

  if (appliedCount > 0) await Promise.all([loadTrackerData(trackerId), loadAuditActivity(trackerId)])

  if (appliedCount > 0 || failures.length > 0) {
    const parts = [
      appliedCount > 0 ? `Applied ${appliedCount} due recurring rule${appliedCount === 1 ? '' : 's'}.` : '',
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
  if (!value && currentPage.value === 'settings') currentPage.value = 'dashboard'
})

watch(activeTrackerId, async trackerId => {
  if (!trackerId || !session.value) {
    accounts.value = []
    incomes.value = []
    expenses.value = []
    transfers.value = []
    accountAdjustments.value = []
    creditCards.value = []
    recurringRules.value = []
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
  if (error) await syncSession(null)
}

const removeLocalTracker = (trackerId: string) => {
  trackers.value = trackers.value.filter(tracker => tracker.id !== trackerId)
  trackerMembers.value = trackerMembers.value.filter(member => member.trackerId !== trackerId)
  if (activeTrackerId.value === trackerId) activeTrackerId.value = trackers.value[0]?.id ?? ''
  if (trackers.value.length === 0) currentPage.value = 'trackers'
}

const handleCreateTracker = async (input: { name: string; description: string; isPersonal: boolean }) => {
  if (!session.value?.user.email) return

  try {
    const { tracker, ownerMembership, error } = await createTracker({ ...input, ownerUserId: session.value.user.id, ownerEmail: session.value.user.email })
    if (error || !tracker || !ownerMembership) throw error ?? new Error('Failed to create tracker.')
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
    if (error || !data) throw error ?? new Error('Failed to add tracker member.')
    trackerMembers.value = [...trackerMembers.value, data]
    await loadAuditActivity(input.trackerId)
  } catch (error) {
    workspaceNotice.value = `The tracker member could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const handleRemoveTrackerMember = async (memberId: string) => {
  try {
    const { error } = await deleteTrackerMember(memberId)
    if (error) throw error
    trackerMembers.value = trackerMembers.value.filter(member => member.id !== memberId)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    workspaceNotice.value = `The tracker member could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const handleDeleteTracker = async (trackerId: string) => {
  try {
    const { error } = await deleteTrackerApi(trackerId)
    if (error) throw error
    removeLocalTracker(trackerId)
  } catch (error) {
    workspaceNotice.value = `The tracker could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}
const addAccountEntry = async (payload: { account: Omit<Account, 'id' | 'createdAt'>; openingBalance: number }) => {
  try {
    if (!payload.account.trackerId) throw new Error('Select a tracker before adding an account.')

    const { data, error } = await createAccountWithOpeningBalance({
      ...payload.account,
      openingBalance: payload.openingBalance,
      openingBalanceDate: new Date().toISOString().split('T')[0],
      openingBalanceRemarks: 'Opening balance'
    })
    if (error || !data) throw error ?? new Error('Insert failed')

    accounts.value = [...accounts.value, data]
    if (payload.openingBalance !== 0) {
      await loadTrackerData(payload.account.trackerId)
    }

    await loadAuditActivity(payload.account.trackerId)
  } catch (error) {
    supabaseError.value = `The account could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addAccountAdjustmentEntry = async (adjustment: Omit<AccountAdjustment, 'id' | 'trackerId'>) => {
  try {
    await persistAccountAdjustmentRecord({ trackerId: activeTrackerId.value, ...adjustment })
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The account adjustment could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteAccountEntry = async (id: string) => {
  try {
    if (
      incomes.value.some(item => item.toAccountId === id) ||
      expenses.value.some(item => item.fromAccountId === id) ||
      transfers.value.some(item => item.fromAccountId === id || item.toAccountId === id) ||
      recurringRules.value.some(rule => rule.incomeToAccountId === id || rule.expenseFromAccountId === id || rule.transferFromAccountId === id || rule.transferToAccountId === id)
    ) {
      throw new Error('This account is already used by recorded income, expenses, transfers, or recurring rules.')
    }

    const linkedCard = creditCards.value.find(card => card.accountId === id)
    if (linkedCard) throw new Error('Remove the linked credit card metadata before deleting this account.')

    const relatedAdjustments = accountAdjustments.value.filter(item => item.accountId === id)
    for (const adjustment of relatedAdjustments) {
      const { error } = await deleteAccountAdjustment(adjustment.id)
      if (error) throw error
    }

    const { error } = await deleteAccount(id)
    if (error) throw error

    accountAdjustments.value = accountAdjustments.value.filter(item => item.accountId !== id)
    accounts.value = accounts.value.filter(account => account.id !== id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The account could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addIncome = async (income: Income) => {
  try {
    await persistIncomeRecord(income)
    await loadAuditActivity(income.trackerId)
  } catch (error) {
    supabaseError.value = `The income entry could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteIncome = async (id: string) => {
  try {
    const { error } = await deleteIncomeApi(id)
    if (error) throw error
    incomes.value = incomes.value.filter(income => income.id !== id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The income entry could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addExpense = async (expense: Expense) => {
  try {
    await persistExpenseRecord(expense)
    await loadAuditActivity(expense.trackerId)
  } catch (error) {
    supabaseError.value = `The expense could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteExpense = async (id: string) => {
  try {
    const { error } = await deleteExpenseApi(id)
    if (error) throw error
    expenses.value = expenses.value.filter(expense => expense.id !== id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The expense could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addTransferEntry = async (transfer: Transfer) => {
  try {
    await persistTransferRecord(transfer)
    await loadAuditActivity(transfer.trackerId)
  } catch (error) {
    supabaseError.value = `The transfer could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteTransferEntry = async (id: string) => {
  try {
    const { error } = await deleteTransfer(id)
    if (error) throw error
    transfers.value = transfers.value.filter(transfer => transfer.id !== id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The transfer could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addCreditCardEntry = async (payload: Omit<CreditCard, 'id' | 'createdAt'> & { openingBalance: number }) => {
  try {
    const { error } = await createCreditCardWithAccount({
      trackerId: payload.trackerId,
      name: payload.name,
      issuer: payload.issuer,
      limitAmount: payload.limitAmount,
      statementDay: payload.statementDay,
      dueDay: payload.dueDay,
      openingBalance: payload.openingBalance
    })
    if (error) throw error

    await Promise.all([loadTrackerData(payload.trackerId), loadAuditActivity(payload.trackerId)])
  } catch (error) {
    supabaseError.value = `The credit card could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteCreditCardEntry = async (id: string) => {
  try {
    const { error } = await deleteCreditCardWithAccount(id)
    if (error) throw error

    await Promise.all([loadTrackerData(activeTrackerId.value), loadAuditActivity(activeTrackerId.value)])
  } catch (error) {
    supabaseError.value = `The credit card could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addRecurringRuleEntry = async (rule: Omit<RecurringRule, 'id' | 'createdAt'>) => {
  try {
    await persistRecurringRuleRecord(rule)
    await loadAuditActivity(rule.trackerId)
  } catch (error) {
    automationNotice.value = `The recurring rule could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
    automationNoticeTone.value = 'warning'
  }
}

const deleteRecurringRuleEntry = async (id: string) => {
  try {
    const { error } = await deleteRecurringRule(id)
    if (error) throw error
    recurringRules.value = recurringRules.value.filter(rule => rule.id !== id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    automationNotice.value = `The recurring rule could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
    automationNoticeTone.value = 'warning'
  }
}

const runRecurringRulesNow = async () => {
  if (!activeTrackerId.value) return

  const { appliedCount, failures } = await processDueRecurringRules()
  if (appliedCount > 0) await Promise.all([loadTrackerData(activeTrackerId.value), loadAuditActivity(activeTrackerId.value)])

  if (appliedCount === 0 && failures.length === 0) {
    automationNotice.value = 'No recurring rules are due right now.'
    automationNoticeTone.value = 'default'
    return
  }

  const parts = [
    appliedCount > 0 ? `Applied ${appliedCount} due recurring rule${appliedCount === 1 ? '' : 's'}.` : '',
    failures.length > 0 ? `${failures.length} item${failures.length === 1 ? '' : 's'} still need attention.` : ''
  ].filter(Boolean)

  automationNotice.value = parts.join(' ')
  automationNoticeTone.value = failures.length > 0 ? 'warning' : 'default'
}
</script>
