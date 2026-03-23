<template>
  <nav class="topbar">
    <div class="topbar-inner">
      <div class="brand-lockup">
        <div class="brand-mark">ET</div>
        <div class="brand-copy">
          <p class="brand-kicker">Money Management</p>
          <button class="brand-name" type="button" @click="$emit('navigate', 'dashboard')">
            Expense Tracker
          </button>
        </div>
      </div>

      <button
        type="button"
        class="topbar-menu-toggle"
        :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
        aria-controls="topbar-menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span class="topbar-menu-toggle-line"></span>
        <span class="topbar-menu-toggle-line"></span>
        <span class="topbar-menu-toggle-line"></span>
        <span>{{ mobileMenuOpen ? 'Close' : 'Menu' }}</span>
      </button>

      <div id="topbar-menu" class="topbar-menu" :class="{ open: mobileMenuOpen }">
        <div class="nav-pill-group" aria-label="Primary">
          <button
            v-for="item in items"
            :key="item.id"
            class="nav-pill"
            :class="{ active: currentPage === item.id }"
            type="button"
            @click="handleNavigate(item.id)"
          >
            <span class="nav-pill-label">{{ item.label }}</span>
            <small class="nav-pill-copy">{{ item.copy }}</small>
          </button>
        </div>

        <div class="topbar-utility-group">
          <div ref="accountMenuRef" class="menu-anchor">
            <button
              type="button"
              class="utility-chip utility-chip-account"
              :class="{ active: currentPage === 'settings' || currentPage === 'trackers' || accountMenuOpen }"
              :aria-expanded="accountMenuOpen ? 'true' : 'false'"
              @click="accountMenuOpen = !accountMenuOpen"
            >
              <div class="utility-chip-meta">
                <div class="utility-chip-label">Account</div>
                <div class="utility-chip-value">{{ userEmail }}</div>
              </div>
              <span class="utility-chip-caret">{{ accountMenuOpen ? '^' : 'v' }}</span>
            </button>

            <div v-if="accountMenuOpen" class="dropdown-panel dropdown-panel-right">
              <div class="dropdown-section-title">Workspace</div>

              <button
                v-for="tracker in trackers"
                :key="tracker.id"
                type="button"
                class="dropdown-item"
                :class="{ active: tracker.id === activeTrackerId }"
                @click="handleSelectTracker(tracker.id)"
              >
                <span>{{ tracker.name }}</span>
                <small>{{ tracker.id === activeTrackerId ? 'Current workspace' : 'Switch workspace' }}</small>
              </button>

              <button type="button" class="dropdown-item dropdown-item-strong" @click="handleNavigate('trackers')">
                <span>Manage trackers</span>
                <small>Sharing and members</small>
              </button>

              <div class="dropdown-section-title">Account</div>

              <button v-if="isAdmin" type="button" class="dropdown-item" @click="handleNavigate('settings')">
                <span>Admin settings</span>
                <small>User access and controls</small>
              </button>

              <button type="button" class="dropdown-item dropdown-item-danger" @click="handleLogout">
                <span>Sign out</span>
                <small>End this session</small>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Tracker } from '../types'

type PageId =
  | 'dashboard'
  | 'expenses'
  | 'income'
  | 'accounts'
  | 'transfers'
  | 'cards'
  | 'recurring'
  | 'reports'
  | 'trackers'
  | 'settings'

const props = defineProps<{
  currentPage: PageId
  userEmail: string
  isAdmin: boolean
  trackers: Tracker[]
  activeTrackerId: string
}>()

const emit = defineEmits<{
  navigate: [page: PageId]
  logout: []
  'select-tracker': [trackerId: string]
}>()

const mobileMenuOpen = ref(false)
const accountMenuOpen = ref(false)
const accountMenuRef = ref<HTMLElement | null>(null)

const items = computed(() => {
  return [
    { id: 'dashboard', label: 'Dashboard', copy: 'Overview' },
    { id: 'expenses', label: 'Expenses', copy: 'Spending' },
    { id: 'income', label: 'Income', copy: 'Inflow' },
    { id: 'accounts', label: 'Accounts', copy: 'Balances' },
    { id: 'transfers', label: 'Transfers', copy: 'Moves' },
    { id: 'cards', label: 'Cards', copy: 'Credit' },
    { id: 'recurring', label: 'Automation', copy: 'Recurring' },
    { id: 'reports', label: 'Reports', copy: 'Insights' }
  ] as { id: PageId; label: string; copy: string }[]
})

const closeMenus = () => {
  accountMenuOpen.value = false
}

const handleNavigate = (page: PageId) => {
  mobileMenuOpen.value = false
  closeMenus()
  emit('navigate', page)
}

const handleSelectTracker = (trackerId: string) => {
  mobileMenuOpen.value = false
  accountMenuOpen.value = false
  emit('select-tracker', trackerId)
}

const handleLogout = () => {
  mobileMenuOpen.value = false
  closeMenus()
  emit('logout')
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node | null

  if (accountMenuOpen.value && accountMenuRef.value && target && !accountMenuRef.value.contains(target)) {
    accountMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})

watch(
  () => props.currentPage,
  () => {
    mobileMenuOpen.value = false
    closeMenus()
  }
)
</script>
