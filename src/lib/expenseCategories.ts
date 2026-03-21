import { EXPENSE_CATEGORIES } from '../constants/categories'

const STORAGE_KEY = 'expense-tracker.custom-categories'

export const normalizeCategoryName = (value: string) => {
  return value
    .trim()
    .replace(/\s+/g, ' ')
}

export const getSavedExpenseCategories = (): string[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(item => normalizeCategoryName(String(item)))
      .filter(Boolean)
      .filter(
        (item, index, array) =>
          array.findIndex(candidate => candidate.toLowerCase() === item.toLowerCase()) === index &&
          !EXPENSE_CATEGORIES.some(defaultCategory => defaultCategory.toLowerCase() === item.toLowerCase())
      )
  } catch {
    return []
  }
}

export const saveExpenseCategories = (categories: string[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}
