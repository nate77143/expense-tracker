export type TrackerRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TrackerMemberStatus = 'active' | 'invited'
export type AuditLogAction = 'insert' | 'update' | 'delete'
export type ExpenseFundingSource = 'income' | 'savings'

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
  entityType: 'trackers' | 'tracker_members' | 'expenses' | 'incomes' | 'savings'
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
}

export interface Expense extends Transaction {
  category: string
  fundingSource: ExpenseFundingSource
  fundingSourceBank?: string
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
