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
        <label class="form-label" for="custom-expense-category">Add new category</label>
        <div class="input-action-row">
          <input
            id="custom-expense-category"
            v-model="newCategory"
            type="text"
            class="form-input"
            placeholder="Examples: Pets, Education, Travel"
            @keydown.enter.prevent="handleAddCategory"
          />
          <button type="button" class="btn btn-secondary" @click="handleAddCategory">
            Add category
          </button>
        </div>
        <span class="field-help">{{ categoryHelpText }}</span>
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
        <label class="form-label" for="expense-funding-source">Paid from</label>
        <select id="expense-funding-source" v-model="form.fundingSource" class="form-select">
          <option value="income">Income</option>
          <option value="savings">Savings</option>
        </select>
        <span class="field-help">Choose where this expense was funded from. New expenses default to income.</span>
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
import { computed, onMounted, ref } from 'vue'
import { EXPENSE_CATEGORIES } from '../constants/categories'
import {
  getSavedExpenseCategories,
  normalizeCategoryName,
  saveExpenseCategories
} from '../lib/expenseCategories'
import type { Expense } from '../types'

const emit = defineEmits<{
  submit: [expense: Omit<Expense, 'id' | 'trackerId'>]
}>()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  category: '',
  amount: 0,
  fundingSource: 'income' as Expense['fundingSource'],
  remarks: ''
})

const customCategories = ref<string[]>([])
const newCategory = ref('')

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    fundingSource: 'income',
    remarks: ''
  }
}

onMounted(() => {
  customCategories.value = getSavedExpenseCategories()
})

const categories = computed(() => [...EXPENSE_CATEGORIES, ...customCategories.value])

const categoryHelpText = computed(() => {
  if (customCategories.value.length === 0) {
    return 'Custom categories will be saved in this browser for future expense entries.'
  }

  return `${customCategories.value.length} custom categor${customCategories.value.length === 1 ? 'y' : 'ies'} saved in this browser.`
})

const handleAddCategory = () => {
  const normalizedValue = normalizeCategoryName(newCategory.value)

  if (!normalizedValue) {
    alert('Please enter a category name first.')
    return
  }

  const categoryAlreadyExists = categories.value.some(
    category => category.toLowerCase() === normalizedValue.toLowerCase()
  )

  if (categoryAlreadyExists) {
    form.value.category = categories.value.find(
      category => category.toLowerCase() === normalizedValue.toLowerCase()
    ) ?? normalizedValue
    newCategory.value = ''
    alert('That category already exists, so it has been selected for you.')
    return
  }

  customCategories.value = [...customCategories.value, normalizedValue].sort((a, b) => a.localeCompare(b))
  saveExpenseCategories(customCategories.value)
  form.value.category = normalizedValue
  newCategory.value = ''
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
    fundingSource: form.value.fundingSource,
    remarks: form.value.remarks
  })

  resetForm()
}
</script>
