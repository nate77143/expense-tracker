<template>
  <form @submit.prevent="submitForm" class="card">
    <h2 class="card-title">Add Expense</h2>
    
    <div class="form-group">
      <label for="expense-date">Date</label>
      <input
        id="expense-date"
        v-model="form.date"
        type="date"
        required
      />
    </div>

    <div class="form-group">
      <label for="expense-category">Category</label>
      <select
        id="expense-category"
        v-model="form.category"
        required
      >
        <option value="">Select a category</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="expense-amount">Amount (₱)</label>
      <input
        id="expense-amount"
        v-model.number="form.amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
      />
    </div>

    <div class="form-group">
      <label for="expense-remarks">Remarks</label>
      <textarea
        id="expense-remarks"
        v-model="form.remarks"
        placeholder="Add notes about this expense"
      ></textarea>
    </div>

    <button type="submit" class="btn btn-primary btn-block">
      Add Expense
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Expense } from '../types'
import { EXPENSE_CATEGORIES } from '../constants/categories'

const emit = defineEmits<{
  submit: [expense: Omit<Expense, 'id'>]
}>()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  category: '',
  amount: 0,
  remarks: ''
})

const categories = computed(() => EXPENSE_CATEGORIES)

const submitForm = () => {
  if (!form.value.date || !form.value.category || !form.value.amount) {
    alert('Please fill in all required fields')
    return
  }

  emit('submit', {
    date: form.value.date,
    category: form.value.category,
    amount: form.value.amount,
    remarks: form.value.remarks
  })

  // Reset form
  form.value = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    remarks: ''
  }
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--gray-900);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-700);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 1rem;
  color: var(--gray-900);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  width: 100%;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: scale(0.98);
}
</style>
