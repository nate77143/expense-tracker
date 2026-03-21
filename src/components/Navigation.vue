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

        <div class="account-chip">
          <div class="account-chip-meta">
            <div class="account-chip-label">Signed in</div>
            <div class="account-chip-value">{{ userEmail }}</div>
          </div>
          <button type="button" class="btn btn-secondary" @click="handleLogout">
            Sign out
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type PageId = 'dashboard' | 'expenses' | 'income' | 'reports' | 'savings' | 'trackers' | 'settings'

const props = defineProps<{
  currentPage: PageId
  userEmail: string
  isAdmin: boolean
}>()

const emit = defineEmits<{
  navigate: [page: PageId]
  logout: []
}>()

const mobileMenuOpen = ref(false)

const items = computed(() => {
  return [
    { id: 'dashboard', label: 'Dashboard', copy: 'Overview' },
    { id: 'expenses', label: 'Money moves', copy: 'Outgoing' },
    { id: 'income', label: 'Income', copy: 'Incoming' },
    { id: 'savings', label: 'Savings', copy: 'Accounts' },
    { id: 'reports', label: 'Reports', copy: 'Insights' },
    { id: 'trackers', label: 'Trackers', copy: 'Shared' },
    ...(props.isAdmin ? [{ id: 'settings', label: 'Settings', copy: 'Admin' }] : [])
  ] as { id: PageId; label: string; copy: string }[]
})

const handleNavigate = (page: PageId) => {
  mobileMenuOpen.value = false
  emit('navigate', page)
}

const handleLogout = () => {
  mobileMenuOpen.value = false
  emit('logout')
}

watch(
  () => props.currentPage,
  () => {
    mobileMenuOpen.value = false
  }
)
</script>
