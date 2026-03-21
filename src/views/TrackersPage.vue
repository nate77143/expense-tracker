<template>
  <section class="page-section">
    <div class="section-header">
      <div>
        <p class="eyebrow">Workspaces</p>
        <h2 class="section-title">Personal and shared trackers</h2>
        <p class="section-copy">
          Create separate trackers for yourself, switch between them, and share selected trackers with family members.
        </p>
      </div>
      <div class="section-meta tracker-header-meta">
        <span class="label-muted">Active tracker</span>
        <strong>{{ activeTracker?.name ?? 'None' }}</strong>
        <div v-if="trackers.length > 0" class="form-group tracker-switcher">
          <label class="form-label" for="trackers-active-switch">Switch tracker</label>
          <select
            id="trackers-active-switch"
            :value="activeTrackerId"
            class="form-select"
            @change="handleSwitchTracker"
          >
            <option v-for="tracker in trackers" :key="tracker.id" :value="tracker.id">
              {{ tracker.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="statusMessage" class="status-banner" :class="statusTone === 'warning' ? 'status-banner-warning' : ''">
      {{ statusMessage }}
    </div>

    <div class="content-grid">
      <section class="panel panel-strong">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Your trackers</h3>
            <p class="panel-copy">Switch workspaces as you move between personal and shared money tracking.</p>
          </div>
          <span class="tag">{{ trackers.length }} tracker{{ trackers.length === 1 ? '' : 's' }}</span>
        </div>

        <div v-if="trackers.length === 0" class="empty-state">
          <div class="empty-state-title">No trackers yet</div>
          <p class="empty-state-copy">Create your first tracker to start organizing finances by workspace.</p>
        </div>

        <div v-else class="stack">
          <article
            v-for="tracker in trackers"
            :key="tracker.id"
            class="tracker-card"
            :class="{ active: tracker.id === activeTrackerId }"
          >
            <div class="tracker-card-main">
              <div class="tracker-card-title">{{ tracker.name }}</div>
              <div class="tracker-card-copy">{{ tracker.description || 'No description yet.' }}</div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="tag">{{ roleLabel(tracker.id) }}</span>
                <span v-if="tracker.isPersonal" class="tag tag-success">Personal</span>
                <span class="tag">{{ memberCount(tracker.id) }} member{{ memberCount(tracker.id) === 1 ? '' : 's' }}</span>
              </div>
            </div>

            <div class="tracker-card-actions">
              <button
                type="button"
                class="btn"
                :class="tracker.id === activeTrackerId ? 'btn-primary' : 'btn-secondary'"
                @click="$emit('select-tracker', tracker.id)"
              >
                {{ tracker.id === activeTrackerId ? 'Current tracker' : 'Open tracker' }}
              </button>
              <button
                v-if="canDeleteTracker(tracker.id)"
                type="button"
                class="btn btn-danger"
                @click="handleDeleteTracker(tracker)"
              >
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="card-title">Create tracker</h3>
            <p class="panel-copy">Use a personal tracker for yourself or a shared tracker for family finances.</p>
          </div>
          <span class="tag">New workspace</span>
        </div>

        <form class="form-shell" @submit.prevent="handleCreateTracker">
          <div class="form-group">
            <label class="form-label" for="tracker-name">Tracker name</label>
            <input id="tracker-name" v-model.trim="createForm.name" type="text" class="form-input" placeholder="Family Budget" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="tracker-description">Description</label>
            <textarea
              id="tracker-description"
              v-model="createForm.description"
              class="form-textarea"
              placeholder="Explain what this tracker is for"
            ></textarea>
          </div>

          <label class="checkbox-row">
            <input v-model="createForm.isPersonal" type="checkbox" class="checkbox-input" />
            <span>Mark this as a personal tracker</span>
          </label>

          <button type="submit" class="btn btn-primary btn-block">Create tracker</button>
        </form>
      </section>
    </div>

    <section class="panel" v-if="activeTracker">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Members of {{ activeTracker.name }}</h3>
          <p class="panel-copy">Invite people into this tracker and control what level of access they receive.</p>
        </div>
        <span class="tag">{{ activeMembers.length }} member{{ activeMembers.length === 1 ? '' : 's' }}</span>
      </div>

      <div v-if="canManageMembers" class="form-shell" style="margin-bottom: 1rem;">
        <div class="field-grid">
          <div class="form-group">
            <label class="form-label" for="member-email">Member email</label>
            <input id="member-email" v-model.trim="memberForm.email" type="email" class="form-input" placeholder="family@example.com" />
          </div>

          <div class="form-group">
            <label class="form-label" for="member-role">Role</label>
            <select id="member-role" v-model="memberForm.role" class="form-select">
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <button type="button" class="btn btn-secondary" @click="handleAddMember">Add member</button>
      </div>

      <div v-else class="status-banner">
        You can view members here, but only owners and admins can manage access for this tracker.
      </div>

      <div v-if="activeMembers.length === 0" class="empty-state">
        <div class="empty-state-title">No members yet</div>
        <p class="empty-state-copy">Add at least one member to start sharing this tracker.</p>
      </div>

      <div v-else class="stack">
        <article v-for="member in activeMembers" :key="member.id" class="user-row">
          <div class="user-row-main">
            <div class="user-row-title">{{ member.email }}</div>
            <div class="user-row-copy">{{ roleCopy(member.role) }}</div>
            <div class="user-row-copy">{{ member.status === 'invited' ? 'Invitation pending' : 'Joined tracker' }}</div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="tag" :class="member.role === 'owner' || member.role === 'admin' ? 'tag-success' : ''">
              {{ member.role }}
            </span>
            <button
              v-if="canRemoveMember(member)"
              type="button"
              class="btn btn-danger"
              @click="$emit('remove-member', member.id)"
            >
              Remove
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="panel" v-if="activeTracker">
      <div class="panel-header">
        <div>
          <h3 class="card-title">Recent activity</h3>
          <p class="panel-copy">Review who updated this tracker and what changed most recently.</p>
        </div>
        <span class="tag">{{ activityLogs.length }} event{{ activityLogs.length === 1 ? '' : 's' }}</span>
      </div>

      <div v-if="activityLogs.length === 0" class="empty-state">
        <div class="empty-state-title">No activity yet</div>
        <p class="empty-state-copy">Audit entries will appear here after someone changes this tracker or its records.</p>
      </div>

      <div v-else class="stack">
        <article v-for="entry in activityLogs" :key="entry.id" class="user-row">
          <div class="user-row-main">
            <div class="user-row-title">{{ activityTitle(entry) }}</div>
            <div class="user-row-copy">{{ activityCopy(entry) }}</div>
            <div class="user-row-copy">{{ formatDateTime(entry.occurredAt) }}</div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span class="tag" :class="actionTone(entry.action)">{{ actionLabel(entry.action) }}</span>
            <span class="tag">{{ entityLabel(entry.entityType) }}</span>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { formatDateTime } from '../lib/formatters'
import type { BudgetAuditLog, Tracker, TrackerMember, TrackerRole } from '../types'

const props = defineProps<{
  trackers: Tracker[]
  members: TrackerMember[]
  activityLogs: BudgetAuditLog[]
  activeTrackerId: string
  currentUserEmail: string
}>()

const emit = defineEmits<{
  'select-tracker': [trackerId: string]
  'create-tracker': [input: { name: string; description: string; isPersonal: boolean }]
  'add-member': [input: { trackerId: string; email: string; role: TrackerRole }]
  'remove-member': [memberId: string]
  'delete-tracker': [trackerId: string]
}>()

const createForm = reactive({
  name: '',
  description: '',
  isPersonal: false
})

const memberForm = reactive<{
  email: string
  role: Exclude<TrackerRole, 'owner'>
}>({
  email: '',
  role: 'member'
})

const statusMessage = ref('')
const statusTone = ref<'default' | 'warning'>('default')

const activeTracker = computed(() => props.trackers.find(tracker => tracker.id === props.activeTrackerId) ?? null)
const activeMembers = computed(() => props.members.filter(member => member.trackerId === props.activeTrackerId))

const currentMembership = computed(() => {
  return activeMembers.value.find(member => member.email.toLowerCase() === props.currentUserEmail.toLowerCase()) ?? null
})

const activityLogs = computed(() => props.activityLogs.filter(entry => entry.trackerId === props.activeTrackerId))

const canManageMembers = computed(() => {
  return currentMembership.value?.role === 'owner' || currentMembership.value?.role === 'admin'
})

const memberCount = (trackerId: string) => props.members.filter(member => member.trackerId === trackerId).length

const roleLabel = (trackerId: string) => {
  const membership = props.members.find(
    member => member.trackerId === trackerId && member.email.toLowerCase() === props.currentUserEmail.toLowerCase()
  )

  return membership ? `Your role: ${membership.role}` : 'Shared tracker'
}

const roleCopy = (role: TrackerRole) => {
  if (role === 'owner') return 'Full control over this tracker'
  if (role === 'admin') return 'Can manage members and records'
  if (role === 'viewer') return 'Can view records only'
  return 'Can contribute records'
}

const handleCreateTracker = () => {
  if (!createForm.name) {
    statusMessage.value = 'Tracker name is required.'
    statusTone.value = 'warning'
    return
  }

  emit('create-tracker', {
    name: createForm.name,
    description: createForm.description,
    isPersonal: createForm.isPersonal
  })

  createForm.name = ''
  createForm.description = ''
  createForm.isPersonal = false
  statusMessage.value = ''
}

const handleAddMember = () => {
  if (!activeTracker.value) {
    statusMessage.value = 'Select a tracker first.'
    statusTone.value = 'warning'
    return
  }

  if (!memberForm.email) {
    statusMessage.value = 'Enter an email address before adding a member.'
    statusTone.value = 'warning'
    return
  }

  emit('add-member', {
    trackerId: activeTracker.value.id,
    email: memberForm.email,
    role: memberForm.role
  })

  memberForm.email = ''
  memberForm.role = 'member'
  statusMessage.value = ''
}

const canRemoveMember = (member: TrackerMember) => {
  if (!canManageMembers.value) {
    return false
  }

  if (member.role === 'owner' && member.email.toLowerCase() === props.currentUserEmail.toLowerCase()) {
    return false
  }

  return true
}

const canDeleteTracker = (trackerId: string) => {
  const membership = props.members.find(
    member => member.trackerId === trackerId && member.email.toLowerCase() === props.currentUserEmail.toLowerCase()
  )

  return membership?.role === 'owner'
}

const handleSwitchTracker = (event: Event) => {
  const nextTrackerId = (event.target as HTMLSelectElement).value
  emit('select-tracker', nextTrackerId)
}

const entityLabel = (entityType: BudgetAuditLog['entityType']) => {
  if (entityType === 'tracker_members') return 'Members'
  if (entityType === 'trackers') return 'Tracker'
  if (entityType === 'expenses') return 'Expenses'
  if (entityType === 'incomes') return 'Income'
  return 'Savings'
}

const actionLabel = (action: BudgetAuditLog['action']) => {
  if (action === 'insert') return 'Created'
  if (action === 'update') return 'Updated'
  return 'Deleted'
}

const actionTone = (action: BudgetAuditLog['action']) => {
  return action === 'delete' ? 'tag-danger' : action === 'insert' ? 'tag-success' : ''
}

const activityTitle = (entry: BudgetAuditLog) => {
  const actor = entry.actorEmail || 'A user'

  if (entry.entityType === 'tracker_members') {
    const targetEmail =
      String(entry.newData?.email ?? entry.oldData?.email ?? '').trim() || 'a member'
    return `${actor} ${actionLabel(entry.action).toLowerCase()} ${targetEmail}`
  }

  if (entry.entityType === 'trackers') {
    const trackerName =
      String(entry.newData?.name ?? entry.oldData?.name ?? activeTracker.value?.name ?? 'this tracker').trim() || 'this tracker'
    return `${actor} ${actionLabel(entry.action).toLowerCase()} ${trackerName}`
  }

  return `${actor} ${actionLabel(entry.action).toLowerCase()} a ${entityLabel(entry.entityType).toLowerCase()} entry`
}

const activityCopy = (entry: BudgetAuditLog) => {
  if (entry.entityType === 'expenses') {
    return String(entry.newData?.category ?? entry.oldData?.category ?? 'Expense change')
  }

  if (entry.entityType === 'incomes') {
    return String(entry.newData?.source ?? entry.oldData?.source ?? 'Income change')
  }

  if (entry.entityType === 'savings') {
    return String(entry.newData?.bank ?? entry.oldData?.bank ?? 'Savings change')
  }

  if (entry.entityType === 'tracker_members') {
    return String(entry.newData?.role ?? entry.oldData?.role ?? 'Membership change')
  }

  return String(entry.newData?.description ?? entry.oldData?.description ?? 'Tracker details changed')
}

const handleDeleteTracker = (tracker: Tracker) => {
  const confirmed = window.confirm(
    `Delete "${tracker.name}"? This will remove the tracker and its related records for everyone who uses it.`
  )

  if (!confirmed) {
    return
  }

  emit('delete-tracker', tracker.id)
}
</script>
