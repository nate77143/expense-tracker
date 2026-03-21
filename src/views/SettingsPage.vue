<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Administration</p>
        <h2 class="section-title">Settings and user access</h2>
        <p class="section-copy">
          Admins can review accounts, approve sign-ups, create new users, and remove accounts through the protected admin API.
        </p>
      </div>
      <div class="section-meta">
        <span class="label-muted">Admin mode</span>
        <strong class="amount-positive">Enabled</strong>
      </div>
    </div>

    <div v-if="statusMessage" class="status-banner" :class="statusToneClass">
      {{ statusMessage }}
    </div>

    <div class="content-grid">
      <section class="panel panel-strong">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Create user</h3>
            <p class="panel-copy">Create a new email/password account. Admin-created accounts are approved immediately.</p>
          </div>
          <span class="tag">Protected</span>
        </div>

        <form class="form-shell" @submit.prevent="handleCreateUser">
          <div class="form-group">
            <label class="form-label" for="settings-user-email">Email</label>
            <input
              id="settings-user-email"
              v-model.trim="createForm.email"
              type="email"
              class="form-input"
              placeholder="new-user@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="settings-user-password">Temporary password</label>
            <input
              id="settings-user-password"
              v-model="createForm.password"
              type="password"
              class="form-input"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <label class="checkbox-row">
            <input v-model="createForm.isAdmin" type="checkbox" class="checkbox-input" />
            <span>Create this account as an admin</span>
          </label>

          <button type="submit" class="btn btn-primary btn-block" :disabled="creatingUser">
            {{ creatingUser ? 'Creating user...' : 'Create user' }}
          </button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">User directory</h3>
            <p class="panel-copy">Approve or restrict sign-ups and remove access when needed.</p>
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <span class="tag">{{ users.length }} user{{ users.length === 1 ? '' : 's' }}</span>
            <button type="button" class="btn btn-secondary" :disabled="loadingUsers" @click="loadUsers">
              {{ loadingUsers ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <div v-if="loadingUsers" class="empty-state">
          <div class="empty-state-title">Loading users</div>
          <p class="empty-state-copy">Checking the protected admin endpoint for the latest account list.</p>
        </div>

        <div v-else-if="users.length === 0" class="empty-state">
          <div class="empty-state-title">No users found</div>
          <p class="empty-state-copy">Create the first account or verify that the admin API is configured.</p>
        </div>

        <div v-else class="stack">
          <article v-for="user in users" :key="user.id" class="user-row">
            <div class="user-row-main">
              <div class="user-row-title">{{ user.email }}</div>
              <div class="user-row-copy">Created {{ formatTimestamp(user.createdAt) }}</div>
              <div class="user-row-copy">
                Last sign in {{ user.lastSignInAt ? formatTimestamp(user.lastSignInAt) : 'Not yet used' }}
              </div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="tag" :class="user.isAdmin ? 'tag-success' : ''">
                  {{ user.isAdmin ? 'Admin' : 'Standard user' }}
                </span>
                <span class="tag" :class="user.isApproved ? 'tag-success' : 'tag-danger'">
                  {{ user.isApproved ? 'Approved' : 'Pending approval' }}
                </span>
                <span class="tag" :class="user.emailConfirmedAt ? 'tag-success' : 'tag-danger'">
                  {{ user.emailConfirmedAt ? 'Confirmed' : 'Unconfirmed' }}
                </span>
                <span v-if="user.id === currentUserId" class="tag">Current account</span>
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <button
                type="button"
                class="btn"
                :class="user.isApproved ? 'btn-secondary' : 'btn-success'"
                :disabled="approvalUserId === user.id || user.id === currentUserId"
                @click="handleApprovalChange(user, !user.isApproved)"
              >
                {{
                  approvalUserId === user.id
                    ? 'Updating...'
                    : user.isApproved
                      ? 'Restrict access'
                      : 'Approve access'
                }}
              </button>
              <button
                type="button"
                class="btn btn-danger"
                :disabled="deletingUserId === user.id || user.id === currentUserId"
                @click="handleDeleteUser(user)"
              >
                {{ deletingUserId === user.id ? 'Removing...' : 'Remove' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Audit log retention</h3>
            <p class="panel-copy">Delete old budget activity logs without opening Supabase SQL Editor.</p>
          </div>
          <span class="tag">Admin only</span>
        </div>

        <form class="form-shell" @submit.prevent="handleAuditLogCleanup">
          <div class="form-group">
            <label class="form-label" for="audit-retention-days">Keep logs for this many days</label>
            <input
              id="audit-retention-days"
              v-model.number="auditRetentionDays"
              type="number"
              min="0"
              max="3650"
              class="form-input"
            />
            <p class="field-help">Default recommendation is 90 days. Use 0 if you want to clear all existing audit logs right away.</p>
          </div>

          <button type="submit" class="btn btn-secondary" :disabled="cleaningAuditLogs">
            {{ cleaningAuditLogs ? 'Cleaning logs...' : 'Clean old logs' }}
          </button>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  cleanupManagedAuditLogs,
  createManagedUser,
  deleteManagedUser,
  fetchManagedUsers,
  updateManagedUserApproval,
  type ManagedUser
} from '../services/adminUserService'

const { currentUserId } = defineProps<{
  currentUserId: string
}>()

const users = ref<ManagedUser[]>([])
const loadingUsers = ref(false)
const creatingUser = ref(false)
const cleaningAuditLogs = ref(false)
const deletingUserId = ref('')
const approvalUserId = ref('')
const statusMessage = ref('')
const statusTone = ref<'default' | 'warning'>('default')
const auditRetentionDays = ref(90)

const createForm = reactive({
  email: '',
  password: '',
  isAdmin: false
})

const statusToneClass = computed(() => (statusTone.value === 'warning' ? 'status-banner-warning' : ''))

const setStatus = (message: string, tone: 'default' | 'warning' = 'default') => {
  statusMessage.value = message
  statusTone.value = tone
}

const loadUsers = async () => {
  loadingUsers.value = true

  try {
    users.value = await fetchManagedUsers()
    setStatus('')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to load users.', 'warning')
  } finally {
    loadingUsers.value = false
  }
}

const resetCreateForm = () => {
  createForm.email = ''
  createForm.password = ''
  createForm.isAdmin = false
}

const handleCreateUser = async () => {
  if (!createForm.email || !createForm.password) {
    setStatus('Please enter both an email and a temporary password.', 'warning')
    return
  }

  if (createForm.password.length < 6) {
    setStatus('Temporary passwords should be at least 6 characters long.', 'warning')
    return
  }

  creatingUser.value = true

  try {
    const createdUser = await createManagedUser({
      email: createForm.email,
      password: createForm.password,
      isAdmin: createForm.isAdmin
    })

    users.value = [createdUser, ...users.value].sort((a, b) => a.email.localeCompare(b.email))
    resetCreateForm()
    setStatus(`Created ${createdUser.email} successfully.`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to create the user.', 'warning')
  } finally {
    creatingUser.value = false
  }
}

const handleApprovalChange = async (user: ManagedUser, approved: boolean) => {
  const confirmed = window.confirm(
    `${approved ? 'Approve' : 'Restrict'} ${user.email}? ${approved ? 'They will be able to use the application.' : 'They will need admin approval again before they can use the application.'}`
  )

  if (!confirmed) {
    return
  }

  approvalUserId.value = user.id

  try {
    const updatedUser = await updateManagedUserApproval(user.id, approved)
    users.value = users.value.map(entry => (entry.id === updatedUser.id ? updatedUser : entry))
    setStatus(`${user.email} is now ${approved ? 'approved' : 'restricted'}.`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to update approval.', 'warning')
  } finally {
    approvalUserId.value = ''
  }
}

const handleDeleteUser = async (user: ManagedUser) => {
  const confirmed = window.confirm(`Remove ${user.email}? This permanently deletes the account.`)

  if (!confirmed) {
    return
  }

  deletingUserId.value = user.id

  try {
    await deleteManagedUser(user.id)
    users.value = users.value.filter(entry => entry.id !== user.id)
    setStatus(`Removed ${user.email}.`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to remove the user.', 'warning')
  } finally {
    deletingUserId.value = ''
  }
}

const handleAuditLogCleanup = async () => {
  if (!Number.isInteger(auditRetentionDays.value) || auditRetentionDays.value < 0) {
    setStatus('Please enter a valid number of retention days.', 'warning')
    return
  }

  const confirmed = window.confirm(
    `Delete budget audit logs older than ${auditRetentionDays.value} days? This cannot be undone.`
  )

  if (!confirmed) {
    return
  }

  cleaningAuditLogs.value = true

  try {
    const result = await cleanupManagedAuditLogs(auditRetentionDays.value)
    setStatus(`Deleted ${result.deletedCount} audit log entr${result.deletedCount === 1 ? 'y' : 'ies'} older than ${result.retentionDays} days.`)
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to clean audit logs.', 'warning')
  } finally {
    cleaningAuditLogs.value = false
  }
}

const formatTimestamp = (value: string | null) => {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value))
}

onMounted(loadUsers)
</script>
