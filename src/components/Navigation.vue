<template>
  <nav class="topbar">
    <div class="topbar-inner">
      <div class="brand-lockup">
        <div class="brand-mark">ET</div>
        <div>
          <p class="brand-kicker">Money Management</p>
          <button class="brand-name" type="button" @click="$emit('navigate', 'dashboard')">
            Expense Tracker
          </button>
        </div>
      </div>

      <div class="nav-pill-group" aria-label="Primary">
        <button
          v-for="item in items"
          :key="item.id"
          class="nav-pill"
          :class="{ active: currentPage === item.id }"
          type="button"
          @click="$emit('navigate', item.id)"
        >
          <span class="nav-pill-label">{{ item.label }}</span>
          <small class="nav-pill-copy">{{ item.copy }}</small>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
type PageId = 'dashboard' | 'expenses' | 'income' | 'reports' | 'savings'

defineProps<{
  currentPage: PageId
}>()

defineEmits<{
  navigate: [page: PageId]
}>()

const items: { id: PageId; label: string; copy: string }[] = [
  { id: 'dashboard', label: 'Dashboard', copy: 'Overview' },
  { id: 'expenses', label: 'Expenses', copy: 'Outgoing' },
  { id: 'income', label: 'Income', copy: 'Incoming' },
  { id: 'savings', label: 'Savings', copy: 'Accounts' },
  { id: 'reports', label: 'Reports', copy: 'Insights' }
]
</script>
