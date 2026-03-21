<template>
  <nav class="navbar">
    <div class="navbar-container">
      <h1 class="navbar-title">💰 Expense Tracker</h1>
      <ul class="nav-links">
        <li>
          <button 
            class="nav-link" 
            :class="{ active: isActive('dashboard') }"
            @click="$emit('navigate', 'dashboard')"
          >
            Dashboard
          </button>
        </li>
        <li>
          <button 
            class="nav-link" 
            :class="{ active: isActive('expenses') }"
            @click="$emit('navigate', 'expenses')"
          >
            Expenses
          </button>
        </li>
        <li>
          <button 
            class="nav-link" 
            :class="{ active: isActive('income') }"
            @click="$emit('navigate', 'income')"
          >
            Income
          </button>
        </li>
        <li>
          <button 
            class="nav-link" 
            :class="{ active: isActive('savings') }"
            @click="$emit('navigate', 'savings')"
          >
            Savings
          </button>
        </li>
        <li>
          <button 
            class="nav-link" 
            :class="{ active: isActive('reports') }"
            @click="$emit('navigate', 'reports')"
          >
            Reports
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: 'dashboard' | 'expenses' | 'income' | 'reports' | 'savings'
}>()

defineEmits<{
  navigate: [page: 'dashboard' | 'expenses' | 'income' | 'reports' | 'savings']
}>()

const isActive = (page: 'dashboard' | 'expenses' | 'income' | 'reports' | 'savings') => {
  return props.currentPage === page
}
</script>
<style scoped>
.navbar {
  background-color: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.nav-links {
  display: flex;
  gap: var(--spacing-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  padding: var(--spacing-md) 0;
  color: var(--gray-600);
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-link:hover {
  color: var(--primary);
}

.nav-link.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 var(--spacing-sm);
  }

  .nav-links {
    gap: var(--spacing-md);
  }

  .nav-link {
    font-size: 0.875rem;
  }
}
</style>
