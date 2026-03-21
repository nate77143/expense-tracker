export const EXPENSE_CATEGORIES = [
  'Food',
  'House',
  'Car',
  'Loan',
  'Church',
  'Savings',
  'Others'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
