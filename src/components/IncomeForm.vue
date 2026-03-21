<template>
  <section class="panel panel-strong">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Add income</h3>
        <p class="panel-copy">Capture every deposit or payout so cash flow and reporting stay accurate.</p>
      </div>
      <span class="tag tag-success">Incoming</span>
    </div>

    <form class="form-shell" @submit.prevent="submitForm">
      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="income-date">Date</label>
          <input id="income-date" v-model="form.date" type="date" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="income-amount">Amount (PHP)</label>
          <input
            id="income-amount"
            v-model.number="form.amount"
            type="number"
            min="0"
            step="0.01"
            class="form-input"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="income-source">Source</label>
          <input
            id="income-source"
            v-model="form.source"
            type="text"
            class="form-input"
            placeholder="Salary, freelance, side project"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="income-remarks">Remarks</label>
          <textarea
            id="income-remarks"
            v-model="form.remarks"
            class="form-textarea"
            placeholder="Optional note about the payment"
          ></textarea>
        </div>
      </div>

      <button type="submit" class="btn btn-success btn-block">Save income</button>
    </form>
  </section>
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

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    source: '',
    remarks: ''
  }
}

const submitForm = () => {
  if (!form.value.date || !form.value.amount) {
    alert('Please fill in all required fields.')
    return
  }

  emit('submit', {
    date: form.value.date,
    amount: form.value.amount,
    source: form.value.source,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
