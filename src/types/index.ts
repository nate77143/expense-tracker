export interface Transaction {
  id: string
  date: string
  amount: number
  remarks: string
}

export interface Expense extends Transaction {
  category: string
}

export interface Income extends Transaction {
  source?: string
}

export interface Saving {
  id: string
  bank: string
  amount: number
  remarks?: string
  date: string
}

export type ReportView = 'daily' | 'weekly' | 'monthly'

export interface DailyReport {
  date: string
  items: Expense[]
  total: number
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  items: Expense[]
  total: number
}

export interface MonthlyReport {
  month: string
  items: Expense[]
  total: number
}
