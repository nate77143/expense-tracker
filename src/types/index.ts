export type TrackerRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TrackerMemberStatus = 'active' | 'invited'
export type AuditLogAction = 'insert' | 'update' | 'delete'
export type AccountType = 'cash' | 'checking' | 'savings' | 'ewallet' | 'credit_card' | 'other_asset' | 'other_liability'
export type AccountGroup = 'asset' | 'liability'
export type TransferType = 'general' | 'cash_withdrawal' | 'savings_transfer' | 'credit_card_payment'
export type AccountAdjustmentReason = 'opening_balance' | 'manual_adjustment' | 'reconciliation_fix'
export type RecurringRuleType = 'income' | 'expense' | 'transfer'
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
    | 'accounts'
    | 'expenses'
    | 'incomes'
    | 'transfers'
    | 'account_adjustments'
    | 'credit_cards'
    | 'credit_card_transactions'
    | 'recurring_transactions'
    | 'recurring_rules'
    | 'savings'
  recordId: string
  action: AuditLogAction
  actorName?: string | null
  actorUserId?: string | null
  actorEmail?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  occurredAt: string
}

export interface RecordAuditFields {
  sourceRecurringRuleId?: string | null
  sourceRecurringRunDate?: string | null
  createdByName?: string | null
  createdByUserId?: string | null
  createdByEmail?: string | null
}

export interface Transaction extends RecordAuditFields {
  id: string
  trackerId: string
  date: string
  amount: number
  remarks: string
}

export interface Account extends RecordAuditFields {
  id: string
  trackerId: string
  name: string
  accountType: AccountType
  accountGroup: AccountGroup
  institution: string
  currencyCode: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export interface Income extends Transaction {
  source?: string
  toAccountId: string
}

export interface Expense extends Transaction {
  category: string
  merchant?: string
  fromAccountId: string
}

export interface Transfer extends Transaction {
  fromAccountId: string
  toAccountId: string
  transferType: TransferType
}

export interface AccountAdjustment extends Transaction {
  accountId: string
  reason: AccountAdjustmentReason
}

export interface CreditCard {
  id: string
  trackerId: string
  accountId: string
  name: string
  issuer: string
  limitAmount: number
  statementDay: number
  dueDay: number
  createdAt: string
}

export interface RecurringRule {
  id: string
  trackerId: string
  ruleType: RecurringRuleType
  frequency: RecurringFrequency
  intervalCount: number
  startDate: string
  nextRunDate: string
  endDate?: string
  isActive: boolean
  amount: number
  description: string
  remarks?: string
  incomeSource?: string
  incomeToAccountId?: string
  expenseCategory?: string
  expenseMerchant?: string
  expenseFromAccountId?: string
  transferFromAccountId?: string
  transferToAccountId?: string
  createdAt: string
}

export interface AccountBalanceSummary {
  accountId: string
  balance: number
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
