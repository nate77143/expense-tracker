export type TrackerRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TrackerMemberStatus = 'active' | 'invited'
export type AuditLogAction = 'insert' | 'update' | 'delete'
export type ExpenseFundingSource = 'income' | 'savings' | 'credit_card'
export type CreditCardTransactionType = 'charge' | 'payment'
export type CreditCardPaymentSource = 'income' | 'savings'
export type RecurringTransactionType = 'expense' | 'income' | 'saving' | 'credit_card_charge'
export type RecurringFrequency = 'weekly' | 'monthly'

export interface Tracker {
  id: string
  name: string
  description: string
  createdAt: string
  isPersonal?: boolean
}

export interface TrackerMember {
  id: string
  trackerId: string
  userId?: string | null
  email: string
  role: TrackerRole
  status: TrackerMemberStatus
  joinedAt: string
}

export interface BudgetAuditLog {
  id: string
  trackerId: string
  entityType:
    | 'trackers'
    | 'tracker_members'
    | 'expenses'
    | 'incomes'
    | 'savings'
    | 'credit_cards'
    | 'credit_card_transactions'
    | 'recurring_transactions'
  recordId: string
  action: AuditLogAction
  actorUserId?: string | null
  actorEmail?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  occurredAt: string
}

export interface Transaction {
  id: string
  trackerId: string
  date: string
  amount: number
  remarks: string
  createdByName?: string | null
  createdByUserId?: string | null
  createdByEmail?: string | null
}

export interface Expense extends Transaction {
  category: string
  fundingSource: ExpenseFundingSource
  fundingSourceBank?: string
  fundingSourceCardId?: string
  targetSavingsBank?: string
}

export interface Income extends Transaction {
  source?: string
}

export interface Saving {
  id: string
  trackerId: string
  bank: string
  amount: number
  remarks?: string
  date: string
  createdByName?: string | null
  createdByUserId?: string | null
  createdByEmail?: string | null
  sourceExpenseId?: string | null
  sourceCreditCardTransactionId?: string | null
}

export interface CreditCard {
  id: string
  trackerId: string
  name: string
  issuer: string
  limitAmount: number
  statementDay: number
  dueDay: number
  createdAt: string
}

export interface CreditCardTransaction {
  id: string
  trackerId: string
  creditCardId: string
  expenseId?: string | null
  date: string
  type: CreditCardTransactionType
  amount: number
  merchant?: string
  category?: string
  paymentSource?: CreditCardPaymentSource
  paymentSourceBank?: string
  remarks?: string
  createdByName?: string | null
  createdByUserId?: string | null
  createdByEmail?: string | null
  createdAt: string
}

export interface RecurringTransaction {
  id: string
  trackerId: string
  type: RecurringTransactionType
  frequency: RecurringFrequency
  intervalCount: number
  startDate: string
  nextRunDate: string
  endDate?: string
  isActive: boolean
  amount: number
  description: string
  remarks?: string
  expenseCategory?: string
  expenseFundingSource?: ExpenseFundingSource
  expenseFundingSourceBank?: string
  expenseTargetSavingsBank?: string
  incomeSource?: string
  savingsBank?: string
  creditCardId?: string
  merchant?: string
  createdAt: string
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
