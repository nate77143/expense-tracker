<template>
  <section class="panel panel-strong">
    <div class="panel-header">
      <div>
        <h3 class="card-title">Add savings</h3>
        <p class="panel-copy">Track each bank allocation so your reserve balances stay visible and current.</p>
      </div>
      <span class="tag tag-success">Reserve fund</span>
    </div>

    <form class="form-shell" @submit.prevent="submitForm">
      <div class="field-grid">
        <div class="form-group">
          <label class="form-label" for="saving-date">Date</label>
          <input id="saving-date" v-model="form.date" type="date" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="saving-bank">Bank</label>
          <input
            id="saving-bank"
            v-model="form.bank"
            type="text"
            class="form-input"
            placeholder="BDO, BPI, Metrobank"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="saving-amount">Amount (PHP)</label>
        <input
          id="saving-amount"
          v-model.number="form.amount"
          type="number"
          min="0"
          step="0.01"
          class="form-input"
          placeholder="0.00"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="saving-remarks">Remarks</label>
        <textarea
          id="saving-remarks"
          v-model="form.remarks"
          class="form-textarea"
          placeholder="Emergency fund, travel, tuition, or another goal"
        ></textarea>
      </div>

      <button type="submit" class="btn btn-success btn-block">Save savings entry</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Saving } from '../types'

const emit = defineEmits<{
  submit: [saving: Omit<Saving, 'id' | 'trackerId'>]
}>()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  bank: '',
  amount: 0,
  remarks: ''
})

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    bank: '',
    amount: 0,
    remarks: ''
  }
}

const submitForm = () => {
  if (!form.value.date || !form.value.bank || !form.value.amount) {
    alert('Please fill in all required fields.')
    return
  }

  emit('submit', {
    date: form.value.date,
    bank: form.value.bank,
    amount: form.value.amount,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
