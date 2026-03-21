<template>
  <section class="panel panel-strong">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Add expense</h3>
        <p class="panel-copy">Record the amount, category, and any notes that will help during review.</p>
      </div>
      <span class="tag">Outgoing</span>
    </div>

    <form class="form-shell" @submit.prevent="submitForm">
      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="expense-date">Date</label>
          <input id="expense-date" v-model="form.date" type="date" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="expense-category">Category</label>
          <select id="expense-category" v-model="form.category" class="form-select" required>
            <option value="">Select a category</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="expense-amount">Amount (PHP)</label>
        <input
          id="expense-amount"
          v-model.number="form.amount"
          type="number"
          min="0"
          step="0.01"
          class="form-input"
          placeholder="0.00"
          required
        />
        <span class="field-help">Use the exact transaction amount for cleaner reporting later.</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="expense-remarks">Remarks</label>
        <textarea
          id="expense-remarks"
          v-model="form.remarks"
          class="form-textarea"
          placeholder="Add context, merchant details, or payment notes"
        ></textarea>
      </div>

      <button type="submit" class="btn btn-primary btn-block">Save expense</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { EXPENSE_CATEGORIES } from '../constants/categories'
import type { Expense } from '../types'

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

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    remarks: ''
  }
}

const submitForm = () => {
  if (!form.value.date || !form.value.category || !form.value.amount) {
    alert('Please fill in all required fields.')
    return
  }

  emit('submit', {
    date: form.value.date,
    category: form.value.category,
    amount: form.value.amount,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
