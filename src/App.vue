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
        @navigate="handleNavigatePage"
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

          <div v-if="activityNotice" class="status-banner status-banner-warning">
            {{ activityNotice }}
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
          />
          <ExpensesPage
            v-else-if="visiblePage === 'expenses'"
            :expenses="expenses"
            :savings="savings"
            :active-tracker-id="activeTrackerId"
            @add-expense="addExpense"
            @delete-expense="deleteExpense"
          />
          <IncomePage
            v-else-if="visiblePage === 'income'"
            :incomes="incomes"
            :active-tracker-id="activeTrackerId"
            @add-income="addIncome"
            @delete-income="deleteIncome"
          />
          <SavingsPage
            v-else-if="visiblePage === 'savings'"
            :savings="savings"
            :active-tracker-id="activeTrackerId"
            @add-saving="addSaving"
            @delete-saving="deleteSaving"
          />
          <ReportsPage v-else-if="visiblePage === 'reports'" :expenses="expenses" />
          <TrackersPage
            v-else-if="visiblePage === 'trackers'"
            :trackers="trackers"
            :members="trackerMembers"
            :activity-logs="auditLogs"
            :active-tracker-id="activeTrackerId"
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
import Dashboard from './views/Dashboard.vue'
import ExpensesPage from './views/ExpensesPage.vue'
import IncomePage from './views/IncomePage.vue'
import ReportsPage from './views/ReportsPage.vue'
import SavingsPage from './views/SavingsPage.vue'
import SettingsPage from './views/SettingsPage.vue'
import TrackersPage from './views/TrackersPage.vue'

import { hasConfiguredAdminEmails, isAdminUser } from './lib/admin'
import type { BudgetAuditLog, Expense, Income, Saving, Tracker, TrackerMember, TrackerRole } from './types'
import {
  getCurrentSession,
  signOutCurrentUser,
  subscribeToAuthChanges
} from './services/supabaseAuthService'
import {
  deleteExpense as deleteExpenseApi,
  deleteIncome as deleteIncomeApi,
  deleteSaving as deleteSavingApi,
  fetchAuditLogs,
  fetchExpenses,
  fetchIncomes,
  fetchSavings,
  insertExpense,
  insertIncome,
  insertSaving
} from './services/supabaseService'
import {
  addTrackerMember,
  createTracker,
  deleteTracker as deleteTrackerApi,
  deleteTrackerMember,
  fetchTrackerMembers,
  fetchTrackersForUser
} from './services/trackerService'

type PageId = 'dashboard' | 'expenses' | 'income' | 'savings' | 'reports' | 'trackers' | 'settings'

const currentPage = ref<PageId>('dashboard')
const session = ref<Session | null>(null)
const trackers = ref<Tracker[]>([])
const trackerMembers = ref<TrackerMember[]>([])
const auditLogs = ref<BudgetAuditLog[]>([])
const activeTrackerId = ref('')
const expenses = ref<Expense[]>([])
const incomes = ref<Income[]>([])
const savings = ref<Saving[]>([])
const loading = ref(false)
const authLoading = ref(true)
const supabaseError = ref<string | null>(null)
const workspaceNotice = ref<string | null>(null)
const financeNotice = ref<string | null>(null)
const activityNotice = ref<string | null>(null)
const authSubscription = ref<{ unsubscribe: () => void } | null>(null)

const pageDetails: Record<PageId, { heading: string; description: string }> = {
  dashboard: {
    heading: 'Financial overview',
    description: 'Monitor cash flow, savings momentum, and your latest transactions from one focused dashboard.'
  },
  expenses: {
    heading: 'Expense management',
    description: 'Capture spend quickly and keep every outgoing transaction organized by category and date.'
  },
  income: {
    heading: 'Income tracking',
    description: 'Log every income stream in one place so your cash position stays accurate and easy to review.'
  },
  savings: {
    heading: 'Savings accounts',
    description: 'Track balances by bank and keep longer-term funds visible alongside day-to-day finances.'
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
  auditLogs.value = []
  supabaseError.value = null
  workspaceNotice.value = null
  financeNotice.value = null
  activityNotice.value = null
  currentPage.value = 'dashboard'
}

const replaceTrackerMembers = (trackerId: string, members: TrackerMember[]) => {
  trackerMembers.value = [...trackerMembers.value.filter(member => member.trackerId !== trackerId), ...members]
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
    auditLogs.value = []
    return
  }

  await Promise.all([loadActiveTrackerMembers(trackerId), loadTrackerData(trackerId), loadAuditActivity(trackerId)])
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

const removeLocalExpense = (id: string) => {
  expenses.value = expenses.value.filter(expense => expense.id !== id)
}

const removeLocalIncome = (id: string) => {
  incomes.value = incomes.value.filter(income => income.id !== id)
}

const removeLocalSaving = (id: string) => {
  savings.value = savings.value.filter(saving => saving.id !== id)
}

const removeLocalTracker = (trackerId: string) => {
  trackers.value = trackers.value.filter(tracker => tracker.id !== trackerId)
  trackerMembers.value = trackerMembers.value.filter(member => member.trackerId !== trackerId)
  expenses.value = expenses.value.filter(expense => expense.trackerId !== trackerId)
  incomes.value = incomes.value.filter(income => income.trackerId !== trackerId)
  savings.value = savings.value.filter(saving => saving.trackerId !== trackerId)

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
    const { data, error } = await insertExpense({
      trackerId: expense.trackerId,
      date: expense.date,
      category: expense.category,
      fundingSource: expense.fundingSource,
      fundingSourceBank: expense.fundingSourceBank,
      amount: expense.amount,
      remarks: expense.remarks
    })

    if (error || !data) {
      throw error ?? new Error('Insert failed')
    }

    expenses.value.unshift(data)
    await loadAuditActivity(expense.trackerId)
  } catch (error) {
    supabaseError.value = `The expense could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteExpense = async (id: string) => {
  try {
    const { error } = await deleteExpenseApi(id)

    if (error) {
      throw error
    }

    removeLocalExpense(id)
    await loadAuditActivity(activeTrackerId.value)
  } catch (error) {
    supabaseError.value = `The expense could not be removed from Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const addIncome = async (income: Income) => {
  try {
    const { data, error } = await insertIncome({
      trackerId: income.trackerId,
      date: income.date,
      amount: income.amount,
      source: income.source,
      remarks: income.remarks
    })

    if (error || !data) {
      throw error ?? new Error('Insert failed')
    }

    incomes.value.unshift(data)
    await loadAuditActivity(income.trackerId)
  } catch (error) {
    supabaseError.value = `The income entry could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteIncome = async (id: string) => {
  try {
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
    const { data, error } = await insertSaving({
      trackerId: saving.trackerId,
      date: saving.date,
      bank: saving.bank,
      amount: saving.amount,
      remarks: saving.remarks
    })

    if (error || !data) {
      throw error ?? new Error('Insert failed')
    }

    savings.value.unshift(data)
    await loadAuditActivity(saving.trackerId)
  } catch (error) {
    supabaseError.value = `The savings entry could not be saved to Supabase. ${getSupabaseErrorMessage(error)}`
  }
}

const deleteSaving = async (id: string) => {
  try {
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
</script>
