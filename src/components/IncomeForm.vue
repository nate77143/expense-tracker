<template>
  <form @submit.prevent="submitForm" class="card">
    <h2 class="card-title">Add Income</h2>
    
    <div class="form-group">
      <label for="income-date">Date</label>
      <input
        id="income-date"
        v-model="form.date"
        type="date"
        required
      />
    </div>

    <div class="form-group">
      <label for="income-amount">Amount (₱)</label>
      <input
        id="income-amount"
        v-model.number="form.amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
      />
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label for="income-source">Source</label>
        <input
          id="income-source"
          v-model="form.source"
          type="text"
          placeholder="Salary, Freelance..."
        />
      </div>
      <div class="form-group">
        <label for="income-remarks">Remarks</label>
        <textarea
          id="income-remarks"
          v-model="form.remarks"
          placeholder="Optional note about this income"
        ></textarea>
      </div>
    </div>

    <button type="submit" class="btn btn-success btn-block">
      Add Income
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Income } from '../types'

const emit = defineEmits<{
  submit: [income: Omit<Income, 'id'>]
}>()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  source: '',
  remarks: ''
})

const submitForm = () => {
  if (!form.value.date || !form.value.amount) {
    alert('Please fill in all required fields')
    return
  }

  emit('submit', {
    date: form.value.date,
    amount: form.value.amount,
    source: form.value.source,
    remarks: form.value.remarks
  })

  // Reset form
  form.value = {
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    source: '',
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
.form-group textarea:focus {
  outline: none;
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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

.btn-success {
  background-color: #10B981;
  color: white;
  width: 100%;
}

.btn-success:hover {
  background-color: #059669;
  box-shadow: var(--shadow-md);
}

.btn-success:active {
  transform: scale(0.98);
}
</style>
