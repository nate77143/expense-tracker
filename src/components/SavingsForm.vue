<template>
  <form @submit.prevent="submitForm" class="card">
    <h2 class="card-title">Add Savings</h2>

    <div class="form-group">
      <label for="savings-date">Date</label>
      <input id="savings-date" v-model="form.date" type="date" required />
    </div>

    <div class="form-group">
      <label for="savings-bank">Bank</label>
      <input id="savings-bank" v-model="form.bank" type="text" placeholder="BDO, BPI..." required />
    </div>

    <div class="form-group">
      <label for="savings-amount">Amount (₱)</label>
      <input id="savings-amount" v-model.number="form.amount" type="number" step="0.01" min="0" required />
    </div>

    <div class="form-group">
      <label for="savings-remarks">Remarks</label>
      <textarea id="savings-remarks" v-model="form.remarks" placeholder="Optional note"></textarea>
    </div>

    <button type="submit" class="btn btn-success btn-block">Add Savings</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Saving } from '../types'

const emit = defineEmits<{
  submit: [saving: Omit<Saving, 'id'>]
}>()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  bank: '',
  amount: 0,
  remarks: ''
})

const submitForm = () => {
  if (!form.value.date || !form.value.bank || !form.value.amount) {
    alert('Please fill in required fields')
    return
  }

  emit('submit', {
    date: form.value.date,
    bank: form.value.bank,
    amount: form.value.amount,
    remarks: form.value.remarks
  })

  form.value = {
    date: new Date().toISOString().split('T')[0],
    bank: '',
    amount: 0,
    remarks: ''
  }
}
</script>
