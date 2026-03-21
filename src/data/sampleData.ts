import type { Expense, Income, Saving } from '../types'

// Sample data for demonstration
const today = new Date()
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

export const sampleExpenses: Expense[] = [
  {
    id: '1',
    date: today.toISOString().split('T')[0],
    category: 'Food',
    amount: 45.50,
    remarks: 'Grocery shopping'
  },
  {
    id: '2',
    date: today.toISOString().split('T')[0],
    category: 'Car',
    amount: 60,
    remarks: 'Gas'
  },
  {
    id: '3',
    date: yesterday.toISOString().split('T')[0],
    category: 'Food',
    amount: 32.00,
    remarks: 'Restaurant dinner'
  },
  {
    id: '4',
    date: yesterday.toISOString().split('T')[0],
    category: 'House',
    amount: 150,
    remarks: 'Electricity bill'
  },
  {
    id: '5',
    date: twoDaysAgo.toISOString().split('T')[0],
    category: 'Savings',
    amount: 200,
    remarks: 'Monthly savings deposit'
  },
  {
    id: '6',
    date: weekAgo.toISOString().split('T')[0],
    category: 'Church',
    amount: 50,
    remarks: 'Tithe'
  },
  {
    id: '7',
    date: weekAgo.toISOString().split('T')[0],
    category: 'Car',
    amount: 25,
    remarks: 'Car wash'
  }
]

export const sampleIncomes: Income[] = [
  {
    id: '1',
    date: today.toISOString().split('T')[0],
    amount: 2500,
    remarks: 'Monthly salary',
    source: 'Salary'
  },
  {
    id: '2',
    date: weekAgo.toISOString().split('T')[0],
    amount: 150,
    remarks: 'Freelance project',
    source: 'Freelance'
  }
]

export const sampleSavings: Saving[] = [
  {
    id: '1',
    bank: 'BDO',
    amount: 15000,
    remarks: 'Emergency fund',
    date: weekAgo.toISOString().split('T')[0]
  },
  {
    id: '2',
    bank: 'BPI',
    amount: 8500,
    remarks: 'Travel savings',
    date: yesterday.toISOString().split('T')[0]
  }
]
